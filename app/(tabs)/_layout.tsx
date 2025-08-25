import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Slot, useRouter, usePathname } from "expo-router";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../../Firebase"; // Your Firebase config

interface UserData {
  uid: string;
  full_name: string;
  current_level: number;
  total_points: number;
  age?: number;
  height?: number;
  weight?: number;
}

const navigationItems = [
  { name: "Home", icon: "home-outline", route: "/(tabs)/Home" },
  { name: "Steps", icon: "walk-outline", route: "/(tabs)/Steps" },
  { name: "Water", icon: "water-outline", route: "/(tabs)/Water" },
  { name: "Game", icon: "trophy-outline", route: "/(tabs)/Game" },
  { name: "Profile", icon: "person-circle-outline", route: "/(tabs)/Profile" },
];

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const auth = getAuth(app);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/Auth");
          return;
        }

        const db = getDatabase(app);
        const userRef = ref(db, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (!userData || !userData.age || !userData.height || !userData.weight) {
          router.replace("/Onboarding");
          return;
        }

        setUser(userData);
      } catch (err) {
        console.log("Error fetching user data:", err);
        router.replace("/Auth");
      } finally {
        setLoading(false);
      }
    };

    checkUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={{ marginTop: 8 }}>Loading Wellmoria...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.title}>Wellmoria</Text>
            {user && <Text style={styles.subtitle}>Welcome back, {user.full_name?.split(" ")[0]}!</Text>}
          </View>
        </View>
        {user && (
          <View style={styles.headerRight}>
            <Text style={styles.levelText}>Level {user.current_level || 1}</Text>
            <Text style={styles.pointsText}>{user.total_points || 0} pts</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <Slot />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.route;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons name={item.icon as any} size={24} color={isActive ? "#14b8a6" : "#9ca3af"} />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

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
