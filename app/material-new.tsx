// app/material-new.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE, SHADOWS, COLORS, NEUMORPHISM } from '@/utils/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import * as api from '@/utils/api';
import ScreenBackground from '@/components/ScreenBackground';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function NewMaterialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const materialId = params.id as string;

  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const SUGGESTIONS = t('materials.suggestList', { returnObjects: true }) as string[] || [];
    
  const UNITS = t('materials.unitList', { returnObjects: true }) as string[] || [];

  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: 'kg',
    price: '',
    stock: '0',
    image: '',
    minStock: '0',
    supplierId: '',
    supplierName: '',
    location: '',
  });
  const [suppliers, setSuppliers] = useState<api.Supplier[]>([]);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    api.listSuppliers().then(res => {
      setSuppliers(Array.isArray(res) ? res : []);
    }).catch(console.error);
  }, []);

  // Fetch material for editing
  React.useEffect(() => {
    if (materialId) {
      api.getMaterial(materialId).then(res => {
        if (res) {
          setForm({
            name: res.name || '',
            sku: res.sku || '',
            unit: res.unit || 'kg',
            price: String(res.price || ''),
            stock: String(res.stock || '0'),
            image: res.image || '',
            minStock: String(res.minStock || '0'),
            supplierId: res.supplierId || '',
            supplierName: res.supplierName || '',
            location: res.location || '',
          });
        }
      });
    }
  }, [materialId]);

  const handleSave = async () => {
    if (!form.name || !form.unit) {
      Alert.alert(t('common.error'), t('materials.errMissingInfo'));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        stock: parseFloat(form.stock) || 0,
        minStock: parseFloat(form.minStock) || 0,
        supplierId: form.supplierId || undefined,
        supplierName: form.supplierName || undefined,
        location: form.location,
      };

      if (materialId) {
        await api.updateMaterial(materialId, payload);
        Alert.alert(t('common.success'), t('common.updateSuccess'));
      } else {
        await api.createMaterial(payload);
        Alert.alert(t('common.success'), t('materials.addSuccess', { defaultValue: 'Thêm nguyên liệu thành công' }));
      }
      router.back();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('materials.errCreate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('materials.newTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.nameLabel')}</Text>
        <TextInput
          value={form.name}
          onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
          placeholder={t('materials.namePlaceholder')}
          placeholderTextColor={colors.textSecondary + '70'}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.quickSuggestions')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionRow}>
          {SUGGESTIONS.map(s => (
            <Pressable 
              key={s} 
              style={[styles.suggestBtn, { backgroundColor: colors.surface }]}
              onPress={() => setForm(f => ({ ...f, name: s }))}
            >
              <Text style={[styles.suggestText, { color: colors.text }]}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.skuLabel')}</Text>
            <TextInput
              value={form.sku}
              onChangeText={(v) => setForm(f => ({ ...f, sku: v }))}
              placeholder={t('materials.placeholderSku')}
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            />
          </View>
          <View style={{ width: 120, marginLeft: 15 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.unitLabel')}</Text>
            <View style={[styles.unitPicker, { backgroundColor: colors.surface }]}>
               {UNITS.includes(form.unit) ? (
                 <Text style={{ color: colors.text }}>{form.unit}</Text>
               ) : (
                 <TextInput 
                   value={form.unit} 
                   onChangeText={v => setForm(f => ({ ...f, unit: v }))}
                   style={{ color: colors.text, padding: 0 }}
                 />
               )}
            </View>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.image')}</Text>
        <TextInput
          value={form.image}
          onChangeText={(v) => setForm(f => ({ ...f, image: v }))}
          placeholder="images/material_sample.jpg..."
          placeholderTextColor={colors.textSecondary + '70'}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.minStockLabel')}</Text>
            <TextInput
              value={form.minStock}
              onChangeText={(v) => setForm(f => ({ ...f, minStock: v }))}
              keyboardType="numeric"
              placeholder={t('materials.placeholderMinStock')}
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.locationLabel')}</Text>
            <TextInput
              value={form.location}
              onChangeText={(v) => setForm(f => ({ ...f, location: v }))}
              placeholder={t('materials.placeholderLocation')}
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.supplierLabel')}</Text>
        <Pressable 
          style={[styles.input, { backgroundColor: colors.surface, justifyContent: 'center' }]} 
          onPress={() => setShowSupplierPicker(true)}
        >
          <Text style={{ color: form.supplierName ? colors.text : colors.textSecondary + '70', fontSize: 16 }}>
            {form.supplierName || t('materials.placeholderSupplier', { defaultValue: 'Chọn nhà cung cấp...' })}
          </Text>
        </Pressable>

        <Modal visible={showSupplierPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('materials.supplierLabel')}</Text>
                <Pressable onPress={() => setShowSupplierPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView>
                <Pressable 
                  style={styles.supplierItem} 
                  onPress={() => {
                    setForm(f => ({ ...f, supplierId: '', supplierName: '' }));
                    setShowSupplierPicker(false);
                  }}
                >
                  <Text style={{ color: colors.text }}>-- Không chọn --</Text>
                </Pressable>
                {suppliers.map(s => (
                  <Pressable 
                    key={s.id} 
                    style={styles.supplierItem} 
                    onPress={() => {
                      setForm(f => ({ ...f, supplierId: s.id, supplierName: s.name }));
                      setShowSupplierPicker(false);
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: 'bold' }}>{s.name}</Text>
                    {s.phone && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{s.phone}</Text>}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('materials.costLabel')}</Text>
        <TextInput
          value={form.price}
          onChangeText={(v) => setForm(f => ({ ...f, price: v }))}
          placeholder={t('materials.placeholderCost')}
          keyboardType="numeric"
          placeholderTextColor={colors.textSecondary + '70'}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        />

        <Pressable 
          style={[styles.saveBtn, { backgroundColor: PALETTE.primary }, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>{t('materials.saveBtn')}</Text>}
        </Pressable>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 15, marginBottom: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: FONTS.bold, marginLeft: 15 },
  content: { paddingHorizontal: 24, paddingTop: 10 },
  label: { fontSize: 13, fontFamily: FONTS.bold, marginBottom: 8, marginTop: 20 },
  input: { height: 55, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.medium },
  suggestionRow: { flexDirection: 'row', marginTop: 5 },
  suggestBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 10, ...SHADOWS.soft },
  suggestText: { fontSize: 14, fontFamily: FONTS.medium },
  row: { flexDirection: 'row' },
  unitPicker: { height: 55, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 16 },
  saveBtn: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 40, ...SHADOWS.soft },
  saveText: { color: '#FFF', fontSize: 18, fontFamily: FONTS.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold },
  supplierItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
