import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { app } from "@/Firebase"; 

// Onboarding screen for collecting additional user details 
// (name, age, height, weight) after authentication
export default function Onboarding() {
  const router = useRouter();
  const auth = getAuth(app); // Firebase authentication instance
  const db = getDatabase(app); // Firebase Realtime Database instance

  // State to hold form input values
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    height: "",
    weight: "",
  });

  // Loading state to show activity indicator while saving data
  const [loading, setLoading] = useState(false);

  // Function to update specific field values dynamically
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validate form inputs before submission
  const validateForm = (): boolean => {
    const { full_name, age, height, weight } = formData;

    // Ensure no fields are left empty
    if (!full_name || !age || !height || !weight) {
      Alert.alert("Error", "Please fill in all fields to continue.");
      return false;
    }

    // Validate age range (13–120 years)
    if (+age < 13 || +age > 120) {
      Alert.alert("Error", "Please enter a valid age.");
      return false;
    }

    // Validate height range (50–250 cm)
    if (+height < 50 || +height > 250) {
      Alert.alert("Error", "Please enter a valid height in cm.");
      return false;
    }

    // Validate weight range (20–300 kg)
    if (+weight < 20 || +weight > 300) {
      Alert.alert("Error", "Please enter a valid weight in kg.");
      return false;
    }

    return true; // All checks passed
  };

  // Handle submission of profile details
  const handleSubmit = async () => {
    // Stop execution if validation fails
    if (!validateForm()) return;

    setLoading(true); // Show loader while saving data
    try {
      const user = auth.currentUser; // Get the currently logged-in user
      if (!user) {
        Alert.alert("Error", "No authenticated user found.");
        return;
      }

      // Save user profile data into Firebase Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        total_points: 0,         // Initial gamification points
        current_level: 1,        // Start at level 1
        daily_step_goal: 8000,   // Default daily step goal
        daily_water_goal: 2000,  // Default daily water intake goal (ml)
        createdAt: new Date().toISOString(), // Timestamp for account creation
      });

      // Show success message and redirect to login/auth screen
      Alert.alert(
        "🎉 Success",
        "Account created successfully!",
        [{ text: "OK", onPress: () => router.replace("/Auth") }]
      );
    } catch (error: any) {
      // Handle errors gracefully (e.g., database failure)
      Alert.alert("Error", error.message || "Failed to save details.");
    }
    setLoading(false); // Hide loader once process is complete
  };

  return (
    <View style={styles.container}>
      {/* Header Section with icon and title */}
      <View style={styles.header}>
        <View style={styles.heartWrapper}>
          <Heart size={32} color="white" />
        </View>
        <Text style={styles.title}>Just a few more details...</Text>
        <Text style={styles.subtitle}>
          Let’s set up your profile to personalize your experience.
        </Text>
      </View>

      {/* Card containing the input form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Complete Your Profile</Text>

        {/* Full Name Input */}
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.full_name}
          onChangeText={(text) => handleInputChange("full_name", text)}
        />

        {/* Row for Age, Height, and Weight */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Age"
            keyboardType="numeric"
            value={formData.age}
            onChangeText={(text) => handleInputChange("age", text)}
          />
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Height (cm)"
            keyboardType="numeric"
            value={formData.height}
            onChangeText={(text) => handleInputChange("height", text)}
          />
          <TextInput
            style={[styles.input, styles.smallInput]}
            placeholder="Weight (kg)"
            keyboardType="numeric"
            value={formData.weight}
            onChangeText={(text) => handleInputChange("weight", text)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Start My Journey</Text>
          )}
        </TouchableOpacity>

        {/* Navigation to login screen if already registered */}
        <TouchableOpacity onPress={() => router.push("/Auth")}>
          <Text style={styles.signInLink}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  heartWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    flex: 1,
    color: "#0f172a",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  smallInput: {
    flex: 1,
  },
  button: {
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  signInLink: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "500",
  },
});
