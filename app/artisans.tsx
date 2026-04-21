// app/artisans.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { FONTS, NEUMORPHISM, SHADOWS, PALETTE, SIZES } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ScreenBackground";
import { AppHeader, InputField } from "@/components/UI";
import * as api from "@/utils/api";

export default function ArtisansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { activeOrg } = useAuth();

  const [workers, setWorkers] = useState<api.Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<any>(null);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceNote, setAdvanceNote] = useState("");

  const handleOpenAdvance = (artisan: any) => {
    setSelectedArtisan(artisan);
    setIsAdvanceModalVisible(true);
  };

  const handleSaveAdvance = async () => {
    if (!selectedArtisan || !advanceAmount) return;
    try {
      await api.createArtisanTransaction({
        artisanId: selectedArtisan.id,
        type: "ADVANCE",
        amount: parseFloat(advanceAmount),
        note: advanceNote,
      });
      Alert.alert(t('common.success'), t('artisans.addSuccess'));
      setIsAdvanceModalVisible(false);
      setAdvanceAmount("");
      setAdvanceNote("");
      loadWorkers(false);
    } catch (e: any) {
      Alert.alert(t('common.error'), t('common.tryAgain'));
    }
  };
  const [editingWorker, setEditingWorker] = useState<api.Artisan | null>(null);
  const [formData, setFormData] = useState({
    code: "", name: "", phone: "", address: "", age: "", role: t('artisans.roleWorker'),
    baseSalary: "0", dailyWage: "0", initialDebt: "0", skills: "", dailyTarget: "10", image: ""
  });

  const loadWorkers = async (showLoading = true) => {
    if (!activeOrg?.id) return;
    if (showLoading) setLoading(true);
    try {
      let data = await api.listArtisans(activeOrg.id);
      
      // Xóa dữ liệu mẫu theo yêu cầu người dùng
      const namesToDelete = ["trần thị hiền", "trần thj hiền", "nguyễn văn chúc"];
      const toDelete = data.filter(w => namesToDelete.includes(w.name.toLowerCase()));
      
      if (toDelete.length > 0) {
        for (const w of toDelete) {
          await api.deleteArtisan(w.id);
        }
        data = data.filter(w => !namesToDelete.includes(w.name.toLowerCase()));
      }

      setWorkers(data || []);
    } catch (error) {
       console.error("Fetch workers error:", error);
       setWorkers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, [activeOrg?.id]);

  const handleSaveWorker = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert(t('common.error'), t('artisans.missingInfo'));
      return;
    }
    try {
      if (editingWorker) {
        await api.updateArtisan(editingWorker.id, {
          ...formData,
          dailyWage: Number(formData.dailyWage) || 0,
          initialDebt: Number(formData.initialDebt) || 0,
          dailyTarget: Number(formData.dailyTarget) || 0,
          age: formData.age ? Number(formData.age) : undefined
        });
        Alert.alert(t('common.success'), t('common.updateSuccess', { defaultValue: 'Cập nhật thành công' }));
      } else {
        await api.createArtisan({ 
          ...formData, 
          orgId: activeOrg?.id,
          dailyWage: Number(formData.dailyWage) || 0,
          initialDebt: Number(formData.initialDebt) || 0,
          dailyTarget: Number(formData.dailyTarget) || 0,
          age: formData.age ? Number(formData.age) : undefined
        });
        Alert.alert(t('common.success'), t('artisans.addSuccess'));
      }
      setIsAddModalVisible(false);
      resetForm();
      loadWorkers(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), (error.message || t('auth.loginFailed')));
    }
  };

  const resetForm = () => {
    setEditingWorker(null);
    setFormData({ code: "", name: "", phone: "", address: "", age: "", role: t('artisans.roleWorker'), baseSalary: "0", dailyWage: "0", initialDebt: "0", skills: "Weaving", dailyTarget: "10", image: "" });
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    (w.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatMoney = (val?: number) => {
    const isEn = i18n.language.startsWith('en');
    return new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: isEn ? 'USD' : 'VND',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('artisans.confirmDelete', { defaultValue: 'Bạn có chắc muốn xóa thợ thủ công này?' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteArtisan(id);
              loadWorkers(false);
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const WorkerCard = ({ item }: { item: api.Artisan }) => (
    <View style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
         <Pressable 
           style={[styles.avatarBox, { backgroundColor: item.isWorking ? '#E8F5E9' : '#FFEBEE' }]}
           onPress={() => {
              setEditingWorker(item);
              setFormData({
                code: item.code || "",
                name: item.name,
                phone: item.phone,
                address: item.address || "",
                age: String(item.age || ""),
                role: item.role || t('artisans.roleWorker'),
                baseSalary: String(item.baseSalary || 0),
                dailyWage: String(item.dailyWage || 0),
                dailyTarget: String(item.dailyTarget || 10),
                initialDebt: String(item.debt || 0),
                skills: item.skills || "",
                image: item.image || ""
              });
              setIsAddModalVisible(true);
           }}
         >
            {(() => {
              const imgSource = api.getPublicFileUrl(item.image);
              if (imgSource) {
                return <Image source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource} style={styles.avatarImage} />;
              }
              return <Ionicons name="person" size={24} color={item.isWorking ? '#2E7D32' : '#C62828'} />;
            })()}
         </Pressable>
          <View style={styles.cardTitleBox}>
            <Text style={[styles.workerName, { color: colors.text }]}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? '#E8F5E9' : '#FFEBEE' }]}>
                <View style={[styles.statusDot, { backgroundColor: item.status === 'ACTIVE' ? '#4CAF50' : '#F44336' }]} />
                <Text style={[styles.statusText, { color: item.status === 'ACTIVE' ? '#2E7D32' : '#C62828' }]}>
                    {item.status === 'ACTIVE' ? "ĐANG LÀM" : "NGHỈ TẠM"}
                </Text>
            </View>
            <Text style={[styles.specialtyText, { color: colors.textSecondary }]}>{item.skills || "Thợ đan"}</Text>
          </View>
         <View style={{ flexDirection: 'row', gap: 10 }}>
           <Pressable style={[styles.callBtn, { backgroundColor: '#E1F5FE' }]} onPress={() => {
              setEditingWorker(item);
              setFormData({
                code: item.code || "",
                name: item.name,
                phone: item.phone,
                address: item.address || "",
                age: String(item.age || ""),
                role: item.role || t('artisans.roleWorker'),
                baseSalary: String(item.baseSalary || 0),
                dailyWage: String(item.dailyWage || 0),
                dailyTarget: String(item.dailyTarget || 10),
                initialDebt: String(item.debt || 0),
                skills: item.skills || "",
                image: item.image || ""
              });
              setIsAddModalVisible(true);
           }}>
              <MaterialIcons name="edit" size={18} color="#0288D1" />
           </Pressable>
           <Pressable style={[styles.callBtn, { backgroundColor: '#E3F2FD' }]} onPress={() => handleOpenAdvance(item)}>
              <MaterialIcons name="payments" size={18} color="#1976D2" />
           </Pressable>
           <Pressable style={[styles.callBtn, { backgroundColor: '#FFF5F5' }]} onPress={() => handleDelete(item.id)}>
              <MaterialIcons name="delete-outline" size={18} color="#FF5252" />
           </Pressable>
         </View>
      </View>

      <View style={[styles.cardDivider, { backgroundColor: colors.background }]} />

      <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>LƯƠNG NGÀY</Text>
            <Text style={[styles.salaryValue, { color: PALETTE.primary }]}>{formatMoney(item.dailyWage)}</Text>
         </View>
         <View style={[styles.verticalDivider, { backgroundColor: colors.background }]} />
         <View style={styles.financeItem}>
            <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>{t('artisans.daysWorked')}</Text>
            <Text style={[styles.salaryValue, { color: '#2E7D32' }]}>{item.totalDaysWorked || 0} {t('common.days', { defaultValue: 'ngày' }).toLowerCase()}</Text>
         </View>
         <View style={[styles.verticalDivider, { backgroundColor: colors.background }]} />
         <View style={styles.financeItem}>
            <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>{t('artisans.debtLabel')}</Text>
            <Text style={[styles.salaryValue, { color: (item.debt || 0) > 0 ? PALETTE.accent : colors.textSecondary }]}>{formatMoney(item.debt)}</Text>
         </View>
      </View>
      
      <View style={{ marginTop: 15, alignItems: 'center' }}>
         <Pressable 
           style={[styles.attendanceBtn, { backgroundColor: item.isWorking ? '#E8F5E9' : PALETTE.primary, width: '100%' }]}
           onPress={() => handleToggleAttendance(item.id, !item.isWorking)}
         >
            <Text style={[styles.attendanceBtnText, { color: item.isWorking ? '#2E7D32' : '#FFF' }]}>
              {item.isWorking ? t('artisans.attendanceDone') : t('artisans.attendanceDo')}
            </Text>
         </Pressable>
      </View>
    </View>
  );

  const handleToggleAttendance = async (id: string, isPresent: boolean) => {
    try {
      await api.submitAttendance({ artisanId: id, status: isPresent ? 'PRESENT' : 'ABSENT' });
      loadWorkers(false);
    } catch (e: any) {
      Alert.alert("Lỗi", "Không thể điểm danh");
    }
  };

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('artisans.title')}</Text>
          <Pressable 
            style={[styles.addSquareBtn, { backgroundColor: colors.primary }]} 
            onPress={() => { resetForm(); setIsAddModalVisible(true); }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, NEUMORPHISM.input, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="search" size={24} color={colors.text} />
            <TextInput
              placeholder={t('artisans.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary + '70'}
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredWorkers}
            keyExtractor={(item) => item.id}
            renderItem={WorkerCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadWorkers(false)} tintColor={PALETTE.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('artisans.noData')}</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>{t('artisans.addFirst')}</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={isAddModalVisible} animationType="slide" transparent>
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
               <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {editingWorker ? t('common.edit') : t('artisans.addNew')}
                  </Text>
                  <Pressable onPress={() => setIsAddModalVisible(false)} style={styles.closeBtn}>
                     <MaterialIcons name="close" size={24} color={colors.text} />
                  </Pressable>
               </View>

               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('artisans.nameLabel')}</Text>
                  <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
                  
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('artisans.phoneLabel')}</Text>
                  <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} keyboardType="phone-pad" value={formData.phone} onChangeText={t => setFormData({...formData, phone: t})} />
                  
                  <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
                     <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('artisans.ageLabel')}</Text>
                        <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} keyboardType="numeric" value={formData.age} onChangeText={t => setFormData({...formData, age: t})} />
                     </View>
                     <View style={{ flex: 1 }}>
                        <InputField label={t('artisans.dailyWageLabel', 'LƯƠNG NGÀY (VNĐ)')} value={formData.dailyWage} onChangeText={(v: string) => setFormData({ ...formData, dailyWage: v })} placeholder="150,000" keyboardType="numeric" />
                     </View>
                  </View>

                  <InputField label={t('artisans.dailyTargetLabel', 'ĐỊNH MỨC (SP/NGÀY)')} value={formData.dailyTarget} onChangeText={(v: string) => setFormData({ ...formData, dailyTarget: v })} placeholder="10" keyboardType="numeric" />

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('artisans.skillsLabel', 'CHUYÊN MÔN (SKILLS)')}</Text>
                  <TextInput style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} value={formData.skills} onChangeText={t => setFormData({...formData, skills: t})} placeholder="Vd: Đan mây, Khung sắt..." />

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('common.image', { defaultValue: 'Ảnh (URL hoặc Assets)' })}</Text>
                  <TextInput 
                    style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} 
                    value={formData.image} 
                    onChangeText={t => setFormData({...formData, image: t})} 
                    placeholder="images/artisan1.jpg..."
                  />

                  <Pressable style={[styles.submitBtn, { backgroundColor: PALETTE.primary, marginTop: 20 }]} onPress={handleSaveWorker}>
                     <Text style={styles.submitBtnText}>{editingWorker ? t('common.complete') : t('common.confirm')}</Text>
                  </Pressable>
               </ScrollView>
            </View>
         </KeyboardAvoidingView>
      </Modal>
      {/* MODAL ỨNG LƯƠNG */}
      <Modal visible={isAdvanceModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: 40 }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('artisans.advanceTitle')}</Text>
              <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>{t('common.artisan')}: {selectedArtisan?.name}</Text>
              
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('artisans.advanceAmount')} ({i18n.language === 'vi' ? 'VND' : 'USD'})</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} 
                keyboardType="numeric" 
                value={advanceAmount} 
                onChangeText={setAdvanceAmount} 
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('artisans.note')}</Text>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.text }]} 
                value={advanceNote} 
                onChangeText={setAdvanceNote} 
                placeholder="..."
              />

              <View style={{ flexDirection: 'row', gap: 15, marginTop: 30 }}>
                <Pressable style={[styles.submitBtn, { flex: 1, backgroundColor: colors.surface }]} onPress={() => setIsAdvanceModalVisible(false)}>
                   <Text style={[styles.submitBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable style={[styles.submitBtn, { flex: 1, backgroundColor: PALETTE.primary }]} onPress={handleSaveAdvance}>
                   <Text style={styles.submitBtnText}>{t('common.confirm')}</Text>
                </Pressable>
              </View>
           </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 15 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontFamily: FONTS.bold },
  addSquareBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...SHADOWS.soft 
  },
  searchContainer: { paddingHorizontal: 24, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 56, borderRadius: 15 },
  searchInput: { flex: 1, marginLeft: 15, fontFamily: FONTS.medium, fontSize: 16 },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: { padding: 20, marginBottom: 20, borderRadius: 25 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  cardTitleBox: { flex: 1, marginLeft: 16 },
  workerName: { fontSize: 18, fontFamily: FONTS.bold },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  specialtyText: { fontSize: 12, fontFamily: FONTS.medium, opacity: 0.6, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  cardDivider: { height: 1.5, marginVertical: 18 },
  financeRow: { flexDirection: 'row', alignItems: 'center' },
  financeItem: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1.5, height: 35, marginHorizontal: 10 },
  financeLabel: { fontSize: 10, fontFamily: FONTS.bold, opacity: 0.5, marginBottom: 6 },
  salaryValue: { fontSize: 17, fontFamily: FONTS.bold },
  debtValue: { fontSize: 17, fontFamily: FONTS.bold },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontFamily: FONTS.bold, fontSize: 16 },
  emptySubText: { marginTop: 8, fontFamily: FONTS.medium, fontSize: 13, opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontFamily: FONTS.bold },
  closeBtn: { padding: 8 },
  inputLabel: { fontSize: 12, fontFamily: FONTS.bold, marginBottom: 8, marginTop: 15 },
  modalInput: { height: 54, borderRadius: 15, paddingHorizontal: 20, fontFamily: FONTS.medium },
  submitBtn: { height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.bold },
  attendanceBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, minWidth: 80, alignItems: 'center' },
  attendanceBtnText: { fontSize: 11, fontFamily: FONTS.bold },
});
