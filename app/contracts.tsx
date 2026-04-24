// app/contracts.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as api from "@/utils/api";
import { H } from "@/utils/href";
import { useAuth } from "@/lib/auth/AuthProvider";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

type ContractRow = {
  id: string;
  number?: string;
  status?: string;
  buyerName?: string;
  quoteNumber?: string;
  grandTotal?: number;
  createdAt?: string;
};

function formatMoney(v?: number, t?: any) {
  if (typeof v !== "number") return "";
  return `${v.toLocaleString("vi-VN")} ${t ? t('common.currencySymbol') : 'đ'}`;
}

export default function ContractsScreen() {
  const router = useRouter();
  const { authReady, activeOrg } = useAuth();
  const { t } = useTranslation();

  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ContractRow[]>([]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.authedFetch("/api/contracts").then(res => res.json());
      setItems(Array.isArray(data) ? data : (data.contracts || []));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('contracts.loadingFailed', { defaultValue: 'Could not load contracts.' }));
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      "Bạn có chắc muốn xóa hợp đồng này?",
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.authedFetch(`/api/contracts/${id}`, { method: 'DELETE' });
              loadData();
            } catch (e: any) { Alert.alert(t('common.error'), e.message); }
          }
        }
      ]
    );
  };

  React.useEffect(() => {
    if (!authReady || !activeOrg?.id) return;
    loadData();
  }, [authReady, activeOrg?.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push(H("/home"))} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('contracts.title')}</Text>
          <Text style={styles.sub}>
            {activeOrg?.name || t('contracts.sub')}
          </Text>
        </View>

        <Pressable
          style={[styles.primaryBtn, NEUMORPHISM.button]}
          onPress={() => router.push(H("/quotes"))}
        >
          <Text style={styles.primaryBtnText}>{t('contracts.createBtn')}</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('contracts.searchPlaceholder')}
          placeholderTextColor={COLORS.textSecondary}
          style={[styles.searchInput, NEUMORPHISM.cardInner]}
        />
        <Pressable style={[styles.searchBtn, NEUMORPHISM.button]} onPress={loadData}>
          <Text style={styles.searchBtnText}>{t('contracts.searchText')}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.centerText}>{t('contracts.loading')}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={[styles.emptyWrap, NEUMORPHISM.cardInner]}>
          <Text style={styles.emptyTitle}>{t('contracts.emptyTitle')}</Text>
          <Text style={styles.emptyText}>
            {t('contracts.emptyDesc')}
          </Text>

          <Pressable
            style={[styles.emptyBtn, NEUMORPHISM.button]}
            onPress={() => router.push(H("/quotes"))}
          >
            <Text style={styles.emptyBtnText}>{t('contracts.goToQuote')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items.filter(it => it.number?.toLowerCase().includes(q.toLowerCase()) || it.buyerName?.toLowerCase().includes(q.toLowerCase()))}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, NEUMORPHISM.card]}
              onPress={() =>
                router.push(H({ pathname: "/contract-details", params: { id: item.id } } as any))
              }
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {item.number || t('contracts.draftName')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                   <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{item.status || "DRAFT"}</Text>
                   </View>
                   <Pressable onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#FF5252" />
                   </Pressable>
                </View>
              </View>

              <Text style={styles.cardSub}>
                {t('contracts.customerLabel')}: <Text style={styles.highlightText}>{item.buyerName || "—"}</Text>
              </Text>

              <Text style={styles.cardSub}>
                {t('contracts.quoteLabel')}: <Text style={styles.highlightText}>{item.quoteNumber || "—"}</Text>
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardSub}>Tổng giá trị</Text>
                <Text style={styles.totalText}>{formatMoney(item.grandTotal, t)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text },
  title: { fontSize: SIZES.large, fontFamily: FONTS.bold, color: COLORS.text },
  sub: { marginTop: 2, fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  primaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.primary },
  primaryBtnText: { color: COLORS.white, fontSize: SIZES.small, fontFamily: FONTS.bold },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", gap: 10 },
  searchInput: { flex: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: SIZES.font, color: COLORS.text },
  searchBtn: { paddingHorizontal: 20, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  searchBtnText: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  centerText: { color: COLORS.textSecondary, fontFamily: FONTS.semiBold, fontSize: SIZES.font },
  emptyWrap: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  emptyTitle: { fontSize: SIZES.medium, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: SIZES.small, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.background },
  emptyBtnText: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: SIZES.small },
  card: { borderRadius: 16, padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: SIZES.font, fontFamily: FONTS.bold, color: COLORS.text, flex: 1 },
  statusBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primary },
  cardSub: { fontSize: SIZES.small, color: COLORS.textSecondary, marginBottom: 6 },
  highlightText: { color: COLORS.text, fontFamily: FONTS.semiBold },
  cardFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.background, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalText: { fontSize: SIZES.large, fontFamily: FONTS.bold, color: COLORS.text },
});
