// app/warranty.tsx
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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONTS, NEUMORPHISM, SHADOWS } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ScreenBackground";
import * as api from "@/utils/api";

export default function WarrantyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg } = useAuth();

  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<any>(null);
  const [formData, setFormData] = useState({
    issue: "",
    note: "",
    status: "PENDING",
    receivedDate: new Date().toISOString().split('T')[0],
    returnDate: "",
    customerId: "",
    productId: ""
  });

  const loadWarranties = async (showLoading = true) => {
    if (!activeOrg?.id) return;
    if (showLoading) setLoading(true);
    try {
      const data = await api.listWarranties(activeOrg.id);
      setWarranties(data.warranties || []);
    } catch (e) {
      console.error(e);
      setWarranties([]); 
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadWarranties(); }, [activeOrg?.id]);

  const handleSaveWarranty = async () => {
    if (!formData.issue) {
      Alert.alert(t('common.info'), t('warranty.issuePlaceholder'));
      return;
    }
    
    try {
      if (editingWarranty) {
        await api.updateWarranty(editingWarranty.id, formData);
        Alert.alert(t('common.success'), t('common.updateSuccess'));
      } else {
        await api.createWarranty(formData);
        Alert.alert(t('common.success'), t('warranty.alertSuccess'));
      }
      setIsModalVisible(false);
      resetForm();
      loadWarranties(false);
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('warranty.alertError'));
    }
  };

  const resetForm = () => {
    setEditingWarranty(null);
    setFormData({
      issue: "",
      note: "",
      status: "PENDING",
      receivedDate: new Date().toISOString().split('T')[0],
      returnDate: "",
      customerId: "",
      productId: ""
    });
  };

  const handleDeleteWarranty = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('common.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteWarranty(id);
              loadWarranties(false);
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#4CAF50';
      case 'PROCESSING': return '#2196F3';
      case 'CANCELLED': return '#F44336';
      default: return '#FF9800';
    }
  };

  const WarrantyCard = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}
      onPress={() => {
        setEditingWarranty(item);
        setFormData({
          issue: item.issue,
          note: item.note || "",
          status: item.status || "PENDING",
          receivedDate: item.receivedDate ? item.receivedDate.split('T')[0] : "",
          returnDate: item.returnDate ? item.returnDate.split('T')[0] : "",
          customerId: item.customerId || "",
          productId: item.productId || ""
        });
        setIsModalVisible(true);
      }}
    >
       <View style={styles.cardHeader}>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) + '15' }]}>
             <Text style={[styles.statusTagText, { color: getStatusColor(item.status) }]}>
               {t(`warranty.status${item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()}`)}
             </Text>
          </View>
          <Pressable onPress={() => handleDeleteWarranty(item.id)} style={{ padding: 4 }}>
            <MaterialIcons name="delete-outline" size={18} color="#FF5252" />
          </Pressable>
       </View>
       
       <View style={styles.mainInfo}>
          <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
             <MaterialIcons name="build" size={28} color={PALETTE.primary} />
          </View>
          <View style={styles.infoContent}>
             <Text style={[styles.issueText, { color: colors.text }]} numberOfLines={2}>{item.issue}</Text>
              <Text style={[styles.subInfo, { color: colors.textSecondary }]}>
                 {item.customer?.name || t('common.guest')} • {item.product?.nameVi || t('warranty.product')}
              </Text>
              <Text style={[styles.dateInfo, { color: colors.textSecondary }]}>
                 <Ionicons name="calendar-outline" size={12} /> {t('warranty.receivedDate')}: {item.receivedDate ? item.receivedDate.split('T')[0] : "---"}
              </Text>
           </View>
        </View>
    </Pressable>
  );

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('warranty.title')}</Text>
          <Pressable style={styles.addBtn} onPress={() => { resetForm(); setIsModalVisible(true); }}>
            <Ionicons name="add-circle" size={32} color={PALETTE.primary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={warranties}
            renderItem={WarrantyCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadWarranties(false)} tintColor={PALETTE.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-checkmark-outline" size={80} color={colors.textSecondary} opacity={0.15} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('warranty.noData')}</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>{t('warranty.addFirst')}</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
               <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {editingWarranty ? t('common.edit') : t('warranty.createTitle')}
                  </Text>
                  <Pressable onPress={() => setIsModalVisible(false)}>
                     <MaterialIcons name="close" size={24} color={colors.text} />
                  </Pressable>
               </View>

               <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('warranty.status')}</Text>
                  <View style={styles.chipRow}>
                     {['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map(s => (
                       <Pressable 
                         key={s} 
                         onPress={() => setFormData({...formData, status: s})}
                         style={[styles.chip, formData.status === s && { backgroundColor: getStatusColor(s), borderColor: getStatusColor(s) }]}
                       >
                          <Text style={[styles.chipText, formData.status === s && { color: '#FFFFFF' }]}>
                            {t(`warranty.status${s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}`)}
                          </Text>
                       </Pressable>
                     ))}
                  </View>

                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('warranty.issue')}</Text>
                   <TextInput 
                     style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text }]} 
                     placeholder={t('warranty.issuePlaceholder')} 
                     multiline
                     value={formData.issue} 
                     onChangeText={t => setFormData({...formData, issue: t})} 
                   />
                   
                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>{t('warranty.note')}</Text>
                   <TextInput 
                     style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text }]} 
                     placeholder={t('warranty.notePlaceholder')} 
                     multiline
                     value={formData.note} 
                     onChangeText={t => setFormData({...formData, note: t})} 
                   />

                   <View style={styles.row}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                         <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>{t('warranty.receivedDate')}</Text>
                         <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder="YYYY-MM-DD" value={formData.receivedDate} onChangeText={t => setFormData({...formData, receivedDate: t})} />
                      </View>
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>{t('warranty.returnDate')}</Text>
                         <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder="YYYY-MM-DD" value={formData.returnDate} onChangeText={t => setFormData({...formData, returnDate: t})} />
                      </View>
                   </View>

                  <Pressable style={[styles.submitBtn, { backgroundColor: PALETTE.primary, marginTop: 35 }]} onPress={handleSaveWarranty}>
                     <Text style={styles.submitBtnText}>{editingWarranty ? t('common.complete') : t('common.add')}</Text>
                  </Pressable>
               </ScrollView>
            </View>
         </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 15 },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold },
  backBtn: { padding: 8 },
  addBtn: { padding: 4 },
  listContent: { padding: 24, paddingBottom: 100 },
  card: { padding: 20, marginBottom: 20, borderRadius: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontFamily: FONTS.bold },
  mainInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoContent: { marginLeft: 16, flex: 1 },
  issueText: { fontSize: 16, fontFamily: FONTS.bold },
  subInfo: { fontSize: 13, fontFamily: FONTS.medium, marginTop: 2, opacity: 0.7 },
  dateInfo: { fontSize: 12, fontFamily: FONTS.medium, marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 22, fontFamily: FONTS.bold, fontSize: 16 },
  emptySubText: { marginTop: 8, fontFamily: FONTS.medium, fontSize: 13, opacity: 0.5, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontFamily: FONTS.bold },
  label: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0' },
  chipText: { fontSize: 12, fontFamily: FONTS.bold },
  input: { height: 56, borderRadius: 15, paddingHorizontal: 20, fontFamily: FONTS.medium, marginTop: 5 },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 15 },
  row: { flexDirection: 'row' },
  submitBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 35, marginBottom: 20, ...SHADOWS.soft },
  submitBtnText: { color: '#FFFFFF', fontSize: 18, fontFamily: FONTS.bold },
});
