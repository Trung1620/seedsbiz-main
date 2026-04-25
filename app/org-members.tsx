import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { FONTS, PALETTE, SHADOWS, COLORS } from '@/utils/theme';
import * as api from '@/utils/api';
import ScreenBackground from '@/components/ScreenBackground';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function OrgMembersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await api.listOrgMembers();
      setMembers(data);
    } catch (e: any) {
      Alert.alert(t("orgMembers.error"), e.message || t("orgMembers.loadFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleUpdateStatus = async (memberId: string, status: string, name: string) => {
    const actionText = status === "ACTIVE" ? t("orgMembers.approve") : t("orgMembers.block");
    const confirmKey = status === "ACTIVE" ? "orgMembers.approveConfirm" : "orgMembers.blockConfirm";
    
    Alert.alert(
      `${actionText}`,
      t(confirmKey, { name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: actionText,
          onPress: async () => {
            try {
              await api.updateOrgMember(memberId, { status });
              loadMembers();
            } catch (e: any) {
              Alert.alert(t("orgMembers.error"), e.message);
            }
          }
        }
      ]
    );
  };

  const handleRemove = async (memberId: string, name: string) => {
    Alert.alert(
      t("orgMembers.remove"),
      t("orgMembers.removeConfirm", { name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("orgMembers.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await api.removeOrgMember(memberId);
              loadMembers();
            } catch (e: any) {
              Alert.alert(t("orgMembers.error"), e.message);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.memberCard, { backgroundColor: colors.surface }]}>
      <View style={styles.memberInfo}>
        <View style={[styles.avatar, { backgroundColor: PALETTE.primary + '20' }]}>
          <Text style={styles.avatarText}>{item.user?.name?.charAt(0) || "U"}</Text>
        </View>
        <View style={styles.textDetails}>
          <Text style={[styles.memberName, { color: colors.text }]}>{item.user?.name}</Text>
          <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{item.user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: item.role === 'OWNER' ? PALETTE.accent : '#EEE' }]}>
               <Text style={[styles.badgeText, { color: item.role === 'OWNER' ? '#FFF' : '#666' }]}>{item.role}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: item.status === 'ACTIVE' ? '#4CAF50' : (item.status === 'PENDING' ? '#FF9800' : '#F44336') }]}>
               <Text style={[styles.badgeText, { color: '#FFF' }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      </View>

      {item.role !== 'OWNER' && (
        <View style={styles.actions}>
          {item.status === 'PENDING' && (
            <Pressable 
              style={[styles.actionIcon, { backgroundColor: '#4CAF5020' }]} 
              onPress={() => handleUpdateStatus(item.id, "ACTIVE", item.user?.name)}
            >
              <MaterialIcons name="check" size={20} color="#4CAF50" />
            </Pressable>
          )}
          {item.status === 'ACTIVE' && (
            <Pressable 
              style={[styles.actionIcon, { backgroundColor: '#F4433620' }]} 
              onPress={() => handleUpdateStatus(item.id, "BLOCKED", item.user?.name)}
            >
              <MaterialIcons name="block" size={20} color="#F44336" />
            </Pressable>
          )}
          {item.status === 'BLOCKED' && (
            <Pressable 
              style={[styles.actionIcon, { backgroundColor: '#4CAF5020' }]} 
              onPress={() => handleUpdateStatus(item.id, "ACTIVE", item.user?.name)}
            >
              <MaterialIcons name="undo" size={20} color="#4CAF50" />
            </Pressable>
          )}
          <Pressable 
            style={[styles.actionIcon, { backgroundColor: '#EEE' }]} 
            onPress={() => handleRemove(item.id, item.user?.name)}
          >
            <MaterialIcons name="delete-outline" size={20} color="#666" />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <ScreenBackground style={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t("orgMembers.title")}</Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMembers(); }} />}
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color={PALETTE.primary} style={{ marginTop: 50 }} /> : (
            <View style={styles.emptyContainer}>
               <Ionicons name="people-outline" size={60} color="#CCC" />
               <Text style={styles.emptyText}>{t("orgMembers.empty")}</Text>
            </View>
          )
        }
      />
    </ScreenBackground>
  );
}


const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, ...SHADOWS.soft },
  title: { fontSize: 20, fontFamily: FONTS.bold, marginLeft: 15 },
  list: { padding: 20, paddingBottom: 100 },
  memberCard: { flexDirection: 'row', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.soft },
  memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontFamily: FONTS.bold, color: PALETTE.primary },
  textDetails: { flex: 1 },
  memberName: { fontSize: 16, fontFamily: FONTS.bold },
  memberEmail: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontFamily: FONTS.bold, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 10 },
  actionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontFamily: FONTS.medium },
});
