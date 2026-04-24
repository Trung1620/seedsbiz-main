// app/suppliers.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, RefreshControl, ActivityIndicator,
  Alert, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { FONTS, SIZES, SHADOWS, PALETTE, NEUMORPHISM } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import ScreenBackground from "@/components/ScreenBackground";
import {
  AppHeader, SearchBar, Card, FAB, EmptyState,
  InputField, PrimaryButton, BottomSheetHeader, IconCircle,
} from "@/components/UI";

export default function SuppliersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeOrg } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<api.Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModal, setIsAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", phone: "", address: "", email: "", taxId: "" });

  const load = async () => {
    if (!activeOrg?.id) return;
    setLoading(true);
    try {
      const data = await api.listSuppliers();
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [activeOrg?.id]);

  const handleCreate = async () => {
    if (!form.name) return Alert.alert(t('common.error'), t('suppliers.errMissingName'));
    setSaving(true);
    try {
      await api.createSupplier(form);
      setIsAddModal(false);
      setForm({ code: "", name: "", phone: "", address: "", email: "", taxId: "" });
      load();
    } catch (e) { Alert.alert(t('common.error'), t('suppliers.errCreate')); }
    finally { setSaving(false); }
  };

  const filtered = items.filter(it =>
    it.name.toLowerCase().includes(q.toLowerCase()) || it.phone?.includes(q) || it.code?.includes(q)
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <AppHeader
        title={t('suppliers.title')}
        subtitle={`${items.length} ${t('suppliers.subtitle')}`}
        onBack={() => router.back()}
      />

      <SearchBar value={q} onChangeText={setQ} placeholder={t('suppliers.searchPlaceholder')} />

      <FlatList
        data={filtered}
        keyExtractor={it => it.id}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={PALETTE.primary} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardRow}>
              <IconCircle icon="business-outline" size={22} color={PALETTE.primary} bg={PALETTE.primary + "12"} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  {item.code && (
                    <View style={[styles.codeBadge, { backgroundColor: PALETTE.primary + "18" }]}>
                      <Text style={[styles.codeText, { color: PALETTE.primary }]}>{item.code}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.infoRow}>
                  {item.phone && <Text style={[styles.info, { color: colors.textSecondary }]}>📞 {item.phone}</Text>}
                  {item.email && <Text style={[styles.info, { color: colors.textSecondary }]} numberOfLines={1}>✉️ {item.email}</Text>}
                </View>
              </View>
            </View>
            {item.address && (
              <View style={[styles.addressRow, { borderTopColor: colors.outline }]}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.address, { color: colors.textSecondary }]}>{item.address}</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={PALETTE.primary} style={{ marginTop: 60 }} />
          ) : (
            <EmptyState
              icon="business-outline"
              title={t('suppliers.noData')}
              subtitle={t('suppliers.noDataSub')}
              action={{ label: t('suppliers.addNow'), onPress: () => setIsAddModal(true) }}
            />
          )
        }
      />

      <FAB onPress={() => setIsAddModal(true)} icon="add" />

      {/* MODAL THÊM NCC */}
      <Modal visible={isAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => setIsAddModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <BottomSheetHeader title={t('suppliers.addTitle')} onClose={() => setIsAddModal(false)} />
            <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
              <InputField label={t('suppliers.codeLabel')} placeholder={t('suppliers.codePlaceholder')} value={form.code} onChangeText={v => setForm({ ...form, code: v })} />
              <InputField label={t('suppliers.nameLabel')} placeholder={t('suppliers.namePlaceholder')} value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
              <InputField label={t('suppliers.phoneLabel')} placeholder={t('suppliers.placeholderPhoneExample')} value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
              <InputField label={t('suppliers.emailLabel')} placeholder={t('suppliers.placeholderEmailExample')} value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
              <InputField label={t('suppliers.addressLabel')} placeholder={t('suppliers.placeholderAddressExample')} value={form.address} onChangeText={v => setForm({ ...form, address: v })} />
              <InputField label={t('suppliers.taxIdLabel')} placeholder={t('suppliers.placeholderTaxIdExample')} value={form.taxId} onChangeText={v => setForm({ ...form, taxId: v })} />
              <PrimaryButton label={t('suppliers.saveBtn')} onPress={handleCreate} loading={saving} style={{ marginTop: 8 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: 14 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontSize: 16, fontFamily: FONTS.bold, flex: 1 },
  codeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  codeText: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  infoRow: { flexDirection: "row", gap: 12, marginTop: 4, flexWrap: "wrap" },
  info: { fontSize: 12, fontFamily: FONTS.medium },
  addressRow: { flexDirection: "row", alignItems: "center", marginTop: 12, borderTopWidth: 1, paddingTop: 12, gap: 5 },
  address: { fontSize: 12, fontFamily: FONTS.medium, flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40 },
  sheetContent: { paddingHorizontal: SIZES.padding, paddingBottom: 20 },
});
