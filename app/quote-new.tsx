// app/quote-new.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { FONTS, SHADOWS, NEUMORPHISM, PALETTE, COLORS } from "@/utils/theme";
import * as api from "@/utils/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { H } from "@/utils/href";

export default function NewQuoteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
  const { colors } = useTheme();

  // --- Header Data ---
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [notes, setNotes] = useState("");

  // --- Items Data ---
  const [items, setItems] = useState<any[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  
  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [showCustPicker, setShowCustPicker] = useState(false);
  const [showProdPicker, setShowProdPicker] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Load Initial Data ---
  useEffect(() => {
    (async () => {
      try {
        const [cList, pList] = await Promise.all([
          api.listCustomers({ orgId: activeOrg?.id }),
          api.listProducts({ orgId: activeOrg?.id })
        ]);
        setCustomers(cList || []);
        setProducts(pList || []);
      } catch (e) {}
    })();
  }, [activeOrg]);

  // --- Calculations ---
  const subTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  }, [items]);

  const taxAmount = (subTotal * taxPercent) / 100;
  const discountAmount = (subTotal * discountPercent) / 100;
  const grandTotal = subTotal + taxAmount - discountAmount;

  const handlePickCustomer = (c: any) => {
    setSelectedCustomer(c);
    setCustName(c.name);
    setCustPhone(c.phone || "");
    setCustAddress(c.address || "");
    setShowCustPicker(false);
  };

  const handleAddProduct = (p: any) => {
    const existing = items.find(it => it.productId === p.id);
    if (existing) {
      setItems(items.map(it => it.productId === p.id ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setItems([...items, {
        productId: p.id,
        sku: p.sku || "",
        nameVi: p.nameVi,
        unitPrice: p.priceVnd || p.costPriceVnd || 0,
        quantity: 1,
      }]);
    }
    setShowProdPicker(false);
  };

  const updateItemQty = (id: string, delta: number) => {
    setItems(items.map(it => {
      if (it.productId === id) {
        const n = Math.max(1, it.quantity + delta);
        return { ...it, quantity: n };
      }
      return it;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(it => it.productId !== id));
  };

  const handleSave = async () => {
    if (!custName) {
      Alert.alert(t("common.error"), t("quotes.alert_missing_name"));
      return;
    }
    if (items.length === 0) {
      Alert.alert(t("common.error"), t("quotes.alert_no_items"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        orgId: activeOrg?.id,
        customerId: selectedCustomer?.id,
        contactName: custName,
        contactPhone: custPhone,
        contactAddress: custAddress,
        taxPercent,
        discountPercent,
        items,
        subTotal,
        grandTotal,
        notesVi: notes,
        status: "DRAFT",
      };
      const res = await api.createQuote(payload);
      Alert.alert(t("common.success"), t("quotes.alert_success_msg"));
      router.replace(H({ pathname: "/quote-details", params: { id: res.id } } as any));
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('quotes.new_quote')}</Text>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={PALETTE.primary} /> : <Feather name="check" size={24} color={PALETTE.primary} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* --- Customer Section --- */}
        <View style={[styles.section, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
           <Text style={[styles.sectionHeader, { color: colors.text }]}>{t('quotes.customer_info')}</Text>
           
           <Pressable style={styles.pickerTrigger} onPress={() => setShowCustPicker(true)}>
              <MaterialIcons name="person-search" size={20} color={PALETTE.primary} />
              <Text style={[styles.pickerText, { color: custName ? colors.text : colors.textSecondary }]}>
                {custName || "Tìm chọn khách hàng..."}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
           </Pressable>

           {custName ? (
             <View style={styles.custDetails}>
                <TextInput 
                  style={[styles.miniInput, { color: colors.text }]} 
                  placeholder="Số điện thoại" 
                  value={custPhone} 
                  onChangeText={setCustPhone} 
                />
                <TextInput 
                  style={[styles.miniInput, { color: colors.text }]} 
                  placeholder="Địa chỉ giao hàng" 
                  value={custAddress} 
                  onChangeText={setCustAddress} 
                />
             </View>
           ) : null}
        </View>

        {/* --- Items Section --- */}
        <View style={[styles.section, { marginTop: 15 }]}>
           <View style={styles.rowBetween}>
              <Text style={[styles.sectionHeader, { color: colors.text }]}>{t('quotes.items_list')}</Text>
              <Pressable style={styles.addProdBtn} onPress={() => setShowProdPicker(true)}>
                 <Ionicons name="add-circle" size={20} color={PALETTE.primary} />
                 <Text style={styles.addProdText}>{t('quotes.add_product')}</Text>
              </Pressable>
           </View>

           {items.length === 0 ? (
             <View style={styles.emptyItems}>
                <Feather name="shopping-cart" size={40} color={colors.textSecondary} style={{ opacity: 0.2 }} />
                <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Chưa có sản phẩm nào</Text>
             </View>
           ) : (
             items.map((item) => (
               <View key={item.productId} style={[styles.itemCard, { backgroundColor: colors.surface }]}>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.itemName, { color: colors.text }]}>{item.nameVi}</Text>
                     <Text style={[styles.itemPrice, { color: PALETTE.primary }]}>
                        {new Intl.NumberFormat('vi-VN').format(item.unitPrice)} đ
                     </Text>
                  </View>
                  
                  <View style={styles.qtyContainer}>
                     <Pressable style={styles.qtyBtn} onPress={() => updateItemQty(item.productId, -1)}>
                        <Feather name="minus" size={16} color={colors.text} />
                     </Pressable>
                     <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                     <Pressable style={styles.qtyBtn} onPress={() => updateItemQty(item.productId, 1)}>
                        <Feather name="plus" size={16} color={colors.text} />
                     </Pressable>
                  </View>

                  <Pressable style={styles.removeBtn} onPress={() => removeItem(item.productId)}>
                     <Ionicons name="trash-outline" size={20} color={PALETTE.error} />
                  </Pressable>
               </View>
             ))
           )}
        </View>

        {/* --- Summary Section --- */}
        <View style={[styles.section, styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryRow}>
               <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tạm tính</Text>
               <Text style={[styles.summaryVal, { color: colors.text }]}>
                 {new Intl.NumberFormat('vi-VN').format(subTotal)} đ
               </Text>
            </View>

            <View style={styles.summaryRow}>
               <View style={styles.inputWithLabel}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Thuế VAT (%)</Text>
                  <TextInput 
                    style={[styles.smallField, { color: colors.text }]} 
                    keyboardType="numeric" 
                    value={taxPercent.toString()} 
                    onChangeText={v => setTaxPercent(parseFloat(v) || 0)} 
                  />
               </View>
               <Text style={[styles.summaryVal, { color: colors.text }]}>
                 +{new Intl.NumberFormat('vi-VN').format(taxAmount)} đ
               </Text>
            </View>

            <View style={styles.summaryRow}>
               <View style={styles.inputWithLabel}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Chiết khấu (%)</Text>
                  <TextInput 
                    style={[styles.smallField, { color: colors.text }]} 
                    keyboardType="numeric" 
                    value={discountPercent.toString()} 
                    onChangeText={v => setDiscountPercent(parseFloat(v) || 0)} 
                  />
               </View>
               <Text style={[styles.summaryVal, { color: colors.text }]}>
                 -{new Intl.NumberFormat('vi-VN').format(discountAmount)} đ
               </Text>
            </View>

            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.outline, paddingTop: 15, marginTop: 10 }]}>
               <Text style={[styles.grandLabel, { color: colors.text }]}>TỔNG CỘNG</Text>
               <Text style={[styles.grandVal, { color: PALETTE.primary }]}>
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}
               </Text>
            </View>
        </View>
      </ScrollView>

      {/* --- Customer Picker Modal --- */}
      <Modal visible={showCustPicker} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
           <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn khách hàng</Text>
              <Pressable onPress={() => setShowCustPicker(false)}>
                 <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
           </View>
           <FlatList
             data={customers}
             keyExtractor={it => it.id}
             renderItem={({ item }) => (
               <Pressable style={styles.pickerItem} onPress={() => handlePickCustomer(item)}>
                  <Text style={[styles.pickerItemMain, { color: colors.text }]}>{item.name}</Text>
                  <Text style={{ color: colors.textSecondary }}>{item.phone || "Không có SĐT"}</Text>
               </Pressable>
             )}
           />
        </SafeAreaView>
      </Modal>

      {/* --- Product Picker Modal --- */}
      <Modal visible={showProdPicker} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
           <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn sản phẩm</Text>
              <Pressable onPress={() => setShowProdPicker(false)}>
                 <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
           </View>
           <FlatList
             data={products}
             keyExtractor={it => it.id}
             renderItem={({ item }) => (
               <Pressable style={styles.pickerItem} onPress={() => handleAddProduct(item)}>
                  <Text style={[styles.pickerItemMain, { color: colors.text }]}>{item.nameVi}</Text>
                  <Text style={{ color: PALETTE.primary }}>{new Intl.NumberFormat('vi-VN').format(item.priceVnd || 0)} đ</Text>
               </Pressable>
             )}
           />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 20 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { padding: 20, borderRadius: 24, ...SHADOWS.soft },
  sectionHeader: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  pickerTrigger: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 15 },
  pickerText: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium },
  custDetails: { marginTop: 15, gap: 10 },
  miniInput: { padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, fontSize: 14, fontFamily: FONTS.medium },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addProdBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.primary + '15', padding: 8, borderRadius: 10, marginBottom: 15 },
  addProdText: { color: PALETTE.primary, fontSize: 12, fontFamily: FONTS.bold, marginLeft: 5 },
  emptyItems: { alignItems: 'center', padding: 40 },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, marginBottom: 10, ...SHADOWS.soft },
  itemName: { fontSize: 15, fontFamily: FONTS.bold },
  itemPrice: { fontSize: 13, fontFamily: FONTS.medium, marginTop: 2 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  qtyText: { marginHorizontal: 12, fontFamily: FONTS.bold, fontSize: 15 },
  removeBtn: { padding: 5 },
  summaryCard: { marginTop: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, fontFamily: FONTS.medium },
  summaryVal: { fontSize: 14, fontFamily: FONTS.bold },
  inputWithLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallField: { width: 40, height: 30, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 6, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 14 },
  grandLabel: { fontSize: 16, fontFamily: FONTS.bold },
  grandVal: { fontSize: 20, fontFamily: FONTS.bold },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 18, fontFamily: FONTS.bold },
  pickerItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  pickerItemMain: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 4 },
});
