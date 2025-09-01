import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "../Firebase"; 

// Entry point component for Wellmoria.
// This checks if a user is logged in or not when the app starts.
// Based on that, it decides which screen to show first.
export default function Index() {
  const router = useRouter();  // Used for navigation
  const [loading, setLoading] = useState(true); // State to show loading spinner until auth check finishes

  useEffect(() => {
    const auth = getAuth(app); // Get Firebase authentication instance

    // Listener that triggers whenever authentication state changes (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // User is already logged in → redirect to main Tabs (Home)
        router.replace("/(tabs)/Home");
      } else {
        // User is not logged in → redirect to Splash screen
        router.replace("/Splash");
      }
      setLoading(false); // Stop showing the spinner after decision is made
    });

    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);

  // While checking login status, show a centered loading spinner
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  // If not loading, this component itself doesn’t render anything.
  // Instead, it redirects user to Home or Splash.
  return null;
}
