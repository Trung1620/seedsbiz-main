// app/debts.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as api from '@/utils/api';
import { authedFetch } from '@/utils/api';
import { useAuth } from '@/lib/auth/AuthProvider';
import { COLORS, FONTS, SIZES, NEUMORPHISM, PALETTE } from '@/utils/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import ScreenBackground from '@/components/ScreenBackground';
import { AppHeader, StatusBadge } from '@/components/UI';
import { Ionicons } from '@expo/vector-icons';

export default function DebtsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { authReady, token, activeOrg } = useAuth();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'all' | 'receivable' | 'payable'>('all');
  const [debts, setDebts] = useState<api.Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDebts = useCallback(async () => {
    if (!authReady || !token || !activeOrg?.id) {
      if (authReady && token && !activeOrg?.id) {
         setError(t('settings.selectProvince') || "Vui lòng chọn Tỉnh/Thành trong phần Cài đặt");
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: any = activeTab === 'all' ? {} : { type: activeTab };
      params.orgId = activeOrg.id;
      const data = await api.listDebts(params);
      const debtList = Array.isArray(data) ? data : data.debts || [];
      setDebts(debtList);
    } catch (err: any) {
      console.error('[Load Debts Error]', err);
      setError(err.message || t('debts.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, authReady, token]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const totalReceivable = debts
    .filter((d) => d.type?.toUpperCase() === 'RECEIVABLE' && d.status !== 'PAID_OFF')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const totalPayable = debts
    .filter((d) => d.type?.toUpperCase() === 'PAYABLE' && d.status !== 'PAID_OFF')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const formatCurrency = (amount: any) => {
    try {
      const num = Number(amount) || 0;
      const isEn = t('language.current') === 'en';
      
      if (isEn) {
        const rate = 25000;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2
        }).format(num / rate);
      }
      return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
    } catch (e) {
      return '0 đ';
    }
  };

  const calculateDaysLeft = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  };

  const getStatusColor = (status: string = 'UNPAID', daysLeft: number = 0) => {
    status = status.toUpperCase();
    if (status === 'PAID_OFF') return COLORS.success;
    if (status === 'OVERDUE' || daysLeft < 0) return COLORS.error;
    if (daysLeft <= 7) return COLORS.warning;
    return COLORS.primary;
  };

  const getStatusText = (status: string = 'UNPAID', daysLeft: number = 0) => {
    status = status.toUpperCase();
    if (status === 'PAID_OFF') return t('debts.paid');
    if (status === 'PARTIAL') return t('debts.partial') || 'Trả một phần';
    if (status === 'OVERDUE' || daysLeft < 0) return t('debts.overdue').replace('{{days}}', String(Math.abs(daysLeft)));
    return t('debts.daysLeft').replace('{{days}}', String(daysLeft));
  };

  const handleAddDebt = () => {
    Alert.alert(
      t('debts.addNew'),
      t('debts.addNewMsg'),
      [
        {
          text: t('debts.receivable'),
          onPress: () => router.push({
            pathname: '/debts-new',
            params: { type: 'receivable' }
          } as any),
        },
        {
          text: t('debts.payable'),
          onPress: () => router.push({
            pathname: '/debts-new',
            params: { type: 'payable' }
          } as any),
        },
        { text: t('debts.cancelBtn'), style: 'cancel' as const },
      ]
    );
  };

  const handleDebtPress = (debt: api.Debt) => {
    const daysLeft = calculateDaysLeft(debt.dueDate);
    const title = (debt as any).isAuto ? `${t('debts.detail')} (${t('common.auto')})` : t('debts.detail');
    const debtorName = (debt as any).customer?.name || (debt as any).artisan?.name || (debt as any).supplier?.name || (debt as any).customerName || t('common.unknown');
    const message = `${debtorName}\n\n${formatCurrency(debt.amount)}\n${t('debts.dueDate').replace('{{date}}', debt.dueDate)}\n${getStatusText(debt.status || 'UNPAID', daysLeft)}${debt.note ? `\n\n${debt.note}` : ''}`;
    
    const buttons: any[] = [{ text: t('common.close'), style: 'cancel' }];
    
    if (!debt.isAuto) {
      buttons.push({
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => confirmDelete(debt.id)
      });
    }

    Alert.alert(title, message, buttons);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('artisans.confirmDelete') || 'Delete this record?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
             try {
               await authedFetch(`/api/debts/${id}`, { method: 'DELETE' });
               loadDebts();
             } catch (e) {
               Alert.alert(t('common.error'), 'Failed to delete');
             }
          } 
        }
      ]
    );
  };

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <AppHeader
        title={t('debts.title')}
        subtitle={`${debts.filter(d => d.status !== 'PAID_OFF').length} khoản đang mở`}
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={handleAddDebt}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: PALETTE.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        {/* Tổng quan */}
        <View style={styles.summaryCards}>
          {(activeTab === 'all' || activeTab === 'receivable') && (
            <View style={[styles.summaryCard, NEUMORPHISM.cardInner, { borderWidth: 1, borderColor: COLORS.success + '30', backgroundColor: COLORS.success + '10' }]}>
              <Text style={styles.summaryLabel}>{t('debts.receivable')}</Text>
              <Text style={[styles.summaryAmount, { color: COLORS.success }]}>
                {formatCurrency(totalReceivable)}
              </Text>
            </View>
          )}
          {(activeTab === 'all' || activeTab === 'payable') && (
            <View style={[styles.summaryCard, NEUMORPHISM.cardInner, { borderWidth: 1, borderColor: COLORS.error + '30', backgroundColor: COLORS.error + '10' }]}>
              <Text style={styles.summaryLabel}>{t('debts.payable')}</Text>
              <Text style={[styles.summaryAmount, { color: COLORS.error }]}>
                {formatCurrency(totalPayable)}
              </Text>
            </View>
          )}
        </View>

        {/* Tab */}
        <View style={[styles.tabContainer, NEUMORPHISM.cardInner]}>
          {(['all', 'receivable', 'payable'] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  style={[
                      styles.tab, 
                      active ? [styles.tabActive, NEUMORPHISM.button] : {}
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab === 'all' ? t('debts.tabAll') : tab === 'receivable' ? t('debts.tabReceivable') : t('debts.tabPayable')}
                  </Text>
                </Pressable>
              );
          })}
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('debts.loading')}</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={[styles.retryButton, NEUMORPHISM.button]} onPress={loadDebts}>
              <Text style={styles.retryText}>{t('debts.retry')}</Text>
            </Pressable>
          </View>
        )}

        {/* Danh sách */}
        {!loading && !error && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{t('debts.listTitle')}</Text>
            </View>

            {debts.length === 0 ? (
              <View style={[styles.emptyBox, NEUMORPHISM.cardInner]}>
                  <Text style={styles.emptyText}>{t('debts.noDebts')}</Text>
              </View>
            ) : (
              debts.map((debt) => {
                const daysLeft = calculateDaysLeft(debt.dueDate);
                return (
                  <Pressable
                    key={debt.id}
                    style={[styles.debtCard, NEUMORPHISM.card]}
                    onPress={() => handleDebtPress(debt)}
                  >
                    <View style={styles.debtHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.customerName}>
                          {debt.customer?.name || debt.artisan?.name || debt.supplier?.name || debt.note || t('common.unknown')}
                        </Text>
                        {debt.referenceType && (
                          <View style={[styles.autoBadge, { backgroundColor: debt.referenceType === 'CUSTOMER' ? '#E3F2FD' : debt.referenceType === 'ARTISAN' ? '#E8F5E9' : '#FFF3E0' }]}>
                            <Text style={[styles.autoBadgeText, { color: debt.referenceType === 'CUSTOMER' ? '#1565C0' : debt.referenceType === 'ARTISAN' ? '#2E7D32' : '#E65100' }]}>
                              {debt.referenceType}
                            </Text>
                          </View>
                        )}
                        {(debt as any).isAuto && (
                          <View style={styles.autoBadge}>
                            <Text style={styles.autoBadgeText}>{t('common.auto') || 'SYSTEM'}</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ backgroundColor: getStatusColor(debt.status || 'pending', daysLeft) + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                         <Text
                           style={[
                             styles.statusText,
                             { color: getStatusColor(debt.status || 'pending', daysLeft) },
                           ]}
                         >
                           {getStatusText(debt.status || 'PENDING', daysLeft)}
                         </Text>
                      </View>
                    </View>

                    <Text style={styles.amount}>{formatCurrency(debt.amount)}</Text>

                    {(debt.paidAmount || 0) > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 12, color: COLORS.success, fontFamily: FONTS.medium }}>
                          ✓ Đã trả: {formatCurrency(debt.paidAmount || 0)}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.error, fontFamily: FONTS.medium }}>
                          Còn lại: {formatCurrency((debt.amount || 0) - (debt.paidAmount || 0))}
                        </Text>
                      </View>
                    )}

                    <View style={styles.debtFooter}>
                      <Text style={styles.dueDate}>{t('debts.dueDate').replace('{{date}}', debt.dueDate)}</Text>
                      <Text style={[styles.typeLabel, { color: debt.type?.toUpperCase() === 'RECEIVABLE' ? COLORS.success : COLORS.error }]}>
                        {debt.type?.toUpperCase() === 'RECEIVABLE' ? t('debts.receivable') : t('debts.payable')}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 16, paddingBottom: 40 },
  header: {
     paddingTop: 16,
     marginBottom: 16,
  },
  pageTitle: { fontSize: SIZES.extraLarge, fontFamily: FONTS.bold, color: COLORS.text },
  autoBadge: { alignSelf: 'flex-start', backgroundColor: '#E0F2F1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  autoBadgeText: { fontSize: 8, fontFamily: FONTS.bold, color: '#00796B', letterSpacing: 0.5 },
  
  summaryCards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, padding: 18, borderRadius: 20, borderWidth: 0 },
  summaryLabel: { fontSize: SIZES.small, color: COLORS.textSecondary, fontFamily: FONTS.semiBold },
  summaryAmount: { fontSize: SIZES.large, fontFamily: FONTS.bold, marginTop: 6 },
  
  tabContainer: { flexDirection: 'row', borderRadius: 18, padding: 6, marginBottom: 20, borderWidth: 0 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 0 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: SIZES.font, fontFamily: FONTS.bold, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: SIZES.medium, fontFamily: FONTS.bold, color: COLORS.text },
  addButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.primary },
  addButtonText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: SIZES.small },
  
  emptyBox: {
      padding: 30,
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 0,
      marginTop: 10,
  },
  
  debtCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 0,
  },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  customerName: { fontSize: SIZES.medium, fontFamily: FONTS.bold, color: COLORS.text, flex: 1 },
  statusText: { fontSize: 11, fontFamily: FONTS.bold },
  amount: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.text, marginVertical: 6 },
  debtFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopColor: COLORS.background, borderTopWidth: 1 },
  dueDate: { fontSize: SIZES.small, color: COLORS.textSecondary, fontFamily: FONTS.medium },
  typeLabel: { fontSize: SIZES.small, fontFamily: FONTS.bold },
  
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, fontFamily: FONTS.medium, fontSize: SIZES.font },
  centerContainer: { alignItems: 'center', marginTop: 60 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: SIZES.font, fontFamily: FONTS.semiBold },
  errorText: { color: COLORS.error, textAlign: 'center', marginBottom: 16, fontFamily: FONTS.medium },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: SIZES.font },
});
