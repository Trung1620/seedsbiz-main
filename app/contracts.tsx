// app/contracts.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { H } from "@/utils/href";
import { useAuth } from "@/lib/auth/AuthProvider";
import { COLORS, FONTS, SIZES, NEUMORPHISM } from "@/utils/theme";

type ContractRow = {
  id: string;
  number?: string;
  status?: string;
  buyerName?: string;
  quoteNumber?: string;
  grandTotal?: number;
  createdAt?: string;
};

function formatMoney(v?: number) {
  if (typeof v !== "number") return "";
  return `${v.toLocaleString("vi-VN")} đ`;
}

export default function ContractsScreen() {
  const router = useRouter();
  const { authReady, activeOrg } = useAuth();

  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<ContractRow[]>([]);

  async function loadData() {
    try {
      setLoading(true);
      // TODO: replace with actual api.listContracts
      setItems([]);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không tải được hợp đồng.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!authReady || !activeOrg?.id) return;
    loadData();
  }, [authReady, activeOrg?.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push(H("/home"))} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Quản lý Hợp đồng</Text>
          <Text style={styles.sub}>
            {activeOrg?.name || "Danh sách hợp đồng"}
          </Text>
        </View>

        <Pressable
          style={[styles.primaryBtn, NEUMORPHISM.button]}
          onPress={() => router.push(H("/quotes"))}
        >
          <Text style={styles.primaryBtnText}>Tạo từ báo giá</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Tìm theo số hợp đồng, khách hàng..."
          placeholderTextColor={COLORS.textSecondary}
          style={[styles.searchInput, NEUMORPHISM.cardInner]}
        />
        <Pressable style={[styles.searchBtn, NEUMORPHISM.button]} onPress={loadData}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.centerText}>Đang tải hợp đồng...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={[styles.emptyWrap, NEUMORPHISM.cardInner]}>
          <Text style={styles.emptyTitle}>Chưa có hợp đồng</Text>
          <Text style={styles.emptyText}>
            Hợp đồng sẽ được tự động tạo từ các báo giá đã chốt với khách hàng.
          </Text>

          <Pressable
            style={[styles.emptyBtn, NEUMORPHISM.button]}
            onPress={() => router.push(H("/quotes"))}
          >
            <Text style={styles.emptyBtnText}>Đi đến báo giá →</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, NEUMORPHISM.card]}
              onPress={() =>
                router.push(H({ pathname: "/contract-details", params: { id: item.id } } as any))
              }
            >
              <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {item.number || "Hợp đồng nháp"}
                  </Text>
                  <View style={styles.statusBadge}>
                     <Text style={styles.statusText}>{item.status || "DRAFT"}</Text>
                  </View>
              </View>

              <Text style={styles.cardSub}>
                Khách hàng: <Text style={styles.highlightText}>{item.buyerName || "—"}</Text>
              </Text>

              <Text style={styles.cardSub}>
                Báo giá: <Text style={styles.highlightText}>{item.quoteNumber || "—"}</Text>
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardSub}>Tổng giá trị</Text>
                <Text style={styles.totalText}>{formatMoney(item.grandTotal)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text },
  title: { fontSize: SIZES.large, fontFamily: FONTS.bold, color: COLORS.text },
  sub: { marginTop: 2, fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  primaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.primary },
  primaryBtnText: { color: COLORS.white, fontSize: SIZES.small, fontFamily: FONTS.bold },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", gap: 10 },
  searchInput: { flex: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: SIZES.font, color: COLORS.text },
  searchBtn: { paddingHorizontal: 20, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  searchBtnText: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  centerText: { color: COLORS.textSecondary, fontFamily: FONTS.semiBold, fontSize: SIZES.font },
  emptyWrap: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  emptyTitle: { fontSize: SIZES.medium, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: SIZES.small, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.background },
  emptyBtnText: { color: COLORS.primary, fontFamily: FONTS.bold, fontSize: SIZES.small },
  card: { borderRadius: 16, padding: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: SIZES.font, fontFamily: FONTS.bold, color: COLORS.text, flex: 1 },
  statusBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primary },
  cardSub: { fontSize: SIZES.small, color: COLORS.textSecondary, marginBottom: 6 },
  highlightText: { color: COLORS.text, fontFamily: FONTS.semiBold },
  cardFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.background, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalText: { fontSize: SIZES.large, fontFamily: FONTS.bold, color: COLORS.text },
});
