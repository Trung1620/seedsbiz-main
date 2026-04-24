// app/shipping.tsx
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
  Image,
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

const getVehicleOptions = (t: any) => [
  { label: t('shipping.vehicleMotorcycle'), value: "motorcycle", icon: "motorcycle" },
  { label: t('shipping.vehicleTruck'), value: "truck", icon: "local-shipping" },
  { label: t('shipping.vehicleOther'), value: "ship", icon: "directions-boat" },
];

const getCarrierOptions = (t: any) => [
  { label: t('shipping.carrierGhtk'), value: "ghtk" },
  { label: "Viettel Post", value: "viettel" },
  { label: "Shopee", value: "shopee" },
  { label: "Lazada", value: "lazada" },
  { label: t('shipping.carrierInternal'), value: "internal" },
];

export default function ShippingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg } = useAuth();

  const VEHICLE_OPTIONS = getVehicleOptions(t);
  const CARRIER_OPTIONS = getCarrierOptions(t);

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any>(null);
  const [formData, setFormData] = useState({
    number: "VN-" + Math.floor(10000 + Math.random() * 90000),
    carrier: t('shipping.carrierGhtk'),
    vehicleType: "motorcycle",
    carrierType: "ghtk",
    vehicleNumber: "",
    receiverName: "",
    receiverPhone: "",
    driverName: "",
    driverPhone: "",
    trackingNumber: "",
    shippingCost: "",
    note: "",
    status: "PENDING",
    image: ""
  });

  const loadDeliveries = async (showLoading = true) => {
    if (!activeOrg?.id) return;
    if (showLoading) setLoading(true);
    try {
      const res = await api.authedFetch(`/api/deliveries?orgId=${activeOrg.id}`);
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch (e) {
      console.error(e);
      setDeliveries([]); 
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDeliveries(); }, [activeOrg?.id]);

  const handleSaveDelivery = async () => {
    if (!formData.receiverName) {
      Alert.alert(t('common.info'), t('shipping.receiverPlaceholder'));
      return;
    }
    
    try {
      if (editingDelivery) {
        await api.updateDelivery(editingDelivery.id, formData);
        Alert.alert(t('common.success'), t('common.updateSuccess'));
      } else {
        await api.createDelivery(formData);
        Alert.alert(t('common.success'), `${t('shipping.alertSuccess')} #${formData.number}`);
      }
      setIsModalVisible(false);
      resetForm();
      loadDeliveries(false);
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('shipping.alertError'));
    }
  };

  const resetForm = () => {
    setEditingDelivery(null);
    setFormData({
      number: "VN-" + Math.floor(10000 + Math.random() * 90000),
      carrier: t('shipping.carrierGhtk'),
      vehicleType: "motorcycle",
      carrierType: "ghtk",
      vehicleNumber: "",
      receiverName: "",
      receiverPhone: "",
      driverName: "",
      driverPhone: "",
      trackingNumber: "",
      shippingCost: "",
      note: "",
      status: "PENDING",
      image: ""
    });
  };

  const handleDeleteDelivery = (id: string) => {
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
              await api.deleteDelivery(id);
              loadDeliveries(false);
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
      case 'DELIVERED': return '#4CAF50';
      case 'PICKED_UP': return '#2196F3';
      default: return '#FF9800';
    }
  };

  const DeliveryCard = ({ item }: { item: any }) => (
    <Pressable 
      style={[styles.card, NEUMORPHISM.card, { backgroundColor: colors.surface }]}
      onPress={() => {
        setEditingDelivery(item);
        setFormData({
          number: item.number,
          carrier: item.carrier,
          vehicleType: item.vehicleType,
          carrierType: item.carrierType,
          vehicleNumber: item.vehicleNumber || "",
          receiverName: item.receiverName,
          receiverPhone: item.receiverPhone || "",
          driverName: item.driverName || "",
          driverPhone: item.driverPhone || "",
          trackingNumber: item.trackingNumber || "",
          shippingCost: String(item.shippingCost || ""),
          note: item.note || "",
          status: item.status || "PENDING",
          image: item.image || ""
        });
        setIsModalVisible(true);
      }}
    >
       <View style={styles.cardHeader}>
          <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) + '15' }]}>
             <Text style={[styles.statusTagText, { color: getStatusColor(item.status) }]}>{item.status || "WAITING"}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.orderNumber, { color: colors.textSecondary }]}>#{item.number}</Text>
            <Pressable onPress={() => handleDeleteDelivery(item.id)} style={{ padding: 4 }}>
              <MaterialIcons name="delete-outline" size={18} color="#FF5252" />
            </Pressable>
          </View>
       </View>
       
       <View style={styles.mainInfo}>
          <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
             {(() => {
               const imgSource = api.getPublicFileUrl(item.image);
               if (imgSource) {
                 return <Image source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource} style={styles.cardImage} />;
               }
               return <MaterialIcons 
                  name={VEHICLE_OPTIONS.find(v => v.value === item.vehicleType)?.icon as any || "local-shipping"} 
                  size={28} 
                  color={PALETTE.primary} 
               />;
             })()}
          </View>
          <View style={styles.infoContent}>
             <Text style={[styles.receiverName, { color: colors.text }]}>{item.receiverName || t('common.guest')}</Text>
              <Text style={[styles.carrierInfo, { color: colors.textSecondary }]}>
                 {item.carrier} • {CARRIER_OPTIONS.find(c => c.value === item.carrierType)?.label}
              </Text>
              {item.driverName && (
                <Text style={[styles.driverInfo, { color: colors.textSecondary }]}>
                   <Ionicons name="person-outline" size={12} /> {item.driverName} {item.driverPhone ? `(${item.driverPhone})` : ''}
                </Text>
              )}
           </View>
           <View style={styles.priceInfo}>
               <Text style={[styles.costText, { color: PALETTE.primary }]}>
                  {new Intl.NumberFormat(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { 
                    style: 'currency', 
                    currency: i18n.language.startsWith('vi') ? 'VND' : 'USD',
                    maximumFractionDigits: i18n.language.startsWith('vi') ? 0 : 2
                  }).format(i18n.language.startsWith('vi') ? (item.shippingCost || 0) : (item.shippingCost || 0) / 25000)}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('shipping.title')}</Text>
          <Pressable 
            style={[styles.addSquareBtn, { backgroundColor: colors.primary }]} 
            onPress={() => { resetForm(); setIsModalVisible(true); }}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PALETTE.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={deliveries}
            renderItem={DeliveryCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDeliveries(false)} tintColor={PALETTE.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="paper-plane-outline" size={80} color={colors.textSecondary} opacity={0.15} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('shipping.noData')}</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>{t('shipping.addFirst')}</Text>
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
                    {editingDelivery ? t('common.edit') : t('shipping.createTitle')}
                  </Text>
                  <Pressable onPress={() => setIsModalVisible(false)}>
                     <MaterialIcons name="close" size={24} color={colors.text} />
                  </Pressable>
               </View>

               <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('shipping.vehicle')}</Text>
                  <View style={styles.optionRow}>
                     {VEHICLE_OPTIONS.map(v => (
                       <Pressable 
                         key={v.value} 
                         onPress={() => setFormData({...formData, vehicleType: v.value})}
                         style={[styles.optionCell, formData.vehicleType === v.value && { backgroundColor: PALETTE.primary + '15', borderColor: PALETTE.primary }]}
                       >
                          <MaterialIcons name={v.icon as any} size={22} color={formData.vehicleType === v.value ? PALETTE.primary : colors.textSecondary} />
                          <Text style={[styles.optionLabel, { color: formData.vehicleType === v.value ? PALETTE.primary : colors.textSecondary }]}>{v.label}</Text>
                       </Pressable>
                     ))}
                  </View>

                  <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('shipping.carrier')}</Text>
                  <View style={styles.chipRow}>
                     {CARRIER_OPTIONS.map(c => (
                       <Pressable 
                         key={c.value} 
                         onPress={() => setFormData({...formData, carrierType: c.value, carrier: c.label})}
                         style={[styles.chip, formData.carrierType === c.value && { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary }]}
                       >
                          <Text style={[styles.chipText, formData.carrierType === c.value && { color: '#FFFFFF' }]}>{c.label}</Text>
                       </Pressable>
                     ))}
                  </View>

                  <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('shipping.statusLabel')}</Text>
                  <View style={styles.chipRow}>
                     {['PENDING', 'PICKED_UP', 'DELIVERED'].map(s => (
                       <Pressable 
                         key={s} 
                         onPress={() => setFormData({...formData, status: s})}
                         style={[styles.chip, formData.status === s && { backgroundColor: getStatusColor(s), borderColor: getStatusColor(s) }]}
                       >
                          <Text style={[styles.chipText, formData.status === s && { color: '#FFFFFF' }]}>{t(`shipping.status${s.charAt(0) + s.slice(1).toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`)}</Text>
                       </Pressable>
                     ))}
                  </View>

                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('shipping.receiverName')}</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder={t('shipping.receiverPlaceholder')} value={formData.receiverName} onChangeText={t => setFormData({...formData, receiverName: t})} />
                   
                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>{t('shipping.receiverPhoneLabel')}</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder="09xx..." keyboardType="phone-pad" value={formData.receiverPhone} onChangeText={t => setFormData({...formData, receiverPhone: t})} />

                   <View style={{ height: 1.5, backgroundColor: colors.outline + '40', marginVertical: 25 }} />

                   <Text style={[styles.label, { color: colors.textSecondary }]}>{t('shipping.driverNameLabel')}</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder={t('common.name')} value={formData.driverName} onChangeText={t => setFormData({...formData, driverName: t})} />

                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>{t('shipping.driverPhoneLabel')}</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder={t('common.phone')} keyboardType="phone-pad" value={formData.driverPhone} onChangeText={t => setFormData({...formData, driverPhone: t})} />

                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>{t('shipping.vehiclePlateLabel')}</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder="51F-12345" value={formData.vehicleNumber} onChangeText={t => setFormData({...formData, vehicleNumber: t})} />
                   
                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('shipping.trackingLabel')}</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder="GHTK123456789" value={formData.trackingNumber} onChangeText={t => setFormData({...formData, trackingNumber: t})} />
                   
                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('shipping.shippingCostLabel')} ({t('common.currencySymbol').toUpperCase()})</Text>
                   <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} placeholder="e.g. 35000" keyboardType="numeric" value={formData.shippingCost} onChangeText={t => setFormData({...formData, shippingCost: t})} />
                  
                   <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>{t('common.image', { defaultValue: 'Ảnh minh chứng (URL hoặc Assets)' })}</Text>
                   <TextInput 
                     style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]} 
                     placeholder="images/delivery_proof.jpg..." 
                     value={formData.image} 
                     onChangeText={t => setFormData({...formData, image: t})} 
                   />

                  <Pressable style={[styles.submitBtn, { backgroundColor: PALETTE.primary, marginTop: 35 }]} onPress={handleSaveDelivery}>
                     <Text style={styles.submitBtnText}>{editingDelivery ? t('common.complete') : t('shipping.confirmBtn')}</Text>
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
  addSquareBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...SHADOWS.soft 
  },
  listContent: { padding: 24, paddingBottom: 100 },
  card: { padding: 20, marginBottom: 20, borderRadius: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontFamily: FONTS.bold },
  orderNumber: { fontSize: 12, fontFamily: FONTS.medium },
  mainInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  infoContent: { marginLeft: 16, flex: 1 },
  receiverName: { fontSize: 18, fontFamily: FONTS.bold },
  carrierInfo: { fontSize: 13, fontFamily: FONTS.medium, marginTop: 2, opacity: 0.7 },
  driverInfo: { fontSize: 12, fontFamily: FONTS.medium, marginTop: 4, color: PALETTE.primary },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 22, fontFamily: FONTS.bold, fontSize: 16 },
  emptySubText: { marginTop: 8, fontFamily: FONTS.medium, fontSize: 13, opacity: 0.5, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontFamily: FONTS.bold },
  label: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionCell: { flex: 1, padding: 15, borderRadius: 15, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center', gap: 5 },
  optionLabel: { fontSize: 11, fontFamily: FONTS.bold },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0' },
  chipText: { fontSize: 12, fontFamily: FONTS.bold },
  input: { height: 56, borderRadius: 15, paddingHorizontal: 20, fontFamily: FONTS.medium, marginTop: 5 },
  submitBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 35, marginBottom: 20, ...SHADOWS.soft },
  submitBtnText: { color: '#FFFFFF', fontSize: 18, fontFamily: FONTS.bold },
  priceInfo: { alignItems: 'flex-end' },
  costText: { fontSize: 16, fontFamily: FONTS.bold },
});
