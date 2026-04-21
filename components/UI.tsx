// components/UI.tsx
// ============================================================
// THƯ VIỆN UI DÙNG CHUNG — Đồng bộ toàn bộ app
// Dựa trên design tokens từ utils/theme.ts
// ============================================================
import React from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, TextInputProps,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { FONTS, SIZES, SHADOWS, PALETTE, NEUMORPHISM } from "@/utils/theme";

// ── TYPES ──────────────────────────────────────────────────
type Children = { children: React.ReactNode; style?: ViewStyle };

// ────────────────────────────────────────────────────────────
// 1. APP HEADER — Tiêu đề + nút back + action
// ────────────────────────────────────────────────────────────
interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, onBack, rightAction }) => {
  const { colors } = useTheme();
  return (
    <View style={headerStyles.wrap}>
      {onBack ? (
        <Pressable onPress={onBack} style={[headerStyles.backBtn, { backgroundColor: colors.surface, ...SHADOWS.soft }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ) : <View style={{ width: 44 }} />}

      <View style={headerStyles.titleBox}>
        <Text style={[headerStyles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[headerStyles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>

      {rightAction ?? <View style={{ width: 44 }} />}
    </View>
  );
};

const headerStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  titleBox: { flex: 1, alignItems: "center" },
  title: { fontSize: 20, fontFamily: FONTS.bold, letterSpacing: 0.3 },
  subtitle: { fontSize: 12, fontFamily: FONTS.medium, marginTop: 2 },
});

// ────────────────────────────────────────────────────────────
// 2. FAB — Floating Action Button (nút thêm mới)
// ────────────────────────────────────────────────────────────
interface FABProps { onPress: () => void; icon?: string }
export const FAB: React.FC<FABProps> = ({ onPress, icon = "add" }) => (
  <Pressable
    onPress={onPress}
    style={[fabStyles.btn, { backgroundColor: PALETTE.primary, ...SHADOWS.floating }]}
  >
    <Ionicons name={icon as any} size={28} color="#FFF" />
  </Pressable>
);

const fabStyles = StyleSheet.create({
  btn: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
    position: "absolute", bottom: 30, right: 24,
  },
});

// ────────────────────────────────────────────────────────────
// 3. SEARCH BAR — Ô tìm kiếm chuẩn
// ────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}
export const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder = "Tìm kiếm..." }) => {
  const { colors } = useTheme();
  return (
    <View style={[searchStyles.wrap, NEUMORPHISM.input, { backgroundColor: colors.surface }]}>
      <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary + "80"}
        style={[searchStyles.input, { color: colors.text }]}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
};
const searchStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, height: 52,
    marginHorizontal: SIZES.padding, marginBottom: 12,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, fontFamily: FONTS.medium },
});

// ────────────────────────────────────────────────────────────
// 4. CARD — Thẻ nội dung chuẩn
// ────────────────────────────────────────────────────────────
export const Card: React.FC<Children & { mx?: number }> = ({ children, style, mx }) => {
  const { colors } = useTheme();
  return (
    <View style={[
      cardStyles.card,
      NEUMORPHISM.card,
      { backgroundColor: colors.surface },
      mx !== undefined && { marginHorizontal: mx },
      style,
    ]}>
      {children}
    </View>
  );
};
const cardStyles = StyleSheet.create({
  card: {
    padding: 18, marginBottom: 14,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
});

// ────────────────────────────────────────────────────────────
// 5. INPUT FIELD — Ô nhập liệu chuẩn
// ────────────────────────────────────────────────────────────
interface InputFieldProps extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
}
export const InputField: React.FC<InputFieldProps> = ({ label, containerStyle, ...rest }) => {
  const { colors } = useTheme();
  return (
    <View style={[inputStyles.wrap, containerStyle]}>
      <Text style={[inputStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary + "70"}
        style={[inputStyles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.outline + "80" }]}
        {...rest}
      />
    </View>
  );
};
const inputStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 1.1, marginBottom: 8, textTransform: "uppercase" },
  input: {
    height: 52, borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15, fontFamily: FONTS.medium,
    borderWidth: 1,
  },
});

// ────────────────────────────────────────────────────────────
// 6. PRIMARY BUTTON — Nút chính
// ────────────────────────────────────────────────────────────
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
  color?: string;
  disabled?: boolean;
}
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label, onPress, loading, style, color = PALETTE.primary, disabled
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={[
      btnStyles.btn,
      { backgroundColor: color, opacity: (disabled || loading) ? 0.65 : 1 },
      ...SHADOWS.soft ? [SHADOWS.soft as any] : [],
      style,
    ]}
  >
    {loading
      ? <ActivityIndicator color="#FFF" />
      : <Text style={btnStyles.label}>{label}</Text>
    }
  </Pressable>
);
const btnStyles = StyleSheet.create({
  btn: {
    height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    ...SHADOWS.soft,
  },
  label: { color: "#FFF", fontSize: 16, fontFamily: FONTS.bold, letterSpacing: 0.5 },
});

