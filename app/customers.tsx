// app/customers.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import { FONTS, NEUMORPHISM, SHADOWS, PALETTE, SIZES } from "@/utils/theme";
import ScreenBackground from "@/components/ScreenBackground";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { AppHeader } from "@/components/UI";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import * as ImagePicker from 'expo-image-picker';
import { uploadImageUriToCloudinary } from "@/utils/uploadCloudinaryRN";

type CustomerItem = api.Customer & { type?: string };
type CustomerFormState = { 
  name: string; 
  phone: string; 
  email: string; 
  address: string; 
  note: string; 
  type: 'individual' | 'business';
  companyName: string;
  taxId: string;
  image: string;
  code: string;
  zalo: string;
  facebook: string;
  birthday: string;
  groupName: 'RETAIL' | 'WHOLESALE' | 'AGENCY';
};

const EMPTY_FORM: CustomerFormState = { 
  name: "", phone: "", email: "", address: "", note: "", type: 'individual', companyName: "", taxId: "", image: "",
  code: "", zalo: "", facebook: "", birthday: "", groupName: 'RETAIL'
};

export default function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { token, activeOrg } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(keyword); }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);

  const loadCustomers = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      setLoading(true);
      const res = await api.listCustomers({ orgId: activeOrg.id, q: searchQuery.trim() });
      setCustomers(Array.isArray(res) ? res : []);
    } catch (error: any) {
      console.error(error);
    } finally { setLoading(false); }
  }, [activeOrg?.id, searchQuery]);

  useEffect(() => { if (activeOrg?.id) loadCustomers(); }, [activeOrg?.id, loadCustomers, searchQuery]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setForm({ ...form, image: result.assets[0].uri });
    }
  };

  const submitForm = async () => {
    if (!token || !activeOrg?.id) return;

    setSaving(true);
    try {
      let finalImageUrl = form.image;
      
      // Upload to Cloudinary if it's a local file
      if (form.image && form.image.startsWith('file://')) {
        setIsUploading(true);
        finalImageUrl = await uploadImageUriToCloudinary(form.image);
        setIsUploading(false);
      }

      // Gửi đầy đủ dữ liệu để đồng bộ hoàn toàn
      const payload: any = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        taxId: form.taxId.trim() || null,
        image: finalImageUrl || null,
        note: form.note.trim() || null,
      };

      if (!payload.name) { 
        Alert.alert(t('common.info'), t('customers.missingNameMsg')); 
        return; 
      }
      
      if (editingCustomer?.id) { 
        await api.updateCustomer(editingCustomer.id, payload); 
      }
      else { 
        await api.createCustomer(payload); 
      }
      setModalVisible(false);
      setKeyword("");
      setSearchQuery("");
      loadCustomers();
    } catch (error: any) { 
      const msg = error?.payload?.issues?.[0]?.message || error?.message || t('common.error');
      Alert.alert(t('common.error'), msg); 
    }
    finally { 
      setSaving(false); 
      setIsUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.exportCustomers();
      const csvData = await res.text();
      const fileName = `KhachHang_${new Date().getTime()}.csv`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvData, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      "Bạn có chắc muốn xóa khách hàng này? Hành động này không thể hoàn tác.",
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteCustomer(id);
              loadCustomers();
            } catch (e: any) {
              const msg = e.response?.data?.error || e.message;
              Alert.alert(t('common.error'), msg === "Cannot delete customer because it has quotes" ? "Không thể xóa khách hàng này vì đã có đơn hàng/báo giá liên quan." : msg);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: CustomerItem }) => (
    <Pressable 
      style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]} 
      onPress={() => { 
        setEditingCustomer(item); 
        setForm({ 
          name: item.name ?? "", 
          phone: item.phone ?? "", 
          email: item.email ?? "", 
          address: item.address ?? "", 
          note: item.note ?? "",
          type: (item.type as any) || 'individual',
          companyName: item.companyName ?? "",
          taxId: item.taxId ?? "",
          image: (item as any).image ?? "",
          code: item.code ?? "",
          zalo: item.zalo ?? "",
          facebook: item.facebook ?? "",
          birthday: item.birthday ? new Date(item.birthday).toISOString().split('T')[0] : "",
          groupName: item.groupName as any || 'RETAIL'
        }); 
        setModalVisible(true); 
      }}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.avatar, { backgroundColor: item.type === 'business' ? '#FFF9C4' : '#E8F5E9' }]}>
            {(() => {
              const imgSource = api.getPublicFileUrl(item.image);
              if (imgSource) {
                return <Image source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource} style={styles.avatarImage} />;
              }
              return <Ionicons name={item.type === 'business' ? "business" : "person"} size={24} color={item.type === 'business' ? '#FBC02D' : '#4CAF50'} />;
            })()}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
             <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: item.type === 'business' ? '#FBC02D' : '#4CAF50' }]}>
                 <Text style={styles.typeBadgeText}>{item.type === 'business' ? t('customers.typeBusiness') : t('customers.typeIndividual')}</Text>
              </View>
          </View>
          {!!item.phone && <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>📞 {item.phone}</Text>}
          <View style={styles.debtRow}>
             <Text style={[styles.debtText, { color: '#FF5252' }]}>{t('customers.debtLabel')}: {(item.currentDebt || 0).toLocaleString()}{t('common.currencySymbol')}</Text>
             <Text style={[styles.debtText, { color: '#4CAF50' }]}> | {t('customers.spentLabel')}: {(item.totalSpent || 0).toLocaleString()}{t('common.currencySymbol')}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
           <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
           <Pressable onPress={() => handleDelete(item.id)}>
              <MaterialIcons name="delete-outline" size={20} color="#FF5252" />
           </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('customers.title')}</Text>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{activeOrg?.name}</Text>
        </View>
        <Pressable 
          style={[styles.addBtn, { backgroundColor: '#2E7D32', marginRight: 10 }]} 
          onPress={handleExport}
        >
           <MaterialIcons name="file-download" size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable style={[styles.addBtn, { backgroundColor: PALETTE.primary }]} onPress={() => { setEditingCustomer(null); setForm(EMPTY_FORM); setModalVisible(true); }}>
           <Ionicons name="person-add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, NEUMORPHISM.input, { backgroundColor: colors.surface }]}>
           <Ionicons name="search" size={20} color={colors.text} />
           <TextInput
             value={keyword}
             onChangeText={setKeyword}
             placeholder={t('customers.searchPlaceholder')}
             placeholderTextColor={colors.textSecondary + '70'}
             style={[styles.searchInput, { color: colors.text }]}
           />
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCustomers} tintColor={PALETTE.primary} />}
        ListEmptyComponent={loading ? <ActivityIndicator color={PALETTE.primary} /> : null}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{editingCustomer ? t('customers.modal.editTitle') : t('customers.modal.createTitle')}</Text>
              <Pressable onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('customers.labelType')}</Text>
              <View style={styles.typeSelector}>
                 <Pressable 
                    onPress={() => setForm({...form, type: 'individual'})}
                    style={[styles.typeOption, form.type === 'individual' && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }]}
                 >
                    <Text style={[styles.typeOptionText, form.type === 'individual' && { color: '#FFFFFF' }]}>{t('customers.typeIndividual')}</Text>
                 </Pressable>
                 <Pressable 
                    onPress={() => setForm({...form, type: 'business'})}
                    style={[styles.typeOption, form.type === 'business' && { backgroundColor: '#FBC02D', borderColor: '#FBC02D' }]}
                 >
                    <Text style={[styles.typeOptionText, form.type === 'business' && { color: '#FFFFFF' }]}>{t('customers.typeBusiness')}</Text>
                 </Pressable>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {form.type === 'individual' ? t('customers.labelNameInd') : t('customers.labelNameBus')}
              </Text>
              <TextInput 
                value={form.name} 
                onChangeText={(v) => setForm((s) => ({ ...s, name: v }))} 
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} 
                placeholder={form.type === 'individual' ? t('customers.placeholderNameInd') : t('customers.placeholderNameBus')}
              />
              
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('customers.labelCode')}</Text>
                  <TextInput value={form.code} onChangeText={(v) => setForm((s) => ({ ...s, code: v }))} style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} placeholder="KH-001" />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('customers.labelGroup')}</Text>
              <View style={styles.verticalPicker}>
                {[
                  { key: 'RETAIL', label: t('customers.groupRetail') },
                  { key: 'WHOLESALE', label: t('customers.groupWholesale') },
                  { key: 'AGENCY', label: t('customers.groupAgency') }
                ].map(g => (
                  <Pressable 
                    key={g.key} 
                    onPress={() => setForm({...form, groupName: g.key as any})} 
                    style={[
                      styles.groupOption, 
                      { backgroundColor: colors.surface, borderColor: colors.outline },
                      form.groupName === g.key && { backgroundColor: PALETTE.primary + '15', borderColor: PALETTE.primary }
                    ]}
                  >
                    <MaterialIcons 
                      name={form.groupName === g.key ? "radio-button-checked" : "radio-button-unchecked"} 
                      size={18} 
                      color={form.groupName === g.key ? PALETTE.primary : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.groupOptionText, 
                      { color: form.groupName === g.key ? PALETTE.primary : colors.textSecondary }
                    ]}>
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('customers.labelPhone')}</Text>
              <TextInput value={form.phone} onChangeText={(v) => setForm((s) => ({ ...s, phone: v }))} style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} keyboardType="phone-pad" />
              
              {form.type === 'business' && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('quotes.company_name')}</Text>
                  <TextInput value={form.companyName} onChangeText={(v) => setForm((s) => ({ ...s, companyName: v }))} style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} />
                  
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('quotes.tax_id')}</Text>
                  <TextInput value={form.taxId} onChangeText={(v) => setForm((s) => ({ ...s, taxId: v }))} style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} />
                </>
              )}

              <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL</Text>
              <TextInput 
                value={form.email} 
                onChangeText={(v) => setForm((s) => ({ ...s, email: v }))} 
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} 
                keyboardType="email-address" 
                placeholder="example@gmail.com"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('customers.labelBirthday')}</Text>
                  <TextInput 
                    value={form.birthday} 
                    onChangeText={(v) => setForm((s) => ({ ...s, birthday: v }))} 
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} 
                    placeholder="YYYY-MM-DD" 
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('customers.labelAddress')}</Text>
              <TextInput value={form.address} onChangeText={(v) => setForm((s) => ({ ...s, address: v }))} style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline }]} multiline />

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.image', 'Ảnh đại diện')}</Text>
              <Pressable 
                style={[styles.imagePickerBtn, { backgroundColor: colors.surface, borderColor: colors.outline }]} 
                onPress={pickImage}
              >
                {form.image ? (
                  <Image 
                    source={form.image.startsWith('http') || form.image.startsWith('file') ? { uri: form.image } : api.getPublicFileUrl(form.image)} 
                    style={styles.imagePreview} 
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 5 }}>{t('common.selectImage', 'Chọn ảnh')}</Text>
                  </View>
                )}
              </Pressable>

              <Pressable 
                style={[styles.saveBtn, { backgroundColor: PALETTE.primary, opacity: (saving || isUploading) ? 0.7 : 1 }]} 
                onPress={submitForm} 
                disabled={saving || isUploading}
              >
                 {(saving || isUploading) ? (
                   <ActivityIndicator color="#FFFFFF" />
                 ) : (
                   <Text style={styles.saveBtnText}>{t('common.complete')}</Text>
                 )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 15, gap: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", ...SHADOWS.soft },
  title: { fontSize: 28, fontFamily: FONTS.bold },
  subTitle: { fontSize: 13, fontFamily: FONTS.medium, opacity: 0.7 },
  addBtn: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  searchWrap: { paddingHorizontal: 24, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 56, ...SHADOWS.soft, borderRadius: 18 },
  searchInput: { flex: 1, marginLeft: 12, fontFamily: FONTS.medium, fontSize: 16 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { padding: 18, marginBottom: 16, borderRadius: 22 },
  cardTopRow: { flexDirection: "row", gap: 15, alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  cardTitle: { fontSize: 16, fontFamily: FONTS.bold, maxWidth: '60%' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 9, fontFamily: FONTS.bold, color: '#FFFFFF' },
  cardMeta: { fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(47, 79, 47, 0.4)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: "90%", ...SHADOWS.floating },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontFamily: FONTS.bold },
  label: { marginTop: 18, marginBottom: 8, fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  typeOption: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  typeOptionText: { fontFamily: FONTS.bold, fontSize: 14, color: '#757575' },
  input: { borderRadius: 15, padding: 15, fontSize: 16, borderWidth: 1.5 },
  saveBtn: { marginTop: 30, paddingVertical: 20, borderRadius: 20, alignItems: "center", ...SHADOWS.soft },
  saveBtnText: { color: "#FFFFFF", fontFamily: FONTS.bold, fontSize: 16 },
  debtRow: { flexDirection: 'row', marginTop: 5 },
  debtText: { fontSize: 11, fontFamily: FONTS.bold },
  row: { flexDirection: 'row', gap: 12 },
  verticalPicker: { gap: 8, marginTop: 5 },
  groupOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1,
    gap: 10
  },
  groupOptionText: { fontSize: 11, fontFamily: FONTS.bold },
  imagePickerBtn: {
    height: 120,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 5,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
