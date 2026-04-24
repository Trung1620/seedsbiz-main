// app/production-progress.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONTS, NEUMORPHISM, SHADOWS } from "@/utils/theme";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTranslation } from "react-i18next";
import ScreenBackground from "@/components/ScreenBackground";
import { AppHeader } from "@/components/UI";
import * as api from "@/utils/api";

export default function ProductionProgressScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { activeOrg } = useAuth();

  const [progressList, setProgressList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reporting, setReporting] = useState(false);
  
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  const loadData = async (showLoading = true) => {
    if (!activeOrg?.id) return;
    if (showLoading) setLoading(true);
    try {
      const data = await api.listProductionProgress(jobId);
      setProgressList(data.progress || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [activeOrg?.id, jobId]));

  const handleReport = async () => {
    if (!jobId || !qty) {
      Alert.alert(t('common.info'), t('productionProgress.quantityDone'));
      return;
    }
    setReporting(true);
    try {
      await api.createProductionProgress({
        jobId,
        quantity: parseInt(qty),
        note
      });
      setQty("");
      setNote("");
      Alert.alert(t('common.success'), t('common.complete'));
      loadData(false);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setReporting(false);
    }
  };

  const ProgressCard = ({ item }: { item: any }) => (
    <View style={[styles.historyCard, { borderLeftColor: PALETTE.primary }]}>
       <View style={styles.historyHeader}>
          <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
             {new Date(item.createdAt).toLocaleString()}
          </Text>
          <Text style={[styles.historyQty, { color: PALETTE.primary }]}>+{item.quantity}</Text>
       </View>
       <Text style={[styles.historyJob, { color: colors.text }]}>
          {item.job?.artisan?.name} - {item.job?.product?.nameVi}
       </Text>
       {item.note && <Text style={[styles.historyNote, { color: colors.textSecondary }]}>{item.note}</Text>}
    </View>
  );

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader
          title={t('productionProgress.title')}
          onBack={() => router.back()}
        />

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {jobId && (
            <View style={[styles.reportBox, NEUMORPHISM.card, { backgroundColor: colors.surface }]}>
               <Text style={[styles.reportTitle, { color: colors.text }]}>{t('productionProgress.reportWork')}</Text>
               
               <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                     <Text style={[styles.label, { color: colors.textSecondary }]}>{t('productionProgress.quantityDone')}</Text>
                     <TextInput 
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        keyboardType="numeric"
                        placeholder="0"
                        value={qty}
                        onChangeText={setQty}
                     />
                  </View>
               </View>

               <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>{t('productionProgress.note')}</Text>
               <TextInput 
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="..."
                  value={note}
                  onChangeText={setNote}
               />

               <Pressable 
                 style={[styles.submitBtn, { backgroundColor: PALETTE.primary }]}
                 onPress={handleReport}
                 disabled={reporting}
               >
                  {reporting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{t('common.confirm')}</Text>}
               </Pressable>
            </View>
          )}

          <View style={styles.historySection}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('productionProgress.history')}</Text>
             {loading ? (
                <ActivityIndicator color={PALETTE.primary} style={{ marginTop: 30 }} />
             ) : (
                <FlatList
                  data={progressList}
                  renderItem={ProgressCard}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: colors.textSecondary }}>{t('productionProgress.noData')}</Text>}
                />
             )}
          </View>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  reportBox: { margin: 20, padding: 20, borderRadius: 20 },
  reportTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 20 },
  label: { fontSize: 10, fontFamily: FONTS.bold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 15, fontFamily: FONTS.medium },
  inputRow: { flexDirection: 'row', gap: 15 },
  submitBtn: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 25, ...SHADOWS.soft },
  submitBtnText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bold },
  historySection: { paddingHorizontal: 20, paddingBottom: 50 },
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 15 },
  historyCard: { padding: 15, backgroundColor: '#FFF', marginBottom: 15, borderRadius: 12, borderLeftWidth: 4, ...SHADOWS.soft },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  historyDate: { fontSize: 11, fontFamily: FONTS.medium },
  historyQty: { fontSize: 16, fontFamily: FONTS.bold },
  historyJob: { fontSize: 14, fontFamily: FONTS.bold },
  historyNote: { fontSize: 12, fontFamily: FONTS.medium, marginTop: 5, opacity: 0.8 },
});
