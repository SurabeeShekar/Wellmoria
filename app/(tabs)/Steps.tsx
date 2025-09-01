import { auth } from "@/Firebase"; // Firebase authentication instance
import { Ionicons } from "@expo/vector-icons"; // Icons for UI
import AsyncStorage from "@react-native-async-storage/async-storage"; // Local storage for caching steps
import { format, subDays } from "date-fns"; // Date formatting utilities
import { Pedometer } from "expo-sensors"; // Expo's step counter sensor
import { getDatabase, onValue, ref, update, off } from "firebase/database"; // Firebase Realtime DB utilities
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit"; // Chart for weekly steps

export default function StepsScreen() {
  // ---------- STATE VARIABLES ----------
  const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");
  const [todaySteps, setTodaySteps] = useState<number>(0); // Steps counted today
  const [weeklySteps, setWeeklySteps] = useState<any[]>([]); // Array of last 7 days data
  const [dailyStepGoal, setDailyStepGoal] = useState<number>(8000); // Default goal = 8000 steps
  const [loading, setLoading] = useState(true); // Loading state until data is ready
  const user = auth.currentUser; // Logged-in Firebase user

  // ---------- Runs once when the component first loads ----------
  useEffect(() => {
    if (!user) return;

    // Reset daily steps if a new day has started
    checkAndResetSteps();

    // Start listening to pedometer data
    const unsubscribe = subscribePedometer();

    // Load weekly step history from Firebase
    const offWeekly = loadWeeklyData();

    // Load user’s step goal from Firebase
    const offGoal = loadStepGoal();

    // Cleanup listeners when component unmounts
    return () => {
      unsubscribe && unsubscribe();
      offWeekly && offWeekly();
      offGoal && offGoal();
    };
  }, [user]);

  // ---------- RESET STEPS EACH DAY ----------
  const checkAndResetSteps = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const savedDate = await AsyncStorage.getItem("stepsDate");

    if (savedDate !== today) {
      // If it’s a new day, reset step count in local storage
      await AsyncStorage.setItem("stepsDate", today);
      await AsyncStorage.setItem("stepsCount", "0");
      setTodaySteps(0);
    } else {
      // Otherwise, load saved steps
      const savedSteps = await AsyncStorage.getItem("stepsCount");
      if (savedSteps) setTodaySteps(parseInt(savedSteps));
    }
  };

  // ---------- PEDOMETER SUBSCRIPTION ----------
  const subscribePedometer = () => {
    // Check if pedometer is available
    Pedometer.isAvailableAsync().then(
      (result) => setIsPedometerAvailable(String(result)),
      () => setIsPedometerAvailable("false")
    );

    // Sync steps (fetch count + update Firebase + cache locally)
    const syncSteps = async () => {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0); // midnight = start of day

      try {
        // Get today’s step count from device sensor
        const { steps } = await Pedometer.getStepCountAsync(start, end);

        setTodaySteps(steps);
        await AsyncStorage.setItem("stepsCount", steps.toString());

        if (user) {
          const db = getDatabase();
          const today = format(new Date(), "yyyy-MM-dd");

          // Calculate derived stats
          const calories = calculateCalories(steps);
          const distance = calculateDistance(steps);

          // Save today's data in Firebase
          await update(ref(db, `users/${user.uid}/steps/${today}`), {
            date: today,
            steps,
            calories_burned: calories,
            distance_km: distance,
          });

          // Save as a quick "today" reference
          await update(ref(db, `users/${user.uid}/today`), {
            date: today,
            steps,
            calories_burned: calories,
            distance_km: distance,
          });
        }
      } catch (err) {
        console.warn("Error fetching step count:", err);
      }
    };

    // Run once immediately
    syncSteps();

    // Keep listening for step updates
    const subscription = Pedometer.watchStepCount(() => {
      syncSteps();
    });

    return () => subscription && subscription.remove();
  };

  // ---------- LOAD WEEKLY DATA FROM FIREBASE ----------
  const loadWeeklyData = () => {
    if (!user) return;
    const db = getDatabase();
    const stepsRef = ref(db, `users/${user.uid}/steps`);

    const listener = onValue(stepsRef, (snapshot) => {
      const data = snapshot.val() || {};

      // Construct last 7 days of steps (including days with 0 steps)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const dateKey = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
        return {
          date: format(subDays(new Date(), 6 - i), "EEE"), // e.g. Mon, Tue
          steps: data[dateKey]?.steps || 0,
          goal: dailyStepGoal, // compare against goal
        };
      });

      setWeeklySteps(last7Days);
      setLoading(false);
    });

    return () => off(stepsRef, "value", listener);
  };

  // ---------- LOAD USER'S STEP GOAL ----------
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

  // ---------- HELPER FUNCTIONS ----------
  const calculateCalories = (steps: number) => steps * 0.04; // 1 step ≈ 0.04 kcal
  const calculateDistance = (steps: number) => (steps * 0.762) / 1000; // step length ≈ 0.762m
  const getTotalWeeklySteps = () => weeklySteps.reduce((sum, d) => sum + d.steps, 0);

  // ---------- LOADING STATE ----------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  // ---------- MAIN UI ----------
  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="walk" size={32} color="#14b8a6" />
        <Text style={styles.title}>Step Tracker</Text>
        <Text style={styles.subtitle}>Every step brings you closer to your goals!</Text>
      </View>

      {/* TODAY'S STEPS CARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Progress</Text>
          <Text style={styles.cardDate}>{format(new Date(), "MMM d, yyyy")}</Text>
        </View>
        <Text style={styles.steps}>{todaySteps.toLocaleString()}</Text>
        <Text style={styles.goal}>of {dailyStepGoal.toLocaleString()} steps</Text>

        {/* Calories + Distance Stats */}
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

      {/* WEEKLY LINE CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week's Journey</Text>
        <LineChart
          data={{
            labels: weeklySteps.map((d) => d.date), // X-axis = days
            datasets: [
              { data: weeklySteps.map((d) => d.steps), color: () => "#14b8a6" }, // steps line
              { data: weeklySteps.map((d) => d.goal), color: () => "#94a3b8" }, // goal line
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

      {/* WEEKLY SUMMARY */}
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

// --- Stylesheet ---
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
