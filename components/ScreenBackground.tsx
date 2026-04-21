// components/ScreenBackground.tsx
import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "@/lib/theme/ThemeProvider";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Thành phần nền chuẩn cho toàn bộ màn hình của Eco Decor.
 * Tự động chuyển đổi màu sắc theo Chế độ Sáng/Tối.
 */
const ScreenBackground: React.FC<Props> = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
};

export default ScreenBackground;
export { ScreenBackground };


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
