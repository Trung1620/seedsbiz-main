// app/quote-details.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as api from "@/utils/api";
import { COLORS, FONTS, SIZES, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { H } from "@/utils/href";

export default function QuoteDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getQuoteById(id);
        setQuote(data);
      } catch (e: any) {
        Alert.alert(t("common.error"), e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      t('common.confirm'),
      "Bạn có chắc muốn xóa báo giá này? Hành động này không thể hoàn tác.",
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              if (id) {
                await api.deleteQuote(id);
                router.back();
              }
            } catch (e: any) { Alert.alert(t('common.error'), e.message); }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={PALETTE.primary} size="large" />
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t("quotes.notFound") || "Không tìm thấy báo giá"}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{quote.number || t("quotes.detail_title")}</Text>
        <View style={{ flexDirection: 'row', gap: 5 }}>
           <Pressable style={styles.editBtn} onPress={() => router.push({ pathname: "/quote-new", params: { id: quote.id } } as any)}>
              <MaterialIcons name="edit" size={24} color={PALETTE.primary} />
           </Pressable>
           <Pressable style={styles.editBtn} onPress={handleDelete}>
              <MaterialIcons name="delete-outline" size={24} color="#FF5252" />
           </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
             <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: PALETTE.primary + '15' }]}>
                   <Text style={[styles.statusText, { color: PALETTE.primary }]}>{quote.status || "DRAFT"}</Text>
                </View>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                   {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("vi-VN") : ""}
                </Text>
             </View>
             
             <Text style={[styles.custName, { color: colors.text }]}>{quote.contactName || quote.customer?.name || quote.customer?.companyName || "Khách lẻ"}</Text>
             <Text style={[styles.label, { color: colors.textSecondary }]}>{t("quotes.address")}: {quote.contactAddress || quote.customer?.address || "—"}</Text>
             <Text style={[styles.label, { color: colors.textSecondary }]}>{t("quotes.phone")}: {quote.contactPhone || quote.customer?.phone || "—"}</Text>
             
             {!!quote.notes && (
                <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.background }}>
                   <Text style={[styles.label, { color: PALETTE.primary, fontFamily: FONTS.bold, marginBottom: 5 }]}>THÔNG TIN BỔ SUNG & GHI CHÚ:</Text>
                   <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{quote.notes}</Text>
                </View>
             )}
          </View>

          <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("quotes.items")}</Text>
             {quote.items?.length > 0 ? (
                quote.items.map((item: any, idx: number) => (
                   <View key={item.id || idx} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.itemName, { color: colors.text }]}>{item.productName || item.nameVi}</Text>
                         <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{item.quantity} x {item.unitPrice?.toLocaleString()} đ</Text>
                      </View>
                      <Text style={[styles.itemTotal, { color: colors.text }]}>{(item.quantity * item.unitPrice)?.toLocaleString()} đ</Text>
                   </View>
                ))
             ) : (
                <Text style={{ color: colors.textSecondary }}>{t("quotes.no_items")}</Text>
             )}

             <View style={styles.totalBlock}>
                <View style={styles.totalRow}>
                   <Text style={{ color: colors.textSecondary }}>{t("quotes.sub_total")}</Text>
                   <Text style={{ color: colors.text }}>{quote.subTotal?.toLocaleString()} đ</Text>
                </View>
                <View style={[styles.totalRow, { marginTop: 10 }]}>
                   <Text style={[styles.grandLabel, { color: colors.text }]}>{t("quotes.grand_total")}</Text>
                   <Text style={[styles.grandValue, { color: PALETTE.primary }]}>{quote.grandTotal?.toLocaleString()} đ</Text>
                </View>
             </View>
          </View>
      </ScrollView>

      <View style={styles.actionRow}>
          <Pressable style={[styles.secondaryBtn, NEUMORPHISM.button]} onPress={() => Alert.alert("Sắp ra mắt", t("quotes.share_link"))}>
             <Text style={[styles.secondaryBtnText, { color: colors.text }]}>{t("quotes.share_link")}</Text>
          </Pressable>
          <Pressable style={[styles.primaryBtn, { backgroundColor: PALETTE.primary }]} onPress={() => router.push(H({ pathname: "/contract-details", params: { quote_id: id } } as any))}>
             <Text style={styles.primaryBtnText}>{t("quotes.create_contract")}</Text>
          </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  content: { padding: 20, paddingBottom: 100 },
  card: { padding: 20, borderRadius: 24, ...SHADOWS.soft },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontFamily: FONTS.bold },
  date: { fontSize: 13, fontFamily: FONTS.medium },
  custName: { fontSize: 20, fontFamily: FONTS.bold, marginBottom: 8 },
  label: { fontSize: 14, fontFamily: FONTS.medium, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  itemName: { fontSize: 15, fontFamily: FONTS.bold },
  itemSub: { fontSize: 12, fontFamily: FONTS.medium, marginTop: 2 },
  itemTotal: { fontSize: 15, fontFamily: FONTS.semiBold },
  totalBlock: { marginTop: 20, paddingTop: 20, borderTopWidth: 2, borderTopColor: COLORS.background },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { fontSize: 16, fontFamily: FONTS.bold },
  grandValue: { fontSize: 22, fontFamily: FONTS.bold },
  actionRow: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', gap: 15, backgroundColor: 'transparent' },
  secondaryBtn: { flex: 1, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 16, fontFamily: FONTS.bold },
  primaryBtn: { flex: 1.5, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bold },
});
