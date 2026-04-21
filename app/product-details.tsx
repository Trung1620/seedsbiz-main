// app/product-details.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as api from "@/utils/api";
import { COLORS, FONTS, SIZES, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import ScreenBackground from "@/components/ScreenBackground";
import { H } from "@/utils/href";

const { width } = Dimensions.get("window");

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const [product, setProduct] = useState<api.ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getProductById(id);
        setProduct(data);
      } catch (e: any) {
        Alert.alert(t("common.error"), e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={PALETTE.primary} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t("products.notFound")}</Text>
      </View>
    );
  }

  const mainImgUrl = api.getPublicFileUrl(product.images?.[0]?.url || product.image);
  const isEn = i18n.language === 'en';
  const rate = 25000;

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("products.detailTitle")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imgContainer}>
          {mainImgUrl ? (
            <Image 
              source={typeof mainImgUrl === 'string' ? { uri: mainImgUrl } : mainImgUrl} 
              style={styles.image} 
              resizeMode="cover" 
            />
          ) : (
            <View style={[styles.image, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
               <Ionicons name="image-outline" size={80} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={[styles.content, { backgroundColor: colors.surface }]}>
           <Text style={[styles.name, { color: colors.text }]}>{product.nameVi || product.nameEn}</Text>
           <Text style={[styles.sku, { color: colors.textSecondary }]}>SKU: {product.sku || "—"}</Text>
           
           <View style={styles.priceRow}>
              <Text style={[styles.price, { color: PALETTE.primary }]}>
                {isEn 
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((product.priceVnd || 0) / rate)
                  : (product.priceVnd || 0).toLocaleString("vi-VN") + " đ"
                }
              </Text>
              <View style={[styles.stockBadge, { backgroundColor: product.inStock ? COLORS.success + '20' : COLORS.error + '20' }]}>
                 <Text style={[styles.stockText, { color: product.inStock ? COLORS.success : COLORS.error }]}>
                   {product.inStock ? t("products.inStock") : t("products.outOfStock")}
                 </Text>
              </View>
           </View>

           <View style={styles.divider} />

           <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                 <Text style={styles.infoLabel}>{t("products.categoryLabel")}</Text>
                 <Text style={[styles.infoValue, { color: colors.text }]}>{product.category || "—"}</Text>
              </View>
              <View style={styles.infoItem}>
                 <Text style={styles.infoLabel}>{t("products.brandLabel")}</Text>
                 <Text style={[styles.infoValue, { color: colors.text }]}>{product.brand || "—"}</Text>
              </View>
              <View style={styles.infoItem}>
                 <Text style={styles.infoLabel}>{t("products.sizeLabel")}</Text>
                 <Text style={[styles.infoValue, { color: colors.text }]}>{product.size || "—"}</Text>
              </View>
           </View>

           <View style={styles.divider} />
           
           <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("products.description")}</Text>
           <Text style={[styles.desc, { color: colors.textSecondary }]}>
             {product.description || t("products.noDescription")}
           </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <Pressable style={[styles.editBtn, NEUMORPHISM.button]} onPress={() => Alert.alert("Sắp ra mắt", "Tính năng chỉnh sửa đang phát triển.")}>
             <Text style={[styles.editBtnText, { color: colors.text }]}>{t("common.edit")}</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: PALETTE.primary }]} onPress={() => router.push(H("/inventory-stock-in"))}>
             <Text style={styles.actionBtnText}>{t("inventory.import")}</Text>
          </Pressable>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold },
  imgContainer: { width: width, height: width * 0.8 },
  image: { width: '100%', height: '100%' },
  content: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -30, padding: 24, paddingBottom: 100 },
  name: { fontSize: 24, fontFamily: FONTS.bold, marginBottom: 4 },
  sku: { fontSize: 14, fontFamily: FONTS.medium, marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  price: { fontSize: 22, fontFamily: FONTS.bold },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stockText: { fontSize: 12, fontFamily: FONTS.bold },
  divider: { height: 1.5, backgroundColor: COLORS.background, marginVertical: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  infoItem: { minWidth: '40%' },
  infoLabel: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { fontSize: 15, fontFamily: FONTS.semiBold },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 12 },
  desc: { fontSize: 14, fontFamily: FONTS.medium, lineHeight: 22 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: COLORS.background },
  editBtn: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 15, fontFamily: FONTS.bold },
  actionBtn: { flex: 2, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: FONTS.bold },
});
