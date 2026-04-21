// app/(tabs)/home.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  RefreshControl,
  Modal,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { H } from "@/utils/href";
import { FONTS, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import * as api from "@/utils/api";
import { LOCAL_PRODUCTS } from "@/constants/localProducts";
import { NEWS_DATA } from "@/constants/newsData";
import { openUrl } from "@/utils/api";

const { width } = Dimensions.get("window");

const HorizontalProductCard = ({ item, onPress, colors }: any) => {
  const { t, i18n } = useTranslation();
  return (
    <Pressable style={[styles.prodCard, NEUMORPHISM.card, { backgroundColor: colors.surface }]} onPress={onPress}>
      {(() => {
        const imgSource = api.getPublicFileUrl(item.image || item.images?.[0]?.url);
        if (imgSource) {
          return (
            <Image 
              source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource} 
              style={styles.prodImage}
              onError={(e) => console.log(`[IMAGE_LOAD_ERROR] Fail: ${imgSource}`, e.nativeEvent)}
            />
          );
        }
        return (
          <View style={[styles.prodImage, styles.prodImagePlaceholder, { backgroundColor: '#FFFDF9' }]}>
             <Ionicons name="leaf" size={32} color={PALETTE.primary} />
          </View>
        );
      })()}
      <View style={styles.prodInfo}>
        <Text style={[styles.prodName, { color: colors.text }]} numberOfLines={1}>
          {i18n.language.startsWith('vi') ? (item.nameVi || item.nameEn) : (item.nameEn || item.nameVi || item.name)}
        </Text>
        <Text style={[styles.prodPrice, { color: PALETTE.accent, fontSize: 13 }]}>
          {item.priceVnd ? new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
            style: 'currency', 
            currency: i18n.language.startsWith('vi') ? 'VND' : 'USD', 
            maximumFractionDigits: i18n.language.startsWith('vi') ? 0 : 2 
          }).format(i18n.language.startsWith('vi') ? item.priceVnd : item.priceVnd / 25000) : t('common.contact')}
        </Text>
      </View>
    </Pressable>
  );
};

