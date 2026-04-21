// utils/theme.ts
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Bảng màu chuẩn Giftique - Modern Elegance Theme
export const PALETTE = {
  primary: '#E6AD2D',    // Vàng Gold - Màu thương hiệu chính
  accent: '#1D4ED8',     // Royal Blue - Điểm nhấn tương phản (nếu cần)
  charcoal: '#1A1A1A',   // Đen than (Text chính)
  sand: '#F7F3EE',       // Vàng cát nhạt - Màu nền chủ đạo (Beige)
  white: '#FFFFFF',
  black: '#0A0A0B',
  error: '#DC2626',
  cream: '#FFFDF9',
};

export const LIGHT_COLORS = {
  background: PALETTE.sand,
  surface: PALETTE.white,
  onSurface: PALETTE.charcoal,
  onSurfaceVariant: '#78716C',
  text: PALETTE.charcoal,
  textSecondary: '#78716C',
  primary: PALETTE.primary,
  accent: PALETTE.accent,
  outline: 'rgba(230, 173, 45, 0.15)', // Viền vàng nhạt
  card: PALETTE.white,
  error: PALETTE.error,
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
  cream: '#FFFDF9',
  primaryContainer: 'rgba(230, 173, 45, 0.1)',
};

export const DARK_COLORS = {
  background: '#0A0A0B',
  surface: '#171717',
  onSurface: '#F5F5F4',
  onSurfaceVariant: '#A8A29E',
  text: '#F5F5F4',
  textSecondary: '#A8A29E',
  primary: PALETTE.primary,
  accent: PALETTE.accent,
  outline: 'rgba(230, 173, 45, 0.2)',
  card: '#1C1917',
  error: PALETTE.error,
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
  cream: '#1C1917',
  primaryContainer: 'rgba(230, 173, 45, 0.15)',
};

// Shorthand
export const COLORS = LIGHT_COLORS;

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 20,
  extraLarge: 32,
  radius: 30,            // Bo góc siêu lớn 30px theo Giftique
  radiusLarge: 40,
  padding: 24,           // Padding rộng hơn để tạo khoảng trắng
  h1: 32, h2: 24, h3: 18,
  width, height,
};

export const FONTS = {
  // Sans-serif cho nội dung chính
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'HelveticaNeue-Medium' : 'sans-serif-medium',
  semiBold: Platform.OS === 'ios' ? 'ArialRoundedMTBold' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'ArialRoundedMTBold' : 'sans-serif-bold',
  
  // Serif cho tiêu đề sang trọng
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
  
  // Font monospaced cho mã SKU hoặc số liệu
  mono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
};

// Hệ thống Typography cân bằng
export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontFamily: FONTS.serif, fontWeight: '700' as any, lineHeight: 40 },
  h2: { fontSize: 24, fontFamily: FONTS.serif, fontWeight: '600' as any, lineHeight: 32 },
  h3: { fontSize: 18, fontFamily: FONTS.bold, fontWeight: '700' as any, lineHeight: 24 },
  body: { fontSize: 14, fontFamily: FONTS.regular, lineHeight: 20 },
  bodyMedium: { fontSize: 14, fontFamily: FONTS.medium, lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: FONTS.regular, lineHeight: 16, opacity: 0.7 },
  label: { fontSize: 11, fontFamily: FONTS.bold, textTransform: 'uppercase' as any, letterSpacing: 1.2 },
};

export const SHADOWS = {
  // Bóng đổ siêu mịn, nhẹ (Subtle Soft Shadows)
  soft: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  floating: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  }
};

export const NEUMORPHISM = {
  card: {
    borderRadius: SIZES.radius,
    backgroundColor: PALETTE.white,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: 'rgba(230, 173, 45, 0.05)', // Viền vàng cực mảnh
  },
  cardInner: {
    borderRadius: 20,
    backgroundColor: 'rgba(230, 173, 45, 0.02)',
    padding: 15,
  },
  button: {
    backgroundColor: PALETTE.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 16,
    ...SHADOWS.soft,
  },
  input: {
    backgroundColor: 'rgba(230, 173, 45, 0.03)', // Background hơi ám vàng nhẹ
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(230, 173, 45, 0.2)',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: PALETTE.cream,
  }
};

