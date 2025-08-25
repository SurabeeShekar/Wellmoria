import { auth } from "@/Firebase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, subDays } from "date-fns";
import { Pedometer } from "expo-sensors";
import { getDatabase, onValue, ref, set, update, off } from "firebase/database";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function StepsScreen() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [weeklySteps, setWeeklySteps] = useState<any[]>([]);
  const [dailyStepGoal, setDailyStepGoal] = useState<number>(8000); // dynamic goal
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    checkAndResetSteps();
    const unsubscribe = subscribePedometer();
    const offWeekly = loadWeeklyData();
    const offGoal = loadStepGoal();

    return () => {
      unsubscribe && unsubscribe();
      offWeekly && offWeekly();
      offGoal && offGoal();
    };
  }, [user]);

  // Listen for changes to daily_step_goal
  const loadStepGoal = () => {
    if (!user) return;
    const db = getDatabase();
    const goalRef = ref(db, `users/${user.uid}/daily_step_goal`);

    const listener = onValue(goalRef, (snapshot) => {
      if (snapshot.exists()) {
        setDailyStepGoal(snapshot.val());
      }
    });

    return () => off(goalRef, "value", listener);
  };

  // Reset baseline when new day starts
  const checkAndResetSteps = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const savedDate = await AsyncStorage.getItem("stepsDate");

    if (savedDate !== today) {
      await AsyncStorage.setItem("stepsDate", today);
      await AsyncStorage.setItem("stepsCount", "0");
      await AsyncStorage.setItem("baselineSteps", "0");

      if (user) {
        const db = getDatabase();
        await set(ref(db, `users/${user.uid}/steps/${today}`), {
          date: today,
          steps: 0,
          calories_burned: 0,
          distance_km: 0,
        });
        await update(ref(db, `users/${user.uid}/today`), {
          date: today,
          steps: 0,
          calories_burned: 0,
          distance_km: 0,
        });
      }
      setTodaySteps(0);
    } else {
      const savedSteps = await AsyncStorage.getItem("stepsCount");
      if (savedSteps) setTodaySteps(parseInt(savedSteps));
    }
  };

  // Subscribe to pedometer
  const subscribePedometer = () => {
    Pedometer.isAvailableAsync().then(
      (result) => setIsPedometerAvailable(String(result)),
      () => setIsPedometerAvailable("false")
    );

    const subscription = Pedometer.watchStepCount(async (result) => {
      const totalDeviceSteps = result.steps;

      let baseline = parseInt((await AsyncStorage.getItem("baselineSteps")) || "0");
      if (baseline === 0) {
        baseline = totalDeviceSteps;
        await AsyncStorage.setItem("baselineSteps", baseline.toString());
      }

      const stepsToday = totalDeviceSteps - baseline;
      setTodaySteps(stepsToday);
      await AsyncStorage.setItem("stepsCount", stepsToday.toString());

      if (user) {
        const db = getDatabase();
        const today = format(new Date(), "yyyy-MM-dd");

        const calories = calculateCalories(stepsToday);
        const distance = calculateDistance(stepsToday);

        await update(ref(db, `users/${user.uid}/steps/${today}`), {
          date: today,
          steps: stepsToday,
          calories_burned: calories,
          distance_km: distance,
        });
        await update(ref(db, `users/${user.uid}/today`), {
          date: today,
          steps: stepsToday,
          calories_burned: calories,
          distance_km: distance,
        });
      }
    });

    return () => subscription && subscription.remove();
  };

  // Load last 7 days
  const loadWeeklyData = () => {
    if (!user) return;
    const db = getDatabase();
    const stepsRef = ref(db, `users/${user.uid}/steps`);

    const listener = onValue(stepsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const dateKey = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        return {
          date: format(subDays(new Date(), 6 - i), "EEE"),
          steps: data[dateKey]?.steps || 0,
          goal: dailyStepGoal, // 🔹 dynamic
        };
      });
      setWeeklySteps(last7Days);
      setLoading(false);
    });

    return () => off(stepsRef, "value", listener);
  };

  const calculateCalories = (steps: number) => steps * 0.04;
  const calculateDistance = (steps: number) => (steps * 0.762) / 1000;
  const getTotalWeeklySteps = () => weeklySteps.reduce((sum, d) => sum + d.steps, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="walk" size={32} color="#14b8a6" />
        <Text style={styles.title}>Step Tracker</Text>
        <Text style={styles.subtitle}>Every step brings you closer to your goals!</Text>
      </View>

      {/* Today's Steps */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Progress</Text>
          <Text style={styles.cardDate}>{format(new Date(), "MMM d, yyyy")}</Text>
        </View>
        <Text style={styles.steps}>{todaySteps.toLocaleString()}</Text>
        <Text style={styles.goal}>of {dailyStepGoal.toLocaleString()} steps</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="flame" size={18} color="#f97316" />
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{calculateCalories(todaySteps).toFixed(0)}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="map" size={18} color="#3b82f6" />
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{calculateDistance(todaySteps).toFixed(2)} km</Text>
          </View>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week's Journey</Text>
        <LineChart
          data={{
            labels: weeklySteps.map((d) => d.date),
            datasets: [
              { data: weeklySteps.map((d) => d.steps), color: () => "#14b8a6" },
              { data: weeklySteps.map((d) => d.goal), color: () => "#94a3b8" },
            ],
            legend: ["Steps", "Goal"],
          }}
          width={Dimensions.get("window").width - 32}
          height={220}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
            labelColor: () => "#6b7280",
            propsForDots: { r: "4" },
          }}
          bezier
          style={{ borderRadius: 12, marginVertical: 8 }}
        />
      </View>

      {/* Weekly Summary */}
      <View style={[styles.card, styles.gradientCard]}>
        <Text style={[styles.cardTitle, { color: "white" }]}>Weekly Achievement</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.summaryValue}>{getTotalWeeklySteps()}</Text>
            <Text style={styles.summaryLabel}>Total Steps</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.summaryValue}>
              {weeklySteps.filter((d) => d.steps >= dailyStepGoal).length}
            </Text>
            <Text style={styles.summaryLabel}>Goals Met</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  gradientCard: { backgroundColor: "#14b8a6" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  cardDate: { fontSize: 12, color: "#6b7280" },
  steps: { fontSize: 40, fontWeight: "bold", color: "#14b8a6", textAlign: "center" },
  goal: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 16 },
  statBox: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "#6b7280" },
  statValue: { fontSize: 18, fontWeight: "bold" },
  summaryValue: { fontSize: 28, fontWeight: "bold", color: "white" },
  summaryLabel: { fontSize: 12, color: "white" },
});
