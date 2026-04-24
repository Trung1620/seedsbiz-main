// app/auth-welcome.tsx
import React, { useState } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import Constants from "expo-constants";
import { COLORS, FONTS, SIZES, NEUMORPHISM, TYPOGRAPHY, PALETTE } from "@/utils/theme";
import { Image } from "react-native";

const BambooBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {[...Array(5)].map((_, row) => (
      [...Array(4)].map((_, col) => (
        <View 
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            top: `${row * 20 + Math.random() * 10}%`,
            left: `${col * 25 + Math.random() * 10}%`,
            width: 10, 
            height: 70,
            backgroundColor: 'rgba(160, 82, 45, 0.07)',
            transform: [{ rotate: '35deg' }],
            borderRadius: 4,
            borderWidth: 1,
            borderColor: 'rgba(160, 82, 45, 0.08)',
          }}
        >
          <View style={{ position: 'absolute', top: '35%', width: '130%', height: 1.5, backgroundColor: 'rgba(160, 82, 45, 0.12)', left: '-15%' }} />
          <View style={{ position: 'absolute', top: '75%', width: '130%', height: 1.5, backgroundColor: 'rgba(160, 82, 45, 0.12)', left: '-15%' }} />
        </View>
      ))
    ))}
  </View>
);

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version || "0.1.0";

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
    } catch (e: any) {
      Alert.alert(t("auth.error"), e?.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <BambooBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={[styles.brandTitle, { marginBottom: -5 }]}>KHO</Text>
            <View style={styles.logoRow}>
              <Image 
                source={require("../assets/bamboo-logo.png")} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>{t('auth.brandPart1')}</Text>
            </View>
            <Text style={[styles.brandTitle, { marginTop: -5 }]}>{t('auth.brandPart2')}</Text>
            
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          {/* Form Section */}
          <View style={[styles.formContainer, { marginTop: -10 }]}>
            <View style={[styles.inputGroup, NEUMORPHISM.cardInner]}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('auth.fieldAccount')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={t('auth.placeholderEmail')}
                  placeholderTextColor="rgba(26, 26, 26, 0.3)"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('auth.fieldPassword')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor="rgba(26, 26, 26, 0.3)"
                />
              </View>
            </View>

            <Pressable
              style={[styles.loginBtn, NEUMORPHISM.button, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={PALETTE.white} />
              ) : (
                <Text style={styles.loginBtnText}>{t("auth.loginBtn")}</Text>
              )}
            </Pressable>

            <Pressable 
              style={styles.forgotBtn}
              onPress={() => router.push("/auth-forgot-password")}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPasswordBtn')}</Text>
            </Pressable>
          </View>

          {/* Registration Section */}
          <View style={styles.registrationSection}>
            <Pressable
              style={styles.registerBtn}
              onPress={() => router.push("/auth-register")}
            >
              <Text style={styles.registerBtnText}>{t('auth.createAccount')}</Text>
            </Pressable>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.versionLabel')} {version}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { 
    flex: 1, 
    paddingHorizontal: 40, 
    justifyContent: "space-between", 
    paddingVertical: 30 
  },
  
  header: { alignItems: 'flex-start', marginTop: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  brandTitle: { 
    fontSize: 42, // Giảm từ 56 xuống 42
    fontFamily: FONTS.serif, 
    color: PALETTE.primary, 
    letterSpacing: -1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -10,
  },
  logo: {
    width: 70, // Giảm từ 100 xuống 70
    height: 70, // Giảm từ 100 xuống 70
    marginRight: -5,
    marginTop: -10,
  },
  tagline: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    letterSpacing: 4,
    fontSize: 10,
    marginTop: 10,
  },

  formContainer: { width: "100%", marginBottom: 20 },
  inputGroup: {
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(230, 173, 45, 0.1)',
    marginBottom: 24,
    padding: 10,
  },
  field: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    color: PALETTE.primary,
    marginBottom: 4,
  },
  textInput: {
    fontSize: SIZES.medium,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(230, 173, 45, 0.1)',
    marginHorizontal: 20,
  },

  loginBtn: {
    height: 64,
    justifyContent: 'center',
    alignItems: "center",
    ...NEUMORPHISM.button,
  },
  loginBtnText: { 
    color: PALETTE.white, 
    fontFamily: FONTS.bold, 
    fontSize: SIZES.medium,
    letterSpacing: 1
  },

  forgotBtn: {
    alignSelf: 'center',
    marginTop: 15,
  },
  forgotText: {
    ...TYPOGRAPHY.caption,
    color: PALETTE.primary,
    fontSize: 12,
    fontFamily: FONTS.bold, // Thêm độ đậm
    textDecorationLine: 'underline',
  },

  registerBtn: {
    backgroundColor: 'rgba(230, 173, 45, 0.18)', // Tăng độ đậm nền một chút
    borderRadius: 15, // Bo góc vừa phải, không quá tròn
    height: 56,
    justifyContent: 'center',
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: 'rgba(230, 173, 45, 0.3)', // Viền rõ nét hơn
  },
  registerBtnText: {
    color: PALETTE.primary,
    fontFamily: FONTS.bold,
    fontSize: SIZES.medium,
  },

  registrationSection: {
    width: "100%",
    marginTop: 20,
    marginBottom: 10,
  },

  footer: { alignSelf: 'center', marginBottom: 10 },
  footerText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(26, 26, 26, 0.3)'
  }
});
