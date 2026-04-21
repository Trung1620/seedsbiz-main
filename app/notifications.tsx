import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as api from '@/utils/api';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeOrg } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (isRefreshing = false) => {
    if (!activeOrg?.id) return;
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.listNotifications(activeOrg.id);
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e) {
      console.error("Load notifications error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllRead = async () => {
    if (!activeOrg?.id) return;
    try {
      await api.markAllNotificationsAsRead(activeOrg.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeOrg?.id]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        <Pressable onPress={markAllRead} style={styles.readAllBtn}>
          <MaterialIcons name="done-all" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.notifItem, item.isRead && { opacity: 0.7 }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.isRead ? 'rgba(0,0,0,0.05)' : 'rgba(47, 107, 63, 0.1)' }]}>
              <MaterialIcons 
                name={item.type === 'ORDER' ? 'shopping-bag' : item.type === 'INVENTORY' ? 'warning' : 'notifications'} 
                size={22} 
                color={item.isRead ? COLORS.textSecondary : COLORS.primary} 
              />
            </View>
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={[styles.notifTitle, item.isRead && { fontFamily: FONTS.medium }]}>{item.title}</Text>
                <Text style={styles.notifTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-off" size={60} color="rgba(47, 107, 63, 0.2)" />
              <Text style={styles.emptyText}>{t('notifications.noData')}</Text>
            </View>
          ) : <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', backgroundColor: COLORS.white },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  readAllBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.onSurface },
  list: { padding: 16 },
  notifItem: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, marginLeft: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.onSurface },
  notifTime: { fontSize: 11, color: COLORS.onSurfaceVariant, fontFamily: FONTS.regular },
  notifMsg: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18, fontFamily: FONTS.medium },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, marginLeft: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.onSurfaceVariant, fontFamily: FONTS.medium }
});
