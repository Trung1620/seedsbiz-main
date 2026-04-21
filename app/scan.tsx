// app/scan.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Ensure npx expo install expo-camera
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PALETTE, FONTS, SHADOWS } from '@/utils/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  // Automatically request permission on mount
  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, []);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 40, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.errorIconBox}>
          <Ionicons name="camera-outline" size={80} color={PALETTE.primary} />
        </View>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          {t('scan.needPermission')}
        </Text>
        <Pressable 
          style={[styles.permissionBtn, { backgroundColor: PALETTE.primary }]} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>{t('scan.allowBtn')}</Text>
        </Pressable>
        <Pressable style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: colors.textSecondary, fontFamily: FONTS.medium }}>{t('common.later')}</Text>
        </Pressable>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || !data) return;
    setScanned(true);
    
    // Automatically redirect to products search with scanned data
    // This helps inventory check very fast
    router.replace(`/products?q=${encodeURIComponent(data)}` as any);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "code128"], // Supports QR and common barcodes
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          {/* Header Bar */}
          <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={26} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>{t('scan.title')}</Text>
            <Pressable style={styles.iconBtn} onPress={() => setTorch(!torch)}>
              <MaterialIcons name={torch ? "flash-on" : "flash-off"} size={26} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Viewfinder - Standard frame */}
          <View style={styles.centerArea}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Dynamic scan line effect */}
              <View style={styles.scannerLine} />
            </View>
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>{t('scan.hint')}</Text>
            </View>
          </View>

          {/* Footer Controls */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
             {scanned && (
               <Pressable style={styles.rescanBtn} onPress={() => setScanned(false)}>
                  <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
                  <Text style={styles.rescanText}>{t('common.tryAgain')}</Text>
               </Pressable>
             )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  iconBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#FFFFFF' },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewfinder: { width: width * 0.75, height: width * 0.75, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: PALETTE.primary, borderWidth: 5 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  scannerLine: { width: '100%', height: 3, backgroundColor: PALETTE.primary, opacity: 0.5 },
  hintBox: { marginTop: 40, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
  hintText: { color: '#FFFFFF', fontFamily: FONTS.medium, fontSize: 14 },
  footer: { alignItems: 'center' },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.primary, paddingHorizontal: 35, paddingVertical: 18, borderRadius: 30, gap: 12, ...SHADOWS.floating },
  rescanText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 18 },
  errorIconBox: { marginBottom: 20, opacity: 0.8 },
  permissionText: { textAlign: 'center', marginBottom: 35, fontSize: 16, fontFamily: FONTS.medium, lineHeight: 26 },
  permissionBtn: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 20, ...SHADOWS.soft },
  permissionBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 16 }
});
