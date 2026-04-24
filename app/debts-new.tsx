// app/debts-new.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as api from "@/utils/api";
import { authedFetch } from "@/utils/api";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

export default function NewDebtScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
  const { type } = useLocalSearchParams<{ type: string }>();

  const [debtType, setDebtType] = useState<"CUSTOMER" | "ARTISAN" | "SUPPLIER">(
    "CUSTOMER"
  );
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Link Source Info
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<string | null>(null);

  // Quick Pick variables
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [activeSourceCategory, setActiveSourceCategory] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    const isEn = t('language.current') === 'en';
    const rate = 25000;
    const displayAmount = isEn ? amount / rate : amount;
    return new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: isEn ? 'USD' : 'VND',
      maximumFractionDigits: isEn ? 2 : 0
    }).format(displayAmount);
  };

  const loadSources = async (category: string) => {
    setActiveSourceCategory(category);
    setSourceLoading(true);
    setSources([]);
    if (!activeOrg?.id) {
       setSourceLoading(false);
       return;
    }
    try {
      if (type === "receivable") {
        // Only Quotes
        const quotes = await api.listQuotes({ orgId: activeOrg.id });
        const items = quotes.map((q: any) => ({
          id: q.id,
          type: 'quote',
          title: q.number,
          subtitle: q.customerName || q.contactName,
          amount: q.grandTotal - (q.depositAmount || 0),
          partnerId: q.customerId,
          partnerName: q.customerName || q.contactName,
          refNote: t('extra.refNoteQuote', { number: q.number })
        })).filter(i => i.amount > 0);
        setSources(items);
      } else {
         // Phải trả logic
         if (category === 'labor' || category === 'materials' || category === 'all') {
            const prods = await api.listProductionOrders();
            const items: any[] = [];
            prods.forEach((p: any) => {
               if ((category === 'labor' || category === 'all') && (p.totalLaborCost || 0) > 0) {
                 items.push({
                   id: p.id,
                   type: 'production_labor',
                   title: `${t('extra.laborPrefix')}: ${p.orderNumber}`,
                   subtitle: p.product?.nameVi || 'SP',
                   amount: p.totalLaborCost,
                   partnerName: `${t('extra.artisanPrefix')} (${p.orderNumber})`,
                   refNote: t('extra.refNoteLabor', { number: p.orderNumber })
                 });
               }
               if ((category === 'materials' || category === 'all') && (p.totalMaterialCost || 0) > 0) {
                items.push({
                  id: p.id,
                  type: 'production_material',
                  title: `${t('extra.matPrefix')}: ${p.orderNumber}`,
                  subtitle: p.product?.nameVi || 'SP',
                  amount: p.totalMaterialCost,
                  partnerName: `${t('extra.supplierPrefix')} (${p.orderNumber})`,
                  refNote: t('extra.refNoteMaterial', { number: p.orderNumber })
                });
              }
            });
            if (category !== 'all') {
               setSources(items);
               return;
            }
            // If all, continue to deliveries
         }
         
         if (category === 'shipping' || category === 'all') {
            const deliveries = await authedFetch("/api/deliveries").then(r => r.json()).catch(() => ({ rows: [] }));
            const deliveryRows = Array.isArray(deliveries) ? deliveries : (deliveries.rows || []);
            const shipItems = deliveryRows.filter((d: any) => (d.shippingCost || 0) > 0).map((d: any) => ({
                id: d.id,
                type: 'shipping',
                title: `${t('extra.shipPrefix')}: ${d.number}`,
                subtitle: d.carrier || t('common.shipping'),
                amount: d.shippingCost,
                partnerName: d.carrier || t('common.shippingCarrier', 'ĐV Vận chuyển'),
                refNote: t('extra.refNoteShipping', { number: d.number })
            }));
            
            if (category === 'all') {
               // concat with previously loaded prods
                setSources(prev => [...prev, ...shipItems]);
            } else {
                setSources(shipItems);
            }
         }
      }
    } catch (error) {
      console.error("Load sources error", error);
    } finally {
      setSourceLoading(false);
    }
  };

  const handleSelectSource = (item: any) => {
    setCustomerName(item.partnerName);
    setCustomerId(item.partnerId || null);
    setAmount(String(item.amount));
    setNote(item.refNote);
    setSourceId(item.id);
    setSourceType(item.type);
    setShowSourceModal(false);
  };

  const handleSave = async () => {
    if (!customerName || !amount) {
      Alert.alert(t("common.error"), t("debts.alertMissingName"));
      return;
    }

    setLoading(true);
    try {
      await api.createDebt({
        debtType,
        customerName,
        customerId,
        amount: parseFloat(amount),
        dueDate: dueDate,
        note,
        status: "PENDING",
        sourceId,
        sourceType
      });
      Alert.alert(t("common.success"), t("debts.alertCreated"));
      router.back();
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || "Failed to create debt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("debts.addNewTitle")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.typeSwitcher, NEUMORPHISM.cardInner]}>
          {(["CUSTOMER", "ARTISAN", "SUPPLIER"] as const).map((typeValue) => (
            <TouchableOpacity
              key={typeValue}
              style={[styles.typeBtn, debtType === typeValue && [styles.typeBtnActive, NEUMORPHISM.button]]}
              onPress={() => setDebtType(typeValue)}
            >
              <Text style={[styles.typeText, debtType === typeValue && styles.typeTextActive]}>
                {typeValue === "CUSTOMER" ? t('extra.typeCustomer') : typeValue === "ARTISAN" ? t('extra.typeArtisan') : t('extra.typeSupplier')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickPickGrid}>
          {type === 'receivable' ? (
             <TouchableOpacity 
             style={[styles.quickPickBox, NEUMORPHISM.button]}
             onPress={() => {
               setShowSourceModal(true);
               loadSources('quote');
             }}
           >
             <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
             <Text style={styles.quickPickLabel}>{t('extra.sourceOrders')}</Text>
           </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.quickPickBox, NEUMORPHISM.button]}
                onPress={() => {
                  setShowSourceModal(true);
                  loadSources('labor');
                }}
              >
                <Ionicons name="people-outline" size={24} color={COLORS.success} />
                <Text style={styles.quickPickLabel}>{t('extra.sourceLabor')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickPickBox, NEUMORPHISM.button]}
                onPress={() => {
                  setShowSourceModal(true);
                  loadSources('materials');
                }}
              >
                <Ionicons name="cube-outline" size={24} color={COLORS.warning} />
                <Text style={styles.quickPickLabel}>{t('extra.sourceMaterials')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.quickPickBox, NEUMORPHISM.button]}
                onPress={() => {
                  setShowSourceModal(true);
                  loadSources('shipping');
                }}
              >
                <Ionicons name="bus-outline" size={24} color={COLORS.primary} />
                <Text style={styles.quickPickLabel}>{t('extra.sourceShipping')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.form}>
           {sourceId && (
              <View style={styles.linkedBadge}>
                 <Ionicons name="link" size={12} color={COLORS.success} />
                 <Text style={styles.linkedText}>{t('extra.linkedSource', { type: sourceType })}</Text>
                 <TouchableOpacity onPress={() => { setSourceId(null); setSourceType(null); }}>
                    <Ionicons name="close-circle" size={16} color={COLORS.error} />
                 </TouchableOpacity>
              </View>
           )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("debts.labelCustomer")}</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder={t("debts.placeholderCustomer")}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("debts.labelAmount")}</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("debts.labelDueDate")} (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, NEUMORPHISM.cardInner]}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2024-12-31"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("debts.labelNote")}</Text>
            <TextInput
              style={[styles.input, styles.textArea, NEUMORPHISM.cardInner]}
              value={note}
              onChangeText={setNote}
              placeholder={t("debts.placeholderNote")}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, NEUMORPHISM.button, loading && styles.disabledBtn]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t("debts.saveBtn")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Source Selection Modal */}
      <Modal visible={showSourceModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, NEUMORPHISM.card]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}> {t('extra.selectFromSystem')} </Text>
              <TouchableOpacity onPress={() => setShowSourceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {sourceLoading ? (
              <ActivityIndicator style={{ margin: 40 }} color={COLORS.primary} />
            ) : (
              <FlatList
                data={sources}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.sourceItem, NEUMORPHISM.cardInner]}
                    onPress={() => handleSelectSource(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sourceTitle}>{item.title}</Text>
                      <Text style={styles.sourceSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Text style={styles.sourceAmount}>{formatCurrency(item.amount)}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>{t('extra.noMatchingData')}</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  content: { flex: 1, padding: 20 },
  typeSwitcher: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
    borderWidth: 0,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  typeBtnActive: { backgroundColor: COLORS.primary },
  typeText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  typeTextActive: { color: COLORS.white, fontFamily: FONTS.bold },
  
  quickPickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  quickPickBox: {
    flex: 1,
    minWidth: '28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
  },
  quickPickLabel: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center'
  },

  form: { gap: 20 },
  linkedBadge: { 
     flexDirection: 'row', 
     alignItems: 'center', 
     backgroundColor: COLORS.success + '15', 
     padding: 10, 
     borderRadius: 10,
     gap: 8,
     marginBottom: -10
  },
  linkedText: { flex: 1, fontSize: 12, color: COLORS.success, fontFamily: FONTS.medium },

  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  input: {
    borderRadius: 14,
    padding: 16,
    fontSize: SIZES.font,
    color: COLORS.text,
    borderWidth: 0,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  footer: { padding: 20, marginBottom: 20 },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFF", fontSize: 16, fontFamily: FONTS.bold },
  disabledBtn: { opacity: 0.6 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  sourceItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 0 },
  sourceTitle: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text },
  sourceSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sourceAmount: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.primary },
  emptyText: { textAlign: 'center', marginVertical: 40, color: COLORS.textSecondary, fontSize: 14 }
});