const NewsCard = ({ item, colors }: any) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  return (
    <Pressable 
      style={[styles.newsCard, NEUMORPHISM.card, { backgroundColor: colors.surface }]} 
      onPress={() => router.push({ pathname: "/news-details", params: { id: item.id } } as any)}
    >
      <View style={{ width: '100%', height: 150, backgroundColor: '#FFFDF9', borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
        <Image 
          source={typeof item.image === 'string' ? { uri: item.image } : item.image || { uri: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800&auto=format&fit=crop" }} 
          style={styles.newsImage} 
          resizeMode="cover"
        />
      </View>
      <View style={styles.newsInfo}>
        <Text style={[styles.newsDate, { color: PALETTE.primary }]}>{item.date}</Text>
        <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>
          {i18n.language.startsWith('vi') ? item.titleVi : (item.titleEn || item.titleVi)}
        </Text>
        <Text style={[styles.newsSummary, { color: colors.textSecondary }]} numberOfLines={2}>
          {i18n.language.startsWith('vi') ? item.summaryVi : (item.summaryEn || item.summaryVi)}
        </Text>
      </View>
    </Pressable>
  );
};

const MetricCard = ({ title, count, icon, color, isMoney, onPress }: any) => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language.startsWith('vi');

  const formatValue = (val: number) => {
     if (!isMoney) return val.toString();
     const rate = 25000;
     const isVi = i18n.language.startsWith('vi');
     const displayAmount = isVi ? val : val / rate;

     if (isVi) {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        return new Intl.NumberFormat('vi-VN').format(val);
     } else {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(displayAmount);
     }
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card, 
        NEUMORPHISM.card, 
        { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
      ]} 
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <View style={{ marginTop: 15 }}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.cardValue, { color: colors.text }]}>
          {formatValue(count)}
          {isMoney && <Text style={{ fontSize: 14 }}> {isVi ? 'VND' : 'USD'}</Text>}
        </Text>
      </View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user, activeOrg } = useAuth();
  const { colors, notificationsEnabled } = useTheme();

  const [stats, setStats] = useState({ revenue: 0, debtTotal: 0, orders: 0 }); // Added orders to stats
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProds, setLoadingProds] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const MAIN_MODULES = [
    { key: "artisans", label: t('home.modules.artisans.title'), route: "/artisans", icon: "engineering", color: "#8D7B68" },
    { key: "production", label: t('home.modules.production.title'), route: "/production", icon: "precision-manufacturing", color: "#FF9800" },
    { key: "materials", label: t('home.modules.materials.title'), route: "/materials", icon: "inventory-2", color: "#FBC02D" },
    { key: "customers", label: t('home.modules.customers.title'), route: "/customers", icon: "groups", color: "#4CAF50" },
    { key: "shipping", label: t('home.modules.shipping.title'), route: "/shipping", icon: "local-shipping", color: "#2196F3" },
    { key: "expenses", label: t('home.modules.expenses.title'), route: "/expenses", icon: "receipt-long", color: "#F44336" },
    { key: "debts", label: t('home.modules.debts.title'), route: "/debts", icon: "account-balance-wallet", color: "#9C27B0" },
  ];

  const loadData = async (isRefreshing = false) => {
    const orgId = activeOrg?.id;
    // 🛡️ Kiểm tra ID hợp lệ (24 ký tự hex) để tránh lỗi 500 từ Backend
    const isIdValid = orgId && /^[0-9a-fA-F]{24}$/.test(orgId);
    if (!isIdValid) {
      setRefreshing(false);
      setLoadingProds(false);
      return;
    }

    if (isRefreshing) setRefreshing(true);
    setLoadingProds(true);
    try {
      // Gửi định dạng ngày đơn giản YYYY-MM-DD để tránh lệch múi giờ
      const now = new Date();
      // Chuyển đổi sang định dạng YYYY-MM-DD theo giờ địa phương (GMT+7)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const [statData, prodData] = await Promise.all([
        api.getDashboardStats(orgId, todayStr, todayStr),
        api.listProducts({ orgId: orgId })
      ]);

      if (statData?.summary) {
        setStats({ 
          revenue: statData.summary.revenue || 0, 
          debtTotal: statData.summary.receivable || 0,
          orders: statData.summary.orders || 0
        });
      }
      
      if (Array.isArray(prodData?.items)) {
        setProducts(prodData.items.slice(0, 10));
      } else if (Array.isArray(prodData?.products)) {
        setProducts(prodData.products.slice(0, 10));
      } else if (Array.isArray(prodData?.rows)) {
        setProducts(prodData.rows.slice(0, 10));
      } else if (Array.isArray(prodData)) {
        setProducts(prodData.slice(0, 10));
      } else {
        setProducts(LOCAL_PRODUCTS.slice(0, 10));
      }
    } catch (e) { 
      console.error("[DASHBOARD_LOAD_ERROR]", e); 
    } finally {
      setRefreshing(false);
      setLoadingProds(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [activeOrg?.id]));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={PALETTE.primary} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable style={styles.menuTrigger} onPress={() => router.push("/profile")}>
             <Ionicons name="person-circle-outline" size={36} color={colors.text} />
          </Pressable>
          <View style={styles.headerRight}>
             <Pressable style={[styles.headerIconBtn, { backgroundColor: colors.surface }]} onPress={() => router.push("/scan")}>
                <MaterialIcons name="qr-code-scanner" size={24} color={PALETTE.primary} />
             </Pressable>
             <Pressable 
                style={[styles.headerIconBtn, { backgroundColor: colors.surface }]} 
                onPress={() => router.push("/notifications")}
             >
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
             </Pressable>
          </View>
        </View>

        {/* GLOBAL SEARCH BAR */}
        <Pressable 
          style={({ pressed }) => [
            styles.searchContainer, 
            NEUMORPHISM.input, 
            { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
          ]}
          android_ripple={{ color: colors.outline + '20', borderless: false }}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search-outline" size={20} color={PALETTE.primary} />
          <Text style={[styles.searchText, { color: colors.textSecondary }]}>
            {t('search.placeholder')}
          </Text>
        </Pressable>

        {/* STATS ROW */}
        <Pressable 
          onPress={() => router.push("/reports" as any)}
          style={({ pressed }) => [
            styles.todayCard, 
            NEUMORPHISM.card, 
            { backgroundColor: colors.surface, opacity: pressed ? 0.95 : 1 }
          ]}
        >
          <View style={styles.todayHeader}>
            <View style={[styles.todayIconBox, { backgroundColor: PALETTE.primary + '15' }]}>
              <MaterialIcons name="insights" size={24} color={PALETTE.primary} />
            </View>
            <View>
              <Text style={[styles.todayTitle, { color: colors.textSecondary }]}>{t('common.today', 'Hôm nay')}</Text>
              <Text style={[styles.todayMainValue, { color: colors.text }]}>
                {Number(stats?.revenue || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} {t('common.currencySymbol')}
              </Text>
            </View>
          </View>
          
          <View style={[styles.todayDivider, { backgroundColor: colors.outline }]} />
          
          <View style={styles.todaySubRow}>
            <View style={styles.todaySubItem}>
              <Text style={[styles.todaySubTitle, { color: colors.textSecondary }]}>{t('home.dashboard.orders')}</Text>
              <Text style={[styles.todaySubValue, { color: colors.text }]}>{stats?.orders || 0}</Text>
            </View>
            <View style={[styles.todaySubDivider, { backgroundColor: colors.outline }]} />
            <View style={styles.todaySubItem}>
              <Text style={[styles.todaySubTitle, { color: colors.textSecondary }]}>{t('home.dashboard.debts')}</Text>
              <Text style={[styles.todaySubValue, { color: PALETTE.accent }]}>
                {Number(stats?.debtTotal || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
              </Text>
            </View>
          </View>
          
          <View style={styles.todayActionHint}>
             <Text style={[styles.todayActionText, { color: PALETTE.primary }]}>
                {t('home.actions.openModule', 'Xem báo cáo chi tiết')} →
             </Text>
          </View>
        </Pressable>

        {/* PRODUCTS CAROUSEL */}
        <View style={styles.section}>
           <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.serif }]}>{t('home.newProducts')}</Text>
              <Pressable onPress={() => router.push("/products")}>
                <Text style={[styles.seeAllText, { color: PALETTE.primary }]}>{t('home.seeAll')}</Text>
              </Pressable>
           </View>
           {loadingProds ? (
             <ActivityIndicator color={PALETTE.primary} style={{ height: 160 }} />
           ) : (
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {products.map((item) => (
                   <HorizontalProductCard key={item.id} item={item} colors={colors} onPress={() => router.push(H({ pathname: "/product-details", params: { id: item.id } } as any))} />
                ))}
             </ScrollView>
           )}
        </View>

        {/* MODULE GRID */}
        <View style={styles.section}>
           <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.serif, marginBottom: 20 }]}>{t('home.quickManage')}</Text>
           <View style={styles.mainGrid}>
              {MAIN_MODULES.map((item) => (
                <Pressable 
                  key={item.key} 
                  onPress={() => router.push(item.route as any)} 
                  style={({ pressed }) => [
                    styles.mainCard, 
                    NEUMORPHISM.card, 
                    { backgroundColor: colors.surface, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }
                  ]}
                >
                   <View style={[styles.iconBox, { backgroundColor: item.color + '12' }]}>
                    <MaterialIcons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <Text style={[styles.mainLabel, { color: colors.text }]} numberOfLines={1}>{item.label}</Text>
                </Pressable>
              ))}
           </View>
        </View>

        {/* LATEST NEWS SECTION */}
        <View style={styles.section}>
           <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.serif }]}>{t('home.latestNews')}</Text>
           </View>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {NEWS_DATA.map((item) => (
                 <NewsCard key={item.id} item={item} colors={colors} />
              ))}
           </ScrollView>
        </View>

        {/* FOOTER */}
        <View style={[styles.footer, { backgroundColor: colors.surface + '50', borderTopColor: colors.outline, marginTop: 40 }]}>
          <View style={styles.centerSection}>
             <Text style={[styles.footerHeading, { color: colors.text, textAlign: 'center', marginBottom: 15 }]}>{t('home.footer.follow')}</Text>
             <View style={styles.socialIcons}>
                <Ionicons name="logo-facebook" size={24} color={colors.textSecondary} />
                <Ionicons name="logo-instagram" size={24} color={colors.textSecondary} />
                <Ionicons name="logo-youtube" size={24} color={colors.textSecondary} />
                <Ionicons name="logo-tiktok" size={24} color={colors.textSecondary} />
             </View>
             <View style={[styles.footerDivider, { backgroundColor: colors.outline, width: '40%', marginVertical: 30 }]} />
             <View style={styles.contactItem}>
                <MaterialIcons name="call" size={20} color={PALETTE.primary} />
                <Text style={[styles.footerHeading, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>{t('home.footer.contact')}</Text>
             </View>
             <Text style={[styles.footerLinkText, { color: colors.textSecondary, marginTop: 10 }]}>{t('home.footer.hotline')}: 0988.xxx.xxx</Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL PROFILE */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setIsMenuVisible(false)}>
           <View style={[styles.drawerContainer, { backgroundColor: colors.background, padding: 30, alignItems: 'center' }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                 <Ionicons name="person" size={40} color={PALETTE.primary} />
              </View>
              <Text style={[styles.userNameHeader, { color: colors.text, fontFamily: FONTS.serif }]}>{user?.name || t('home.guest')}</Text>
              <Pressable style={[NEUMORPHISM.button, { width: '100%', marginTop: 30 }]} onPress={() => { setIsMenuVisible(false); router.push("/profile"); }}>
                 <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>{t('home.viewProfile')}</Text>
              </Pressable>
           </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  contentArea: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 15 },
  menuTrigger: { width: 44, height: 44, justifyContent: 'center' },
  headerRight: { flexDirection: "row", gap: 12, alignItems: 'center' },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginVertical: 10, paddingHorizontal: 16, height: 54, borderRadius: 16, gap: 12 },
  searchText: { fontSize: 15, fontFamily: FONTS.medium, opacity: 0.6 },
  todayCard: { marginHorizontal: 24, padding: 22, marginBottom: 30, borderRadius: 28 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  todayIconBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  todayTitle: { fontSize: 13, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 1 },
  todayMainValue: { fontSize: 26, fontFamily: FONTS.bold, marginTop: 2 },
  todayDivider: { height: 1, width: '100%', opacity: 0.1, marginBottom: 18 },
  todaySubRow: { flexDirection: 'row', alignItems: 'center' },
  todaySubItem: { flex: 1, alignItems: 'center' },
  todaySubDivider: { width: 1, height: 30, opacity: 0.2 },
  todaySubTitle: { fontSize: 11, fontFamily: FONTS.medium, marginBottom: 4, opacity: 0.7 },
  todaySubValue: { fontSize: 16, fontFamily: FONTS.bold },
  todayActionHint: { marginTop: 15, alignItems: 'flex-end' },
  todayActionText: { fontSize: 12, fontFamily: FONTS.bold },
  card: { flex: 1, padding: 24, borderRadius: 32, ...SHADOWS.soft },
  cardTitle: { fontSize: 13, marginBottom: 8, opacity: 0.8, fontWeight: '600' },
  cardValue: { fontSize: 24, fontWeight: '700' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 24, marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  seeAllText: { fontFamily: FONTS.bold, fontSize: 12 },
  horizontalScroll: { gap: 18 },
  prodCard: { width: 160, padding: 12 },
  prodImage: { width: '100%', height: 110, borderRadius: 20, marginBottom: 12 },
  prodImagePlaceholder: { width: '100%', height: 110, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  prodInfo: { gap: 2 },
  prodName: { fontFamily: FONTS.bold, fontSize: 14 },
  prodPrice: { fontFamily: FONTS.bold },
  mainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mainCard: { width: (width - 48 - 24) / 3, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  mainLabel: { fontFamily: FONTS.bold, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  drawerContainer: { width: width, height: '70%', borderTopLeftRadius: 40, borderTopRightRadius: 40, ...SHADOWS.floating },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 18, ...SHADOWS.soft },
  userNameHeader: { fontFamily: FONTS.bold, fontSize: 24 },
  footer: { paddingVertical: 30, paddingHorizontal: 20, paddingBottom: 150, borderTopWidth: 1, marginTop: 30 },
  footerHeading: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1, marginBottom: 5, opacity: 0.9 },
  footerLinkText: { fontFamily: FONTS.medium, fontSize: 13 },
  footerDivider: { height: 1.5, marginBottom: 25, opacity: 0.5, alignSelf: 'center' },
  centerSection: { alignItems: 'center', marginTop: 10 },
  contactItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialIcons: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  newsCard: { width: 280, padding: 10, marginRight: 15 },
  newsImage: { width: '100%', height: 150, borderRadius: 20 },
  newsInfo: { paddingHorizontal: 4 },
  newsDate: { fontSize: 11, fontFamily: FONTS.bold, marginBottom: 6, textTransform: 'uppercase' },
  newsTitle: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: 8, lineHeight: 22 },
  newsSummary: { fontSize: 13, fontFamily: FONTS.medium, opacity: 0.7, lineHeight: 18 },
});
