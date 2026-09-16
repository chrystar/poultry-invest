import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useCapitalVentures } from '../hooks/useCapitalVentures';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function VenturesScreen() {
  const { ventures, loading } = useCapitalVentures();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>EXPANSION</Text>
        <Text style={styles.title}>Capital Ventures</Text>
        <Text style={styles.subtitle}>
          New initiatives raising capital to grow the business beyond current operations.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : ventures.length === 0 ? (
          <Text style={styles.emptyText}>No active ventures right now.</Text>
        ) : (
          ventures.map((venture) => {
            const progress = Math.min(venture.capital_raised / venture.target_capital, 1);
            return (
              <Pressable
                key={venture.id}
                style={[styles.card, shadow.card]}
                onPress={() => router.push(`/venture/${venture.id}`)}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle}>{venture.title}</Text>
                  <View style={[styles.statusPill, venture.status !== 'open' && styles.statusPillClosed]}>
                    <Text style={styles.statusText}>{venture.status === 'open' ? 'Open' : venture.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardSummary} numberOfLines={2}>{venture.summary}</Text>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressRaised}>{formatNaira(venture.capital_raised)} raised</Text>
                  <Text style={styles.progressTarget}>of {formatNaira(venture.target_capital)}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>View breakdown</Text>
                  <Feather name="arrow-right" size={14} color={colors.primary} />
                </View>
              </Pressable>
            );
          })
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
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { flex: 1, fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginRight: spacing.sm },
  statusPill: { backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillClosed: { backgroundColor: colors.border },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: colors.primary },
  cardSummary: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, marginBottom: spacing.md },
  progressTrack: { height: 6, backgroundColor: colors.primaryMuted, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  progressRaised: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: colors.text },
  progressTarget: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  cardFooterText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.primary },
});