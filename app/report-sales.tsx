// app/report-sales.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE, SHADOWS } from '@/utils/theme';
import ScreenBackground from '@/components/ScreenBackground';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';
import * as api from '@/utils/api';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SalesReportDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (activeOrg?.id) {
      loadReport();
    }
  }, [activeOrg?.id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = now.toISOString();
      const data = await api.getSalesReport(activeOrg!.id, from, to);
      setReportData(data);
    } catch (e) {
      console.error("[SALES_REPORT_DETAIL_ERROR]", e);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (v: number) => {
    const isEn = i18n.language === 'en';
    const rate = 25000;
    const val = v || 0;
    const displayAmount = isEn ? val / rate : val;
    
    if (isEn) {
       return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(displayAmount);
    }
    return val.toLocaleString('vi-VN') + ' đ';
  };

  if (loading) {
    return (
      <ScreenBackground style={styles.center}>
        <ActivityIndicator color={PALETTE.primary} size="large" />
      </ScreenBackground>
    );
  }

  const { summary, quotes, topProducts } = reportData || {};

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('home.dashboard.reports.sales', 'Báo cáo Doanh thu')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Smart Analysis Section */}
        <View style={styles.analysisSection}>
           <View style={styles.sectionHeader}>
             <MaterialIcons name="auto-awesome" size={20} color={PALETTE.primary} />
             <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>{t('reports.analysis.title')}</Text>
           </View>
           
           <View style={[styles.analysisCard, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
              {/* Sales Funnel Summary */}
              <View style={styles.funnelRow}>
                <View style={styles.funnelItem}>
                  <Text style={styles.funnelCount}>{reportData.analysis?.funnel?.draft || 0}</Text>
                  <Text style={styles.funnelLabel}>{t('reports.analysis.funnelQuote')}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={16} color="#DDD" />
                <View style={styles.funnelItem}>
                  <Text style={styles.funnelCount}>{reportData.analysis?.funnel?.sent || 0}</Text>
                  <Text style={styles.funnelLabel}>{t('reports.analysis.funnelSent')}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={16} color="#DDD" />
                <View style={[styles.funnelItem, { backgroundColor: PALETTE.primary + '10' }]}>
                  <Text style={[styles.funnelCount, { color: PALETTE.primary }]}>{reportData.analysis?.funnel?.accepted || 0}</Text>
                  <Text style={styles.funnelLabel}>{t('reports.analysis.funnelAccepted')}</Text>
                </View>
              </View>

              <View style={styles.dividerLight} />

              {/* Key Analysis Stats */}
              <View style={styles.analysisMetrics}>
                 <View style={styles.analysisMetric}>
                    <Text style={styles.analysisMetricLabel}>{t('reports.analysis.metricsConversion')}</Text>
                    <Text style={[styles.analysisMetricValue, { color: PALETTE.primary }]}>
                       {reportData.analysis?.conversionRate?.toFixed(1) || 0}%
                    </Text>
                 </View>
                 <View style={styles.analysisMetric}>
                    <Text style={styles.analysisMetricLabel}>{t('reports.analysis.metricsAov')}</Text>
                    <Text style={[styles.analysisMetricValue, { color: colors.text }]}>
                       {formatMoney(reportData.analysis?.aov || 0).replace(' đ', '')}
                    </Text>
                 </View>
                 <View style={styles.analysisMetric}>
                    <Text style={styles.analysisMetricLabel}>{t('reports.analysis.metricsMargin')}</Text>
                    <Text style={[styles.analysisMetricValue, { color: '#4CAF50' }]}>
                       {reportData.analysis?.profitMargin?.toFixed(1) || 0}%
                    </Text>
                 </View>
              </View>

              {/* Dynamic Insights from AI */}
              <View style={styles.insightsList}>
                 {reportData.analysis?.insights?.length > 0 ? reportData.analysis.insights.map((insight: any, idx: number) => (
                   <View key={idx} style={styles.insightItem}>
                      <View style={[styles.insightIconBox, { backgroundColor: insight.type === 'warning' ? '#FFF3E0' : insight.type === 'success' ? '#E8F5E9' : '#FFF9C4' }]}>
                        <MaterialIcons 
                          name={insight.type === 'warning' ? 'warning' : insight.type === 'success' ? 'check-circle' : insight.type === 'star' ? 'auto-awesome' : 'info'} 
                          size={16} 
                          color={insight.type === 'warning' ? '#FFA000' : insight.type === 'success' ? '#4CAF50' : insight.type === 'star' ? '#FBC02D' : PALETTE.primary} 
                        />
                      </View>
                      <Text style={[styles.insightText, { color: colors.text }]}>{insight.text}</Text>
                   </View>
                 )) : (
                   <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 15, textAlign: 'center' }}>{t('reports.analysis.noDataAi')}</Text>
                 )}
              </View>

              <View style={[styles.suggestionBox, { backgroundColor: PALETTE.primary + '05' }]}>
                <Text style={styles.suggestionTitle}>{t('reports.analysis.strategicTitle')}:</Text>
                <View style={styles.suggestionsList}>
                   {(reportData.analysis?.suggestions || []).map((sug: string, idx: number) => (
                     <View key={idx} style={styles.suggestionItem}>
                        <MaterialIcons name="tips-and-updates" size={16} color={PALETTE.primary} style={{ marginRight: 8 }} />
                        <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>{sug}</Text>
                     </View>
                   ))}
                </View>
              </View>
           </View>
        </View>
        {/* Doanh thu Summary */}
        <View style={[styles.summaryCard, { backgroundColor: PALETTE.primary, marginBottom: 25, ...SHADOWS.soft }]}>
          <Text style={styles.summaryLabel}>{t('reports.metrics.revenue')}</Text>
          <Text style={styles.summaryValue}>{formatMoney(summary?.revenue)}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>{t('reports.metrics.netSales')}</Text>
              <Text style={styles.subValue}>{formatMoney(summary?.netSales)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.subLabel}>{t('reports.metrics.netProfit')}</Text>
              <Text style={[styles.subValue, { color: '#4CAF50' }]}>{formatMoney(summary?.grossProfit)}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
           <View style={[styles.statBox, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('reports.metrics.orders')}</Text>
              <Text style={[styles.statNum, { color: colors.text }]}>{summary?.totalCount}</Text>
           </View>
           <View style={[styles.statBox, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('modulesScreen.finance.revenue')}</Text>
              <Text style={[styles.statNum, { color: PALETTE.primary }]}>{formatMoney(summary?.totalCollected)}</Text>
           </View>
        </View>

        {/* Top Product Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('reports.section.topProducts').toUpperCase()}</Text>
        <View style={[styles.listCard, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
          {topProducts?.map((p: any, i: number) => (
            <View key={i} style={[styles.listItem, i === topProducts.length - 1 && { borderBottomWidth: 0 }]}>
               <View style={styles.itemRank}>
                 <Text style={styles.rankText}>{i + 1}</Text>
               </View>
               <View style={{ flex: 1, marginLeft: 12 }}>
                 <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{p.nameVi}</Text>
                 <Text style={[styles.itemSku, { color: colors.textSecondary }]}>{t('common.qty')}: {p._sum.quantity}</Text>
               </View>
               <Text style={[styles.itemValue, { color: colors.text }]}>{formatMoney(p._sum.lineTotal)}</Text>
            </View>
          ))}
          {(!topProducts || topProducts.length === 0) && (
            <Text style={{ textAlign: 'center', padding: 20, color: colors.textSecondary }}>{t('reports.noProductData')}</Text>
          )}
        </View>

        {/* Recent Orders Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('reports.section.dailyTrend').toUpperCase()}</Text>
        {quotes?.filter((q: any) => q.status === 'ACCEPTED' || q.status === 'CONVERTED').map((q: any, i: number) => (
          <Pressable 
            key={i} 
            style={[styles.orderCard, { backgroundColor: colors.surface, ...SHADOWS.soft }]}
            onPress={() => router.push({ pathname: '/quote-details', params: { id: q.id } } as any)}
          >
            <View style={styles.orderHeader}>
              <Text style={[styles.orderNum, { color: colors.text }]}>{q.number}</Text>
              <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{new Date(q.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</Text>
            </View>
            <Text style={[styles.orderCust, { color: colors.textSecondary }]}>{q.customer?.name || q.customer?.companyName || t('common.retailCustomer')}</Text>
            <View style={styles.orderFooter}>
               <View style={styles.statusBadge}>
                 <Text style={styles.statusText}>{q.status}</Text>
               </View>
               <Text style={[styles.orderTotal, { color: PALETTE.primary }]}>{formatMoney(q.grandTotal)}</Text>
            </View>
          </Pressable>
        ))}
        {(!quotes || quotes.length === 0) && (
          <Text style={{ textAlign: 'center', padding: 20, color: colors.textSecondary }}>{t('reports.noDataInPeriod')}</Text>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 20, marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", ...SHADOWS.soft },
  pageTitle: { fontSize: 22, fontFamily: FONTS.bold, marginLeft: 15 },
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  summaryCard: { padding: 24, borderRadius: 24, marginBottom: 20 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: FONTS.medium, marginBottom: 4 },
  summaryValue: { color: '#FFF', fontSize: 28, fontFamily: FONTS.bold },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: FONTS.medium, marginBottom: 2 },
  subValue: { color: '#FFF', fontSize: 15, fontFamily: FONTS.bold },
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statBox: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  statLabel: { fontSize: 11, fontFamily: FONTS.bold, marginBottom: 4, opacity: 0.7 },
  statNum: { fontSize: 18, fontFamily: FONTS.bold },
  sectionTitle: { fontSize: 12, fontFamily: FONTS.bold, marginBottom: 16, letterSpacing: 1.2 },
  listCard: { borderRadius: 24, paddingVertical: 8, marginBottom: 25 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontFamily: FONTS.bold, color: '#666' },
  itemName: { fontSize: 14, fontFamily: FONTS.bold },
  itemSku: { fontSize: 12, marginTop: 2 },
  itemValue: { fontSize: 14, fontFamily: FONTS.bold },
  orderCard: { padding: 18, borderRadius: 20, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNum: { fontSize: 15, fontFamily: FONTS.bold },
  orderDate: { fontSize: 12 },
  orderCust: { fontSize: 13, marginBottom: 12 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  statusBadge: { backgroundColor: PALETTE.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: FONTS.bold, color: PALETTE.primary },
  orderTotal: { fontSize: 16, fontFamily: FONTS.bold },
  analysisSection: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  analysisCard: { borderRadius: 24, padding: 20 },
  analysisMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  analysisMetric: { alignItems: 'center', flex: 1 },
  analysisMetricLabel: { fontSize: 10, fontFamily: FONTS.medium, color: '#666', marginBottom: 4 },
  analysisMetricValue: { fontSize: 16, fontFamily: FONTS.bold },
  dividerLight: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 15 },
  insightsList: { marginBottom: 15 },
  insightItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  insightText: { fontSize: 13, fontFamily: FONTS.medium, marginLeft: 10, flex: 1 },
  suggestionBox: { padding: 16, borderRadius: 16, marginTop: 15 },
  suggestionTitle: { fontSize: 11, fontFamily: FONTS.bold, color: PALETTE.primary, marginBottom: 10, letterSpacing: 1 },
  suggestionsList: { gap: 10 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center' },
  suggestionText: { fontSize: 13, fontFamily: FONTS.medium, flex: 1, lineHeight: 18 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  funnelItem: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12 },
  funnelCount: { fontSize: 18, fontFamily: FONTS.bold },
  funnelLabel: { fontSize: 10, fontFamily: FONTS.medium, opacity: 0.5, marginTop: 2 },
  insightIconBox: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});
