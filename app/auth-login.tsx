// app/auth-login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import { H } from "@/utils/href";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

export default function AuthLoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("auth.error"), t("auth.missingFields"));
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthProvider will handle navigation after token is set
    } catch (e: any) {
      Alert.alert(t("auth.error"), e?.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.center}>
          <Text style={styles.title}>{t("auth.loginTitle")}</Text>
          <Text style={styles.sub}>{t("auth.loginSub")}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="admin@seedsbiz.com"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>{t("auth.password")}</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Pressable
              style={[styles.primary, NEUMORPHISM.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryText}>{t("auth.loginBtn")}</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("auth.noAccount")}</Text>
              <Pressable onPress={() => router.push(H("/auth-register"))}>
                <Text style={styles.linkText}> {t("auth.registerNow")}</Text>
              </Pressable>
            </View>
          </View>
          
          <Pressable style={styles.back} onPress={() => router.replace(H("/home"))}>
             <Text style={styles.backText}>← {t("common.back")}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  center: { flex: 1, padding: 30, justifyContent: "center" },
  title: { fontSize: 36, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8 },
  sub: { fontSize: SIZES.font, color: COLORS.textSecondary, fontFamily: FONTS.medium, marginBottom: 40 },
  form: { width: "100%" },
  label: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8, marginLeft: 4 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: SIZES.font,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    marginBottom: 20,
    borderWidth: 0,
  },
  primary: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    borderWidth: 0,
  },
  primaryText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: SIZES.font },
  footer: { flexDirection: "row", marginTop: 24, justifyContent: "center" },
  footerText: { color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: SIZES.small },
  linkText: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: SIZES.small },
  back: { marginTop: 40, alignSelf: 'center' },
  backText: { color: COLORS.textSecondary, fontFamily: FONTS.bold, fontSize: SIZES.font },
});
