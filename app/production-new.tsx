// app/production-new.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONTS, NEUMORPHISM, SHADOWS } from "@/utils/theme";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import ScreenBackground from "@/components/ScreenBackground";

export default function NewProductionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { activeOrg } = useAuth();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [artisans, setArtisans] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  // Form State
  const [orderNumber, setOrderNumber] = useState(`SX-${Date.now().toString().slice(-4)}`);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState("10");
  const [laborCost, setLaborCost] = useState("50000");
  const [duration, setDuration] = useState("3");
  const [otherCosts, setOtherCosts] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState("");

  const [selectedArtisan, setSelectedArtisan] = useState<any>(null);
  // selectedWorkers được đồng bộ từ selectedArtisan (schema chỉ hỗ trợ 1 thợ/lệnh)
  const selectedWorkers: string[] = selectedArtisan ? [selectedArtisan.id] : [];
  const toggleWorker = (id: string) => {
    const w = artisans.find(a => a.id === id);
    setSelectedArtisan((prev: any) => prev?.id === id ? null : w);
    setIsWorkerModal(false);
  };
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);

  // Modals
  const [isProductModal, setIsProductModal] = useState(false);
  const [isWorkerModal, setIsWorkerModal] = useState(false);
  const [isMaterialModal, setIsMaterialModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeOrg?.id) return;
      try {
        const [pData, aData, mData] = await Promise.all([
          api.listProducts({ orgId: activeOrg.id }),
          api.listArtisans(activeOrg.id),
          api.listMaterials()
        ]);
        setProducts(pData?.items || pData || []);
        setArtisans(aData || []);
        setMaterials(mData || []);
      } catch (e) {
        console.error("Fetch error", e);
      }
    };
    fetchData();
  }, [activeOrg?.id]);

  const handleCreate = async () => {
    if (!selectedProduct || !selectedArtisan) {
      Alert.alert(t('common.error'), t('production.errMissingProductWorker'));
      return;
    }

    setLoading(true);
    try {
      await api.createProductionOrder({
        orderNumber,
        productId: selectedProduct.id,
        artisanIds: selectedArtisan ? [selectedArtisan.id] : [], // Backend nhận array artisanIds
        materials: selectedMaterials.map(m => ({ materialId: m.id, quantity: m.qtyUsed })),
        quantity: parseInt(quantity),
        laborCostPerUnit: parseFloat(laborCost),
        otherCosts: parseFloat(otherCosts),
        shippingCost: parseFloat(shippingCost),
        duration: parseInt(duration),
        startDate,
        expectedEndDate,
        notes,
      });
      Alert.alert(t('common.success'), t('production.successCreated'));
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('common.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const selectWorker = (worker: any) => {
    setSelectedArtisan(worker);
    setIsWorkerModal(false);
  };

  const addMaterial = (mat: any) => {
    if (selectedMaterials.find(m => m.id === mat.id)) return;
    setSelectedMaterials([...selectedMaterials, { ...mat, qtyUsed: 1 }]);
    setIsMaterialModal(false);
  };

  const updateMatQty = (id: string, qty: string) => {
    setSelectedMaterials(selectedMaterials.map(m => 
      m.id === id ? { ...m, qtyUsed: parseFloat(qty) || 0 } : m
    ));
  };

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
           <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
           </Pressable>
           <Text style={[styles.title, { color: colors.text }]}>{t('production.newTitle')}</Text>
           <Pressable onPress={handleCreate} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color={PALETTE.primary} /> : <Text style={styles.saveBtn}>{t('common.saveChanges').toUpperCase()}</Text>}
           </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* PRODUCT SELECTION */}
          <Text style={styles.sectionTitle}>{t('production.secProduct')}</Text>
          <Pressable 
            style={[styles.selector, NEUMORPHISM.input, { backgroundColor: colors.surface }]}
            onPress={() => setIsProductModal(true)}
          >
             <Ionicons name="cube-outline" size={20} color={PALETTE.primary} />
             <Text style={[styles.selectorText, { color: selectedProduct ? colors.text : colors.textSecondary }]}>
                {selectedProduct ? (i18n.language.startsWith('vi') ? (selectedProduct.nameVi || selectedProduct.name) : (selectedProduct.nameEn || selectedProduct.nameVi)) : t('production.selectProduct')}
             </Text>
             <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* WORKER SELECTION */}
          <Text style={styles.sectionTitle}>{t('production.secWorker')}</Text>
          <Pressable 
            style={[styles.selector, NEUMORPHISM.input, { backgroundColor: colors.surface }]}
            onPress={() => setIsWorkerModal(true)}
          >
             <Ionicons name="people-outline" size={20} color={PALETTE.primary} />
             <Text style={[styles.selectorText, { color: selectedArtisan ? colors.text : colors.textSecondary }]}>
                {selectedArtisan ? selectedArtisan.name : t('production.selectWorker')}
             </Text>
             <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.row}>
             <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('production.targetQty')}</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
                  keyboardType="numeric" 
                  value={quantity} 
                  onChangeText={setQuantity} 
                />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('production.targetDays')}</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
                  keyboardType="numeric" 
                  value={duration} 
                  onChangeText={setDuration} 
                />
             </View>
          </View>

          <View style={styles.row}>
             <View style={{ flex: 1 }}>
                <Text style={styles.label}>NGÀY BẮT ĐẦU</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
                  placeholder="YYYY-MM-DD"
                  value={startDate} 
                  onChangeText={setStartDate} 
                />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.label}>NGÀY DỰ KIẾN XONG</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
                  placeholder="YYYY-MM-DD"
                  value={expectedEndDate} 
                  onChangeText={setExpectedEndDate} 
                />
             </View>
          </View>

          {/* WORKER CHIP — hiển thị thợ đã chọn */}
          {selectedArtisan && (
            <View style={[styles.workerChip, { borderBottomColor: colors.outline, marginTop: 8 }]}>
              <Ionicons name="person" size={16} color={PALETTE.primary} />
              <Text style={{ color: colors.text, flex: 1, marginLeft: 8 }}>{selectedArtisan.name}</Text>
              <Pressable onPress={() => setSelectedArtisan(null)}>
                <Ionicons name="remove-circle" size={20} color="#FF5252" />
              </Pressable>
            </View>
          )}

          <View style={{ marginTop: 10 }}>
             <Text style={styles.label}>{t('production.laborCostPerUnit')}</Text>
             <TextInput 
               style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
               keyboardType="numeric" 
               value={laborCost} 
               onChangeText={setLaborCost} 
             />
          </View>

          {/* MATERIALS SELECTION */}
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>{t('production.secMaterials')}</Text>
             <Pressable onPress={() => setIsMaterialModal(true)}>
                <Text style={{ color: PALETTE.primary, fontWeight: 'bold' }}>{t('production.selectMaterial')}</Text>
             </Pressable>
          </View>
          {selectedMaterials.map(m => (
            <View key={m.id} style={styles.matRow}>
               <View style={{ flex: 2 }}>
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>{m.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{t('inventory.inCostLabel')}: {m.price}{i18n.language === 'vi' ? 'đ' : '$'}/{m.unit}</Text>
               </View>
               <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <TextInput 
                    style={[styles.qtyInput, { backgroundColor: colors.surface, color: colors.text }]} 
                    keyboardType="numeric"
                    value={m.qtyUsed.toString()}
                    onChangeText={(v) => updateMatQty(m.id, v)}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{m.unit}</Text>
               </View>
               <Pressable onPress={() => setSelectedMaterials(selectedMaterials.filter(x => x.id !== m.id))}>
                  <Ionicons name="trash-outline" size={18} color="#FF5252" />
               </Pressable>
            </View>
          ))}

          <View style={{ marginTop: 20 }}>
             <Text style={styles.label}>{t('production.otherCosts')}</Text>
             <TextInput 
               style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
               keyboardType="numeric" 
               value={otherCosts} 
               onChangeText={setOtherCosts} 
             />
          </View>

          <View style={{ marginTop: 20 }}>
             <Text style={styles.label}>{t('production.shippingCost')}</Text>
             <TextInput 
               style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
               keyboardType="numeric" 
               value={shippingCost} 
               onChangeText={setShippingCost} 
               placeholder="15000"
             />
          </View>

          <View style={[styles.costSummary, { backgroundColor: PALETTE.primary + '10' }]}>
             <Text style={styles.summaryTitle}>{t('production.estimatedTotal')}</Text>
             <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('production.matTotal')}:</Text>
                <Text style={styles.summaryValue}>
                   {Math.round(selectedMaterials.reduce((acc, m) => acc + (m.price * m.qtyUsed), 0)).toLocaleString()} {t('common.currencySymbol')}
                </Text>
             </View>
             <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('production.laborTotal')} ({quantity} SP):</Text>
                <Text style={styles.summaryValue}>
                   {(parseInt(quantity || '0') * parseFloat(laborCost || '0')).toLocaleString()} {t('common.currencySymbol')}
                </Text>
             </View>
             <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('production.shippingOtherTotal')}:</Text>
                <Text style={styles.summaryValue}>
                   {(parseFloat(shippingCost || '0') + parseFloat(otherCosts || '0')).toLocaleString()} {t('common.currencySymbol')}
                </Text>
             </View>
             <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: PALETTE.primary + '30', marginTop: 10, paddingTop: 10 }]}>
                <Text style={[styles.summaryLabel, { fontSize: 18, color: PALETTE.primary }]}>{t('quotes.total').toUpperCase()}:</Text>
                <Text style={[styles.summaryValue, { fontSize: 18, color: PALETTE.primary }]}>
                   {(
                      selectedMaterials.reduce((acc, m) => acc + (m.price * m.qtyUsed), 0) + 
                      (parseInt(quantity || '0') * parseFloat(laborCost || '0')) + 
                      parseFloat(shippingCost || '0') + 
                      parseFloat(otherCosts || '0')
                   ).toLocaleString()} {t('common.currencySymbol')}
                </Text>
             </View>
          </View>

          <View style={{ marginTop: 20 }}>
             <Text style={styles.label}>{t('production.processNotes')}</Text>
             <TextInput 
               style={[styles.input, { backgroundColor: colors.surface, color: colors.text, height: 100 }]} 
               multiline
               value={notes} 
               onChangeText={setNotes} 
               placeholder={t('production.notesPlaceholder')}
             />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* PRODUCT SELECTOR MODAL */}
        <Modal visible={isProductModal} animationType="slide">
           <View style={[styles.modalBox, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: colors.text }]}>{t('production.modalSelectProduct')}</Text>
                 <Pressable onPress={() => setIsProductModal(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
              </View>
              <FlatList 
                data={products}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.listItem} 
                    onPress={() => { setSelectedProduct(item); setIsProductModal(false); }}
                  >
                     <Text style={{ fontSize: 16 }}>{item.nameVi}</Text>
                  </Pressable>
                )}
              />
           </View>
        </Modal>

        {/* WORKER SELECTOR MODAL */}
        <Modal visible={isWorkerModal} animationType="slide">
           <View style={[styles.modalBox, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: colors.text }]}>{t('production.modalSelectWorker')}</Text>
                 <Pressable onPress={() => setIsWorkerModal(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
              </View>
              <FlatList 
                data={artisans}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <Pressable 
                    style={[styles.listItem, selectedWorkers.includes(item.id) && { backgroundColor: PALETTE.primary + '20' }]} 
                    onPress={() => toggleWorker(item.id)}
                  >
                     <Text style={{ fontSize: 16 }}>{item.name}</Text>
                     {selectedWorkers.includes(item.id) && <Ionicons name="checkmark-circle" size={20} color={PALETTE.primary} />}
                  </Pressable>
                )}
              />
           </View>
        </Modal>

        {/* MATERIAL SELECTOR MODAL */}
        <Modal visible={isMaterialModal} animationType="slide">
           <View style={[styles.modalBox, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: colors.text }]}>{t('production.modalSelectMaterial')}</Text>
                 <Pressable onPress={() => setIsMaterialModal(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
              </View>
              <FlatList 
                data={materials}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.listItem} 
                    onPress={() => addMaterial(item)}
                  >
                     <Text style={{ fontSize: 16 }}>{item.name}</Text>
                     <Text style={{ fontSize: 12, color: '#888' }}>{item.price}đ/{item.unit}</Text>
                  </Pressable>
                )}
              />
           </View>
        </Modal>

      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: FONTS.bold },
  saveBtn: { color: PALETTE.primary, fontFamily: FONTS.bold, fontSize: 16 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, marginTop: 25, marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  selector: { height: 56, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 12 },
  selectorText: { flex: 1, fontSize: 15, fontFamily: FONTS.medium },
  label: { fontSize: 12, fontFamily: FONTS.bold, marginBottom: 8, marginTop: 15, opacity: 0.6 },
  input: { height: 54, borderRadius: 15, paddingHorizontal: 20, fontFamily: FONTS.medium },
  row: { flexDirection: 'row', gap: 15 },
  workerList: { marginTop: 10 },
  workerChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  matRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 10 },
  qtyInput: { width: 60, height: 40, borderRadius: 8, paddingHorizontal: 8, textAlign: 'center', borderWidth: 1, borderColor: '#DDD' },
  modalBox: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  listItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#EEE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // Summary
  costSummary: { marginTop: 30, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.primary + '40' },
  summaryTitle: { fontSize: 14, fontFamily: FONTS.bold, color: PALETTE.primary, marginBottom: 15, letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, fontFamily: FONTS.medium, opacity: 0.7 },
  summaryValue: { fontSize: 14, fontFamily: FONTS.bold },
});
