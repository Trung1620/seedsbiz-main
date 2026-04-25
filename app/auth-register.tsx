// app/auth-register.tsx
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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import { H } from "@/utils/href";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

export default function AuthRegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OWNER" | "STAFF">("OWNER");
  const [orgValue, setOrgValue] = useState(""); // Tên xưởng hoặc Mã xưởng
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !orgValue) {
      Alert.alert(t("auth.error"), t("auth.missingFields"));
      return;
    }

    setLoading(true);
    try {
      const data = await register(name.trim(), email.trim(), password, role, orgValue.trim());
      if (data.status === "PENDING") {
        Alert.alert(
          t("auth.registerSuccess"), 
          t("auth.registerPending"),
          [{ text: "OK", onPress: () => router.replace(H("/auth-login")) }]
        );
      } else {
        Alert.alert(t("auth.success"), t("auth.registerSuccess"), [
          { text: "OK", onPress: () => router.replace(H("/auth-login")) }
        ]);
      }
    } catch (e: any) {
      Alert.alert(t("auth.error"), e?.message || t("auth.registerFailed"));
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{t("auth.registerTitle")}</Text>
          <Text style={styles.sub}>{t("auth.registerSub")}</Text>

          <View style={styles.form}>
            {/* ROLE SELECTION */}
            <View style={styles.roleContainer}>
               <Pressable 
                 style={[styles.roleBtn, role === "OWNER" && styles.roleBtnActive]} 
                 onPress={() => setRole("OWNER")}
               >
                  <Text style={[styles.roleBtnText, role === "OWNER" && styles.roleBtnTextActive]}>{t("auth.roleOwner")}</Text>
               </Pressable>
               <Pressable 
                 style={[styles.roleBtn, role === "STAFF" && styles.roleBtnActive]} 
                 onPress={() => setRole("STAFF")}
               >
                  <Text style={[styles.roleBtnText, role === "STAFF" && styles.roleBtnTextActive]}>{t("auth.roleStaff")}</Text>
               </Pressable>
            </View>

            <Text style={styles.label}>{t("profile.fullName")}</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={name}
              onChangeText={setName}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>{t('profile.email')}</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@email.com"
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.label}>{role === "OWNER" ? t("auth.orgName") : t("auth.orgCode")}</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={orgValue}
              onChangeText={setOrgValue}
              placeholder={role === "OWNER" ? t("auth.placeholderOrgName") : t("auth.placeholderOrgCode")}
              autoCapitalize={role === "STAFF" ? "none" : "sentences"}
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
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryText}>{t("auth.registerBtn")}</Text>
              )}
            </Pressable>


            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("auth.hasAccount")}</Text>
              <Pressable onPress={() => router.push(H("/auth-login"))}>
                <Text style={styles.linkText}> {t("auth.loginNow")}</Text>
              </Pressable>
            </View>
          </View>
          
          <Pressable style={styles.back} onPress={() => router.back()}>
             <Text style={styles.backText}>← {t("common.back")}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { padding: 30, justifyContent: "center", minHeight: '100%' },
  title: { fontSize: 36, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8 },
  sub: { fontSize: SIZES.font, color: COLORS.textSecondary, fontFamily: FONTS.medium, marginBottom: 40 },
  form: { width: "100%" },
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  roleBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.textSecondary },
  roleBtnTextActive: { color: COLORS.white },
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
  back: { marginTop: 40, alignSelf: 'center', marginBottom: 20 },
  backText: { color: COLORS.textSecondary, fontFamily: FONTS.bold, fontSize: SIZES.font },
});
