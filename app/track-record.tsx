import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useTrackRecord } from '../hooks/useTrackRecord';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
}

export default function TrackRecordScreen() {
  const { batches, loading } = useTrackRecord();

  const avgRoi = batches.length
    ? (batches.reduce((s, b) => s + b.roi_percent, 0) / batches.length).toFixed(1)
    : '—';
  const avgMortality = batches.length
    ? (batches.reduce((s, b) => s + b.mortality_rate, 0) / batches.length).toFixed(1)
    : '—';
  const totalBirds = batches.reduce((s, b) => s + b.birds_started, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>PROVEN PERFORMANCE</Text>
        <Text style={styles.title}>Track Record</Text>
        <Text style={styles.subtitle}>
          Historical production output and returns across completed batches.
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>{totalBirds.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Birds raised</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{avgRoi}%</Text>
            <Text style={styles.statLabel}>Avg. ROI</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>{avgMortality}%</Text>
            <Text style={styles.statLabel}>Avg. mortality</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Completed batches</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : batches.length === 0 ? (
          <Text style={styles.emptyText}>No completed batches recorded yet.</Text>
        ) : (
          batches.map((batch) => (
            <View key={batch.id} style={[styles.batchCard, shadow.card]}>
              <View style={styles.batchTopRow}>
                <Text style={styles.batchLabel}>{batch.batch_label}</Text>
                <Text style={styles.batchDate}>{formatDate(batch.cycle_completed_at)}</Text>
              </View>

              <View style={styles.batchStatsRow}>
              <Pressable
  key={batch.id}
  style={[styles.batchCard, shadow.card]}
  onPress={() => router.push(`/batch/${batch.id}`)}
>
  <View style={styles.batchTopRow}>
    <Text style={styles.batchLabel}>{batch.batch_label}</Text>
    <Text style={styles.batchDate}>{formatDate(batch.cycle_completed_at)}</Text>
  </View>

  <View style={styles.batchStatsRow}>
    <View style={styles.batchStat}>
      <Text style={styles.batchStatLabel}>Birds</Text>
      <Text style={styles.batchStatValue}>{batch.birds_sold}/{batch.birds_started}</Text>
    </View>
    <View style={styles.batchStat}>
      <Text style={styles.batchStatLabel}>Mortality</Text>
      <Text style={styles.batchStatValue}>{batch.mortality_rate}%</Text>
    </View>
    <View style={styles.batchStat}>
      <Text style={styles.batchStatLabel}>ROI</Text>
      <Text style={[styles.batchStatValue, { color: colors.gold }]}>{batch.roi_percent}%</Text>
    </View>
  </View>

  <View style={styles.viewMoreRow}>
    <Text style={styles.viewMoreText}>View full breakdown</Text>
    <Feather name="chevron-right" size={14} color={colors.primary} />
  </View>
</Pressable>
              </View>

              {batch.audit_report_url && (
                <Pressable
                  style={styles.reportRow}
                  onPress={() => Linking.openURL(batch.audit_report_url!)}
                >
                  <Feather name="file-text" size={13} color={colors.primary} />
                  <Text style={styles.reportText}>View audit report</Text>
                  <Feather name="external-link" size={12} color={colors.primary} />
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xl },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { fontFamily: fonts.display, fontSize: 19, color: colors.text, marginBottom: 4 },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.md },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  batchCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  batchTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  batchLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  batchDate: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  batchStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  batchStat: { alignItems: 'flex-start' },
  batchStatLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textFaint, marginBottom: 2 },
  batchStatValue: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  reportText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary },
  viewMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  viewMoreText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary },
});