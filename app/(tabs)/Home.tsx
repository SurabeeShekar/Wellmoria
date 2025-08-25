import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { format, subDays } from "date-fns";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import { ProgressBar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [todaySteps, setTodaySteps] = useState<any>(null);
  const [todayWater, setTodayWater] = useState<any>(null);
  const [weeklySteps, setWeeklySteps] = useState<any[]>([]);
  const [weeklyWater, setWeeklyWater] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const today = format(new Date(), "yyyy-MM-dd");

    // User profile
    const userRef = ref(db, `users/${currentUser.uid}`);
    onValue(userRef, (snap) => {
      if (snap.exists()) setUser(snap.val());
    });

    // Today's summary (steps + water)
    const todayRef = ref(db, `users/${currentUser.uid}/today`);
    onValue(todayRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.steps) setTodaySteps(data.steps);
        if (data.water_ml !== undefined) setTodayWater({ amount_ml: data.water_ml });
      }
    });

    //  Weekly steps 
    const stepsRef = ref(db, `users/${currentUser.uid}/steps`);
    onValue(stepsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const last7: any[] = [];
        for (let i = 0; i < 7; i++) {
          const day = format(subDays(new Date(), i), "yyyy-MM-dd");
          if (data[day]) last7.push(data[day]);
        }
        setWeeklySteps(last7.reverse());
      } else {
        setWeeklySteps([]);
      }
    });

    // Weekly water 
    const waterRef = ref(db, `users/${currentUser.uid}/water`);
    onValue(waterRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const last7: any[] = [];
        for (let i = 0; i < 7; i++) {
          const day = format(subDays(new Date(), i), "yyyy-MM-dd");
          if (data[day]) last7.push(data[day]);
        }
        setWeeklyWater(last7.reverse());
      } else {
        setWeeklyWater([]);
      }
    });

    // Wait until listeners initialize
    setTimeout(() => setLoading(false), 800);
  }, []);

  //  Helpers 
  const getStepProgress = () =>
    todaySteps && user?.daily_step_goal
      ? Math.min((todaySteps.steps || 0) / user.daily_step_goal, 1)
      : 0;

  const getWaterProgress = () =>
    todayWater && user?.daily_water_goal
      ? Math.min((todayWater.amount_ml || 0) / user.daily_water_goal, 1)
      : 0;

  const getNextLevelPoints = () => (user?.current_level || 1) * 1000;

  const getLevelProgress = () => {
    if (!user) return 0;
    const pointsForCurrent = (user.current_level - 1) * 1000;
    const pointsForNext = user.current_level * 1000;
    const gained = user.total_points - pointsForCurrent;
    const needed = pointsForNext - pointsForCurrent;
    return Math.min(gained / needed, 1);
  };

  const totalWeeklySteps = weeklySteps.reduce((sum, d) => sum + (d.steps || 0), 0);
  const totalWeeklyWater = weeklyWater.reduce(
    (sum, d) => sum + (d.amount_ml || 0),
    0
  );
  const totalWeeklyCalories = weeklySteps.reduce(
    (sum, d) => sum + (d.calories_burned || 0),
    0
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good{" "}
          {new Date().getHours() < 12
            ? "Morning"
            : new Date().getHours() < 17
            ? "Afternoon"
            : "Evening"}
          , {user?.full_name?.split(" ")[0]}! 👋
        </Text>
        <Text style={styles.subtext}>Ready to crush your fitness goals today?</Text>
      </View>

      {/* --- Level Progress --- */}
      <View style={[styles.card, styles.gradientPurple]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="trophy" size={20} color="#fff" />
          <Text style={[styles.cardTitle, { color: "#fff" }]}>
            Level {user?.current_level || 1} Warrior
          </Text>
        </View>
        <ProgressBar progress={getLevelProgress()} color="#fff" style={styles.progress} />
        <View style={styles.rowBetween}>
          <Text style={styles.whiteText}>{user?.total_points || 0} points</Text>
          <Text style={styles.whiteText}>
            {getNextLevelPoints()} points to next level
          </Text>
        </View>
      </View>

      {/* --- Steps & Water --- */}
      <View style={styles.row}>
        {/* Steps */}
        <View style={[styles.card, styles.smallCard, styles.borderTeal]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="walk" size={20} color="#14b8a6" />
            <Text style={styles.cardTitle}>Steps Today</Text>
          </View>
          <Text style={styles.bigText}>
            {todaySteps?.steps?.toLocaleString() || "0"}
          </Text>
          <ProgressBar progress={getStepProgress()} color="#14b8a6" style={styles.progress} />
          <View style={styles.rowBetween}>
            <Text style={styles.subLabel}>
              Goal: {user?.daily_step_goal?.toLocaleString() || "8000"}
            </Text>
            <Text style={styles.subLabel}>{(getStepProgress() * 100).toFixed(0)}%</Text>
          </View>
        </View>

        {/* Water */}
        <View style={[styles.card, styles.smallCard, styles.borderBlue]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cup-water" size={20} color="#3b82f6" />
            <Text style={styles.cardTitle}>Water Today</Text>
          </View>
          <Text style={[styles.bigText, { color: "#3b82f6" }]}>
            {todayWater?.amount_ml || 0} ml
          </Text>
          <ProgressBar progress={getWaterProgress()} color="#3b82f6" style={styles.progress} />
          <View style={styles.rowBetween}>
            <Text style={styles.subLabel}>
              Goal: {user?.daily_water_goal?.toLocaleString() || "2000"} ml
            </Text>
            <Text style={styles.subLabel}>{(getWaterProgress() * 100).toFixed(0)}%</Text>
          </View>
        </View>
      </View>

      {/* --- Weekly Highlights --- */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="chart-line" size={20} color="green" />
          <Text style={styles.cardTitle}>This Week's Highlights</Text>
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.center}>
            <Text style={styles.highlight}>{user?.current_level || 1}</Text>
            <Text style={styles.subLabel}>Current Level</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.highlight}>{user?.total_points || 0}</Text>
            <Text style={styles.subLabel}>Total Points</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.highlight}>{totalWeeklyCalories}</Text>
            <Text style={styles.subLabel}>Calories Burned</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.highlight}>
              {getStepProgress() >= 1 ? "🎯" : "💪"}
            </Text>
            <Text style={styles.subLabel}>Today's Mood</Text>
          </View>
        </View>
        <View style={[styles.rowBetween, { marginTop: 10 }]}>
          <Text style={styles.subLabel}>
            Weekly Steps: {totalWeeklySteps.toLocaleString()}
          </Text>
          <Text style={styles.subLabel}>
            Weekly Water: {totalWeeklyWater.toLocaleString()} ml
          </Text>
        </View>
      </View>

      {/* Motivation */}
      <View style={[styles.card, styles.gradientGreen]}>
        <Text style={[styles.motivation, { color: "#fff" }]}>
          {getStepProgress() >= 1
            ? "🎉 Amazing! You've reached your step goal!"
            : getStepProgress() >= 0.5
            ? "🔥 You're halfway there! Keep it up!"
            : "🌟 Every step counts! Let's get moving!"}
        </Text>
        <Text style={[styles.whiteText, { textAlign: "center" }]}>
          {getStepProgress() >= 1
            ? "You're a fitness champion! Time to celebrate and set new goals."
            : `Just ${(user?.daily_step_goal || 8000) - (todaySteps?.steps || 0)} more steps to reach your goal!`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { padding: 16, paddingBottom: 30 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 20, alignItems: "center" },
  greeting: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  subtext: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientPurple: { backgroundColor: "#a855f7" },
  gradientGreen: { backgroundColor: "#22c55e" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  progress: { height: 8, borderRadius: 4, marginVertical: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  smallCard: { flex: 1, marginHorizontal: 4 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bigText: { fontSize: 28, fontWeight: "700", color: "#14b8a6", marginBottom: 8 },
  whiteText: { color: "#fff" },
  subLabel: { fontSize: 13, color: "#374151" },
  highlight: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4f46e5",
    textAlign: "center",
  },
  center: { alignItems: "center", flex: 1 },
  motivation: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 6 },
  borderTeal: { borderLeftWidth: 4, borderLeftColor: "#14b8a6" },
  borderBlue: { borderLeftWidth: 4, borderLeftColor: "#3b82f6" },
});
