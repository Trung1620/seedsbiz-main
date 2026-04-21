// app/job-sheets.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONTS, NEUMORPHISM, SHADOWS, SIZES } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ScreenBackground";
import { AppHeader, EmptyState } from "@/components/UI";
import * as api from "@/utils/api";

export default function JobSheetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    artisanId: "",
    productId: "",
    quantity: "",
    unitPrice: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: ""
  });

  const loadData = async (showLoading = true) => {
    if (!activeOrg?.id) return;
    if (showLoading) setLoading(true);
    try {
      const data = await api.listJobSheets();
      setItems(data.jobSheets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [activeOrg?.id]));

  const formatMoney = (val?: number) => {
    const isEn = i18n.language.startsWith('en');
    return new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: isEn ? 'USD' : 'VND',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const JobCard = ({ item }: { item: any }) => (
    <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
       <View style={styles.cardHeader}>
          <Text style={[styles.artisanName, { color: colors.text }]}>{item.artisan?.name}</Text>
          <View style={[styles.statusTag, { backgroundColor: PALETTE.primary + '15' }]}>
             <Text style={[styles.statusText, { color: PALETTE.primary }]}>
               {t(`jobSheet.status${item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}`)}
             </Text>
          </View>
       </View>
       
       <Text style={[styles.productName, { color: colors.textSecondary }]}>{item.product?.nameVi}</Text>
       
       <View style={styles.progressRow}>
          <View style={styles.progressInfo}>
             <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{t('productionProgress.done')}</Text>
             <Text style={[styles.progressValue, { color: colors.text }]}>{item.completedQuantity} / {item.quantity}</Text>
          </View>
          <View style={[styles.progressBarBase, { backgroundColor: colors.background }]}>
             <View style={[styles.progressBarFill, { width: `${Math.min(100, (item.completedQuantity / item.quantity) * 100)}%`, backgroundColor: PALETTE.primary }]} />
          </View>
       </View>

       <View style={styles.footer}>
          <View>
             <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('jobSheet.unitPrice')}</Text>
             <Text style={[styles.priceValue, { color: PALETTE.primary }]}>{formatMoney(item.unitPrice)}</Text>
          </View>
          <Pressable 
            style={[styles.reportBtn, { backgroundColor: PALETTE.primary }]}
            onPress={() => router.push({ pathname: "/production-progress", params: { jobId: item.id } })}
          >
             <Text style={styles.reportBtnText}>{t('productionProgress.reportWork')}</Text>
          </Pressable>
       </View>
    </View>
  );

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader
          title={t('jobSheet.title')}
          onBack={() => router.back()}
          rightAction={
            <Pressable onPress={() => setIsModalVisible(true)} style={styles.addBtn}>
               <Ionicons name="add-circle" size={32} color={PALETTE.primary} />
            </Pressable>
          }
        />

        {loading ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={items}
            renderItem={JobCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(false)} tintColor={PALETTE.primary} />}
            ListEmptyComponent={
              <EmptyState
                icon="assignment-ind"
                title={t('jobSheet.noData')}
                subtitle="Hãy bắt đầu giao việc cho thợ bằng cách tạo phiếu gia công mới."
              />
            }
          />
        )}
      </View>
      
      {/* Modal tạo phiếu gia công (Rút gọn) */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
               <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('jobSheet.addNew')}</Text>
                  <Pressable onPress={() => setIsModalVisible(false)}><MaterialIcons name="close" size={24} color={colors.text} /></Pressable>
               </View>
               <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>Tính năng tạo phiếu chi tiết đang được đồng bộ...</Text>
               <Pressable style={[styles.submitBtn, { backgroundColor: PALETTE.primary }]} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.submitBtnText}>{t('common.confirm')}</Text>
               </Pressable>
            </View>
         </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { padding: 4 },
  listContent: { padding: 20, paddingBottom: 100 },
  card: { padding: 20, marginBottom: 20, borderRadius: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  artisanName: { fontSize: 18, fontFamily: FONTS.bold },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: FONTS.bold },
  productName: { fontSize: 14, fontFamily: FONTS.medium, marginBottom: 15 },
  progressRow: { marginBottom: 20 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontFamily: FONTS.medium },
  progressValue: { fontSize: 12, fontFamily: FONTS.bold },
  progressBarBase: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 10, fontFamily: FONTS.medium, textTransform: 'uppercase' },
  priceValue: { fontSize: 16, fontFamily: FONTS.bold },
  reportBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  reportBtnText: { color: '#FFF', fontSize: 13, fontFamily: FONTS.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold },
  submitBtn: { height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bold },
});
