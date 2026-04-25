import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image, Alert, Modal, TextInput, Clipboard } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { COLORS, FONTS, SHADOWS, PALETTE, SIZES } from "@/utils/theme";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as api from "@/utils/api";
import { me as getMe, updateProfile } from "@/utils/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as ImagePicker from 'expo-image-picker';
import ScreenBackground from "@/components/ScreenBackground";

// ✅ FIX 1: Thêm 'role' và 'createdAt' vào interface
interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  image?: string;
  bio?: string;
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // ✅ FIX 2: Lấy cả 'i18n' từ useTranslation
  const { t, i18n } = useTranslation();
  const { logout, activeOrg } = useAuth();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [isOrgModalVisible, setIsOrgModalVisible] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: "",
    directorName: "",
    businessLicense: "",
    taxId: "",
    address: "",
    bankName: "",
    bankAccount: "",
    bankOwner: ""
  });

  const fetchMe = async () => {
    try {
      const res = await getMe();
      if (res?.user) {
        setMe(res.user);
        setEditName(res.user.name || "");
        setEditPhone(res.user.phone || "");
        if (res.user.image) setImage(res.user.image);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    if (activeOrg) {
      setOrgForm({
        name: activeOrg.name || "",
        directorName: activeOrg.directorName || "",
        businessLicense: activeOrg.businessLicense || "",
        taxId: activeOrg.taxId || "",
        address: activeOrg.address || "",
        bankName: activeOrg.bankName || "",
        bankAccount: activeOrg.bankAccount || "",
        bankOwner: activeOrg.bankOwner || ""
      });
    }
  }, [activeOrg]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setImage(selectedUri);

      try {
        setSaving(true);
        // ✅ FIX 3: Dùng optional chaining để tránh lỗi 'me' possibly null
        await updateProfile({ name: me?.name ?? "", image: selectedUri });
        Alert.alert(t('common.success'), t('profile.avatarUpdated'));
      } catch (e) {
        Alert.alert(t('common.error'), t('profile.avatarUpdateError'));
      } finally {
        setSaving(false);
      }
    }
  };

  const handleUpdateOrg = async () => {
    if (!activeOrg) return;
    try {
      setSaving(true);
      await api.updateOrg(activeOrg.id, {
        ...orgForm
      });
      Alert.alert(t('common.success'), t('profile.orgUpdated'));
    } catch (e) {
      Alert.alert(t('common.error'), t('profile.orgUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert(t('common.error'), t('profile.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      const res = await updateProfile({
        name: editName,
        image: image || undefined,
        phone: editPhone
      });

      if (res.success) {
        await fetchMe();
        setIsEditModalVisible(false);
        setTimeout(() => {
          Alert.alert(t('common.success'), t('profile.editProfileTitle') + " " + t('common.success'));
        }, 500);
      } else {
        Alert.alert(t('common.error'), res.error || t('common.tryAgain'));
      }
      // ✅ FIX 4: Xóa catch thứ 2 (duplicate catch gây lỗi bundle!)
    } catch (e: any) {
      console.error("[PROFILE_SAVE_ERROR]", e);
      Alert.alert(t("common.error"), t("profile.update_error"));
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert(t('common.copied'), t('profile.idCopied'));
  };

  // ✅FIX 5: Đổi tên hàm thành 'handleLogout' cho khớp với JSX bên dưới
  const handleLogout = () => {
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

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.title}>{t("profile.title")}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={styles.avatarSection}>
              <View style={styles.avatarBox}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{me?.name?.charAt(0) || "U"}</Text>
                  </View>
                )}
                <Pressable style={styles.editAvatarBtn} onPress={pickImage} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <MaterialIcons name="camera-alt" size={18} color={COLORS.white} />}
                </Pressable>
              </View>
              <Text style={styles.name}>{me?.name || t("common.user")}</Text>
              <Text style={styles.email}>{me?.email}</Text>
            </View>

            <View style={styles.infoList}>
              <InfoItem
                label={t('profile.userId')}
                value={me?.id?.slice(-8).toUpperCase() || "—"}
                icon="id-card-outline"
                onPress={() => copyToClipboard(me?.id ?? "")}
              />
              <InfoItem
                label={t('profile.phone')}
                value={me?.phone || t('profile.notUpdated')}
                icon="call-outline"
              />
              <InfoItem
                label={t('profile.role')}
                value={me?.role === "ADMIN" || me?.role === "OWNER" ? t("orgMembers.admin") : t("orgMembers.member")}
                icon="shield-checkmark-outline"
                onPress={() => Alert.alert(t('profile.role'), me?.role)}
              />
              {activeOrg && (
                <InfoItem
                  label={t("profile.activeOrg")}
                  value={activeOrg.name}
                  icon="business-outline"
                />
              )}
              {activeOrg?.code && (me?.role === "OWNER" || me?.role === "ADMIN") && (
                <InfoItem
                  label={t("profile.orgCode")}
                  value={activeOrg.code}
                  icon="share-social-outline"
                  onPress={() => copyToClipboard(activeOrg.code ?? "")}
                />
              )}
              <InfoItem
                label={t('profile.joinedAt')}
                value={new Date(me?.createdAt || Date.now()).toLocaleDateString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US')}
                icon="calendar-outline"
              />
              <InfoItem
                label={t('profile.lastLogin')}
                value={me?.lastLoginAt ? new Date(me.lastLoginAt).toLocaleString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US') : t('profile.justNow')}
                icon="time-outline"
              />
            </View>

            <View style={styles.actionSection}>
              {(me?.role === "OWNER" || me?.role === "ADMIN") && (
                <Pressable 
                  style={[styles.actionBtn, { backgroundColor: PALETTE.primary + '10' }]}
                  onPress={() => router.push("/org-members" as any)}
                >
                  <Ionicons name="people-outline" size={22} color={PALETTE.primary} />
                  <Text style={[styles.actionText, { color: PALETTE.primary }]}>{t("profile.manageStaff")}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={PALETTE.primary} />
                </Pressable>
              )}


              <Pressable style={styles.secondaryBtn} onPress={() => setIsEditModalVisible(true)}>
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                <Text style={styles.secondaryBtnText}>{t('profile.editInfo')}</Text>
              </Pressable>

              <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                <Text style={styles.logoutBtnText}>{t('profile.logoutBtn')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.editProfileTitle')}</Text>
              <Pressable onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{t('settings.name')}</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.textInput}
                  placeholder={t('profile.namePlaceholder')}
                  placeholderTextColor={COLORS.onSurfaceVariant}
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{t('profile.phone')}</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  style={styles.textInput}
                  placeholder={t('profile.phone')}
                  placeholderTextColor={COLORS.onSurfaceVariant}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={{ height: 20 }} />

              <Pressable
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{t('common.saveChanges')}</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal thiết lập xưởng */}
      <Modal visible={isOrgModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.workshopSettingsTitle')}</Text>
              <Pressable onPress={() => setIsOrgModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: t('profile.workshopName'), key: "name" },
                { label: t('profile.directorName'), key: "directorName" },
                { label: t('profile.businessLicense'), key: "businessLicense" },
                { label: t('profile.taxId'), key: "taxId" },
                { label: t('profile.address'), key: "address" },
                { label: t('profile.bankName'), key: "bankName" },
                { label: t('profile.bankAccount'), key: "bankAccount" },
                { label: t('profile.bankOwner'), key: "bankOwner" },
              ].map((item) => (
                <View key={item.key} style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{item.label}</Text>
                  <TextInput
                    value={(orgForm as any)[item.key]}
                    onChangeText={(v) => setOrgForm({ ...orgForm, [item.key]: v })}
                    style={styles.textInput}
                    placeholder={`${t('common.add')} ${item.label.toLowerCase()}`}
                  />
                </View>
              ))}

              <Pressable
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                disabled={saving}
                onPress={async () => {
                  setSaving(true);
                  try {
                    await api.authedFetch(`/api/orgs/${activeOrg?.id || ''}`, {
                      method: 'PATCH',
                      body: JSON.stringify(orgForm)
                    });
                    Alert.alert(t('common.success'), t('profile.orgUpdated'));
                    setIsOrgModalVisible(false);
                  } catch (e) {
                    Alert.alert(t('common.error'), t('profile.orgUpdateError'));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{t('profile.saveWorkshop')}</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

function InfoItem({ label, value, icon, isLast, onPress }: any) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.infoRow, !isLast && styles.borderBottom]}>
      <View style={styles.iconIconBox}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={{ marginLeft: 16, flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={COLORS.onSurfaceVariant} style={{ opacity: 0.5 }} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderRadius: 14, elevation: 1 },
  title: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.onSurface },
  container: { padding: 20, alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarBox: { position: 'relative', width: 110, height: 110 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 44, color: COLORS.white, fontFamily: FONTS.bold },
  editAvatarBtn: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  name: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.onSurface, marginTop: 16 },
  email: { fontSize: 14, color: COLORS.onSurfaceVariant, fontFamily: FONTS.medium, marginTop: 4 },

  infoList: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: 20, marginBottom: 24, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  iconIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(47, 107, 63, 0.08)', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 12, color: COLORS.onSurfaceVariant, fontFamily: FONTS.medium },
  infoValue: { fontSize: 16, color: COLORS.onSurface, fontFamily: FONTS.bold, marginTop: 2 },

  actionSection: { width: '100%', gap: 16 },
  secondaryBtn: { width: '100%', flexDirection: 'row', paddingVertical: 16, borderRadius: 20, backgroundColor: 'rgba(47, 107, 63, 0.05)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryBtnText: { fontFamily: FONTS.bold, color: COLORS.primary, fontSize: 16 },
  logoutBtn: { width: '100%', flexDirection: 'row', paddingVertical: 16, borderRadius: 20, backgroundColor: 'rgba(231, 76, 60, 0.05)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logoutBtnText: { fontFamily: FONTS.bold, color: COLORS.error, fontSize: 16 },

  actionBtn: { width: '100%', flexDirection: 'row', paddingVertical: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  actionText: { fontFamily: FONTS.bold, fontSize: 16, flex: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.onSurface },
  inputWrap: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.onSurfaceVariant, marginBottom: 10, marginLeft: 4 },
  textInput: { backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 16, padding: 16, fontSize: 16, fontFamily: FONTS.medium, color: COLORS.onSurface, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 20, alignItems: 'center', elevation: 2, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontFamily: FONTS.bold }
});
