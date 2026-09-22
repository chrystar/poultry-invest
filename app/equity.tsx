import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useEquityCampaigns } from '../hooks/useEquityCampaigns';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function EquityCampaignsScreen() {
  const { campaigns, progressById, loading } = useEquityCampaigns();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>EQUITY STAKEHOLDER</Text>
        <Text style={styles.title}>Current raises</Text>
        <Text style={styles.subtitle}>Buy shares in a specific batch and earn a share of its net profit.</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : campaigns.length === 0 ? (
          <Text style={styles.emptyText}>No equity raises open right now.</Text>
        ) : (
          campaigns.map((c) => {
            const p = progressById[c.id] ?? { sharesSold: 0, sharesRemaining: c.total_shares, percentFunded: 0, investorCount: 0 };
            return (
              <Pressable key={c.id} style={[styles.card, shadow.card]} onPress={() => router.push(`/equity-campaign/${c.id}`)}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <View style={[styles.statusPill, c.status !== 'raising' && styles.statusPillDone]}>
                    <Text style={styles.statusText}>{c.status === 'raising' ? 'Raising' : c.status === 'active' ? 'Active' : 'Completed'}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{c.target_birds.toLocaleString()} birds · {formatNaira(c.price_per_share)}/share</Text>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${p.percentFunded * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {p.sharesSold.toLocaleString()} / {c.total_shares.toLocaleString()} shares · {p.investorCount} investor{p.investorCount !== 1 ? 's' : ''}
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
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xl },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { flex: 1, fontFamily: fonts.displayMedium, fontSize: 16, color: colors.text, marginRight: spacing.sm },
  statusPill: { backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillDone: { backgroundColor: '#E3F3EC' },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: colors.primary },
  cardMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.md },
  progressTrack: { height: 6, backgroundColor: colors.primaryMuted, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
});