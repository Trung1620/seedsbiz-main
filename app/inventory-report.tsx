// app/inventory-report.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE, SHADOWS } from '@/utils/theme';
import ScreenBackground from '@/components/ScreenBackground';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';
import * as api from '@/utils/api';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function InventoryReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeOrg?.id) {
      loadInventory();
    }
  }, [activeOrg?.id]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.listProducts({ orgId: activeOrg!.id });
      setProducts(data.items || data.products || []);
    } catch (e) {
      console.error("[INVENTORY_REPORT_LOAD_ERROR]", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nameVi?.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = products.reduce((acc, p) => acc + (p.stockCount || 0), 0);
  const lowStockCount = products.filter(p => (p.stockCount || 0) < 5).length;

  if (loading) {
    return (
      <ScreenBackground style={styles.center}>
        <ActivityIndicator color={PALETTE.primary} size="large" />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: PALETTE.primary }]}>BÁO CÁO KIỂM KÊ (Chỉ xem)</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Tìm theo tên hoặc SKU..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.summaryRow}>
         <View style={[styles.summaryBox, { backgroundColor: PALETTE.primary + '10' }]}>
            <Text style={styles.summaryLabel}>TỔNG TỒN KHO</Text>
            <Text style={[styles.summaryValue, { color: PALETTE.primary }]}>{totalStock}</Text>
         </View>
         <View style={[styles.summaryBox, { backgroundColor: '#FF6B6B10' }]}>
            <Text style={[styles.summaryLabel, { color: '#FF6B6B' }]}>SẮP HẾT HÀNG</Text>
            <Text style={[styles.summaryValue, { color: '#FF6B6B' }]}>{lowStockCount}</Text>
         </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={[styles.listCard, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
          <View style={styles.listHeader}>
             <Text style={[styles.colHead, { flex: 2, color: colors.textSecondary }]}>SẢN PHẨM / SKU</Text>
             <Text style={[styles.colHead, { flex: 1, textAlign: 'right', color: colors.textSecondary }]}>TỒN KHO</Text>
          </View>
          
          {filteredProducts.map((p: any, i: number) => (
            <View key={p.id} style={[styles.listItem, i === filteredProducts.length - 1 && { borderBottomWidth: 0 }]}>
               <View style={{ flex: 2 }}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{p.nameVi}</Text>
                  <Text style={[styles.itemSku, { color: colors.textSecondary }]}>{p.sku || 'N/A'}</Text>
               </View>
               <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={[
                    styles.stockBadge, 
                    { backgroundColor: (p.stockCount || 0) < 5 ? '#FF6B6B15' : '#4CAF5015' }
                  ]}>
                    <Text style={[
                      styles.stockText, 
                      { color: (p.stockCount || 0) < 5 ? '#FF6B6B' : '#4CAF50' }
                    ]}>
                      {p.stockCount || 0}
                    </Text>
                  </View>
               </View>
            </View>
          ))}
          
          {filteredProducts.length === 0 && (
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 20, marginBottom: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", ...SHADOWS.soft },
  pageTitle: { fontSize: 22, fontFamily: FONTS.bold, marginLeft: 15 },
  searchContainer: { paddingHorizontal: 24, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontFamily: FONTS.medium },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 15, marginBottom: 20 },
  summaryBox: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontFamily: FONTS.bold, marginBottom: 4, opacity: 0.8 },
  summaryValue: { fontSize: 24, fontFamily: FONTS.bold },
  container: { paddingHorizontal: 24 },
  listCard: { borderRadius: 24, paddingVertical: 8, marginBottom: 25 },
  listHeader: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  colHead: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemName: { fontSize: 14, fontFamily: FONTS.bold },
  itemSku: { fontSize: 12, marginTop: 2 },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, minWidth: 45, alignItems: 'center' },
  stockText: { fontSize: 14, fontFamily: FONTS.bold },
  emptyText: { textAlign: 'center', padding: 40, color: '#999', fontSize: 14 },
});
