// app/expenses.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { FONTS, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import * as ImagePicker from 'expo-image-picker';
import { uploadImageUriToCloudinary } from "@/utils/uploadCloudinaryRN";
import { Image } from "react-native";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authReady, token, activeOrg } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'month' | 'quarter' | 'year'>('month');
  
  // BREAKDOWN MODAL STATE
  const [showBreakdown, setShowBreakdown] = useState(false);

  // NEW EXPENSE STATE
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("OTHER");
  const [newMethod, setNewMethod] = useState("CASH");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newReceiptImage, setNewReceiptImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewReceiptImage(result.assets[0].uri);
    }
  };

  const handleSaveExpense = async () => {
    if (!newTitle || !newAmount) return Alert.alert(t('common.error'), t('common.missingInfo'));
    setSaving(true);
    try {
      let finalImageUrl = newReceiptImage;
      
      // Upload to Cloudinary if it's a local file
      if (newReceiptImage && newReceiptImage.startsWith('file://')) {
        setIsUploading(true);
        finalImageUrl = await uploadImageUriToCloudinary(newReceiptImage);
        setIsUploading(false);
      }

      const payload = {
        title: newTitle,
        amount: Number(newAmount),
        category: newCategory,
        paymentMethod: newMethod,
        expenseDate: newDate,
        receiptImage: finalImageUrl || undefined,
        orgId: activeOrg?.id
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, payload);
        Alert.alert(t('common.success'), t('common.updateSuccess'));
      } else {
        activeOrg?.id && await api.createExpense(payload);
        Alert.alert(t('common.success'), t('common.addSuccess'));
      }
      
      setShowNewModal(false);
      setEditingExpense(null);
      setNewTitle("");
      setNewAmount("");
      setNewReceiptImage("");
      load();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setSaving(false);
      setIsUploading(false);
    }
  };

  const exportToExcel = async () => {
    if (items.length === 0) return Alert.alert(t('common.info'), t('expenses.noData'));
    
    try {
      // Tiêu đề cột
      const header = ["Ngày (Date)", "Nội dung (Title)", "Số tiền (Amount)", "Phân loại (Category)", "Phương thức (Method)"];
      
      // Chuyển dữ liệu sang dạng dòng
      const rows = items.map(item => [
        new Date(item.date || item.createdAt).toLocaleDateString('vi-VN'),
        item.title?.replace(/,/g, ' '), // Loại bỏ dấu phẩy để không lỗi CSV
        item.amount,
        t(`expenses.cat_${item.category?.toLowerCase()}`, { defaultValue: item.category }),
        t(`expenses.method_${item.paymentMethod?.toLowerCase()}`, { defaultValue: item.paymentMethod })
      ]);

      // Tạo nội dung CSV (Dùng dấu phẩy ngăn cách)
      // Thêm \uFEFF ở đầu để Excel nhận diện được Encoding UTF-8 (hiển thị tiếng Việt)
      const csvString = "\uFEFF" + [header, ...rows].map(e => e.join(",")).join("\n");
      
      const fileName = `Bao_cao_chi_phi_${period}_${new Date().getTime()}.csv`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Xuất báo cáo chi phí', UTI: 'public.comma-separated-values-text' });
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  const load = async (selectedPeriod = period) => {
    if (!authReady || !token || !activeOrg?.id) return;
    setLoading(true);
    try {
      const now = new Date();
      let fromDate: Date;
      let toDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      if (selectedPeriod === 'today') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      } else if (selectedPeriod === 'month') {
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (selectedPeriod === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        fromDate = new Date(now.getFullYear(), quarter * 3, 1);
      } else {
        fromDate = new Date(now.getFullYear(), 0, 1);
      }

      const fromStr = fromDate.toISOString();
      const toStr = toDate.toISOString();

      const [rows, stats] = await Promise.all([
        api.listExpenses({ from: fromStr, to: toStr }),
        api.getDashboardStats(activeOrg.id, fromStr, toStr)
      ]);
      
      // Gộp các chi phí thủ công và chi phí từ lệnh sản xuất
      const manualItems = rows || [];
      const productionItems = stats?.virtualExpenses || [];
      const combined = [...manualItems, ...productionItems].sort((a, b) => 
        new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
      );

      setItems(combined);
      setSummary(stats);
    } catch (e: any) {
      console.error("[LOAD_EXPENSES_ERROR]", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(period); }, [period]);

  const getCategoryIcon = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'marketing': return 'campaign';
      case 'utilities': return 'bolt';
      case 'rent': return 'home-work';
      case 'salary': return 'payments';
      case 'production': return 'build-circle';
      default: return 'receipt';
    }
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      "Bạn có chắc muốn xóa phiếu chi này?",
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteExpense(id);
              load(period);
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const [editingExpense, setEditingExpense] = useState<any>(null);

  const handleEdit = (item: any) => {
    setEditingExpense(item);
    setNewTitle(item.title);
    setNewAmount(String(item.amount));
    setNewCategory(item.category || "OTHER");
    setNewMethod(item.paymentMethod || "CASH");
    setNewDate(new Date(item.date || item.createdAt).toISOString().split('T')[0]);
    setNewReceiptImage(item.receiptImage || "");
    setShowNewModal(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconCircle, { backgroundColor: item.isProduction ? '#E3F2FD' : PALETTE.primary + '15' }]}>
           <MaterialIcons 
             name={getCategoryIcon(item.category) as any} 
             size={24} 
             color={item.isProduction ? '#1976D2' : PALETTE.primary} 
           />
        </View>
      </View>
      
      <View style={styles.cardCenter}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {i18n.language.startsWith('en') 
            ? item.title
                ?.replace('Tiền công thợ', 'Artisan Wages')
                ?.replace('Nguyên liệu (SX)', 'Material Cost (Prod)')
            : item.title}
        </Text>
        <Text style={[styles.category, { color: item.isProduction ? '#1976D2' : colors.textSecondary }]}>
          {item.isProduction 
            ? t('expenses.prodCost') 
            : t(`expenses.cat_${item.category?.toLowerCase()}`, { defaultValue: item.category || t('common.general') })}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date(item.date || item.createdAt).toLocaleDateString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US')}
        </Text>
      </View>
 
      <View style={styles.cardRight}>
        <Text style={[styles.amount, { color: '#FF5252' }]}>
          -{new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
            style: 'currency', 
            currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
          }).format(item.amount || 0)}
        </Text>
        {!item.isProduction && (
          <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'flex-end', marginTop: 8 }}>
            <Pressable onPress={() => handleEdit(item)}>
               <MaterialIcons name="edit" size={18} color="#0288D1" />
            </Pressable>
            <Pressable onPress={() => handleDeleteExpense(item.id)}>
               <MaterialIcons name="delete-outline" size={18} color="#FF5252" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
           <Text style={[styles.headerTitle, { color: colors.text }]}>{t('expenses.title')}</Text>
        </View>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: PALETTE.primary }]} 
          onPress={() => setShowNewModal(true)}
        >
           <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: '#2E7D32', marginLeft: 10 }]} 
          onPress={exportToExcel}
        >
           <MaterialIcons name="file-download" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: '#FFB300', marginLeft: 10 }]} 
          onPress={() => setShowBreakdown(true)}
        >
           <Ionicons name="receipt-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

       <View style={[styles.summaryCard, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {period === 'today' ? t('expenses.todayCost') : 
             period === 'month' ? t('expenses.monthCost') :
             period === 'quarter' ? t('expenses.quarterCost') : t('expenses.yearCost')}
          </Text>
          <Text style={[styles.summaryValue, { color: '#FF5252' }]}>
            {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
              style: 'currency', 
              currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
            }).format(summary?.expenses || 0)}
          </Text>
       </View>

       {/* Bộ chọn thời gian */}
           <View style={styles.periodContainer}>
              {(['today', 'month', 'quarter', 'year'] as const).map((p) => (
                <Pressable 
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[
                    styles.periodBtn, 
                    period === p && { backgroundColor: PALETTE.primary }
                  ]}
                >
                  <Text style={[
                    styles.periodText, 
                    { color: period === p ? '#FFF' : colors.textSecondary }
                  ]}>
                    {p === 'today' ? t('common.today') : 
                     p === 'month' ? t('common.month') : 
                     p === 'quarter' ? t('common.quarter') : t('common.year')}
                  </Text>
                </Pressable>
              ))}
           </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={PALETTE.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={PALETTE.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.emptyBox}>
             <MaterialIcons name="money-off" size={60} color={colors.textSecondary} style={{ opacity: 0.3, marginBottom: 15 }} />
             <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('expenses.noData')}</Text>
          </View>
        )}
      />

      {/* Modal chi tiết chi phí */}
      <Modal
        visible={showBreakdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBreakdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('expenses.detailTitle')}</Text>
              <Pressable onPress={() => setShowBreakdown(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.breakdownList}>
               <View style={styles.breakdownItem}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t('expenses.breakdownLabor')}</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>
                    {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
                      style: 'currency', 
                      currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
                    }).format(summary?.breakdown?.labor || 0)}
                  </Text>
               </View>

               <View style={styles.breakdownItem}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t('expenses.breakdownMaterial')}</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>
                    {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
                      style: 'currency', 
                      currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
                    }).format(summary?.breakdown?.material || 0)}
                  </Text>
               </View>

               <View style={styles.breakdownItem}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t('expenses.breakdownShipping')}</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>
                    {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
                      style: 'currency', 
                      currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
                    }).format(summary?.breakdown?.shipping || 0)}
                  </Text>
               </View>

               <View style={styles.breakdownItem}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t('expenses.breakdownOtherProd')}</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>
                    {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
                      style: 'currency', 
                      currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
                    }).format(summary?.breakdown?.otherProduction || 0)}
                  </Text>
               </View>

               <View style={[styles.breakdownItem, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t('expenses.breakdownManual')}</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>
                    {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
                      style: 'currency', 
                      currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
                    }).format(summary?.breakdown?.manualExpenses || 0)}
                  </Text>
               </View>

               <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.outline + '30' }]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>{t('quotes.total').toUpperCase()}</Text>
                  <Text style={[styles.totalValue, { color: '#FF5252' }]}>
                    {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
                      style: 'currency', 
                      currency: i18n.language.startsWith('vi') ? 'VND' : 'USD' 
                    }).format(summary?.expenses || 0)}
                  </Text>
               </View>
            </View>

            <Pressable 
              style={[styles.closeBtn, { backgroundColor: PALETTE.primary }]}
              onPress={() => setShowBreakdown(false)}
            >
              <Text style={styles.closeBtnText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal tạo phiếu chi mới */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingExpense ? t('common.edit') : t('expenses.newTitle')}
              </Text>
              <Pressable onPress={() => { setShowNewModal(false); setEditingExpense(null); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>{t('expenses.labelTitle')}</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder={t('expenses.placeholderTitle')}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>{t('expenses.labelAmount')}</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                keyboardType="numeric"
                placeholder="500000"
                value={newAmount}
                onChangeText={setNewAmount}
              />

              <Text style={styles.label}>{t('expenses.labelCategory')}</Text>
              <View style={styles.pickerRow}>
                {['UTILITY', 'EQUIPMENT', 'SALARY', 'MARKETING', 'OTHER'].map(cat => (
                  <Pressable 
                    key={cat}
                    onPress={() => setNewCategory(cat)}
                    style={[styles.pickerBtn, newCategory === cat && { backgroundColor: PALETTE.primary }]}
                  >
                    <Text style={[styles.pickerText, { color: newCategory === cat ? '#FFF' : colors.textSecondary }]}>
                       {t(`expenses.cat_${cat.toLowerCase()}`, { defaultValue: cat })}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>{t('expenses.labelMethod')}</Text>
              <View style={styles.pickerRow}>
                {['CASH', 'BANK'].map(m => (
                  <Pressable 
                    key={m}
                    onPress={() => setNewMethod(m)}
                    style={[styles.pickerBtn, newMethod === m && { backgroundColor: PALETTE.primary }]}
                  >
                    <Text style={[styles.pickerText, { color: newMethod === m ? '#FFF' : colors.textSecondary }]}>
                       {t(`expenses.method_${m.toLowerCase()}`, { defaultValue: m })}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>{t('expenses.labelDate')}</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                value={newDate}
                onChangeText={setNewDate}
              />

              <Text style={styles.label}>{t('expenses.labelReceipt')}</Text>
              <Pressable 
                style={[styles.imagePickerBtn, { backgroundColor: colors.background, borderColor: colors.outline + '40' }]} 
                onPress={pickImage}
              >
                {newReceiptImage ? (
                  <Image source={{ uri: newReceiptImage }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{t('common.selectImage')}</Text>
                  </View>
                )}
              </Pressable>

              <Pressable 
                style={[styles.primaryBtn, { backgroundColor: PALETTE.primary, marginTop: 30, opacity: (saving || isUploading) ? 0.7 : 1 }]}
                disabled={saving || isUploading}
                onPress={handleSaveExpense}
              >
                {(saving || isUploading) ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{t('expenses.saveBtn')}</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginVertical: 15 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  summaryCard: { marginHorizontal: 20, padding: 25, borderRadius: 24, alignItems: 'center', marginBottom: 25 },
  summaryLabel: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },
  summaryValue: { fontSize: 32, fontFamily: FONTS.bold },
  periodContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', marginHorizontal: 20, borderRadius: 15, padding: 5, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  periodText: { fontSize: 13, fontFamily: FONTS.bold },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, borderRadius: 20 },
  cardLeft: { marginRight: 15 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  cardCenter: { flex: 1 },
  title: { fontSize: 16, fontFamily: FONTS.bold },
  category: { fontSize: 13, fontFamily: FONTS.medium, opacity: 0.6, marginTop: 2 },
  date: { fontSize: 11, fontFamily: FONTS.medium, opacity: 0.4, marginTop: 4 },
  cardRight: { marginLeft: 10 },
  amount: { fontSize: 16, fontFamily: FONTS.bold },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: FONTS.medium, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 32, padding: 30, maxHeight: '85%', width: '100%', ...SHADOWS.soft },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold },
  breakdownList: { marginBottom: 25 },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  breakdownLabel: { fontSize: 14, fontFamily: FONTS.medium },
  breakdownValue: { fontSize: 14, fontFamily: FONTS.bold },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20, marginTop: 5 },
  totalLabel: { fontSize: 16, fontFamily: FONTS.bold },
  totalValue: { fontSize: 18, fontFamily: FONTS.bold },
  closeBtn: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bold },
  label: { fontSize: 11, fontFamily: FONTS.bold, marginTop: 20, marginBottom: 8, opacity: 0.6 },
  input: { height: 54, borderRadius: 15, paddingHorizontal: 20, fontFamily: FONTS.medium },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  pickerText: { fontSize: 12, fontFamily: FONTS.bold },
  primaryBtn: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  primaryBtnText: { color: '#FFF', fontFamily: FONTS.bold, fontSize: 15 },
  imagePickerBtn: {
    height: 120,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 5,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
