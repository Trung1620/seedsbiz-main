// app/job-sheet-new.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONTS, NEUMORPHISM, SHADOWS } from "@/utils/theme";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as api from "@/utils/api";
import ScreenBackground from "@/components/ScreenBackground";

export default function NewJobSheetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { activeOrg } = useAuth();

  const params = useLocalSearchParams();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [artisans, setArtisans] = useState<any[]>([]);

  // Form State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedArtisan, setSelectedArtisan] = useState<any>(null);
  const [quantity, setQuantity] = useState("10");
  const [unitPrice, setUnitPrice] = useState("50000");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");

  // Modals
  const [isProductModal, setIsProductModal] = useState(false);
  const [isWorkerModal, setIsWorkerModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeOrg?.id) return;
      try {
        setFetching(true);
        const [pData, aData] = await Promise.all([
          api.listProducts({ orgId: activeOrg.id }),
          api.listArtisans(activeOrg.id)
        ]);
        setProducts(pData || []);
        setArtisans(aData || []);

        if (jobId) {
          const job = await api.getJobSheet(jobId);
          if (job) {
            setSelectedProduct(job.product);
            setSelectedArtisan(job.artisan);
            setQuantity(String(job.quantity || 0));
            setUnitPrice(String(job.unitPrice || 0));
            setStartDate(job.startDate ? job.startDate.split('T')[0] : "");
            setEndDate(job.endDate ? job.endDate.split('T')[0] : "");
          }
        }
      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [activeOrg?.id, jobId]);

  const handleSave = async () => {
    if (!selectedProduct || !selectedArtisan) {
      Alert.alert(t('common.error'), t('production.errMissingProductWorker'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productId: selectedProduct.id,
        artisanId: selectedArtisan.id,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        startDate,
        endDate: endDate || null,
      };

      if (jobId) {
        await api.updateJobSheet(jobId, payload);
        Alert.alert(t('common.success'), t('common.updateSuccess'));
      } else {
        await api.createJobSheet(payload);
        Alert.alert(t('common.success'), t('production.successCreated'));
      }
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('common.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await api.exportJobSheets();
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu");
      
      const content = await res.text();
      const filename = `PhieuGiaCong_${new Date().toISOString().slice(0, 10)}.csv`;
      const fileUri = FileSystem.cacheDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Thành công", "Đã lưu file: " + filename);
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>
            {jobId ? t('common.edit') : t('jobSheet.addNew')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            {jobId && (
              <Pressable onPress={handleExport}>
                <Ionicons name="download-outline" size={24} color={PALETTE.primary} />
              </Pressable>
            )}
            <Pressable onPress={handleSave} disabled={loading || fetching}>
              {loading ? <ActivityIndicator size="small" color={PALETTE.primary} /> : <Text style={styles.saveBtn}>{t('common.saveChanges').toUpperCase()}</Text>}
            </Pressable>
          </View>
        </View>

        {fetching ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color={PALETTE.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ARTISAN SELECTION */}
          <Text style={styles.sectionTitle}>{t('jobSheet.artisan')}</Text>
          <Pressable
            style={[styles.selector, NEUMORPHISM.input, { backgroundColor: colors.surface }]}
            onPress={() => setIsWorkerModal(true)}
          >
            <Ionicons name="people-outline" size={20} color={PALETTE.primary} />
            <Text style={[styles.selectorText, { color: selectedArtisan ? colors.text : colors.textSecondary }]}>
              {selectedArtisan ? selectedArtisan.name : t('production.selectWorker')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* PRODUCT SELECTION */}
          <Text style={styles.sectionTitle}>{t('jobSheet.product')}</Text>
          <Pressable
            style={[styles.selector, NEUMORPHISM.input, { backgroundColor: colors.surface }]}
            onPress={() => setIsProductModal(true)}
          >
            <Ionicons name="cube-outline" size={20} color={PALETTE.primary} />
            <Text style={[styles.selectorText, { color: selectedProduct ? colors.text : colors.textSecondary }]}>
              {selectedProduct ? (selectedProduct.nameVi || selectedProduct.name) : t('production.selectProduct')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('jobSheet.quantity').toUpperCase()}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('jobSheet.unitPrice').toUpperCase()}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                keyboardType="numeric"
                value={unitPrice}
                onChangeText={setUnitPrice}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('jobSheet.startDate').toUpperCase()}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('jobSheet.endDate').toUpperCase()}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          <View style={[styles.costSummary, { backgroundColor: PALETTE.primary + '10' }]}>
            <Text style={styles.summaryTitle}>{t('production.laborTotal').toUpperCase()}</Text>
            <View style={[styles.summaryRow, { marginTop: 5 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 24, color: PALETTE.primary, fontFamily: FONTS.bold }]}>
                {(parseInt(quantity || '0') * parseFloat(unitPrice || '0')).toLocaleString()} {t('common.currencySymbol')}
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
        )}

        {/* MODALS */}
        <Modal visible={isProductModal} animationType="slide">
          <View style={[styles.modalBox, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('production.modalSelectProduct')}</Text>
              <Pressable onPress={() => setIsProductModal(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <FlatList
              data={products}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.listItem}
                  onPress={() => { setSelectedProduct(item); setIsProductModal(false); }}
                >
                  <Text style={{ fontSize: 16, color: colors.text }}>{item.nameVi}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.sku}</Text>
                </Pressable>
              )}
            />
          </View>
        </Modal>

        <Modal visible={isWorkerModal} animationType="slide">
          <View style={[styles.modalBox, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('production.modalSelectWorker')}</Text>
              <Pressable onPress={() => setIsWorkerModal(false)}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
            </View>
            <FlatList
              data={artisans}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.listItem}
                  onPress={() => { setSelectedArtisan(item); setIsWorkerModal(false); }}
                >
                  <Text style={{ fontSize: 16, color: colors.text }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.role}</Text>
                </Pressable>
              )}
            />
          </View>
        </Modal>

      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: FONTS.bold },
  saveBtn: { color: PALETTE.primary, fontFamily: FONTS.bold, fontSize: 16 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, marginTop: 25, marginBottom: 15 },
  selector: { height: 56, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 12 },
  selectorText: { flex: 1, fontSize: 15, fontFamily: FONTS.medium },
  label: { fontSize: 12, fontFamily: FONTS.bold, marginBottom: 8, marginTop: 15, opacity: 0.6 },
  input: { height: 54, borderRadius: 15, paddingHorizontal: 20, fontFamily: FONTS.medium },
  row: { flexDirection: 'row', gap: 15 },
  modalBox: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  listItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#EEE', flexDirection: 'column' },
  costSummary: { marginTop: 30, padding: 25, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.primary + '40', alignItems: 'center' },
  summaryTitle: { fontSize: 12, fontFamily: FONTS.bold, color: PALETTE.primary, marginBottom: 5, letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'center' },
  summaryLabel: { fontSize: 14, fontFamily: FONTS.medium },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
