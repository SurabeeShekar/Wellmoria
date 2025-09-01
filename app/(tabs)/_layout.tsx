import Ionicons from "@expo/vector-icons/Ionicons"; // Icon library for tab navigation + UI
import { Slot, usePathname, useRouter } from "expo-router"; // Expo Router utilities
import { getAuth } from "firebase/auth"; // Firebase authentication
import { get, getDatabase, ref } from "firebase/database"; // Firebase Realtime Database
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { app } from "../../Firebase"; // Firebase app instance

// --- User Data Interface ---
// Defines the structure of the user object fetched from Firebase
interface UserData {
  uid: string;
  full_name: string;
  current_level: number;
  total_points: number;
  age?: number;
  height?: number;
  weight?: number;
}

// --- Bottom Navigation Items ---
// Each object represents a tab in the bottom navigation bar
const navigationItems = [
  { name: "Home", icon: "home-outline", route: "/(tabs)/Home" },
  { name: "Steps", icon: "walk-outline", route: "/(tabs)/Steps" },
  { name: "Water", icon: "water-outline", route: "/(tabs)/Water" },
  { name: "Game", icon: "trophy-outline", route: "/(tabs)/Game" },
  { name: "Profile", icon: "person-circle-outline", route: "/(tabs)/Profile" },
];

export default function TabsLayout() {
  const router = useRouter(); // Used for navigation
  const pathname = usePathname(); // Gets current active route

  const [user, setUser] = useState<UserData | null>(null); // Holds logged-in user data
  const [loading, setLoading] = useState(true); // Tracks loading state

  // --- Check user authentication + fetch data from Firebase ---
  useEffect(() => {
    const checkUserData = async () => {
      try {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        // If no user is logged in → redirect to Auth screen
        if (!currentUser) {
          router.replace("/Auth");
          return;
        }

        // Fetch user data from Realtime Database
        const db = getDatabase(app);
        const userRef = ref(db, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        // If onboarding details are missing → redirect to Onboarding
        if (!userData || !userData.age || !userData.height || !userData.weight) {
          router.replace("/Onboarding");
          return;
        }

        // Store user data in state var
        setUser(userData);
      } catch (err) {
        console.log("Error fetching user data:", err);
        router.replace("/Auth"); // On error, send user back to Auth
      } finally {
        setLoading(false); // Stop loading spinner
      }
    };

    checkUserData();
  }, []);

  // --- Show loading screen while fetching data ---
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={{ marginTop: 8 }}>Loading Wellmoria...</Text>
      </View>
    );
  }

  // --- Main Layout ---
  return (
    <SafeAreaView style={styles.container}>
      {/* ---------- Header Section ---------- */}
      <View style={styles.header}>
        {/* Left side: Logo + App Name + Greeting */}
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.title}>Wellmoria</Text>
            {user && (
              <Text style={styles.subtitle}>
                Welcome back, {user.full_name?.split(" ")[0]}!
              </Text>
            )}
          </View>
        </View>

        {/* Right side: Level & Points */}
        {user && (
          <View style={styles.headerRight}>
            <Text style={styles.levelText}>Level {user.current_level || 1}</Text>
            <Text style={styles.pointsText}>{user.total_points || 0} pts</Text>
          </View>
        )}
      </View>

      {/* ---------- Content Section ---------- */}
      {/* Slot renders the nested routes (tabs pages) */}
      <ScrollView style={styles.content}>
        <Slot />
      </ScrollView>

      {/* ---------- Bottom Navigation Bar ---------- */}
      <View style={styles.bottomNav}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.route; // Highlight active tab
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.route as any)} // Navigate to route
            >
              {/* Tab Icon */}
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? "#14b8a6" : "#9ca3af"}
              />
              {/* Tab Label */}
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdff" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#14b8a6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  headerRight: { alignItems: "center" },
  levelText: { fontSize: 14, fontWeight: "600", color: "#14b8a6" },
  pointsText: { fontSize: 12, color: "#6b7280" },
  content: { flex: 1, padding: 12 },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 6,
  },
  navItem: { alignItems: "center" },
  navItemActive: {},
  navText: { fontSize: 10, color: "#9ca3af" },
  navTextActive: { color: "#14b8a6", fontWeight: "600" },
});
