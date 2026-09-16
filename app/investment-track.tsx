import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';

const tracks = [
  {
    id: 'fixed_term',
    title: 'Fixed-Term Livestock Investor',
    tagline: 'Principal + yield tied to a specific batch',
    risk: 'Lower risk',
    icon: 'feather' as const,
    points: [
      '30% profit-share dividend per batch',
      'Principal refunded after 6 production cycles',
      'Tied to livestock performance only',
    ],
    route: '/(tabs)/investment',
  },
  {
    id: 'equity',
    title: 'Equity Stakeholder',
    tagline: 'Perpetual ownership, recurring dividends',
    risk: 'Higher risk, higher upside',
    icon: 'pie-chart' as const,
    points: [
      'Direct equity ownership via shares',
      'Dividends from total net company profit',
      'Capital is non-refundable, perpetual',
    ],
    route: '/equity',
  },
];

export default function InvestmentTrackScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>GETTING STARTED</Text>
        <Text style={styles.title}>How would you like to invest?</Text>
        <Text style={styles.subtitle}>
          Choose the structure that fits your goals. You can hold both at once.
        </Text>

        {tracks.map((track) => (
          <Pressable
            key={track.id}
            style={[styles.card, shadow.raised]}
            onPress={() => router.push(track.route as any)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Feather name={track.icon} size={18} color="#fff" />
              </View>
              <View style={styles.riskPill}>
                <Text style={styles.riskText}>{track.risk}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{track.title}</Text>
            <Text style={styles.cardTagline}>{track.tagline}</Text>

            <View style={styles.pointsList}>
              {track.points.map((point) => (
                <View key={point} style={styles.pointRow}>
                  <Feather name="check" size={13} color={colors.primary} />
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>View details</Text>
              <Feather name="arrow-right" size={15} color={colors.primary} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  riskPill: { backgroundColor: colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  riskText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: colors.primary },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text, marginBottom: 4 },
  cardTagline: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.md },
  pointsList: { gap: 8, marginBottom: spacing.md },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.text, flex: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  cardFooterText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
});