import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Splash() {
  const router = useRouter(); // used for navigation between screens

  return (
    <View style={styles.container}>
      <View style={styles.inner}>

        {/* --- App Name Display --- 
            Shows the name of the app "Wellmoria" at the center of the splash screen */}
        <Text style={styles.title}>Wellmoria</Text>

        {/* --- Login Button ---
            On press, navigates the user to the Auth (Login) screen */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/Auth")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* --- Signup Button ---
            On press, navigates the user to the SignUp screen */}
        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={() => router.push("/SignUp")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  // Root container: makes the splash screen centered on the screen
  container: {
    flex: 1,
    backgroundColor: "#121212", // dark background for consistency with login theme
    justifyContent: "center",
    alignItems: "center",
  },

  // Inner wrapper to align splash content (app title + buttons) vertically
  inner: {
    alignItems: "center",
    gap: 20,
  },

  // Can be used for an app logo image
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },

  // App title text styling
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
  },

  // Base style for buttons
  button: {
    width: 220,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#6200EE", // primary purple theme
    alignItems: "center",
    marginBottom: 15,
  },

  // Special style for the Sign Up button (teal accent)
  signupButton: {
    backgroundColor: "#03DAC6",
  },

  // Button text styling
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
