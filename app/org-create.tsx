// app/org-create.tsx
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

export default function OrgCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setActiveOrg } = useAuth();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("org.nameRequired"));
      return;
    }

    setLoading(true);
    try {
      const org = await api.createOrg({ name: name.trim(), address: address.trim() });
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
           <Pressable style={styles.back} onPress={() => router.back()}>
              <Text style={styles.backText}>←</Text>
           </Pressable>
           <View>
              <Text style={styles.title}>{t("org.createTitle")}</Text>
              <Text style={styles.sub}>{t("org.createSub")}</Text>
           </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("org.orgNameLabel")}</Text>
          <TextInput
            style={[styles.input, NEUMORPHISM.cardInner]}
            value={name}
            onChangeText={setName}
            placeholder={t("org.orgNamePlaceholder")}
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>{t("org.addressLabel")}</Text>
          <TextInput
            style={[styles.input, NEUMORPHISM.cardInner]}
            value={address}
            onChangeText={setAddress}
            placeholder={t("org.addressPlaceholder")}
            placeholderTextColor={COLORS.textSecondary}
          />

          <Pressable
            style={[styles.primary, NEUMORPHISM.button, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryText}>{t("org.createBtn")}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', gap: 16, marginBottom: 40, marginTop: 10 },
  back: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text },
  title: { fontSize: 32, fontFamily: FONTS.bold, color: COLORS.text },
  sub: { fontSize: SIZES.font, color: COLORS.textSecondary, fontFamily: FONTS.medium, marginTop: 4 },
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
});
