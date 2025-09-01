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
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/Firebase"; // Firebase app instance (configured separately)
import { Heart } from "lucide-react-native"; // Heart icon
import { LinearGradient } from "expo-linear-gradient"; // Gradient background

// -------------------------
// Login Screen Component
// -------------------------
// This screen lets users log in with their email & password.
// Uses Firebase Authentication for user validation.
// If login is successful → navigates to Home screen.
// If login fails → shows error messages or redirects to Sign Up.
// -------------------------
export default function LoginScreen() {
  // -------------------------
  // State variables
  // -------------------------
  const [email, setEmail] = useState<string>("");       // Stores user's email input
  const [password, setPassword] = useState<string>(""); // Stores user's password input
  const [loading, setLoading] = useState<boolean>(false); // Tracks login button state (loading spinner)

  const router = useRouter(); // Used to navigate between screens
  const auth = getAuth(app);  // Firebase Auth instance

  // -------------------------
  // Function: handleLogin
  // -------------------------
  // This function runs when user taps "Sign In".
  // 1. Checks if fields are filled.
  // 2. Sends login request to Firebase.
  // 3. If successful → navigates to Home.
  // 4. If failed → shows error alerts (e.g., wrong password, no user found).
  // -------------------------
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true); // Show spinner while Firebase processes login
    try {
      await signInWithEmailAndPassword(auth, email, password); // Firebase login
      router.replace("/(tabs)/Home"); // Redirect to Home if successful
    } catch (error: any) {
      // Handle specific Firebase error codes
      if (error.code === "auth/user-not-found") {
        Alert.alert("User Not Found", "Please create an account");
        router.push("/SignUp"); // Navigate to Sign Up page
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Login Failed", "Incorrect password. Try again.");
      } else {
        Alert.alert("Login Failed", error.message); // Any other error
      }
    }
    setLoading(false); // Hide spinner after process
  };

  // -------------------------
  // UI Layout
  // -------------------------
  // Screen has:
  // 1. Header with app logo + title + subtitle.
  // 2. Login form (email + password).
  // 3. Button for login.
  // 4. Link to Sign Up page.
  // -------------------------
  return (
    <View style={styles.container}>
      {/* ---------- Header Section ---------- */}
      <View style={styles.header}>
        {/* Gradient circle with heart icon */}
        <LinearGradient
          colors={["#14b8a6", "#3b82f6"]}
          style={styles.iconCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Heart color="white" size={32} />
        </LinearGradient>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Welcome to Wellmoria</Text>
        <Text style={styles.subtitle}>
          Your gamified fitness journey starts here.
        </Text>
      </View>

      {/* ---------- Login Card ---------- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In</Text>

        {/* Email input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none" // Prevents auto-capitalization of email
          keyboardType="email-address" // Keyboard optimized for email entry
        />

        {/* Password input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry // Hides password input
          value={password}
          onChangeText={setPassword}
        />

        {/* Login button (shows spinner when loading) */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading} // Disabled during login process
        >
          {loading ? (
            <ActivityIndicator color="white" /> // Spinner while waiting
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Link to Sign Up page */}
        <TouchableOpacity onPress={() => router.push("../SignUp")}>
          <Text style={styles.link}>Need an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748b",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
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
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "500",
  },
});
