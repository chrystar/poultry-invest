import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import FarmMediaViewer from '../../components/FarmMediaViewer';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useEquityCampaignMedia, type CampaignMedia } from '../../hooks/useEquityCampaignMedia';

export default function CampaignMediaScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { items, loading } = useEquityCampaignMedia(campaignId);
  const [activeItem, setActiveItem] = useState<CampaignMedia | null>(null);
  const { width } = useWindowDimensions();

  const columns = 2;
  const gap = spacing.sm;
  const tileSize = (width - spacing.lg * 2 - gap) / columns;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>INVESTOR UPDATES</Text>
          <Text style={styles.title}>Batch Media</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="image" size={24} color={colors.primary} />
          <Text style={styles.emptyText}>No updates posted yet. Check back once production begins.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap }}
          ItemSeparatorComponent={() => <View style={{ height: gap }} />}
          renderItem={({ item }) => (
            <Pressable style={[styles.tile, { width: tileSize, height: tileSize }]} onPress={() => setActiveItem(item)}>
              <Image source={{ uri: item.signedUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {item.media_type === 'video' && (
                <View style={styles.playBadge}>
                  <Feather name="play" size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          )}
        />
      )}

      <FarmMediaViewer
        item={activeItem ? { ...activeItem, public_url: activeItem.signedUrl ?? '' } as any : null}
        onClose={() => setActiveItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: 2 },
  title: { fontFamily: fonts.display, fontSize: 21, color: colors.text },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  tile: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface },
  playBadge: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.md },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});