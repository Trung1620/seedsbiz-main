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
  Image,
} from "react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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
  const [orderName, setOrderName] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  // --- Items Data ---
  const [items, setItems] = useState<any[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  
  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [showCustPicker, setShowCustPicker] = useState(false);
  const [showProdPicker, setShowProdPicker] = useState(false);
  
  // Date Picker States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateType, setActiveDateType] = useState<"quote" | "expiry" | "delivery">("quote");
  const [tempDate, setTempDate] = useState({ 
    day: new Date().getDate().toString(), 
    month: (new Date().getMonth() + 1).toString(), 
    year: new Date().getFullYear().toString() 
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const openDatePicker = (type: "quote" | "expiry" | "delivery") => {
    setActiveDateType(type);
    let current = quoteDate;
    if (type === "expiry") current = expiryDate || quoteDate;
    if (type === "delivery") current = deliveryDate || quoteDate;

    const parts = current.split('-');
    if (parts.length === 3) {
      setTempDate({ year: parts[0], month: parseInt(parts[1]).toString(), day: parseInt(parts[2]).toString() });
    }
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const formatted = `${tempDate.year}-${tempDate.month.padStart(2, '0')}-${tempDate.day.padStart(2, '0')}`;
    if (activeDateType === "quote") setQuoteDate(formatted);
    if (activeDateType === "expiry") setExpiryDate(formatted);
    if (activeDateType === "delivery") setDeliveryDate(formatted);
    setShowDatePicker(false);
  };

  // --- Load Initial Data ---
  useEffect(() => {
    (async () => {
      try {
        const [cList, pList] = await Promise.all([
          api.listCustomers({ orgId: activeOrg?.id }),
          api.listProducts({ orgId: activeOrg?.id })
        ]);

        if (Array.isArray(cList)) setCustomers(cList);
        else if (Array.isArray(cList?.items)) setCustomers(cList.items);

        if (Array.isArray(pList)) setProducts(pList);
        else if (Array.isArray(pList?.items)) setProducts(pList.items);
        else if (Array.isArray(pList?.products)) setProducts(pList.products);
        else if (Array.isArray(pList?.rows)) setProducts(pList.rows);
      } catch (e) {
        console.error("[LOAD_DATA_ERROR]", e);
      }
    })();
  }, [activeOrg]);

  // --- Calculations ---
  const subTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  }, [items]);

  const taxAmount = (subTotal * taxPercent) / 100;
  const discountAmount = (subTotal * discountPercent) / 100;
  const grandTotal = subTotal + taxAmount - discountAmount + shippingFee;

  // --- Calculations ---
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      (p.nameVi?.toLowerCase() || "").includes(q) || 
      (p.sku?.toLowerCase() || "").includes(q)
    );
  }, [products, searchQuery]);

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
        nameVi: p.nameVi || "Sản phẩm không tên",
        image: p.images?.[0] || p.image || "",
        unitPrice: p.priceVnd ?? p.costPriceVnd ?? 0,
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
        orderName,
        shippingFee,
        depositAmount,
        quoteDate,
        expiryDate,
        deliveryDate,
        taxPercent,
        discountPercent,
        items,
        subTotal,
        grandTotal,
        notes: notes,
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

  const handleExportLocal = async () => {
    try {
      const header = ["Sản phẩm", "SKU", "Số lượng", "Đơn giá", "Thành tiền"];
      const rows = items.map(it => [
        `"${it.nameVi.replace(/"/g, '""')}"`,
        it.sku,
        it.quantity,
        it.unitPrice,
        it.quantity * it.unitPrice
      ]);
      
      const csvContent = "\uFEFF" + [
        [`BÁO GIÁ NHÁP - ${orderName || "Không tên"}`],
        [`Khách hàng: ${custName || "Chưa chọn"}`],
        [`Ngày: ${quoteDate}`],
        [],
        header,
        ...rows,
        [],
        ["TỔNG TIỀN HÀNG", "", "", "", subTotal],
        ["VAT (%)", "", "", "", taxPercent],
        ["CHIẾT KHẤU (%)", "", "", "", discountPercent],
        ["PHÍ VẬN CHUYỂN", "", "", "", shippingFee],
        ["TỔNG CỘNG", "", "", "", grandTotal]
      ].map(r => r.join(",")).join("\r\n");

      const filename = `BaoGia_Nhap_${new Date().getTime()}.csv`;
      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('quotes.new_quote')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={handleExportLocal} style={{ marginRight: 15 }}>
            <MaterialIcons name="file-download" size={26} color={PALETTE.primary} />
          </Pressable>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* --- General Info Section --- */}
        <View style={[styles.section, NEUMORPHISM.card, { backgroundColor: colors.surface, marginBottom: 15 }]}>
           <Text style={[styles.sectionHeader, { color: colors.text }]}>THÔNG TIN CHUNG</Text>
           
           <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tên đơn hàng (ví dụ: Đơn hàng quà Tết, Quạt mây...)</Text>
              <TextInput 
                style={[styles.fullInput, { color: colors.text }]} 
                placeholder="Nhập tên đơn hàng..." 
                value={orderName} 
                onChangeText={setOrderName} 
              />
           </View>

           <View style={styles.rowGrid}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phí vận chuyển (đ)</Text>
                 <TextInput 
                   style={[styles.fullInput, { color: colors.text }]} 
                   placeholder="0" 
                   keyboardType="numeric"
                   value={shippingFee.toString()} 
                   onChangeText={v => setShippingFee(parseFloat(v) || 0)} 
                 />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tiền đặt cọc (đ)</Text>
                 <TextInput 
                   style={[styles.fullInput, { color: colors.text }]} 
                   placeholder="0" 
                   keyboardType="numeric"
                   value={depositAmount.toString()} 
                   onChangeText={v => setDepositAmount(parseFloat(v) || 0)} 
                 />
              </View>
           </View>

           <View style={styles.rowGrid}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ngày báo giá</Text>
                 <Pressable style={styles.dateDisplay} onPress={() => openDatePicker("quote")}>
                    <Text style={{ color: colors.text, fontFamily: FONTS.bold }}>{quoteDate}</Text>
                    <MaterialIcons name="calendar-today" size={16} color={PALETTE.primary} />
                 </Pressable>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                 <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Hạn hiệu lực</Text>
                 <Pressable style={styles.dateDisplay} onPress={() => openDatePicker("expiry")}>
                    <Text style={{ color: expiryDate ? colors.text : colors.textSecondary, fontFamily: FONTS.bold }}>
                       {expiryDate || "Chưa chọn"}
                    </Text>
                    <MaterialIcons name="event" size={16} color={PALETTE.primary} />
                 </Pressable>
              </View>
           </View>

           <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ngày dự kiến giao hàng</Text>
              <Pressable style={styles.dateDisplay} onPress={() => openDatePicker("delivery")}>
                 <Text style={{ color: deliveryDate ? colors.text : colors.textSecondary, fontFamily: FONTS.bold }}>
                    {deliveryDate || "Chưa chọn"}
                 </Text>
                 <MaterialIcons name="local-shipping" size={18} color={PALETTE.primary} />
              </Pressable>
           </View>
        </View>

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
        <View style={[styles.section, { marginTop: 15, paddingHorizontal: 0, shadowOpacity: 0, elevation: 0 }]}>
           <View style={[styles.rowBetween, { paddingHorizontal: 20 }]}>
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
                <View key={item.productId} style={[styles.itemCard, { borderBottomWidth: 1, borderBottomColor: colors.outline }]}>
                   <Image 
                     source={{ uri: (typeof item.image === 'string' && item.image) ? item.image : "https://placehold.co/100x100/f0f0f0/666666?text=No+Image" }} 
                     style={styles.itemImage} 
                   />
                   <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.nameVi}</Text>
                      <Text style={[styles.itemPrice, { color: PALETTE.primary }]}>
                         {new Intl.NumberFormat('vi-VN').format(item.unitPrice)} đ
                      </Text>
                   </View>
                   
                   <View style={styles.qtyContainer}>
                      <Pressable style={styles.qtyBtn} onPress={() => updateItemQty(item.productId, -1)}>
                         <Feather name="minus" size={14} color={colors.text} />
                      </Pressable>
                      <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                      <Pressable style={styles.qtyBtn} onPress={() => updateItemQty(item.productId, 1)}>
                         <Feather name="plus" size={14} color={colors.text} />
                      </Pressable>
                   </View>

                   <Pressable style={styles.removeBtn} onPress={() => removeItem(item.productId)}>
                      <Ionicons name="trash-outline" size={18} color={PALETTE.error} />
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

        {/* --- Notes Section --- */}
        <View style={[styles.section, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 15 }]}>
           <Text style={[styles.sectionHeader, { color: colors.text }]}>GHI CHÚ / ĐIỀU KHOẢN</Text>
           <TextInput 
             style={[styles.fullInput, { color: colors.text, height: 100, textAlignVertical: 'top' }]} 
             placeholder="Nhập ghi chú hoặc điều khoản thanh toán..." 
             multiline 
             value={notes} 
             onChangeText={setNotes} 
           />
        </View>
      </ScrollView>

      <View style={[styles.fixedBottom, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
         <Pressable 
           style={({ pressed }) => [
             styles.mainButton, 
             { backgroundColor: PALETTE.primary, opacity: (loading || pressed) ? 0.8 : 1 }
           ]} 
           onPress={handleSave}
           disabled={loading}
         >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.mainButtonText}>TẠO BÁO GIÁ MỚI</Text>
            )}
         </Pressable>
      </View>

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
              <Pressable onPress={() => { setShowProdPicker(false); setSearchQuery(""); }}>
                 <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
           </View>

           <View style={styles.modalSearch}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput 
                style={[styles.modalSearchInput, { color: colors.text }]} 
                placeholder="Tìm tên sản phẩm hoặc mã SKU..." 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
              />
           </View>

           <FlatList
             data={filteredProducts}
             keyExtractor={it => it.id}
             initialNumToRender={10}
             maxToRenderPerBatch={10}
             windowSize={5}
             removeClippedSubviews={true}
             renderItem={({ item }) => (
               <Pressable style={styles.pickerItem} onPress={() => { handleAddProduct(item); setSearchQuery(""); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Image 
                       source={{ uri: (item.images && typeof item.images[0] === 'string') ? item.images[0] : "https://placehold.co/100x100/f0f0f0/666666?text=No+Image" }} 
                       style={styles.pickerItemImage} 
                     />
                     <View style={{ marginLeft: 15, flex: 1 }}>
                        <Text style={[styles.pickerItemMain, { color: colors.text }]}>{item.nameVi}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>SKU: {item.sku || "N/A"}</Text>
                        <Text style={{ color: PALETTE.primary, fontFamily: FONTS.bold, marginTop: 4 }}>
                          {new Intl.NumberFormat('vi-VN').format(item.priceVnd || 0)} đ
                        </Text>
                     </View>
                  </View>
               </Pressable>
             )}
             ListEmptyComponent={() => (
               <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>Không tìm thấy sản phẩm nào</Text>
               </View>
             )}
           />
        </SafeAreaView>
      </Modal>

      {/* --- Custom Date Picker Modal --- */}
      <Modal visible={showDatePicker} transparent animationType="fade">
         <View style={styles.modalOverlay}>
            <View style={[styles.datePickerContent, { backgroundColor: colors.surface }]}>
               <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', marginBottom: 20 }]}>
                 {activeDateType === "quote" ? "Chọn ngày báo giá" : activeDateType === "expiry" ? "Chọn hạn hiệu lực" : "Chọn ngày giao hàng"}
               </Text>

               <View style={styles.datePickerGrid}>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.pickerLabel}>Ngày</Text>
                     <TextInput 
                       style={[styles.datePartInput, { color: colors.text }]} 
                       keyboardType="numeric" 
                       value={tempDate.day} 
                       onChangeText={v => setTempDate({...tempDate, day: v})}
                     />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                     <Text style={styles.pickerLabel}>Tháng</Text>
                     <TextInput 
                       style={[styles.datePartInput, { color: colors.text }]} 
                       keyboardType="numeric" 
                       value={tempDate.month} 
                       onChangeText={v => setTempDate({...tempDate, month: v})}
                     />
                  </View>
                  <View style={{ flex: 1.5 }}>
                     <Text style={styles.pickerLabel}>Năm</Text>
                     <TextInput 
                       style={[styles.datePartInput, { color: colors.text }]} 
                       keyboardType="numeric" 
                       value={tempDate.year} 
                       onChangeText={v => setTempDate({...tempDate, year: v})}
                     />
                  </View>
               </View>

               <View style={styles.modalActions}>
                  <Pressable style={[styles.modalBtn, { backgroundColor: 'rgba(0,0,0,0.05)' }]} onPress={() => setShowDatePicker(false)}>
                     <Text style={{ color: colors.text }}>Hủy</Text>
                  </Pressable>
                  <Pressable style={[styles.modalBtn, { backgroundColor: PALETTE.primary }]} onPress={confirmDate}>
                     <Text style={{ color: '#FFF', fontFamily: FONTS.bold }}>Xác nhận</Text>
                  </Pressable>
               </View>
            </View>
         </View>
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
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 12, fontFamily: FONTS.bold, marginBottom: 8, opacity: 0.6 },
  fullInput: { padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, fontSize: 14, fontFamily: FONTS.medium },
  rowGrid: { flexDirection: 'row', alignItems: 'center' },
  pickerTrigger: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 15 },
  pickerText: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium },
  custDetails: { marginTop: 15, gap: 10 },
  miniInput: { padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, fontSize: 14, fontFamily: FONTS.medium },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addProdBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.primary + '15', padding: 8, borderRadius: 10, marginBottom: 15 },
  addProdText: { color: PALETTE.primary, fontSize: 12, fontFamily: FONTS.bold, marginLeft: 5 },
  emptyItems: { alignItems: 'center', padding: 40 },
  itemCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  itemImage: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#f0f0f0' },
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
  smallField: { width: 80, height: 40, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 10, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16 },
  grandLabel: { fontSize: 16, fontFamily: FONTS.bold },
  grandVal: { fontSize: 20, fontFamily: FONTS.bold },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 18, fontFamily: FONTS.bold },
  pickerItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  pickerItemMain: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 4 },
  modalSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', margin: 20, paddingHorizontal: 15, borderRadius: 12, height: 50 },
  modalSearchInput: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 15 },
  pickerItemImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#f0f0f0' },
  fixedBottom: { paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  mainButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  mainButtonText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bold, letterSpacing: 1 },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  datePickerContent: { width: '100%', borderRadius: 24, padding: 25, ...SHADOWS.floating },
  datePickerGrid: { flexDirection: 'row', marginBottom: 25 },
  pickerLabel: { fontSize: 12, fontFamily: FONTS.bold, opacity: 0.5, marginBottom: 5 },
  datePartInput: { height: 50, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, textAlign: 'center', fontSize: 18, fontFamily: FONTS.bold },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