// ────────────────────────────────────────────────────────────
// 7. EMPTY STATE — Màn hình trống
// ────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon = "folder-open-outline", title, subtitle, action }) => {
  const { colors } = useTheme();
  return (
    <View style={emptyStyles.wrap}>
      <View style={[emptyStyles.iconBox, { backgroundColor: PALETTE.primary + "12" }]}>
        <Ionicons name={icon as any} size={48} color={PALETTE.primary + "80"} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[emptyStyles.sub, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      {action && (
        <Pressable onPress={action.onPress} style={[emptyStyles.actionBtn, { backgroundColor: PALETTE.primary }]}>
          <Text style={emptyStyles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
};
const emptyStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  iconBox: { width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: FONTS.medium, textAlign: "center", opacity: 0.7, paddingHorizontal: 40 },
  actionBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  actionText: { color: "#FFF", fontFamily: FONTS.bold, fontSize: 14 },
});

// ────────────────────────────────────────────────────────────
// 8. STATUS BADGE — Badge trạng thái màu
// ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE:     { bg: "#D1FAE5", text: "#065F46" },
  PENDING:    { bg: "#FEF3C7", text: "#92400E" },
  UNPAID:     { bg: "#FEE2E2", text: "#991B1B" },
  PARTIAL:    { bg: "#FEF9C3", text: "#713F12" },
  PAID_OFF:   { bg: "#D1FAE5", text: "#065F46" },
  PAID:       { bg: "#D1FAE5", text: "#065F46" },
  DELIVERED:  { bg: "#DBEAFE", text: "#1E40AF" },
  PICKED_UP:  { bg: "#EDE9FE", text: "#5B21B6" },
  CANCELLED:  { bg: "#F1F5F9", text: "#475569" },
  DRAFT:      { bg: "#F1F5F9", text: "#475569" },
  CONFIRMED:  { bg: "#D1FAE5", text: "#065F46" },
  DONE:       { bg: "#D1FAE5", text: "#065F46" },
  DELIVERING: { bg: "#DBEAFE", text: "#1E40AF" },
  RESIGNED:   { bg: "#FEE2E2", text: "#991B1B" },
  CUSTOMER:   { bg: "#DBEAFE", text: "#1565C0" },
  ARTISAN:    { bg: "#D1FAE5", text: "#2E7D32" },
  SUPPLIER:   { bg: "#FFF3E0", text: "#E65100" },
};

export const StatusBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const c = STATUS_COLORS[status?.toUpperCase()] || { bg: "#F1F5F9", text: "#475569" };
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: c.bg }]}>
      <Text style={[badgeStyles.text, { color: c.text }]}>{label || status}</Text>
    </View>
  );
};
const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: "flex-start" },
  text: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 0.5 },
});

// ────────────────────────────────────────────────────────────
// 9. ICON CIRCLE — Khung tròn chứa icon
// ────────────────────────────────────────────────────────────
interface IconCircleProps { icon: string; size?: number; color?: string; bg?: string }
export const IconCircle: React.FC<IconCircleProps> = ({
  icon, size = 22, color = PALETTE.primary, bg = PALETTE.primary + "15"
}) => (
  <View style={[iconCircleStyles.wrap, { backgroundColor: bg }]}>
    <Ionicons name={icon as any} size={size} color={color} />
  </View>
);
const iconCircleStyles = StyleSheet.create({
  wrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});

// ────────────────────────────────────────────────────────────
// 10. SECTION TITLE — Tiêu đề section
// ────────────────────────────────────────────────────────────
export const SectionTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => {
  const { colors } = useTheme();
  return (
    <View style={sectionStyles.wrap}>
      <Text style={[sectionStyles.text, { color: colors.text }]}>{title}</Text>
      {right}
    </View>
  );
};
const sectionStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SIZES.padding, marginBottom: 10, marginTop: 4 },
  text: { fontSize: 15, fontFamily: FONTS.bold },
});

// ────────────────────────────────────────────────────────────
// 11. BOTTOM MODAL WRAPPER
// ────────────────────────────────────────────────────────────
export const BottomSheetHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => {
  const { colors } = useTheme();
  return (
    <View style={bsStyles.header}>
      <View style={bsStyles.handle} />
      <Text style={[bsStyles.title, { color: colors.text }]}>{title}</Text>
      <Pressable onPress={onClose} style={bsStyles.closeBtn}>
        <Ionicons name="close" size={22} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
};
const bsStyles = StyleSheet.create({
  header: { paddingHorizontal: SIZES.padding, paddingTop: 10, paddingBottom: 15, alignItems: "center" },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.12)", marginBottom: 14 },
  title: { fontSize: 18, fontFamily: FONTS.bold },
  closeBtn: { position: "absolute", right: SIZES.padding, top: 18 },
});
