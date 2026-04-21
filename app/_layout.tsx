// app/_layout.tsx
import "@/locales/i18n";
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/lib/theme/ThemeProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <SafeAppWrapper />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter, useSegments } from "expo-router";

function SafeAppWrapper() {
  const { colors } = useTheme();
  const { user, authReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (!authReady) return;

    const inAuthGroup = 
      segments[0] === "auth-welcome" || 
      segments[0] === "auth-login" || 
      segments[0] === "auth-forgot-password" ||
      segments[0] === "auth-register";

    if (!user && !inAuthGroup) {
      // Nếu chưa login và không ở màn login/welcome/forgot/register -> đẩy về welcome
      router.replace("/auth-welcome");
    } else if (user && inAuthGroup) {
      // Nếu đã login mà lỡ ở màn auth -> đẩy vào trong (tabs)/home
      router.replace("/(tabs)/home");
    }
  }, [user, authReady, segments]);
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: colors.background } 
      }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth-welcome" />
        <Stack.Screen name="auth-login" />
        <Stack.Screen name="auth-forgot-password" />
        <Stack.Screen name="auth-register" />
        <Stack.Screen name="quote-new" />
        <Stack.Screen name="debts-new" />
        <Stack.Screen name="search" />
      </Stack>
    </View>
  );
}
