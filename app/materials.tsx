// app/materials.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { AppHeader, SearchBar, EmptyState } from "@/components/UI";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function MaterialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authReady, token, activeOrg } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const canUse = authReady && !!token && !!activeOrg?.id;

  const load = async () => {
    if (!canUse) return;
    setLoading(true);
    try {
      const rows = await api.listMaterials();
      setItems(rows || []);

      const whs = await api.listWarehouses();
      setWarehouses(whs || []);
    } catch (e: any) {
      console.error("[LOAD_MATERIALS_ERROR]", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.exportMaterials();
      const csvData = await res.text();
      const fileName = `VatTu_${new Date().getTime()}.csv`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvData, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (canUse) load();
    }, [canUse])
  );

  const filteredItems = items.filter(it => 
    it.name?.toLowerCase().includes(q.toLowerCase()) || 
    it.sku?.toLowerCase().includes(q.toLowerCase())
  );

  const handleRemove = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('materials.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMaterial(id);
              load();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const [isStockInVisible, setIsStockInVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [stockInQty, setStockInQty] = useState("");
  const [stockInNote, setStockInNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStockIn = async () => {
    if (!selectedItem || !stockInQty) return;
    const qty = parseFloat(stockInQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert(t('common.error'), t('inventory.inQtyErrorMsg'));
      return;
    }

    setSubmitting(true);
    try {
      // ✅ Gửi lệnh nhập kho lên backend
      await api.createStockMove({
        warehouseId: selectedItem.warehouseId || warehouses[0]?.id, // Sử dụng kho đầu tiên nếu vật tư không có kho mặc định
        type: "IN",
        note: stockInNote || `Nhập kho vật tư: ${selectedItem.name}`,
        items: [
          {
            materialId: selectedItem.id, 
            productId: null,   // Phải gửi null để backend xử lý đúng khóa chính
            variantId: null,   // Phải gửi null để backend xử lý đúng khóa chính
            qty: qty,
          }
        ]
      });

      Alert.alert(t('common.success'), t('inventory.inSuccessMsg'));
      setIsStockInVisible(false);
      setStockInQty("");
      setStockInNote("");
      load(); // Tải lại danh sách để cập nhật số tồn kho mới
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('common.tryAgain'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: PALETTE.primary + '15' }]}>
           {(() => {
             const imgSource = api.getPublicFileUrl(item.image);
             if (imgSource) {
               return <Image source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource} style={styles.cardImage} />;
             }
             return <MaterialIcons name="inventory-2" size={24} color={PALETTE.primary} />;
           })()}
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.sku, { color: colors.textSecondary }]}>{item.sku || "N/A"}</Text>
        </View>
        <View style={styles.actionIcons}>
          <Pressable onPress={() => router.push({ pathname: '/material-new', params: { id: item.id } } as any)} style={styles.smallIconBtn}>
             <MaterialIcons name="edit" size={20} color="#0288D1" />
          </Pressable>
          <Pressable onPress={() => handleRemove(item.id)} style={styles.smallIconBtn}>
             <MaterialIcons name="delete-outline" size={20} color="#FF5252" />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.text }]}>
            {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
              style: 'currency', 
              currency: i18n.language.startsWith('vi') ? 'VND' : 'USD',
              maximumFractionDigits: i18n.language.startsWith('vi') ? 0 : 2
            }).format(i18n.language.startsWith('vi') ? (item.price || 0) : (item.price || 0) / 25000)}
            <Text style={[styles.unit, { color: colors.textSecondary }]}>/{item.unit}</Text>
          </Text>
          {(item.location || item.supplierName) && (
            <View style={{ flexDirection: 'row', marginTop: 4, gap: 10 }}>
              {item.location && <Text style={[styles.sku, { color: colors.textSecondary, fontSize: 11 }]}>📍 {item.location}</Text>}
              {item.supplierName && <Text style={[styles.sku, { color: colors.textSecondary, fontSize: 11 }]}>🚚 {item.supplierName}</Text>}
            </View>
          )}
      </View>
      
      <View style={[styles.stockRow, { borderTopColor: colors.outline + '40' }]}>
        <View style={styles.stockInfo}>
           <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>{t('inventory.stockTitle')} / {t('inventory.stockLimit')}</Text>
           <Text style={[styles.stockValue, { color: item.stock <= (item.minStock || 0) ? '#FF5252' : PALETTE.primary }]}>
             {item.stock || 0} / {item.minStock || 0} {item.unit}
           </Text>
        </View>
        <Pressable 
          style={[styles.actionBtn, { backgroundColor: colors.background }]}
          onPress={() => {
            const defaultWhId = item.warehouseId || warehouses[0]?.id;
            setSelectedItem({ ...item, warehouseId: defaultWhId });
            setIsStockInVisible(true);
          }}
        >
           <MaterialIcons name="add-circle-outline" size={20} color={colors.textSecondary} />
           <Text style={[styles.actionText, { color: colors.textSecondary }]}>{t('inventory.stockIn')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <AppHeader
        title={t('materials.title')}
        subtitle={`${items.length} ${t('materials.countSuffix')}`}
        onBack={() => router.back()}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              style={[{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' }, SHADOWS.soft]}
              onPress={handleExport}
            >
              <MaterialIcons name="file-download" size={24} color="#FFF" />
            </Pressable>
            <Pressable
              style={[{ width: 44, height: 44, borderRadius: 14, backgroundColor: PALETTE.primary, alignItems: 'center', justifyContent: 'center' }, SHADOWS.soft]}
              onPress={() => router.push('/material-new')}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </Pressable>
          </View>
        }
      />

      <SearchBar
        value={q}
        onChangeText={setQ}
        placeholder={t('materials.searchPlaceholder')}
      />

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={PALETTE.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={PALETTE.primary} style={{ marginTop: 60 }} />
        ) : (
          <EmptyState
            icon="leaf-outline"
            title={t('materials.noData')}
            subtitle={t('materials.noDataSub')}
            action={{ label: t('materials.addBtn'), onPress: () => router.push('/material-new') }}
          />
        )}
      />

      {/* MODAL NHẬP KHO VẬT TƯ */}
      <Modal visible={isStockInVisible} animationType="slide" transparent>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
               <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('inventory.stockIn')}</Text>
                  <Pressable onPress={() => setIsStockInVisible(false)} style={styles.closeBtn}>
                     <MaterialIcons name="close" size={24} color={colors.text} />
                  </Pressable>
               </View>

               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  <Text style={{ color: colors.textSecondary, marginBottom: 15 }}>
                      {t('common.material')}: <Text style={{ color: colors.text, fontWeight: 'bold' }}>{selectedItem?.name}</Text>
                   </Text>
                   
                   <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('inventory.inWarehouseLabel', { defaultValue: 'Kho hàng nhập' })}</Text>
                   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
                      {warehouses.length > 0 ? warehouses.map(w => {
                         const isSelected = selectedItem?.warehouseId === w.id;
                         return (
                            <Pressable 
                               key={w.id} 
                               onPress={() => setSelectedItem({...selectedItem, warehouseId: w.id})}
                               onLongPress={() => {
                                  Alert.alert(
                                     "Xóa kho hàng",
                                     `Bạn có chắc chắn muốn xóa kho "${w.name}" không?`,
                                     [
                                        { text: "Hủy", style: "cancel" },
                                        { 
                                           text: "Xóa", 
                                           style: "destructive", 
                                           onPress: async () => {
                                              try {
                                                 await api.deleteWarehouse(w.id);
                                                 await load();
                                                 Alert.alert("Thành công", "Đã xóa kho hàng.");
                                              } catch (e: any) {
                                                 Alert.alert("Lỗi", e.message);
                                              }
                                           } 
                                        }
                                     ]
                                  );
                               }}
                               style={[
                                  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
                                  isSelected ? { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary } : { backgroundColor: colors.surface, borderColor: colors.outline }
                               ]}
                            >
                               <Text style={{ color: isSelected ? '#FFF' : colors.text, fontSize: 12, fontWeight: 'bold' }}>{w.name}</Text>
                            </Pressable>
                         );
                      }) : (
                         <View style={{ width: '100%' }}>
                            <Text style={{ color: '#FF5252', fontSize: 12, fontStyle: 'italic', marginBottom: 10 }}>
                               {t('inventory.noWarehouseMsg', { defaultValue: 'Hệ thống chưa có kho hàng.' })}
                            </Text>
                            <Pressable 
                               disabled={submitting}
                               style={{ backgroundColor: '#2E7D32', padding: 10, borderRadius: 10, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}
                               onPress={async () => {
                                  try {
                                     setSubmitting(true);
                                     await api.createWarehouse({ name: "Kho mặc định", location: "Xưởng sản xuất" });
                                     await load();
                                     Alert.alert(t('common.success'), "Đã tạo kho mặc định thành công!");
                                  } catch (e: any) {
                                     Alert.alert(t('common.error'), e.message);
                                  } finally {
                                     setSubmitting(false);
                                  }
                               }}
                            >
                               <Text style={{ color: '#FFF', fontWeight: 'bold' }}>+ Tạo kho mặc định ngay</Text>
                            </Pressable>
                         </View>
                      )}
                   </View>

                   <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('inventory.inQtyLabel')} ({selectedItem?.unit})</Text>
                   <TextInput 
                     style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} 
                     keyboardType="numeric" 
                     value={stockInQty} 
                     onChangeText={setStockInQty} 
                     placeholder="0.0"
                     autoFocus
                   />
                   
                   <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('inventory.inNoteLabel')}</Text>
                   <TextInput 
                     style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} 
                     value={stockInNote} 
                     onChangeText={setStockInNote} 
                     placeholder="..."
                   />

                   <Pressable 
                     style={[
                        styles.submitBtn, 
                        { backgroundColor: PALETTE.primary, marginTop: 30, opacity: (submitting || warehouses.length === 0) ? 0.7 : 1 }
                     ]} 
                     onPress={handleStockIn}
                     disabled={submitting || warehouses.length === 0}
                   >
                     {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{t('common.confirm')}</Text>}
                   </Pressable>
                </ScrollView>
            </View>
         </KeyboardAvoidingView>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginVertical: 15 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontFamily: FONTS.bold },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  searchWrap: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, ...SHADOWS.soft },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  headerText: { flex: 1, marginLeft: 15 },
  name: { fontSize: 17, fontFamily: FONTS.bold },
  sku: { fontSize: 13, fontFamily: FONTS.medium, marginTop: 2 },
  priceTag: { alignItems: 'flex-end' },
  priceContainer: { marginTop: 10, paddingLeft: 63 },
  price: { fontSize: 16, fontFamily: FONTS.bold },
  unit: { fontSize: 13, opacity: 0.6 },
  actionIcons: { flexDirection: 'row', alignItems: 'center' },
  smallIconBtn: { padding: 8, borderRadius: 10 },
  stockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1 },
  stockInfo: { flexDirection: 'row', alignItems: 'center' },
  stockLabel: { fontSize: 10, fontFamily: FONTS.bold, marginRight: 8, opacity: 0.5 },
  stockValue: { fontSize: 15, fontFamily: FONTS.bold },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  actionText: { fontSize: 12, fontFamily: FONTS.bold, marginLeft: 6 },
  emptyText: { fontFamily: FONTS.medium, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontFamily: FONTS.bold },
  closeBtn: { padding: 8 },
  inputLabel: { fontSize: 12, fontFamily: FONTS.bold, marginBottom: 8, marginTop: 15 },
  modalInput: { height: 54, borderRadius: 15, paddingHorizontal: 20, fontFamily: FONTS.medium },
  submitBtn: { height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bold },
});
