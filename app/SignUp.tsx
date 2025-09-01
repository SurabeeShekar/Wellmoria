import { useState } from "react";
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
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { Pedometer } from "expo-sensors";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { app } from "@/Firebase";

// ----- Signup Screen ------
export default function SignupScreen() {
  // Local states to hold form data
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // loader state

  const router = useRouter();
  const auth = getAuth(app); // Firebase authentication instance
  const db = getDatabase(app); // Firebase realtime database instance

  // ---- Handle Signup Logic ----
  const handleSignup = async () => {
    // Step 1: Input Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    // Step 2: Show loader
    setLoading(true);

    try {
      // Step 3: Create new user in Firebase Authentication
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Step 4: Initialize tracking data for the new user
      const today = format(new Date(), "yyyy-MM-dd"); // store in YYYY-MM-DD format

      // Get device steps since midnight using Pedometer
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0); // reset time to start of day
      const result = await Pedometer.getStepCountAsync(startOfDay, new Date());
      const deviceSteps = result.steps || 0;

      // Step 5: Save step offset in local storage
      // This ensures the app starts counting from 0 for the new user,
      // instead of continuing from the device's raw pedometer count
      await AsyncStorage.setItem("stepsOffset", deviceSteps.toString());

      // Step 6: Initialize default step data in Firebase Realtime Database
      // Create an entry for today's steps
      await set(ref(db, `users/${user.uid}/steps/${today}`), {
        date: today,
        steps: 0,
        calories_burned: 0,
        distance_km: 0,
      });

      // Create/update a "today" shortcut entry for quick access
      await set(ref(db, `users/${user.uid}/today`), {
        date: today,
        steps: 0,
        calories_burned: 0,
        distance_km: 0,
      });

      // Save metadata like offset
      await set(ref(db, `users/${user.uid}/meta`), {
        stepsOffset: deviceSteps,
      });

      // Step 7: Redirect to Onboarding screen after successful signup
      router.replace("/Onboarding");
    } catch (error: any) {
      // If Firebase signup fails, show the error
      Alert.alert("Signup Failed", error.message);
    }

    // Step 8: Hide loader
    setLoading(false);
  };

  // ----- UI -----
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Back navigation */}
        <TouchableOpacity onPress={() => router.push("/Auth")}>
          <Text style={styles.backLink}>← Back to sign in</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Create your account</Text>

        {/* Email field */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password field */}
        <TextInput
          style={styles.input}
          placeholder="Password (Min. 8 characters)"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Confirm password field */}
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Signup button */}
        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 4 },
  backLink: { color: "#2563eb", fontWeight: "500", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#0f172a" },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 12, color: "#0f172a" },
  button: { backgroundColor: "#0f172a", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 8 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
