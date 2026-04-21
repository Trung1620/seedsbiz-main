import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONTS, SIZES, NEUMORPHISM, TYPOGRAPHY, PALETTE } from "@/utils/theme";
import * as api from "@/utils/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập email của bạn.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${api.BASE_URL}/api/auth-forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        Alert.alert("Thành công", data.message, [
          { text: "OK", onPress: () => router.push("/auth-welcome") }
        ]);
      } else {
        Alert.alert("Lỗi", data.error || "Có lỗi xảy ra.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Pressable onPress={() => router.push("/auth-welcome")} style={styles.backBtn}>
            <Text style={styles.backText}>← Quay lại đăng nhập</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>KHÔI PHỤC</Text>
            <Text style={styles.subtitle}>MẬT KHẨU</Text>
            <View style={styles.accentLine} />
            <Text style={styles.desc}>
              Nhập email của bạn để nhận mã khôi phục tài khoản.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputGroup, NEUMORPHISM.cardInner]}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@example.com"
              />
            </View>

            <Pressable
              style={[styles.btn, NEUMORPHISM.button, loading && { opacity: 0.8 }]}
              onPress={handleResetRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={PALETTE.white} />
              ) : (
                <Text style={styles.btnText}>GỬI YÊU CẦU</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 20 },
  backBtn: { marginBottom: 30, paddingVertical: 10 },
  backText: { 
    color: PALETTE.primary, 
    fontFamily: FONTS.bold, 
    fontSize: 18 // Tăng kích thước chữ và mũi tên
  },
  header: { marginBottom: 40 },
  title: { fontSize: 40, fontFamily: FONTS.serif, color: PALETTE.primary },
  subtitle: { fontSize: 40, fontFamily: FONTS.serif, color: PALETTE.primary, marginTop: -10 },
  accentLine: { width: 40, height: 3, backgroundColor: PALETTE.primary, marginVertical: 20 },
  desc: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  form: { width: "100%" },
  inputGroup: {
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 20,
    marginBottom: 30,
  },
  label: { ...TYPOGRAPHY.label, fontSize: 10, color: PALETTE.primary, marginBottom: 8 },
  input: { fontSize: SIZES.medium, color: COLORS.text, fontFamily: FONTS.medium },
  btn: {
    backgroundColor: PALETTE.primary,
    borderRadius: SIZES.radius,
    height: 64,
    justifyContent: 'center',
    alignItems: "center",
  },
  btnText: { color: PALETTE.white, fontFamily: FONTS.bold, fontSize: SIZES.medium, letterSpacing: 1 },
});
