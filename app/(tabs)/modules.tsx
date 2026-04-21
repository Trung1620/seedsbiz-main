// app/(tabs)/modules.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, RefreshControl, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '@/utils/theme';
import { useAuth } from '@/lib/auth/AuthProvider';
import * as api from "@/utils/api";

const { width, height } = Dimensions.get('window');

const getModuleGroups = (t: any) => [
  {
    title: t('modulesScreen.groups.inventory.title'),
    icon: "inventory-2",
    color: COLORS.primary,
    items: [
      { key: "products", label: t('modulesScreen.groups.inventory.products'), desc: t('home.modules.products.desc') || "List products", route: "/products", icon: "category" },
      { key: "variants", label: t('modulesScreen.groups.inventory.variants'), desc: t('home.modules.products.desc') || "SKU Management", route: "/product-new", icon: "layers" },
      { key: "bom", label: t('modulesScreen.groups.inventory.bom'), desc: t('home.modules.materials.desc') || "BOM Management", route: "/materials", icon: "reorder" },
      { key: "barcode", label: t('modulesScreen.groups.inventory.barcode'), desc: t('quotes.scanner.hint') || "QR Scan", route: "/scan", icon: "qr-code-scanner" },
      { key: "suppliers", label: "Nhà cung cấp", desc: "Đối tác vật tư mây tre", route: "/suppliers", icon: "local-shipping" },
    ]
  },
  {
    title: "QUẢN LÝ TÀI CHÍNH",
    icon: "account-balance-wallet",
    color: COLORS.error,
    items: [
      { key: "debts", label: "Quản lý Công nợ", desc: "Theo dõi nợ Khách/Thợ/NCC", route: "/debts", icon: "money-off" },
      { key: "expenses", label: "Phiếu chi tiền", desc: "Quản lý chi phí vận hành", route: "/expenses", icon: "payments" },
      { key: "reports", label: t('home.modules.reports.title') || "Báo cáo", desc: t('home.modules.reports.desc') || "Phân tích doanh thu/lợi nhuận", route: "/reports", icon: "insert-chart" },
    ]
  },
  {
    title: t('modulesScreen.groups.production.title'),
    icon: "engineering",
    color: "#FF9500",
    items: [
      { key: "artisans", label: t('modulesScreen.groups.production.artisans'), desc: t('home.modules.artisans.desc') || "Artisan Profiles", route: "/artisans", icon: "person" },
      { key: "processing", label: t('modulesScreen.groups.production.processing'), desc: t('home.modules.production.desc') || "Job Sheets", route: "/job-sheets", icon: "assignment" },
      { key: "progress", label: t('modulesScreen.groups.production.progress'), desc: t('home.modules.production.desc') || "Progress", route: "/production-progress", icon: "hourglass-top" },
      { key: "labor_cost", label: t('modulesScreen.groups.production.labor_cost'), desc: t('home.modules.expenses.desc') || "Labor Costing", route: "/debts", icon: "calculate" },
    ]
  },
  {
    title: t('modulesScreen.groups.sales.title'),
    icon: "shopping-basket",
    color: "#FF2D55",
    items: [
      { key: "pos", label: t('modulesScreen.groups.sales.pos'), desc: t('home.modules.quotes.desc') || "Quick POS", route: "/quote-new", icon: "point-of-sale" },
      { key: "custom_order", label: t('modulesScreen.groups.sales.custom_order'), desc: t('home.modules.quotes.desc') || "Custom Requests", route: "/quotes", icon: "auto-fix-high" },
      { key: "customers", label: t('modulesScreen.groups.sales.customers'), desc: t('home.modules.customers.desc') || "Customer CRM", route: "/customers", icon: "groups" },
    ]
  },
  {
    title: t('modulesScreen.groups.shipping.title'),
    icon: "local-shipping",
    color: "#007AFF",
    items: [
      { key: "shipping", label: t('modulesScreen.groups.shipping.tracking'), desc: t('home.modules.shipping.desc') || "Shipping tracking", route: "/shipping", icon: "local-shipping" },
      { key: "repair", label: t('modulesScreen.groups.shipping.repair'), desc: "Care after sales", route: "/warranty", icon: "verified-user" },
    ]
  },
  {
    title: "Hệ thống",
    icon: "settings",
    color: "#8E8E93",
    items: [
      { key: "settings", label: t('nav.settings') || "Cài đặt", desc: "Cấu hình ứng dụng & Vùng miền", route: "/settings", icon: "settings" },
      { key: "profile", label: t('home.viewProfile') || "Hồ sơ", desc: "Thông tin cá nhân", route: "/profile", icon: "person" },
    ]
  }
];

