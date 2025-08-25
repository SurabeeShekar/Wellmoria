import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        {/* Splash / auth check page */}
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />

        {/* Entry page */}
        <Stack.Screen 
          name="Splash" 
          options={{ headerShown: false }} 
        />

        {/* Auth = login page */}
        <Stack.Screen 
          name="/Auth" 
          options={{ headerShown: false }} 
        />

        {/* Sign up page */}
        <Stack.Screen 
          name="/SignUp" 
          options={{ headerShown: false }} 
        />

        {/* Onboarding page */}
        <Stack.Screen 
          name="/Onboarding" 
          options={{ headerShown: false }} 
        />
        

        {/* Tabs layout */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
