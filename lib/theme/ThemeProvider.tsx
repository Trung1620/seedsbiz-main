// lib/theme/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '@/utils/theme';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof LIGHT_COLORS;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: ThemeType) => void;
  
  // Notification Logic
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const [savedTheme, savedNotif] = await Promise.all([
        AsyncStorage.getItem('user_theme'),
        AsyncStorage.getItem('user_notifications')
      ]);
      
      if (savedTheme) setThemeState(savedTheme as ThemeType);
      else if (systemColorScheme) setThemeState(systemColorScheme);

      if (savedNotif !== null) {
        setNotificationsEnabled(savedNotif === 'true');
      }
    };
    loadSettings();
  }, []);

  const setTheme = async (t: ThemeType) => {
    setThemeState(t);
    await AsyncStorage.setItem('user_theme', t);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    await AsyncStorage.setItem('user_notifications', String(newState));
  };

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ 
      theme, colors, isDark: theme === 'dark', toggleTheme, setTheme,
      notificationsEnabled, toggleNotifications
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
