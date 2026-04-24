// app/quotes.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { FONTS, SHADOWS, NEUMORPHISM, PALETTE, COLORS } from "@/utils/theme";
import * as api from "@/utils/api";
import { H } from "@/utils/href";

export default function QuotesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const data = await api.listQuotes({ orgId: activeOrg.id, q: search });
      setItems(data || []);
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeOrg?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(H({ pathname: "/quote-details", params: { id: item.id } } as any))}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.number, { color: colors.text }]}>{item.number || "QU-N/A"}</Text>
          <Text style={[styles.custName, { color: colors.textSecondary }]}>{item.contactName || item.customer?.name || item.customer?.companyName || t('common.retailCustomer')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACCEPTED' ? '#E8F5E9' : PALETTE.primary + '15' }]}>
          <Text style={[styles.statusText, { color: item.status === 'ACCEPTED' ? '#2E7D32' : PALETTE.primary }]}>
            {item.status || "DRAFT"}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateBox}>
          <Feather name="calendar" size={14} color={colors.textSecondary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString("vi-VN")}
          </Text>
        </View>
        <Text style={[styles.amount, { color: colors.text }]}>
          {new Intl.NumberFormat('vi-VN').format(item.grandTotal || 0)} {t('common.currencySymbol')}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('quotes.list_title')}</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push(H("/quote-new"))}>
          <Ionicons name="add" size={28} color={PALETTE.primary} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, NEUMORPHISM.input, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder={t('quotes.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary + '80'}
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadData}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PALETTE.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={60} color={colors.textSecondary} style={{ opacity: 0.2 }} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('quotes.no_quotes')}</Text>
              <Pressable style={styles.emptyCreateBtn} onPress={() => router.push(H("/quote-new"))}>
                 <Text style={styles.emptyCreateText}>{t('quotes.new_quote')}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 20 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 15 },
  listContent: { padding: 20, paddingBottom: 100 },
  card: { padding: 20, borderRadius: 24, marginBottom: 15, ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  number: { fontSize: 16, fontFamily: FONTS.bold },
  custName: { fontSize: 14, fontFamily: FONTS.medium, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: FONTS.bold },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)', paddingTop: 15 },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, fontFamily: FONTS.medium },
  amount: { fontSize: 16, fontFamily: FONTS.bold },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontFamily: FONTS.medium, fontSize: 15 },
  emptyCreateBtn: { marginTop: 20, backgroundColor: PALETTE.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyCreateText: { color: '#FFF', fontFamily: FONTS.bold, fontSize: 14 }
});
