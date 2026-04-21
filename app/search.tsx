// app/search.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, NEUMORPHISM, SHADOWS } from "@/utils/theme";
import * as api from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function GlobalSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (text: string) => {
    if (!activeOrg?.id) return;
    setLoading(true);
    try {
      // Tìm kiếm song song Sản phẩm và Đơn hàng
      const [prods, quotes] = await Promise.all([
        api.listProducts({ q: text, orgId: activeOrg.id }),
        api.listQuotesByOrg(activeOrg.id)
      ]);

      const filteredQuotes = quotes.filter((q: any) => 
        (q.code || q.number || "").toLowerCase().includes(text.toLowerCase()) ||
        (q.contactName || q.customerName || "").toLowerCase().includes(text.toLowerCase())
      );

      const combined = [
        ...prods.map((p: any) => ({ ...p, _type: 'product', title: p.nameVi || p.nameEn, sub: p.sku || 'N/A', icon: 'cube' })),
        ...filteredQuotes.map((q: any) => ({ ...q, _type: 'quote', title: q.code || q.number || 'ORDER', sub: q.contactName || t('common.customer'), icon: 'receipt' }))
      ];

      setResults(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.resultCard, NEUMORPHISM.card]}
      onPress={() => {
        if (item._type === 'product') {
          router.push({ pathname: "/product-details", params: { id: item.id } } as any);
        } else {
          router.push({ pathname: "/quote-details", params: { id: item.id } } as any);
        }
      }}
    >
      <View style={styles.imageContainer}>
        {item._type === 'product' && item.image ? (
          <Image source={{ uri: item.image }} style={styles.resultImage} />
        ) : (
          <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '10' }]}>
            <Ionicons name={item.icon} size={22} color={COLORS.primary} />
          </View>
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultSub} numberOfLines={1}>{item.sub}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER TÌM KIẾM */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={28} color={COLORS.text} />
        </Pressable>
        <View style={[styles.searchBar, NEUMORPHISM.input]}>
          <Ionicons name="search" size={20} color={COLORS.primary} />
          <TextInput
            style={styles.input}
            placeholder={t('search.placeholder')}
            placeholderTextColor="rgba(47, 79, 47, 0.4)"
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(it, idx) => (it.id || idx).toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
           loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} /> : null
        }
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <View style={styles.emptyWrap}>
               <Ionicons name="search-outline" size={60} color={COLORS.textSecondary} style={{ opacity: 0.2 }} />
               <Text style={styles.emptyText}>{t('search.noResults').replace('{{query}}', query)}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, ...SHADOWS.soft },
  input: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text },
  
  listContent: { padding: 20, paddingBottom: 100 },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { width: 44, height: 44 },
  resultImage: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.outline + '20' },
  resultInfo: { flex: 1, marginLeft: 15 },
  resultTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
  resultSub: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  
  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 15 },
  emptyText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
