import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import FarmMediaViewer from '../components/FarmMediaViewer';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useFarmMedia, type FarmMedia } from '../hooks/useFarmMedia';

export default function FarmMediaGalleryScreen() {
  const { items, loading } = useFarmMedia();
  const [activeItem, setActiveItem] = useState<FarmMedia | null>(null);
  const { width } = useWindowDimensions();

  const gap = spacing.sm;
  const columns = 2;
  const tileSize = (width - spacing.lg * 2 - gap * (columns - 1)) / columns;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>SEE IT FOR YOURSELF</Text>
          <Text style={styles.title}>Farm Operations</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="image" size={24} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No photos or videos yet</Text>
          <Text style={styles.emptyText}>Check back soon for updates from our farm operations.</Text>
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
              <Image source={{ uri: item.public_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              {item.media_type === 'video' && (
                <View style={styles.playBadge}>
                  <Feather name="play" size={14} color="#fff" />
                </View>
              )}
              {item.title ? (
                <View style={styles.tileCaption}>
                  <Text style={styles.tileCaptionText} numberOfLines={1}>{item.title}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <FarmMediaViewer item={activeItem} onClose={() => setActiveItem(null)} />
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
  playBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  tileCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 6 },
  tileCaptionText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: '#fff' },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});