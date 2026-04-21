// app/auth-create-workspace.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import { H } from "@/utils/href";
import * as api from "@/utils/api";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

export default function AuthCreateWorkspaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setActiveOrg, token } = useAuth();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert(t("common.error"), t("org.nameRequired"));
    if (!token) return Alert.alert(t("common.error"), t("auth.needLogin"));

    setLoading(true);
    try {
      const org = await api.createOrg(name.trim());
      setActiveOrg(org);
      router.replace(H("/home"));
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || t("org.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.center}>
        <Text style={styles.title}>{t("auth.createWorkspaceTitle") || "Tạo Workspace"}</Text>
        <Text style={styles.sub}>Trải nghiệm đầy đủ tính năng với dữ liệu riêng của bạn</Text>

        <View style={styles.form}>
           <Text style={styles.label}>{t("org.orgNameLabel")}</Text>
           <TextInput
             style={[styles.input, NEUMORPHISM.cardInner]}
             value={name}
             onChangeText={setName}
             placeholder="Tên doanh nghiệp của bạn"
             placeholderTextColor={COLORS.textSecondary}
           />

           <Pressable
             style={[styles.primary, NEUMORPHISM.button, loading && { opacity: 0.7 }]}
             onPress={handleCreate}
             disabled={loading}
           >
             {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryText}>{t("common.create")}</Text>}
           </Pressable>
        </View>

        <Pressable style={styles.back} onPress={() => router.back()}>
           <Text style={styles.backText}>← Quay lại</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, padding: 30, justifyContent: "center" },
  title: { fontSize: 32, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8 },
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
  back: { marginTop: 40, alignSelf: 'center' },
  backText: { color: COLORS.textSecondary, fontFamily: FONTS.bold, fontSize: SIZES.font },
});
