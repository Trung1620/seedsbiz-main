// app/org-select.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import { H } from "@/utils/href";
import * as api from "@/utils/api";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

export default function OrgSelectScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setActiveOrg, token } = useAuth();
  const [orgs, setOrgs] = useState<api.Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
       router.replace(H("/auth-login"));
       return;
    }

    (async () => {
      try {
        const data = await api.listOrgs();
        setOrgs(data);
        if (data.length === 0) {
           router.replace(H("/org-create"));
        }
      } catch (e: any) {
        Alert.alert(t("common.error"), e?.message || t("org.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onSelect = (org: api.Org) => {
    setActiveOrg(org);
    router.replace(H("/home"));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{t("org.selectTitle")}</Text>
        <Text style={styles.sub}>{t("org.selectSub")}</Text>

        <FlatList
          data={orgs}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ gap: 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.orgCard, NEUMORPHISM.card]}
              onPress={() => onSelect(item)}
            >
              <View style={styles.orgInfo}>
                 <Text style={styles.orgName}>{item.name}</Text>
                 <Text style={styles.orgRole}>Admin • {item.address || "No address"}</Text>
              </View>
              <View style={styles.chevron}>
                 <Text style={styles.chevronText}>→</Text>
              </View>
            </Pressable>
          )}
        />

        <Pressable
          style={[styles.createBtn, NEUMORPHISM.button]}
          onPress={() => router.push(H("/org-create"))}
        >
          <Text style={styles.createBtnText}>+ {t("org.createNew")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24 },
  title: { fontSize: 32, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8 },
  sub: { fontSize: SIZES.font, color: COLORS.textSecondary, fontFamily: FONTS.medium, marginBottom: 30 },
  orgCard: {
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
  },
  orgInfo: { flex: 1 },
  orgName: { fontSize: SIZES.large, fontFamily: FONTS.bold, color: COLORS.text },
  orgRole: { fontSize: SIZES.small, color: COLORS.textSecondary, fontFamily: FONTS.medium, marginTop: 4 },
  chevron: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  chevronText: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: 18 },
  createBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    borderWidth: 0,
    marginBottom: 20,
  },
  createBtnText: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: SIZES.font },
});
