// app/production.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { FONTS, NEUMORPHISM, SHADOWS, PALETTE, SIZES } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import ScreenBackground from "@/components/ScreenBackground";
import { AppHeader, EmptyState } from "@/components/UI";

export default function ProductionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authReady, token, activeOrg } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!authReady || !token || !activeOrg?.id) return;
    setLoading(true);
    try {
      const rows = await api.listProductionOrders();
      setItems(rows || []);
    } catch (e: any) {
      console.error("[LOAD_PRODUCTION_ERROR]", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [activeOrg?.id]));

  const getStatusColor = (status: any) => {
    const s = typeof status === 'string' ? status.toUpperCase() : '';
    switch (s) {
      case 'COMPLETED': return '#4CAF50';
      case 'IN_PROGRESS': return colors.primary;
      case 'CANCELLED': return '#FF5252';
      default: return '#FFA000';
    }
  };

  const formatMoney = (val?: number) => {
    const isEn = i18n.language.startsWith('en');
    return new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: isEn ? 'USD' : 'VND',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderNo}>#{item.orderNumber}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '15' }]}>
           <View style={[styles.dot, { backgroundColor: getStatusColor(item.status) }]} />
           <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || t('production.statusPending')}</Text>
        </View>
      </View>

      <Text style={[styles.productName, { color: colors.text }]}>
        {i18n.language.startsWith('vi') ? (item.product?.nameVi || item.product?.name) : (item.product?.nameEn || item.product?.nameVi || item.product?.name)}
      </Text>
      
      <View style={styles.detailRow}>
         <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
               {t('production.workersCount', { count: item.jobSheets?.length || (item.artisan ? 1 : 0) })}
            </Text>
         </View>
         <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
               {item.startDate ? new Date(item.startDate).toLocaleDateString("vi-VN") : "—"} 
               {" - "} 
               {item.expectedEndDate ? new Date(item.expectedEndDate).toLocaleDateString("vi-VN") : (item.duration ? `${item.duration} ngày` : "—")}
            </Text>
         </View>
         <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
               {t('production.qtyLabel', { count: item.quantity })}
            </Text>
         </View>
      </View>

      <View style={[styles.costSummary, { backgroundColor: colors.background + '50' }]}>
         <View style={styles.costItem}>
            <Text style={styles.costLabel}>{t('production.materialCost')}</Text>
            <Text style={[styles.costValue, { color: colors.text }]}>{formatMoney(item.totalMaterialCost)}</Text>
         </View>
         <View style={styles.verticalBar} />
         <View style={styles.costItem}>
            <Text style={styles.costLabel}>{t('production.laborCost')}</Text>
            <Text style={[styles.costValue, { color: colors.text }]}>{formatMoney(item.totalLaborCost)}</Text>
         </View>
         <View style={styles.verticalBar} />
         <View style={styles.costItem}>
            <Text style={styles.costLabel}>{t('production.totalCost')}</Text>
            <Text style={[styles.costValue, { color: colors.primary }]}>
               {formatMoney(item.actualTotalCost)}
            </Text>
         </View>
      </View>

      <Pressable 
        style={[styles.viewBtn, { backgroundColor: colors.background, position: 'absolute', right: 15, bottom: 15 }]}
        onPress={() => {}}
      >
         <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </Pressable>
    </View>
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <AppHeader
        title={t('production.title')}
        subtitle={`${items.length} lệnh sản xuất`}
        onBack={() => router.back()}
        rightAction={
          <Pressable
            style={[{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, SHADOWS.soft]}
            onPress={() => router.push("/production-new")}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        }
      />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <EmptyState
            icon="construct-outline"
            title={t('production.noData')}
            subtitle="Tạo lệnh sản xuất đầu tiên của xưởng bạn"
            action={{ label: 'Tạo lệnh mới', onPress: () => router.push('/production-new') }}
          />
        )}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginVertical: 15 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontFamily: FONTS.bold },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { padding: 18, marginBottom: 16, borderRadius: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  orderBadge: { backgroundColor: PALETTE.cream, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderNo: { fontSize: 13, fontFamily: FONTS.bold, color: PALETTE.primary },
  statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontFamily: FONTS.bold },
  productName: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 15 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 14, fontFamily: FONTS.medium },
  costSummary: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 5 },
  costItem: { flex: 1, alignItems: 'center' },
  costLabel: { fontSize: 9, fontFamily: FONTS.bold, opacity: 0.5, marginBottom: 2, textTransform: 'uppercase' },
  costValue: { fontSize: 13, fontFamily: FONTS.bold },
  verticalBar: { width: 1, height: 20, backgroundColor: '#DDD' },
  viewBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: FONTS.medium, fontSize: 16 },
});
