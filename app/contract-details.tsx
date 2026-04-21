// app/contract-details.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as api from "@/utils/api";
import { COLORS, FONTS, SIZES, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";

export default function ContractDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) {
       // Mock for now if no ID
       setData({
         number: "HD-2026/001",
         status: "DRAFT",
         sellerCompanyName: "CÔNG TY TNHH KHÁNH NGUYÊN",
         buyerName: "Công ty Minh Khôi",
         paymentTerms: "Thanh toán 100% sau khi giao hàng",
         deliveryTerms: "Giao hàng trong vòng 7 ngày",
         grandTotal: 50000000
       });
       setLoading(false);
       return;
    };
    (async () => {
      try {
        setLoading(true);
        // const res = await api.getContractById(id);
        // setData(res);
      } catch (e: any) {
        Alert.alert("Lỗi", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator color={PALETTE.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Chi tiết Hợp đồng</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
         <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.num, { color: PALETTE.primary }]}>{data?.number}</Text>
            <View style={styles.divider} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Bên Bán:</Text>
            <Text style={[styles.val, { color: colors.text }]}>{data?.sellerCompanyName}</Text>
            
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>Bên Mua:</Text>
            <Text style={[styles.val, { color: colors.text }]}>{data?.buyerName}</Text>
         </View>

         <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
            <Text style={[styles.section, { color: colors.text }]}>Điều khoản</Text>
            <Text style={[styles.term, { color: colors.textSecondary }]}>• Thanh toán: {data?.paymentTerms}</Text>
            <Text style={[styles.term, { color: colors.textSecondary }]}>• Giao hàng: {data?.deliveryTerms}</Text>
         </View>

         <View style={[styles.totalCard, { backgroundColor: PALETTE.primary }]}>
            <Text style={styles.totalLabel}>TỔNG GIÁ TRỊ</Text>
            <Text style={styles.totalVal}>{data?.grandTotal?.toLocaleString()} đ</Text>
         </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 24, fontFamily: FONTS.bold },
  title: { fontSize: 20, fontFamily: FONTS.bold },
  scroll: { padding: 20 },
  card: { padding: 24, borderRadius: 24 },
  num: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 15 },
  divider: { height: 1, backgroundColor: COLORS.background, marginBottom: 15 },
  label: { fontSize: 12, fontFamily: FONTS.bold, textTransform: 'uppercase' },
  val: { fontSize: 16, fontFamily: FONTS.semiBold, marginTop: 4 },
  section: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 12 },
  term: { fontSize: 14, fontFamily: FONTS.medium, marginBottom: 6 },
  totalCard: { marginTop: 30, padding: 24, borderRadius: 24, alignItems: 'center', ...SHADOWS.soft },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: FONTS.bold },
  totalVal: { color: '#FFFFFF', fontSize: 32, fontFamily: FONTS.bold, marginTop: 4 },
});
