import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, NEUMORPHISM, PALETTE, SHADOWS } from '@/utils/theme';
import { H } from '@/utils/href';
import ScreenBackground from '@/components/ScreenBackground';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';
import * as api from '@/utils/api';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg, authReady } = useAuth();

  const params = useLocalSearchParams();
  const initialPeriod = (params.period as any) || 'month';
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>(initialPeriod);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const calculateDates = useCallback((p: typeof period) => {
    const now = new Date();
    // Chuyển đổi sang định dạng YYYY-MM-DD theo giờ địa phương (GMT+7)
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let from = new Date();
    if (p === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (p === 'week') {
      const day = now.getDay() || 7;
      from.setDate(now.getDate() - day + 1);
      from.setHours(0, 0, 0, 0);
    } else if (p === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (p === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), quarter * 3, 1);
    }
    return { from: formatDate(from), to: formatDate(now) };
  }, [period]);

  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      setError(null);
      const ranges = calculateDates(period);
      
      // Tạo một Promise timeout để tránh treo vô hạn
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 15000)
      );

      const fetchPromise = Promise.all([
        api.getDashboardStats(activeOrg.id, ranges.from, ranges.to),
        api.getSalesReport(activeOrg.id, ranges.from, ranges.to)
      ]);

      const [stats, salesRes] = await Promise.race([fetchPromise, timeoutPromise]) as any;

      const summary = stats?.summary || {};
      const cashInByDay = stats?.chartData || [];
      let chartData = [];
      
      if (period === 'today') {
        chartData = [
          { label: 'Sáng', height: 40 },
          { label: 'Trưa', height: 70 },
          { label: 'Chiều', height: 90 },
          { label: 'Tối', height: 30 },
        ];
      } else {
        const amounts = cashInByDay.map((d: any) => Number(d.amount) || 0);
        const max = amounts.length > 0 ? Math.max(...amounts, 1) : 1;
        chartData = cashInByDay.map((d: any) => {
          const val = Number(d.amount) || 0;
          return {
            label: d.date ? String(d.date).slice(5) : '', 
            height: Math.max(2, Math.min(100, (val / max) * 100)) || 2
          };
        });
      }

      setData({ 
        ...summary,
        chartData 
      });
    } catch (e: any) {
      console.error("[REPORTS_LOAD_ERROR]", e);
      setError(e.message === "Timeout" ? t('extra.errorTimeout') : t('extra.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id, period, calculateDates]);

  useEffect(() => {
    if (authReady && activeOrg?.id) {
      loadData();
    }
  }, [authReady, activeOrg?.id, period, loadData]);

  const formatCurrency = (val: any) => {
    try {
      const num = Number(val) || 0;
      const isEn = i18n.language === 'en';
      
      if (isEn) {
        const rate = 25000;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2
        }).format(num / rate);
      }

      // Format Vietnamese style
      if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
      
      return new Intl.NumberFormat('vi-VN').format(num) + ' ' + t('common.currencySymbol');
    } catch (e) {
      return '0 ' + t('common.currencySymbol');
    }
  };

  const metrics = [
    { key: 'revenue', title: String(t('reports.metrics.revenue')), value: data ? formatCurrency(data.revenue) : '0', icon: 'payments', color: PALETTE.accent },
    { key: 'receivable', title: t('reports.metrics.receivable'), value: data ? formatCurrency(data.receivable) : '0', icon: 'account-balance-wallet', color: PALETTE.primary },
    { key: 'payable', title: t('reports.metrics.payable'), value: data ? formatCurrency(data.payable) : '0', icon: 'receipt-long', color: '#FF6B6B' },
    { key: 'profit', title: t('reports.metrics.netProfit'), value: data ? formatCurrency(data.profit) : '0', icon: 'trending-up', color: '#4CAF50' },
  ];

  if (!authReady || !activeOrg?.id) {
    return (
      <ScreenBackground style={styles.center}>
        <ActivityIndicator color={PALETTE.primary} size="large" />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <View style={styles.header}>
           <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
           </Pressable>
           <Text style={[styles.pageTitle, { color: colors.text }]}>{String(t('reports.title', 'Báo cáo'))}</Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: '#FF6B6B15', borderColor: '#FF6B6B30' }]}>
            <MaterialIcons name="error-outline" size={20} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>{t('debts.retry')}</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.periodFilter, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          {['today', 'week', 'month', 'quarter'].map((p: any) => {
             const isActive = period === p;
             return (
               <Pressable key={p} style={[styles.periodBtn, isActive && { backgroundColor: PALETTE.primary }]} onPress={() => setPeriod(p)}>
                 <Text style={[styles.periodText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                   {String(t(`reports.period.${p}`, p))}
                 </Text>
               </Pressable>
             );
          })}
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderRadius: 24, ...SHADOWS.soft }]}>
            <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
              {period === 'week' ? String(t('extra.chart.weeklyTrend')) : String(t('extra.chart.saleChart'))}
            </Text>
            <View style={styles.chartBarRow}>
               {(data?.chartData || []).map((item: any, i: number) => (
                 <View key={i} style={styles.chartBarCol}>
                    <View style={[styles.chartBar, { height: item.height, backgroundColor: item.height > 60 ? PALETTE.primary : colors.background }]} />
                    <Text style={[styles.chartDay, { color: colors.textSecondary }]}>{item.label}</Text>
                 </View>
               ))}
            </View>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((item) => (
            <View key={item.key} style={[styles.metricCard, { backgroundColor: colors.surface, borderRadius: 24, ...SHADOWS.soft }]}>
              <View style={[styles.metricIconWrap, { backgroundColor: item.color + '15' }]}>
                <MaterialIcons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{item.title}</Text>
              <Text style={[styles.metricValue, { color: (item.key === 'revenue' || item.key === 'receivable') ? PALETTE.primary : colors.text }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

         <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{String(t('home.dashboard.reports.title'))}</Text>
        <View style={[styles.reportListBox, { backgroundColor: colors.surface, borderRadius: 24, ...SHADOWS.soft }]}>
           {[
             { name: String(t('home.dashboard.reports.sales')), icon: 'trending-up', route: '/report-sales' },
             { name: String(t('home.dashboard.reports.debts')), icon: 'account-balance', route: '/debts' },
             { name: String(t('extra.inventoryReport')), icon: 'inventory', route: '/inventory-report' },
           ].map((r, i) => (
             <Pressable key={i} style={[styles.reportRow, { borderBottomWidth: i === 2 ? 0 : 1, borderBottomColor: colors.outline + '40' }]} onPress={() => { console.log("NAV TO:", r.route); router.push(r.route as any); }}>
               <View style={[styles.reportIconBox, { backgroundColor: PALETTE.primary + '10' }]}>
                  <MaterialIcons name={r.icon as any} size={20} color={PALETTE.primary} />
               </View>
               <Text style={[styles.reportTitle, { color: colors.text }]}>{r.name}</Text>
               <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
             </Pressable>
           ))}
        </View>

        {/* PHÂN TÍCH CHI TIẾT - BIỂU ĐỒ TRÒN */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 35, marginBottom: 20 }]}>
          {t('extra.financialAnalysisTitle')}
        </Text>
        
        <View style={[styles.pieChartContainer, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
           <View style={styles.pieWrapper}>
              {/* Vòng tròn nền */}
              <View style={[styles.pieCircle, { backgroundColor: '#F0F0F0' }]}>
                 {/* Đoạn Lợi nhuận (Xanh) - Quadrant 1 */}
                 <View style={[styles.pieSegment, { backgroundColor: '#4CAF50', right: 0, top: 0 }]} />
                 {/* Tiền thợ (Đỏ) - Quadrant 2 */}
                 <View style={[styles.pieSegment, { backgroundColor: '#FF6B6B', right: 0, bottom: 0 }]} />
                 {/* Vật tư (Nâu) - Quadrant 3 */}
                 <View style={[styles.pieSegment, { backgroundColor: '#8d7b68', left: 0, bottom: 0 }]} />
                 {/* Thuế (Xám) - Quadrant 4 */}
                 <View style={[styles.pieSegment, { backgroundColor: '#78716C', left: 0, top: 0 }]} />
                 
                 {/* Tâm vòng tròn (Donut style) */}
                 <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterText}>{t('inventory.stockTitle')}</Text>
                 </View>
              </View>
           </View>

              <View style={styles.legendContainer}>
                {(data?.pieData || [
                  { name: t('reports.metrics.profit'), color: '#4CAF50', amount: 0, percentage: 0 },
                  { name: t('reports.metrics.labor'), color: '#FF6B6B', amount: 0, percentage: 0 },
                  { name: t('reports.metrics.material'), color: '#8d7b68', amount: 0, percentage: 0 },
                  { name: t('reports.metrics.taxes'), color: '#78716C', amount: 0, percentage: 0 },
                ]).map((item: any, idx: number) => (
                  <View key={idx} style={styles.legendRow}>
                     <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                     <View style={styles.legendInfo}>
                        <View style={styles.legendHeaderRow}>
                          <Text style={styles.legendLabel} numberOfLines={1}>{item.name}</Text>
                          <Text style={[styles.legendPercentage, { color: item.color }]}>{item.percentage || 0}%</Text>
                        </View>
                        <Text style={styles.legendValue}>{formatCurrency(item.amount)}</Text>
                     </View>
                  </View>
                ))}
             </View>
        </View>


        {/* INSIGHTS TỪ HỆ THỐNG */}
        {data?.businessInsights && (
          <View style={[styles.insightsBox, { backgroundColor: PALETTE.primary + '08', borderColor: PALETTE.primary + '20' }]}>
             <MaterialIcons name="lightbulb" size={18} color={PALETTE.primary} />
             <Text style={[styles.insightsText, { color: colors.text }]}>{data.businessInsights}</Text>
          </View>
        )}


        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 150 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 25 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: '#FFF', ...SHADOWS.soft },
  pageTitle: { fontSize: 24, fontFamily: FONTS.serif, fontWeight: '700', marginLeft: 15 },
  periodFilter: { flexDirection: 'row', padding: 4, borderRadius: 18, marginBottom: 25, borderWidth: 1, height: 48 },
  periodBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  periodText: { fontSize: 13, fontFamily: FONTS.medium },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  metricCard: { width: (width - 48 - 12) / 2, padding: 18, justifyContent: 'space-between' },
  metricIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricTitle: { fontSize: 10, fontFamily: FONTS.bold, textTransform: 'uppercase', opacity: 0.6, letterSpacing: 0.5 },
  metricValue: { fontSize: 20, fontFamily: FONTS.bold, marginTop: 4 },
  sectionTitle: { fontSize: 11, fontFamily: FONTS.bold, marginBottom: 12, letterSpacing: 1.2, opacity: 0.6, textTransform: 'uppercase' },
  reportListBox: { overflow: 'hidden' },
  reportRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  reportIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  reportTitle: { flex: 1, fontSize: 14, fontFamily: FONTS.medium },
  chartCard: { padding: 20, marginBottom: 25 },
  chartTitle: { fontSize: 11, fontFamily: FONTS.bold, marginBottom: 20, opacity: 0.6, textTransform: 'uppercase' },
  chartBarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  chartBarCol: { alignItems: 'center' },
  chartBar: { width: 12, borderRadius: 6 },
  chartDay: { fontSize: 9, fontFamily: FONTS.medium, marginTop: 8, opacity: 0.5 },
  pieChartContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 28, marginBottom: 15 },
  pieWrapper: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center' },
  pieCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', position: 'relative', backgroundColor: '#F0F0F0' },
  pieSegment: { position: 'absolute', width: 50, height: 50 },
  pieCenter: { position: 'absolute', width: 60, height: 60, borderRadius: 30, top: 20, left: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', zIndex: 10, ...SHADOWS.soft },
  pieCenterText: { fontSize: 10, fontFamily: FONTS.bold, opacity: 0.5, textAlign: 'center' },
  legendContainer: { flex: 1, paddingLeft: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, width: '100%' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginRight: 10 },
  legendInfo: { flex: 1 },
  legendHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  legendLabel: { flex: 1, fontSize: 12, color: '#444', fontFamily: FONTS.medium },
  legendPercentage: { fontSize: 12, fontFamily: FONTS.bold, marginLeft: 10 },
  legendValue: { fontSize: 13, fontFamily: FONTS.bold, color: '#000' },


  insightsBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 25, borderWidth: 1 },
  insightsText: { flex: 1, fontSize: 12, fontFamily: FONTS.medium, marginLeft: 10, lineHeight: 18 },
  miniStatCard: { width: (width - 48 - 12) / 2, padding: 15, borderRadius: 20, marginBottom: 12 },
  miniStatTitle: { fontSize: 9, fontFamily: FONTS.bold, color: '#999', marginBottom: 5 },
  miniStatValue: { fontSize: 16, fontFamily: FONTS.bold },
  miniStatSubText: { fontSize: 10, color: '#BBB', marginTop: 4 },
  profitHeroCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginTop: 10 },
  profitIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  profitInfo: { flex: 1 },
  profitLabel: { fontSize: 10, fontFamily: FONTS.bold, color: '#999', marginBottom: 2 },
  profitAmount: { fontSize: 20, fontFamily: FONTS.bold },
  profitPercentBox: { backgroundColor: '#4CAF5015', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  profitPercentText: { color: '#4CAF50', fontSize: 12, fontFamily: FONTS.bold },
  errorBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, fontFamily: FONTS.medium, color: '#FF6B6B', marginLeft: 10 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FF6B6B', borderRadius: 8, marginLeft: 10 },
  retryText: { color: '#FFF', fontSize: 12, fontFamily: FONTS.bold },
});
