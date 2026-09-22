import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type BatchWithCount = {
  id: string;
  label: string;
  start_date: string;
  investor_count: number;
};

function getStage(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  const elapsedDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (elapsedDays < 0) return { label: 'Not Started', color: '#B3691F', bg: '#FCEEE0' };
  if (elapsedDays >= 42) return { label: 'Completed', color: colors.primary, bg: colors.primaryMuted };
  return { label: 'Started', color: '#1F7A5C', bg: '#E3F3EC' };
}

export default function ProductionBatchesScreen() {
  const [batches, setBatches] = useState<BatchWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBatches = useCallback(async () => {
    const { data: batchRows } = await supabase.from('production_batches').select('*').order('start_date', { ascending: false });
    if (!batchRows) { setLoading(false); return; }

    const { data: interestRows } = await supabase.from('investment_interests').select('batch_id').not('batch_id', 'is', null);
    const countByBatch: Record<string, number> = {};
    (interestRows ?? []).forEach((r) => { countByBatch[r.batch_id] = (countByBatch[r.batch_id] ?? 0) + 1; });

    setBatches(batchRows.map((b) => ({ ...b, investor_count: countByBatch[b.id] ?? 0 })));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchBatches(); }, [fetchBatches]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBatches(); }} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Production Batches</Text>
        </View>

        <Text style={styles.subtitle}>
          Groups of investors whose livestock batch runs together. Create groups from Reservations by selecting rows and tapping "Group into batch."
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : batches.length === 0 ? (
          <Text style={styles.emptyText}>No batches created yet.</Text>
        ) : (
          batches.map((batch) => {
            const stage = getStage(batch.start_date);
            return (
              <Pressable
                key={batch.id}
                style={[styles.card, shadow.card]}
                onPress={() => router.push(`/admin/production-batch/${batch.id}`)}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardLabel}>{batch.label}</Text>
                  <View style={[styles.pill, { backgroundColor: stage.bg }]}>
                    <Text style={[styles.pillText, { color: stage.color }]}>{stage.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  Started {new Date(batch.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} · {batch.investor_count} investor{batch.investor_count !== 1 ? 's' : ''}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displayMedium, fontSize: 19, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, marginBottom: spacing.xl },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text },
  cardMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5 },
});