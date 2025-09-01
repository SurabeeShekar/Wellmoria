import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format, subDays } from "date-fns";
import { getDatabase, ref, onValue, update, set } from "firebase/database";
import { auth } from "@/Firebase";
import { LineChart } from "react-native-chart-kit";

// Predefined water amounts (presets) for quick-add feature
// Each object contains ml amount, label, and emoji icon
const WATER_PRESETS = [
  { amount: 250, label: "Glass", icon: "🥛" },
  { amount: 330, label: "Bottle", icon: "🍼" },
  { amount: 500, label: "Large Bottle", icon: "🧴" },
  { amount: 200, label: "Coffee Cup", icon: "☕" },
];

export default function Water() {
  // State to store today’s hydration (amount + log)
  const [todayWater, setTodayWater] = useState<any>(null);

  // Stores last 7 days hydration data for chart & summary
  const [weeklyWater, setWeeklyWater] = useState<any[]>([]);

  // Loading indicators
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Current signed-in user from Firebase auth
  const currentUser = auth.currentUser;

  // --- Lifecycle: when component mounts ---
  useEffect(() => {
    if (!currentUser) return;

    const db = getDatabase();
    const today = format(new Date(), "yyyy-MM-dd");
    const waterRef = ref(db, `users/${currentUser.uid}/water/${today}`);

    // Realtime listener for today’s hydration progress
    // Keeps UI synced with Firebase
    const unsubscribe = onValue(waterRef, (snapshot) => {
      setTodayWater(snapshot.val() || { amount_ml: 0, log_entries: [] });
      setLoading(false);
    });

    // Load hydration for the last 7 days (weekly chart & summary)
    loadWeeklyData();

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // --- Loads last 7 days hydration data ---
  const loadWeeklyData = () => {
    if (!currentUser) return;
    const db = getDatabase();
    const stepsRef = ref(db, `users/${currentUser.uid}/water`);

    onValue(stepsRef, (snapshot) => {
      const data = snapshot.val() || {};

      // Build array of last 7 days (date, amount, goal)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const dateKey = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        return {
          date: format(subDays(new Date(), 6 - i), "EEE"), // short weekday label
          amount_ml: data[dateKey]?.amount_ml || 0, // fallback 0 if no entry
          goal: 2000, // daily hydration goal
        };
      });

      setWeeklyWater(last7Days);
    });
  };

  // --- Adds new water intake entry ---
  const addWater = async (amount: number) => {
    if (!currentUser) return;
    setAdding(true);

    try {
      const db = getDatabase();
      const today = format(new Date(), "yyyy-MM-dd");
      const now = format(new Date(), "HH:mm");
      const waterRef = ref(db, `users/${currentUser.uid}/water/${today}`);

      // Calculate updated amount and append new entry
      const currentAmount = todayWater?.amount_ml || 0;
      const newAmount = currentAmount + amount;
      const newEntries = [
        ...(todayWater?.log_entries || []),
        { time: now, amount },
      ];

      // Save today’s updated hydration log to Firebase
      await set(waterRef, {
        amount_ml: newAmount,
        log_entries: newEntries,
      });

      // Update today’s summary section in Firebase
      const todayRef = ref(db, `users/${currentUser.uid}/today`);
      await update(todayRef, {
        water_ml: newAmount,
        date: today,
      });

      // Increment user’s total points
      // 1 point for every 100 ml consumed
      const userRef = ref(db, `users/${currentUser.uid}`);
      onValue(
        userRef,
        async (snap) => {
          const userData = snap.val() || {};
          const newPoints =
            (userData.total_points || 0) + Math.floor(amount / 100);
          await update(userRef, { total_points: newPoints });
        },
        { onlyOnce: true } // ensure it runs once to avoid multiple updates
      );
    } catch (err) {
      console.error("Error adding water:", err);
    }
    setAdding(false);
  };

  // --- Returns today’s progress towards daily goal in % ---
  const getWaterProgress = () => {
    if (!todayWater) return 0;
    const goal = 2000;
    return Math.min((todayWater.amount_ml / goal) * 100, 100); // capped at 100%
  };

  // --- Sums total ml consumed over 7 days ---
  const getTotalWeeklyWater = () =>
    weeklyWater.reduce((sum, d) => sum + d.amount_ml, 0);

  // --- Show loading spinner while fetching data ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // --- Main UI ---
  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Ionicons name="water" size={32} color="#3b82f6" />
        <Text style={styles.title}>Hydration Tracker</Text>
        <Text style={styles.subtitle}>Stay hydrated, stay healthy 💙</Text>
      </View>

      {/* Today’s Progress Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Hydration</Text>
          <MaterialCommunityIcons name="water" size={20} color="#3b82f6" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.bigText}>
            {todayWater?.amount_ml || 0}
            <Text style={styles.unit}> ml</Text>
          </Text>
          <Text style={styles.subtitle}>
            Goal: 2000 ml ({getWaterProgress().toFixed(0)}%)
          </Text>
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${getWaterProgress()}%` }]}
            />
          </View>
        </View>
      </View>

      {/* Weekly Hydration Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week's Hydration</Text>
        <LineChart
          data={{
            labels: weeklyWater.map((d) => d.date),
            datasets: [
              { data: weeklyWater.map((d) => d.amount_ml) }, // actual hydration
              {
                data: weeklyWater.map((d) => d.goal), // constant daily goal
                color: () => "#94a3b8",
              },
            ],
          }}
          width={Dimensions.get("window").width - 32}
          height={220}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: () => "#6b7280",
          }}
          bezier
          style={{ borderRadius: 12, marginVertical: 8 }}
        />
      </View>

      {/* Weekly Summary (Total + Goals Met) */}
      <View style={[styles.card, styles.gradientCard]}>
        <Text style={[styles.cardTitle, { color: "white" }]}>
          Weekly Hydration
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.summaryValue}>{getTotalWeeklyWater()}</Text>
            <Text style={styles.summaryLabel}>Total (ml)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.summaryValue}>
              {weeklyWater.filter((d) => d.amount_ml >= d.goal).length}
            </Text>
            <Text style={styles.summaryLabel}>Goals Met</Text>
          </View>
        </View>
      </View>

      {/* Quick Add Buttons (presets) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Add</Text>
        <View style={styles.quickAddGrid}>
          {WATER_PRESETS.map((preset, i) => (
            <TouchableOpacity
              key={i}
              disabled={adding} // disable while saving
              onPress={() => addWater(preset.amount)}
              style={styles.quickAddBtn}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetSub}>{preset.amount} ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Daily Log (reverse-chronological order) */}
      {todayWater?.log_entries?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Log</Text>
          {todayWater.log_entries
            .slice()
            .sort((a: any, b: any) => b.time.localeCompare(a.time)) // latest first
            .map((entry: any, i: number) => (
              <View key={i} style={styles.logRow}>
                {/* Left side: icon + entry info */}
                <View style={styles.logLeft}>
                  <View style={styles.logIcon}>
                    <Ionicons name="water" size={16} color="#3b82f6" />
                  </View>
                  <View>
                    <Text style={styles.logAmount}>{entry.amount} ml</Text>
                    <Text style={styles.logTime}>{entry.time}</Text>
                  </View>
                </View>
                {/* Right side: points earned */}
                <Text style={styles.logPoints}>
                  +{Math.floor(entry.amount / 100)} pts
                </Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  subtitle: { fontSize: 14, color: "#6b7280" },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  gradientCard: { backgroundColor: "#3b82f6" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  cardContent: { marginTop: 8, alignItems: "center" },
  bigText: { fontSize: 36, fontWeight: "bold", color: "#2563eb" },
  unit: { fontSize: 16, color: "#6b7280" },
  progressBar: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 5,
    width: "100%",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 5,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 16 },
  statBox: { alignItems: "center" },
  summaryValue: { fontSize: 28, fontWeight: "bold", color: "white" },
  summaryLabel: { fontSize: 12, color: "white" },
  quickAddGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  quickAddBtn: {
    width: "48%",
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  presetIcon: { fontSize: 24 },
  presetLabel: { fontWeight: "600", color: "#1f2937" },
  presetSub: { fontSize: 12, color: "#6b7280" },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  logLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logAmount: { fontWeight: "600", color: "#1f2937" },
  logTime: { fontSize: 12, color: "#6b7280" },
  logPoints: { color: "#2563eb", fontWeight: "600" },
});
