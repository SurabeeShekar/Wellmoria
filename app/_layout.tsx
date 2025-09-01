import { Stack } from "expo-router"; // For handling navigation stack
import { StatusBar } from "expo-status-bar"; // For customizing status bar appearance
import { KeyboardAvoidingView, Platform } from "react-native"; // To move UI up when keyboard opens
import { SafeAreaProvider } from "react-native-safe-area-context"; // To ensure content stays inside safe area (not overlapping notches/status bar)

export default function RootLayout() {
  return (
    // SafeAreaProvider ensures the UI respects device safe zones (like iPhone notch, status bar, etc.)
    <SafeAreaProvider>
      {/* KeyboardAvoidingView moves content when keyboard opens, 
          so text fields aren’t hidden by the keyboard */}
      <KeyboardAvoidingView
        style={{ flex: 1 }} // Makes it fill the entire screen
        behavior={Platform.OS === "ios" ? "padding" : "height"} // On iOS: push content up, On Android: resize height
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Extra offset for Android so UI doesn’t overlap
      >
        {/* Stack navigator manages the different screens in the app */}
        <Stack>
          {/* Initial splash/auth check page (decides whether user is logged in or not) */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Splash screen shown when app starts */}
          <Stack.Screen name="Splash" options={{ headerShown: false }} />

          {/* Login (authentication) page */}
          <Stack.Screen name="/Auth" options={{ headerShown: false }} />

          {/* Sign-up (registration) page */}
          <Stack.Screen name="/SignUp" options={{ headerShown: false }} />

          {/* Onboarding page for first-time users */}
          <Stack.Screen name="/Onboarding" options={{ headerShown: false }} />

          {/* Tabs layout (contains home, profile, game, etc.) */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>

        {/* Status bar styling (light text on dark background) */}
        <StatusBar style="light" />
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}
