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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE, SHADOWS, COLORS, NEUMORPHISM } from '@/utils/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import * as api from '@/utils/api';
import ScreenBackground from '@/components/ScreenBackground';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function NewMaterialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const SUGGESTIONS = i18n.language.startsWith('vi') 
    ? ["Mây", "Tre", "Nứa", "Cói", "Xong", "Mành", "Ruột mây"] 
    : ["Rattan", "Bamboo", "Reed", "Sedge", "Wicker", "Blinds", "Rattan Core"];
    
  const UNITS = i18n.language.startsWith('vi')
    ? ["kg", "mét", "cây", "bó", "tấm"]
    : ["kg", "meter", "pcs", "bundle", "sheet"];

  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: 'kg',
    price: '',
    stock: '0',
    image: '',
    minStock: '0',
    supplierName: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.unit) {
      Alert.alert(t('common.error'), t('materials.errMissingInfo'));
      return;
    }

    try {
      setLoading(true);
      await api.createMaterial({
        ...form,
        price: parseFloat(form.price) || 0,
        stock: parseFloat(form.stock) || 0,
        minStock: parseFloat(form.minStock) || 0,
        supplierName: form.supplierName || undefined,
        location: form.location,
      });
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
              placeholder="VT-001"
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

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.image', 'Ảnh (URL hoặc Assets)')}</Text>
        <TextInput
          value={form.image}
          onChangeText={(v) => setForm(f => ({ ...f, image: v }))}
          placeholder="images/material_sample.jpg..."
          placeholderTextColor={colors.textSecondary + '70'}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>NGƯỠNG BÁO ĐỘNG</Text>
            <TextInput
              value={form.minStock}
              onChangeText={(v) => setForm(f => ({ ...f, minStock: v }))}
              keyboardType="numeric"
              placeholder="0"
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>VỊ TRÍ KHO</Text>
            <TextInput
              value={form.location}
              onChangeText={(v) => setForm(f => ({ ...f, location: v }))}
              placeholder="Kệ B2"
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>NHÀ CUNG CẤP</Text>
        <TextInput
          value={form.supplierName}
          onChangeText={(v) => setForm(f => ({ ...f, supplierName: v }))}
          placeholder="Tên nhà cung cấp hoặc cá nhân..."
          placeholderTextColor={colors.textSecondary + '70'}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>GIÁ NHẬP TRUNG BÌNH (VNĐ)</Text>
        <TextInput
          value={form.price}
          onChangeText={(v) => setForm(f => ({ ...f, price: v }))}
          placeholder="50000"
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
});
