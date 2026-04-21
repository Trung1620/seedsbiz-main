// app/index.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { PALETTE } from "@/utils/theme";

export default function RootIndex() {
  const { token, authReady } = useAuth();

  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: PALETTE.sand }}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  // If no token -> Must go to Welcome screen
  if (!token) {
    return <Redirect href="/auth-welcome" />;
  }

  // If token exists -> Go to main screen (Tabs)
  return <Redirect href="/(tabs)/home" />;
}