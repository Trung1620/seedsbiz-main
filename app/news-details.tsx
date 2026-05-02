// app/news-details.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, PALETTE, SHADOWS } from '@/utils/theme';
import { NEWS_DATA } from '@/constants/newsData';
import ScreenBackground from '@/components/ScreenBackground';

export default function NewsDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const news = NEWS_DATA.find(n => n.id === id);

  if (!news) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy bài viết.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: PALETTE.primary }}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenBackground>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Tin tức mây tre</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image 
          source={typeof news.image === 'string' ? { uri: news.image } : news.image} 
          style={styles.mainImage} 
        />
        
        <View style={styles.contentCard}>
          <Text style={styles.date}>{news.date}</Text>
          <Text style={styles.title}>{news.titleVi}</Text>
          <View style={styles.divider} />
          
          <Text style={styles.bodyText}>
             {news.content || news.summaryVi}
          </Text>

          {/* HIỂN THỊ THÊM ẢNH CHI TIẾT */}
          {news.moreImages && news.moreImages.map((img: any, index: number) => (
            <Image 
              key={index} 
              source={typeof img === 'string' ? { uri: img } : img} 
              style={[styles.additionalImage, { marginTop: 20 }]} 
            />
          ))}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, gap: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  scrollContent: { paddingBottom: 100 },
  mainImage: { width: '100%', height: 250, resizeMode: 'cover' },
  additionalImage: { width: '100%', height: 220, borderRadius: 20, resizeMode: 'cover' },
  contentCard: { flex: 1, backgroundColor: '#FFF', marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  date: { fontSize: 13, fontFamily: FONTS.bold, color: PALETTE.primary, marginBottom: 10 },
  title: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text, lineHeight: 32, marginBottom: 20 },
  divider: { height: 1, backgroundColor: COLORS.outline + '40', marginBottom: 20 },
  subTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text, marginTop: 25, marginBottom: 10 },
  bodyText: { fontSize: 16, fontFamily: FONTS.medium, color: COLORS.textSecondary, lineHeight: 26 },
  detailBlock: { marginTop: 10 }
});
