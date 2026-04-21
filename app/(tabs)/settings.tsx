// app/(tabs)/settings.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Switch,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { me as getMe, type Org } from "@/utils/api";
import { getOrg, setOrg as setActiveOrgInStorage } from "@/utils/storage";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import { FONTS, NEUMORPHISM, SHADOWS, PALETTE } from "@/utils/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme/ThemeProvider";

const VN_PROVINCES = [
  { id: "65cb7e1e1e1e1e1e1e1e1e01", name: "Hà Nội" },
  { id: "65cb7e1e1e1e1e1e1e1e1e02", name: "TP. Hồ Chí Minh" },
  { id: "65cb7e1e1e1e1e1e1e1e1e03", name: "Đà Nẵng" },
  { id: "65cb7e1e1e1e1e1e1e1e1e04", name: "Hải Phòng" },
  { id: "65cb7e1e1e1e1e1e1e1e1e05", name: "Cần Thơ" },
  { id: "65cb7e1e1e1e1e1e1e1e1e06", name: "An Giang" },
  { id: "65cb7e1e1e1e1e1e1e1e1e07", name: "Bà Rịa - Vũng Tàu" },
  { id: "65cb7e1e1e1e1e1e1e1e1e08", name: "Bắc Giang" },
  { id: "65cb7e1e1e1e1e1e1e1e1e09", name: "Bắc Ninh" },
  { id: "65cb7e1e1e1e1e1e1e1e1e0a", name: "Bến Tre" },
  { id: "65cb7e1e1e1e1e1e1e1e1e0b", name: "Bình Định" },
  { id: "65cb7e1e1e1e1e1e1e1e1e0c", name: "Bình Dương" },
  { id: "65cb7e1e1e1e1e1e1e1e1e0d", name: "Bình Phước" },
  { id: "65cb7e1e1e1e1e1e1e1e1e0e", name: "Bình Thuận" },
  { id: "65cb7e1e1e1e1e1e1e1e1e0f", name: "Cà Mau" },
  { id: "65cb7e1e1e1e1e1e1e1e1e10", name: "Đắk Lắk" },
  { id: "65cb7e1e1e1e1e1e1e1e1e11", name: "Đắk Nông" },
  { id: "65cb7e1e1e1e1e1e1e1e1e12", name: "Đồng Nai" },
  { id: "65cb7e1e1e1e1e1e1e1e1e13", name: "Đồng Tháp" },
  { id: "65cb7e1e1e1e1e1e1e1e1e14", name: "Gia Lai" },
  { id: "65cb7e1e1e1e1e1e1e1e1e15", name: "Hà Nam" },
  { id: "65cb7e1e1e1e1e1e1e1e1e16", name: "Hà Tĩnh" },
  { id: "65cb7e1e1e1e1e1e1e1e1e17", name: "Hải Dương" },
  { id: "65cb7e1e1e1e1e1e1e1e1e18", name: "Hậu Giang" },
  { id: "65cb7e1e1e1e1e1e1e1e1e19", name: "Hòa Bình" },
  { id: "65cb7e1e1e1e1e1e1e1e1e1a", name: "Hưng Yên" },
  { id: "65cb7e1e1e1e1e1e1e1e1e1b", name: "Khánh Hòa" },
  { id: "65cb7e1e1e1e1e1e1e1e1e1c", name: "Kiên Giang" },
  { id: "65cb7e1e1e1e1e1e1e1e1e1d", name: "Kon Tum" },
  { id: "65cb7e1e1e1e1e1e1e1e1e1e", name: "Lâm Đồng" },
  { id: "65cb7e1e1e1e1e1e1e1e1e1f", name: "Long An" },
  { id: "65cb7e1e1e1e1e1e1e1e1e20", name: "Nam Định" },
  { id: "65cb7e1e1e1e1e1e1e1e1e21", name: "Nghệ An" },
  { id: "65cb7e1e1e1e1e1e1e1e1e22", name: "Ninh Bình" }
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, token, setActiveOrg: contextSetActiveOrg } = useAuth();
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme, notificationsEnabled, toggleNotifications } = useTheme();

  const [me, setMe] = useState<any>(null);
  const [activeOrg, setOrg] = useState<Org | null>(null);
  const [isOrgModalVisible, setOrgModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [currentOrg, userMe] = await Promise.all([
        getOrg(),
        getMe(),
      ]);
      setOrg(currentOrg);
      setMe(userMe?.user ?? null);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (token) loadData(); }, [token, loadData]);

  const selectNewProvince = async (province: { id: string, name: string }) => {
    const dummyOrg: Org = { id: province.id, name: province.name };
    try {
      await setActiveOrgInStorage(dummyOrg);
      if (contextSetActiveOrg) await contextSetActiveOrg(dummyOrg);
      setOrg(dummyOrg);
      setOrgModalVisible(false);
      Alert.alert(t('common.success'), t('settings.regionSwitched', { name: province.name }));
    } catch (e) {
      Alert.alert(t('common.error'), t('settings.regionSwitchError'));
    }
  };

  const onLogout = () => {
    Alert.alert(t("settings.logout"), t("settings.logoutConfirm"), [
      { text: t("settings.cancel"), style: "cancel" },
      {
        text: t("settings.logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth-login");
        },
      },
    ]);
  };

  const currentLangLabel = i18n.language && i18n.language.startsWith('en') ? "English" : "Tiếng Việt";

  const Item = ({ icon, color, label, value, onPress, isLast }: any) => (
    <Pressable 
      style={[styles.itemRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.outline }]}
      onPress={onPress}
    >
      <View style={[styles.itemIcon, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.itemRight}>
        {value && <Text style={[styles.itemValue, { color: colors.primary }]}>{value}</Text>}
        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.title')}</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.region')}</Text>
          <View style={[styles.sectionCard, NEUMORPHISM.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
             <Pressable style={styles.itemRow} onPress={() => setOrgModalVisible(true)}>
                <View style={[styles.itemIcon, { backgroundColor: '#E6770015' }]}>
                   <MaterialIcons name="location-on" size={20} color="#E67700" />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.currentRegion')}</Text>
                <View style={styles.itemRight}>
                   <Text style={[styles.itemValue, { color: colors.primary, fontFamily: FONTS.bold }]}>{activeOrg?.name || t('common.select')}</Text>
                   <MaterialIcons name="unfold-more" size={20} color={colors.textSecondary} />
                </View>
             </Pressable>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.accountAuth')}</Text>
          <View style={[styles.sectionCard, NEUMORPHISM.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
             <Item 
                icon="verified-user" 
                color="#4C6EF5" 
                label={t('settings.yourRole')} 
                value={me?.role === 'ADMIN' ? t('settings.admin') : t('settings.staff')} 
                onPress={() => Alert.alert(t('common.info'), (t('settings.yourRole') + ": " + (me?.role === 'ADMIN' ? t('settings.admin') : t('settings.staff'))))} 
             />
             <Item 
                icon="language" 
                color="#0CA678" 
                label={t("settings.language")} 
                value={currentLangLabel} 
                onPress={() => i18n.changeLanguage(i18n.language.startsWith('en') ? 'vi' : 'en')} 
                isLast 
             />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.system')}</Text>
          <View style={[styles.sectionCard, NEUMORPHISM.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
             <View style={styles.itemRow}>
                <View style={[styles.itemIcon, { backgroundColor: '#7048E815' }]}>
                   <MaterialIcons name="dark-mode" size={20} color="#7048E8" />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.darkMode')}</Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#dee2e6', true: colors.primary + '80' }}
                  thumbColor={isDark ? colors.primary : '#f4f4f4'}
                />
             </View>
             <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: colors.outline }]}>
                <View style={[styles.itemIcon, { backgroundColor: '#0CA67815' }]}>
                   <MaterialIcons name="notifications" size={20} color="#0CA678" />
                </View>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.pushNotifications')}</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#dee2e6', true: colors.primary + '80' }}
                  thumbColor={notificationsEnabled ? colors.primary : '#f4f4f4'}
                />
             </View>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.supportTitle')}</Text>
          <View style={[styles.sectionCard, NEUMORPHISM.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
             <Item icon="policy" color="#868E96" label={t('settings.policySupport')} onPress={() => router.push("/settings/policy" as any)} isLast />
          </View>
        </View>

        <Pressable 
          style={[styles.logoutBtn, NEUMORPHISM.card, { backgroundColor: colors.surface, borderColor: colors.error + '30' }]}
          onPress={onLogout}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('settings.logout')}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={isOrgModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setOrgModalVisible(false)}>
           <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.selectProvince')}</Text>
                 <Pressable onPress={() => setOrgModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                 </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '100%' }}>
                <View style={styles.orgList}>
                   {VN_PROVINCES.map((p) => (
                     <Pressable 
                        key={p.id} 
                        style={[styles.orgItem, activeOrg?.id === p.id && { backgroundColor: PALETTE.primary + '10' }]}
                        onPress={() => selectNewProvince(p)}
                      >
                         <MaterialIcons 
                            name={activeOrg?.id === p.id ? "radio-button-checked" : "radio-button-unchecked"} 
                            size={22} 
                            color={activeOrg?.id === p.id ? PALETTE.primary : colors.textSecondary} 
                         />
                         <Text style={[styles.orgName, { color: colors.text }, activeOrg?.id === p.id && { fontFamily: FONTS.bold }]}>
                            {p.name}
                         </Text>
                      </Pressable>
                   ))}
                </View>
              </ScrollView>
           </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontFamily: FONTS.bold },
  container: { paddingHorizontal: 20 },
  sectionWrap: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontFamily: FONTS.bold, marginLeft: 15, marginBottom: 15, letterSpacing: 1.5, opacity: 0.6 },
  sectionCard: { borderRadius: 25, paddingVertical: 4, ...SHADOWS.soft },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
  itemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, marginLeft: 15, fontSize: 16, fontFamily: FONTS.medium },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemValue: { fontSize: 14, fontFamily: FONTS.bold },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 25, gap: 10, marginTop: 10, marginBottom: 20, ...SHADOWS.soft },
  logoutText: { fontSize: 16, fontFamily: FONTS.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(47, 79, 47, 0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, maxHeight: '80%', ...SHADOWS.floating },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontFamily: FONTS.bold },
  orgList: { gap: 10, paddingBottom: 40 },
  orgItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 18, gap: 15 },
  orgName: { fontSize: 16, fontFamily: FONTS.medium },
});
