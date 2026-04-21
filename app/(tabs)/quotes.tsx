import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { FONTS, SHADOWS, NEUMORPHISM, PALETTE, COLORS } from "@/utils/theme";
import * as api from "@/utils/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { H } from "@/utils/href";

export default function QuotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
  const { colors } = useTheme();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefreshing = false) => {
    if (!activeOrg?.id) return;
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const resp = await api.listQuotes({ orgId: activeOrg.id, q });
      setItems(resp || []);
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("common.error"), t("quotes.error_load"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeOrg?.id, q]);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.quoteCard, NEUMORPHISM.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(H({ pathname: "/quote-details", params: { id: item.id } } as any))}
    >
      <View style={styles.cardHeader}>
         <View style={[styles.imgPlaceholder, { backgroundColor: colors.background }]}>
            <MaterialIcons name="description" size={24} color={PALETTE.primary} />
         </View>
         <View style={{ flex: 1 }}>
            <Text style={[styles.quoteNumber, { color: colors.text }]}>{item.number || "QU-N/A"}</Text>
            <Text style={[styles.custName, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.contactName || "Khách lẻ"}
            </Text>
         </View>
         <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACCEPTED' ? '#E8F5E9' : PALETTE.primary + '15' }]}>
            <Text style={[styles.statusText, { color: item.status === 'ACCEPTED' ? '#2E7D32' : PALETTE.primary }]}>
              {item.status || "DRAFT"}
            </Text>
         </View>
      </View>

      <View style={styles.cardFooter}>
         <View style={styles.footerLeft}>
            <Feather name="calendar" size={12} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}
            </Text>
         </View>
         <Text style={[styles.amountText, { color: colors.text }]}>
            {new Intl.NumberFormat('vi-VN').format(item.grandTotal || 0)} đ
         </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
         <Text style={[styles.headerTitle, { color: colors.text }]}>{t("quotes.list_title")}</Text>
         <Pressable style={[styles.addBtn, { backgroundColor: PALETTE.primary }]} onPress={() => router.push(H("/quote-new"))}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
         </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, NEUMORPHISM.input, { backgroundColor: colors.surface }]}>
           <Ionicons name="search" size={20} color={colors.textSecondary} />
           <TextInput
             value={q}
             onChangeText={setQ}
             placeholder={t('quotes.searchPlaceholder')}
             placeholderTextColor={colors.textSecondary + '70'}
             style={[styles.searchInput, { color: colors.text }]}
           />
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[PALETTE.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={50} color={colors.textSecondary} style={{ opacity: 0.2 }} />
              <Text style={{ color: colors.textSecondary, marginTop: 10 }}>{t("quotes.no_quotes")}</Text>
            </View>
          ) : null
        }
      />
      {loading && !refreshing && <ActivityIndicator color={PALETTE.primary} style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 15 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 24 },
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  searchWrap: { paddingHorizontal: 24, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 14 },
  quoteCard: { padding: 18, borderRadius: 24, marginBottom: 16, ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  imgPlaceholder: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quoteNumber: { fontFamily: FONTS.bold, fontSize: 16 },
  custName: { fontSize: 13, fontFamily: FONTS.medium, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: FONTS.bold },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)', paddingTop: 12 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 11, fontFamily: FONTS.medium },
  amountText: { fontSize: 15, fontFamily: FONTS.bold },
  empty: { alignItems: 'center', marginTop: 100 },
  loader: { marginTop: 20 }
});
