import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useTrackRecord } from '../../hooks/useTrackRecord';

export default function AdminBatchesScreen() {
  const { batches, loading, refetch } = useTrackRecord();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/admin/batch-form')} style={styles.addBtn}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>MANAGE</Text>
        <Text style={styles.title}>Batch Performance</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          batches.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.card, shadow.card]}
              onPress={() => router.push({ pathname: '/admin/batch-form', params: { batchId: b.id } })}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{b.batch_label}</Text>
                <Feather name="edit-2" size={14} color={colors.textFaint} />
              </View>
              <Text style={styles.cardMeta}>
                {b.birds_sold}/{b.birds_started} birds · {b.roi_percent}% ROI · {new Date(b.cycle_completed_at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  cardMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
});