import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Platform, StyleSheet } from 'react-native';
import { FONTS, PALETTE } from '@/utils/theme';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/ThemeProvider';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const renderTabIcon = (name: any, color: string, focused: boolean) => (
    <View style={styles.iconContainer}>
      {focused && <View style={[styles.indicator, { backgroundColor: PALETTE.primary }]} />}
      <MaterialIcons name={name} size={26} color={color} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PALETTE.primary,
        tabBarInactiveTintColor: colors.textSecondary + '60',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          height: Platform.OS === 'ios' ? 94 : 74,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 14,
          paddingTop: 0,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          position: 'absolute',
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.bold,
          fontSize: 10,
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav.home') || 'Trang chủ',
          tabBarIcon: ({ color, focused }) => renderTabIcon("home", color, focused),
        }}
      />

      <Tabs.Screen
        name="quote-new-dummy"
        options={{
          title: t('nav.create_quote') || 'Tạo báo giá',
          tabBarIcon: ({ color, focused }) => renderTabIcon("add-shopping-cart", color, focused),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('quote-new');
          },
        })}
      />
      
      <Tabs.Screen
        name="plus"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={[styles.plusBtn, { backgroundColor: PALETTE.primary, borderColor: colors.surface, shadowColor: PALETTE.primary }]}>
              <MaterialIcons name="qr-code-scanner" size={32} color="#FFFFFF" />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('scan');
            },
          })}
      />

      <Tabs.Screen
        name="quotes"
        options={{
          title: t('nav.orders') || 'Đơn hàng',
          tabBarIcon: ({ color, focused }) => renderTabIcon("receipt-long", color, focused),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: t('nav.products') || 'Sản phẩm',
          tabBarIcon: ({ color, focused }) => renderTabIcon("inventory", color, focused),
        }}
      />

      {/* Ẩn các trang không cần hiện trên tab bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="modules" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="layout" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  plusBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -38,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 5,
  }
});
