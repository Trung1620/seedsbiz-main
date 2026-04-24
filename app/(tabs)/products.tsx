// app/(tabs)/products.tsx
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
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { H } from "@/utils/href";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { FONTS, SIZES, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { LOCAL_PRODUCTS } from "@/constants/localProducts";

export default function ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authReady, token, activeOrg } = useAuth();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<api.Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(q); }, 500);
    return () => clearTimeout(timer);
  }, [q]);

  const canUse = authReady && !!token && !!activeOrg?.id;

  const load = async (opts?: { query?: string }) => {
    if (!canUse) return;
    setLoading(true);
    try {
      const query = (opts?.query ?? searchQuery).trim();
      const rows = await api.listProducts({ q: query, orgId: activeOrg.id });
      
      if (Array.isArray(rows?.items) && rows.items.length > 0) {
        setItems(rows.items);
      } else if (Array.isArray(rows) && rows.length > 0) {
        setItems(rows);
      } else if (rows && Array.isArray(rows.rows) && rows.rows.length > 0) {
        setItems(rows.rows);
      } else {
        // Nếu API trả về trống hoặc lỗi cấu trúc, hiện sản phẩm mẫu
        setItems(LOCAL_PRODUCTS as any);
      }
    } catch (e: any) {
      console.error("[LOAD_PRODUCTS_ERROR]", e);
      // Fallback on error too
      setItems(LOCAL_PRODUCTS as any);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (canUse) load();
    }, [canUse, searchQuery])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      "Bạn có chắc muốn xóa sản phẩm này?",
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteProduct(id);
              load();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: api.Product }) => {
    return (
      <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
        <View style={styles.imageContainer}>
          {(() => {
            let rawImg = item.image || (Array.isArray(item.images) ? item.images[0] : null);
            if (rawImg && typeof rawImg === 'object' && (rawImg as any).url) {
              rawImg = (rawImg as any).url;
            }
            const imgSource = api.getPublicFileUrl(rawImg);
            if (imgSource) {
              return <Image source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource} style={styles.cardImage} />;
            }
            return (
              <View style={[styles.cardImage, { backgroundColor: colors.outline + "10", justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
              </View>
            );
          })()}
        </View>

        <View style={styles.cardCenter}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {item.nameVi || item.nameEn}
          </Text>
          <Text style={[styles.skuText, { color: colors.textSecondary }]}>
            {item.sku || "NO-SKU"}
          </Text>
          
          <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
             <Pressable 
               style={[styles.actionBtn, { backgroundColor: '#E1F5FE' }]} 
               onPress={() => router.push({ pathname: "/product-new", params: { id: item.id } } as any)}
             >
                <MaterialIcons name="edit" size={16} color="#0288D1" />
             </Pressable>
             <Pressable 
               style={[styles.actionBtn, { backgroundColor: '#FFF5F5' }]} 
               onPress={() => handleDelete(item.id)}
             >
                <MaterialIcons name="delete-outline" size={16} color="#FF5252" />
             </Pressable>
          </View>
        </View>

        <View style={styles.cardRight}>
           <View style={[styles.stockChip, { backgroundColor: PALETTE.accent + '10', borderColor: PALETTE.accent + '30' }]}>
              <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>{t('home.modules.inventory.stock')}</Text>
              <Text style={[styles.stockValue, { color: PALETTE.accent }]}>{(item as any).stockCount || 0}</Text>
           </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t("products.title")}</Text>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: PALETTE.primary }]}
          onPress={() => router.push("/product-new")}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, NEUMORPHISM.input, { backgroundColor: colors.surface }]}>
           <Ionicons name="search" size={20} color={colors.text} />
           <TextInput
             value={q}
             onChangeText={setQ}
             placeholder={t("products.searchPlaceholder")}
             placeholderTextColor={colors.textSecondary + '70'}
             style={[styles.searchInput, { color: colors.text }]}
           />
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} tintColor={PALETTE.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={PALETTE.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.emptyBox}>
             <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('products.noProducts')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, marginTop: 15, marginBottom: 15 },
  title: { fontSize: 32, fontFamily: FONTS.bold },
  muted: { fontFamily: FONTS.medium, fontSize: 13, opacity: 0.7 },
  addBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  searchWrap: { paddingHorizontal: 24, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 56, ...SHADOWS.soft },
  searchInput: { flex: 1, marginLeft: 12, fontFamily: FONTS.medium, fontSize: 16 },
  listContent: { paddingHorizontal: 24, paddingBottom: 120 },
  card: { flexDirection: "row", alignItems: "center", padding: 18, marginBottom: 16 },
  imageContainer: { marginRight: 18 },
  cardImage: { width: 70, height: 70, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardCenter: { flex: 1 },
  name: { fontSize: 16, fontFamily: FONTS.bold },
  skuText: { fontSize: 11, fontFamily: FONTS.medium, marginTop: 4, letterSpacing: 0.5 },
  cardRight: { marginLeft: 12 },
  stockChip: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, borderWidth: 1 },
  stockLabel: { fontSize: 9, fontFamily: FONTS.bold, marginBottom: 2, opacity: 0.6 },
  stockValue: { fontSize: 20, fontFamily: FONTS.bold },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: FONTS.medium, fontSize: 16 },
});
