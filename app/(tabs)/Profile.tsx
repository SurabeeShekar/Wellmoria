import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { auth } from "@/Firebase";
import { User as UserIcon, LogOut, Save } from "lucide-react-native";

export default function Profile() {
  // State variables
  const [user, setUser] = useState<any>(null); // Stores user info (from Firebase)
  const [formData, setFormData] = useState<any>({}); // Editable profile fields
  const [loading, setLoading] = useState(true); // Loading indicator for profile fetch
  const [editing, setEditing] = useState(false); // Toggles edit mode
  const [saving, setSaving] = useState(false); // Indicates save operation in progress

  // Fetch user profile data when component mounts
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const db = getDatabase();
    const profileRef = ref(db, `users/${currentUser.uid}`);

    // Listen for profile changes in Firebase Realtime Database
    const unsubscribe = onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUser({ ...currentUser, ...data });

        // Pre-fill form data with existing profile values
        setFormData({
          full_name: data.full_name || currentUser.email?.split("@")[0],
          age: data.age || "",
          height: data.height || "",
          weight: data.weight || "",
          daily_step_goal: data.daily_step_goal || 8000,
          daily_water_goal: data.daily_water_goal || 2000,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Handle changes in input fields
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Save updated profile data to Firebase
  const saveProfile = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const db = getDatabase();
      await update(ref(db, `users/${auth.currentUser.uid}`), {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        daily_step_goal: parseInt(formData.daily_step_goal),
        daily_water_goal: parseInt(formData.daily_water_goal),
      });
      setEditing(false); // Exit edit mode after saving
    } catch (error) {
      Alert.alert("Error", "Failed to save profile.");
      console.error(error);
    }
    setSaving(false);
  };

  // Log out the user
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
    } catch (error) {
      Alert.alert("Error", "Failed to sign out.");
      console.error(error);
    }
  };

  // Calculate BMI based on weight & height
  const getBMI = () => {
    if (!formData?.weight || !formData?.height) return null;
    const h = formData.height / 100; // Convert cm → meters
    return (formData.weight / (h * h)).toFixed(1); // BMI formula
  };

  // Determine BMI category and assign color
  const getBMIStatus = () => {
    const bmiString = getBMI();
    if (!bmiString) return null;

    const bmi = parseFloat(bmiString);
    if (isNaN(bmi)) return null;

    if (bmi < 18.5) return { status: "Underweight", color: "#3b82f6" };
    if (bmi < 25) return { status: "Normal", color: "#16a34a" };
    if (bmi < 30) return { status: "Overweight", color: "#eab308" };
    return { status: "Obese", color: "#dc2626" };
  };

  // Show loader while profile is fetching
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <UserIcon color="#14b8a6" size={28} />
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>
          Manage your personal information and goals
        </Text>
      </View>

      {/* Profile Card with user info */}
      <View style={styles.card}>
        <Text style={styles.name}>{formData.full_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {/* Fitness level and points */}
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: "#9333ea" }]}>
              Level {user?.current_level || 1}
            </Text>
            <Text style={styles.metricLabel}>Fitness Level</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: "#f59e0b" }]}>
              {user?.total_points || 0}
            </Text>
            <Text style={styles.metricLabel}>Total Points</Text>
          </View>
        </View>
      </View>

      {/* Personal Information (Editable) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        {/* Input fields for user data */}
        {["full_name", "age", "height", "weight"].map((field, idx) => (
          <TextInput
            key={idx}
            style={[styles.input, !editing && styles.inputDisabled]}
            placeholder={field.replace("_", " ")}
            value={String(formData[field] || "")}
            onChangeText={(val) => handleInputChange(field, val)}
            editable={editing}
            keyboardType={field === "full_name" ? "default" : "numeric"}
          />
        ))}

        {/* BMI Display */}
        {getBMI() && (
          <View style={styles.bmiBox}>
            <Text style={styles.bmiLabel}>BMI</Text>
            <Text style={styles.bmiValue}>{getBMI()}</Text>
            <Text style={[styles.bmiStatus, { color: getBMIStatus()?.color }]}>
              {getBMIStatus()?.status}
            </Text>
          </View>
        )}

        {/* Save Button (visible only in edit mode) */}
        {editing && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={saveProfile}
            disabled={saving}
          >
            <Save color="white" size={18} />
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Daily Goals Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Goals</Text>
        {["daily_step_goal", "daily_water_goal"].map((field, idx) => (
          <TextInput
            key={idx}
            style={[styles.input, !editing && styles.inputDisabled]}
            placeholder={field.replace("_", " ")}
            value={String(formData[field] || "")}
            onChangeText={(val) => handleInputChange(field, val)}
            editable={editing}
            keyboardType="numeric"
          />
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut color="white" size={18} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  headerSubtitle: { color: "#64748b", marginTop: 4 },
  card: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  name: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-around" },
  metric: { alignItems: "center" },
  metricValue: { fontSize: 18, fontWeight: "bold" },
  metricLabel: { fontSize: 12, color: "#6b7280" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  editBtn: { color: "#2563eb", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: "#0f172a",
  },
  inputDisabled: { backgroundColor: "#e5e7eb" },
  bmiBox: { alignItems: "center", marginVertical: 10 },
  bmiLabel: { fontWeight: "bold", color: "#0f172a" },
  bmiValue: { fontSize: 18, fontWeight: "bold" },
  bmiStatus: { fontSize: 14 },
  saveBtn: {
    backgroundColor: "#14b8a6",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: { color: "white", fontWeight: "600", marginLeft: 6 },
  logoutBtn: {
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: { color: "white", fontWeight: "600" },
});
