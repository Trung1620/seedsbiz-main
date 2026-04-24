// app/materials.tsx
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
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { FONTS, NEUMORPHISM, SHADOWS, PALETTE, SIZES } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import ScreenBackground from "@/components/ScreenBackground";
import { AppHeader, SearchBar, EmptyState } from "@/components/UI";

export default function MaterialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { authReady, token, activeOrg } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const canUse = authReady && !!token && !!activeOrg?.id;

  const load = async () => {
    if (!canUse) return;
    setLoading(true);
    try {
      const rows = await api.listMaterials();
      setItems(rows || []);
    } catch (e: any) {
      console.error("[LOAD_MATERIALS_ERROR]", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (canUse) load();
    }, [canUse])
  );

  const filteredItems = items.filter(it => 
    it.name?.toLowerCase().includes(q.toLowerCase()) || 
    it.sku?.toLowerCase().includes(q.toLowerCase())
  );

  const handleRemove = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('materials.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMaterial(id);
              load();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: PALETTE.primary + '15' }]}>
           {(() => {
             const imgSource = api.getPublicFileUrl(item.image);
             if (imgSource) {
               return <Image source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource} style={styles.cardImage} />;
             }
             return <MaterialIcons name="inventory-2" size={24} color={PALETTE.primary} />;
           })()}
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.sku, { color: colors.textSecondary }]}>{item.sku || "N/A"}</Text>
        </View>
        <View style={styles.actionIcons}>
          <Pressable onPress={() => handleRemove(item.id)} style={styles.smallIconBtn}>
             <MaterialIcons name="delete-outline" size={20} color="#FF5252" />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.text }]}>
            {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
              style: 'currency', 
              currency: i18n.language.startsWith('vi') ? 'VND' : 'USD',
              maximumFractionDigits: i18n.language.startsWith('vi') ? 0 : 2
            }).format(i18n.language.startsWith('vi') ? (item.price || 0) : (item.price || 0) / 25000)}
            <Text style={[styles.unit, { color: colors.textSecondary }]}>/{item.unit}</Text>
          </Text>
          {(item.location || item.supplierName) && (
            <View style={{ flexDirection: 'row', marginTop: 4, gap: 10 }}>
              {item.location && <Text style={[styles.sku, { color: colors.textSecondary, fontSize: 11 }]}>📍 {item.location}</Text>}
              {item.supplierName && <Text style={[styles.sku, { color: colors.textSecondary, fontSize: 11 }]}>🚚 {item.supplierName}</Text>}
            </View>
          )}
      </View>
      
      <View style={[styles.stockRow, { borderTopColor: colors.outline + '40' }]}>
        <View style={styles.stockInfo}>
           <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>{t('inventory.stockTitle')} / {t('inventory.stockLimit')}</Text>
           <Text style={[styles.stockValue, { color: item.stock <= (item.minStock || 0) ? '#FF5252' : PALETTE.primary }]}>
             {item.stock || 0} / {item.minStock || 0} {item.unit}
           </Text>
        </View>
        <Pressable 
          style={[styles.actionBtn, { backgroundColor: colors.background }]}
          onPress={() => Alert.alert(t('common.info'), t('common.comingSoon'))}
        >
           <MaterialIcons name="add-circle-outline" size={20} color={colors.textSecondary} />
           <Text style={[styles.actionText, { color: colors.textSecondary }]}>{t('inventory.stockIn')}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <AppHeader
        title={t('materials.title')}
        subtitle={`${items.length} ${t('materials.countSuffix')}`}
        onBack={() => router.back()}
        rightAction={
          <Pressable
            style={[{ width: 44, height: 44, borderRadius: 14, backgroundColor: PALETTE.primary, alignItems: 'center', justifyContent: 'center' }, SHADOWS.soft]}
            onPress={() => router.push('/material-new')}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        }
      />

      <SearchBar
        value={q}
        onChangeText={setQ}
        placeholder={t('materials.searchPlaceholder')}
      />

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={PALETTE.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={PALETTE.primary} style={{ marginTop: 60 }} />
        ) : (
          <EmptyState
            icon="leaf-outline"
            title={t('materials.noData')}
            subtitle={t('materials.noDataSub')}
            action={{ label: t('materials.addBtn'), onPress: () => router.push('/material-new') }}
          />
        )}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginVertical: 15 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontFamily: FONTS.bold },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  searchWrap: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, ...SHADOWS.soft },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: FONTS.medium, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  headerText: { flex: 1, marginLeft: 15 },
  name: { fontSize: 17, fontFamily: FONTS.bold },
  sku: { fontSize: 13, fontFamily: FONTS.medium, marginTop: 2 },
  priceTag: { alignItems: 'flex-end' },
  priceContainer: { marginTop: 10, paddingLeft: 63 },
  price: { fontSize: 16, fontFamily: FONTS.bold },
  unit: { fontSize: 13, opacity: 0.6 },
  actionIcons: { flexDirection: 'row', alignItems: 'center' },
  smallIconBtn: { padding: 8, borderRadius: 10 },
  stockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1 },
  stockInfo: { flexDirection: 'row', alignItems: 'center' },
  stockLabel: { fontSize: 10, fontFamily: FONTS.bold, marginRight: 8, opacity: 0.5 },
  stockValue: { fontSize: 15, fontFamily: FONTS.bold },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  actionText: { fontSize: 12, fontFamily: FONTS.bold, marginLeft: 6 },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: FONTS.medium, fontSize: 16 },
});
