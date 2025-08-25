import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Splash() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Logo */}
        <Image source={require("../assets/logo.png")} style={styles.logo} />

        {/* App name */}
        <Text style={styles.title}>Wellmoria</Text>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/Auth")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // match login theme
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    alignItems: "center",
    gap: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
  },
  button: {
    width: 220,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#6200EE", // primary purple like login
    alignItems: "center",
    marginBottom: 15,
  },
  signupButton: {
    backgroundColor: "#03DAC6", // teal accent for signup
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
