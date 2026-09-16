import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import PackageCard from '../../components/PackageCard';
import TypeToggle from '../../components/TypeToggle';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useInvestments } from '../../hooks/useInvestments';

export default function InvestmentScreen() {
  const { types, packages, loading, error, refetch } = useInvestments();
  const [activeType, setActiveType] = useState<string | null>(null);

  const currentType = activeType ?? types[0]?.id;
  const type = types.find((t) => t.id === currentType);
  const filteredPackages = useMemo(
    () => packages.filter((p) => p.type_id === currentType),
    [packages, currentType]
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Feather name="alert-circle" size={22} color={colors.danger} style={{ marginBottom: spacing.sm }} />
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md }}>
          Couldn't load packages. Check your connection.
        </Text>
        <Pressable onPress={refetch}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary }}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>INVESTMENT</Text>
        <Text style={styles.title}>Choose what to invest in</Text>

        <Pressable onPress={() => router.push('/equity')} style={styles.equityLink}>
          <Text style={styles.equityLinkText}>Looking for Equity Stakeholder instead?</Text>
          <Feather name="arrow-right" size={13} color={colors.primary} />
        </Pressable>

        <TypeToggle
          options={types.map((t) => ({ id: t.id, label: t.title.split(' ')[0] }))}
          active={currentType}
          onChange={setActiveType}
        />

        {type && (
          <View style={[styles.summaryCard, shadow.raised]}>
            <View style={styles.summaryIconWrap}>
              <Feather name={(type.icon as any) ?? 'feather'} size={18} color="#fff" />
            </View>
            <Text style={styles.summaryTitle}>{type.title}</Text>
            <Text style={styles.summarySubtitle}>{type.subtitle}</Text>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryMetaRow}>
              <Feather name="clock" size={13} color="#BFD3C6" />
              <Text style={styles.summaryMetaText}>{type.duration_label}</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Available packages</Text>
          <Text style={styles.sectionCount}>{filteredPackages.length} options</Text>
        </View>

        <View style={{ marginTop: spacing.sm }}>
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              birds={pkg.birds}
              amount={pkg.amount}
              estimatedProfit={pkg.estimated_profit}
             // profitSharePercent={pkg.profit_share_percent}
              duration={pkg.duration}
              recommended={pkg.is_recommended}
              onPress={() => router.push(`/investment/${pkg.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  equityLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg },
  equityLinkText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary },
  summaryCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  summaryIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  summaryTitle: { fontFamily: fonts.display, fontSize: 19, color: '#fff', marginBottom: 4 },
  summarySubtitle: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: '#D8E3DC' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.md },
  summaryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryMetaText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#BFD3C6' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.xs },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.text },
  sectionCount: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
});