const DetailItem = ({ label, value, icon, color, subValue }: any) => (
  <View style={styles.detailCard}>
    <View style={[styles.detailIcon, { backgroundColor: color + '15' }]}>
      <MaterialIcons name={icon} size={22} color={color} />
    </View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: COLORS.onSurface }]}>{value}</Text>
      {subValue && <Text style={styles.detailSubValue}>{subValue}</Text>}
    </View>
  </View>
);

export default function ModulesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { activeOrg, logout } = useAuth();
  
  const MODULE_GROUPS = getModuleGroups(t);
  const isVi = i18n.language.startsWith('vi');
  
  const [stats, setStats] = useState({
    revenue: 0,
    growth: 0,
    debtTotal: 0,
    inventoryValue: 0,
    netProfit: 0,
    recentPayments: [] as any[],
    recentExpenses: [] as any[],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFinanceVisible, setIsFinanceVisible] = useState(false);

  const loadStats = async (isRefreshing = false) => {
    if (!activeOrg?.id) return;
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getDashboardStats(activeOrg.id);
      if (data) {
        setStats({
          revenue: data.revenue || 0,
          growth: data.growth || 0,
          debtTotal: data.debtTotal || 0,
          inventoryValue: data.inventoryValue || 0,
          netProfit: data.netProfit || 0,
          recentPayments: data.recentPayments || [],
          recentExpenses: data.recentExpenses || [],
        });
      }
    } catch (e) {
      console.error("Finance stats error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [activeOrg?.id])
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(isVi ? "vi-VN" : "en-US", {
      style: "currency",
      currency: isVi ? "VND" : "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <View style={styles.container}>
      {/* HEADER TÍCH HỢP TÌNH TRẠNG XƯỞNG */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
            <View>
                <Text style={styles.headerTitle}>{t('modulesScreen.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('modulesScreen.subtitle')}</Text>
            </View>
            <Pressable 
              style={styles.notifBtn}
              onPress={() => router.push("/notifications")}
            >
              <MaterialIcons name="notifications-none" size={26} color={COLORS.primary} />
            </Pressable>
        </View>

        {/* THÀNH TỰU TÀI CHÍNH TÓM TẮT - THAY THẾ DASHBOARD */}
        <Pressable 
          style={styles.miniFinanceCard}
          onPress={() => setIsFinanceVisible(true)}
        >
          <View style={styles.miniFinanceLeft}>
             <Text style={styles.miniLabel}>{t('modulesScreen.finance.revenue')}</Text>
             <Text style={styles.miniValue}>{formatCurrency(stats.revenue)}</Text>
          </View>
          <View style={styles.miniFinanceRight}>
             <View style={styles.growthBadgeMini}>
                <Text style={styles.growthTextMini}>+{stats.growth}%</Text>
             </View>
             <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.white} style={{ opacity: 0.6 }} />
          </View>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadStats(true)}
              tintColor={COLORS.primary}
            />
          }
      >
        {MODULE_GROUPS.map((group, gIdx) => (
          <View key={gIdx} style={styles.groupContainer}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIconBox, { backgroundColor: group.color + '15' }]}>
                <MaterialIcons name={group.icon as any} size={18} color={group.color} />
              </View>
              <Text style={[styles.groupTitle, { color: group.color }]}>{group.title}</Text>
            </View>

            <View style={styles.itemsCard}>
              {group.items.map((item, iIdx) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [
                    styles.itemRow,
                    pressed && { backgroundColor: 'rgba(0,0,0,0.02)' },
                    iIdx === group.items.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={styles.itemIconBox}>
                    <MaterialIcons name={item.icon as any} size={22} color={COLORS.onSurfaceVariant} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.onSurfaceVariant} style={{ opacity: 0.2 }} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL TÀI CHÍNH TOÀN DIỆN (GIỮ NGUYÊN TỪ DASHBOARD) */}
      <Modal
          visible={isFinanceVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsFinanceVisible(false)}
        >
          <View style={styles.reportModalOverlay}>
            <View style={[styles.reportModalContent, { marginTop: height * 0.05 }]}>
              <View style={styles.reportModalHeader}>
                <View>
                   <Text style={styles.reportModalTitle}>{t('modulesScreen.finance.title')}</Text>
                   <Text style={styles.reportModalSubtitle}>{t('modulesScreen.finance.subtitle')}</Text>
                </View>
                <Pressable onPress={() => setIsFinanceVisible(false)} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={28} color={COLORS.onSurface} />
                </Pressable>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} style={styles.reportScroll}>
                <View style={styles.modalGrid}>
                    <DetailItem label={t('modulesScreen.finance.revenue')} value={formatCurrency(stats.revenue)} icon="trending-up" color={COLORS.success} subValue={t('common.today')} />
                    <DetailItem label={t('modulesScreen.finance.profit')} value={formatCurrency(stats.netProfit)} icon="savings" color="#FF9500" subValue={t('common.estimate')} />
                    <DetailItem label={t('modulesScreen.finance.receivable')} value={formatCurrency(stats.debtTotal)} icon="call-received" color={COLORS.primary} subValue={t('common.customer')} />
                    <DetailItem label={t('modulesScreen.finance.payable')} value={formatCurrency(0)} icon="call-made" color={COLORS.error} subValue={t('common.artisan')} />
                </View>

                <View style={styles.reportDivider} />

                <Text style={styles.reportSectionTitle}>{t('modulesScreen.finance.recent')}</Text>
                {/* Lịch sử Thu/Chi như cũ */}
                <View style={styles.transactionList}>
                    {stats.recentPayments.concat(stats.recentExpenses).length === 0 ? (
                         <Text style={{ textAlign: 'center', opacity: 0.4, marginTop: 20 }}>{t('modulesScreen.finance.no_tx')}</Text>
                    ) : (
                        <>
                            {stats.recentPayments.map(p => (
                                <View key={p.id} style={styles.txItem}>
                                    <MaterialIcons name="add-circle" size={20} color={COLORS.success} />
                                    <Text style={{ flex: 1, marginLeft: 10 }}>{t('modulesScreen.finance.revenue')}</Text>
                                    <Text style={{ color: COLORS.success, fontWeight: 'bold' }}>+{formatCurrency(p.amount)}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>
              </ScrollView>
              <View style={styles.footerActionRow}>
                <Pressable style={[styles.actionBtn, { backgroundColor: COLORS.error }]} onPress={() => { setIsFinanceVisible(false); router.push("/debts" as any); }}>
                   <Text style={styles.actionBtnText}>{t('modulesScreen.finance.manage_debt')}</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => { setIsFinanceVisible(false); router.push("/expenses" as any); }}>
                   <Text style={styles.actionBtnText}>{t('modulesScreen.finance.record_tx')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 24, backgroundColor: COLORS.white, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.onSurface },
  headerSubtitle: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.onSurfaceVariant },
  notifBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center' },
  miniFinanceCard: { backgroundColor: COLORS.primary, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 8 },
  miniFinanceLeft: { gap: 4 },
  miniLabel: { fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  miniValue: { fontFamily: FONTS.bold, color: COLORS.white, fontSize: 20 },
  miniFinanceRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  growthBadgeMini: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  growthTextMini: { fontFamily: FONTS.bold, color: COLORS.white, fontSize: 11 },
  content: { flex: 1, padding: 20, paddingTop: 10 },
  groupContainer: { marginBottom: 24 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  groupIconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { fontFamily: FONTS.bold, fontSize: 12, letterSpacing: 0.5 },
  itemsCard: { backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', elevation: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)', gap: 15 },
  itemIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.onSurface },
  itemDesc: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },
  reportModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  reportModalContent: { flex: 0.9, backgroundColor: COLORS.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24 },
  reportModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  reportModalTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.onSurface },
  reportModalSubtitle: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.onSurfaceVariant },
  reportScroll: { flex: 1 },
  reportSectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.onSurface, marginTop: 16, marginBottom: 12 },
  reportDivider: { height: 1.5, backgroundColor: 'rgba(0,0,0,0.03)', marginVertical: 20 },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailCard: { width: (width - 48 - 12) / 2, backgroundColor: COLORS.white, borderRadius: 22, padding: 18 },
  detailIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  detailText: { gap: 2 },
  detailLabel: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.onSurfaceVariant },
  detailValue: { fontFamily: FONTS.bold, fontSize: 15 },
  detailSubValue: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.success },
  transactionList: { gap: 10 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 14, borderRadius: 16, elevation: 1 },
  footerActionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  actionBtnText: { fontFamily: FONTS.bold, color: COLORS.white, fontSize: 14 },
  closeBtn: { padding: 4 },
});
