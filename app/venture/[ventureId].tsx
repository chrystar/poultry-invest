import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import type { CapitalVenture } from '../../hooks/useCapitalVentures';
import { supabase } from '../../lib/supabase';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function VentureDetailScreen() {
  const { ventureId } = useLocalSearchParams<{ ventureId: string }>();
  const { user } = useAuth();
  const [venture, setVenture] = useState<CapitalVenture | null>(null);
  const [loading, setLoading] = useState(true);
  const [expressing, setExpressing] = useState(false);

  useEffect(() => {
    if (!ventureId) return;
    const load = async () => {
      const { data } = await supabase.from('capital_ventures').select('*').eq('id', ventureId).single();
      setVenture(data as CapitalVenture);
      setLoading(false);
    };
    load();
  }, [ventureId]);

  const handleExpressInterest = async () => {
    if (!user) {
      Alert.alert('Please sign in', 'You need to be logged in to express interest.');
      return;
    }
    if (!venture) return;

    setExpressing(true);
    const { data, error } = await supabase
      .from('venture_interests')
      .insert({ user_id: user.id, venture_id: venture.id, amount: 0 })
      .select('reference_code')
      .single();
    setExpressing(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }

    router.push({
      pathname: '/reservation-confirmed',
      params: { code: data.reference_code, birds: venture.title, amount: '0' },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!venture) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ padding: spacing.lg, fontFamily: fonts.body, color: colors.textMuted }}>Venture not found.</Text>
      </SafeAreaView>
    );
  }

  const progress = Math.min(venture.capital_raised / venture.target_capital, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>CAPITAL VENTURE</Text>
        <Text style={styles.title}>{venture.title}</Text>
        <Text style={styles.summary}>{venture.summary}</Text>

        <View style={[styles.progressCard, shadow.raised]}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <View>
              <Text style={styles.progressLabel}>Raised so far</Text>
              <Text style={styles.progressValue}>{formatNaira(venture.capital_raised)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.progressLabel}>Target</Text>
              <Text style={styles.progressValue}>{formatNaira(venture.target_capital)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Capital breakdown</Text>
        <View style={[styles.capexCard, shadow.card]}>
          {venture.capex_breakdown.map((item, i) => (
            <View key={item.label}>
              <View style={styles.capexRow}>
                <Text style={styles.capexLabel}>{item.label}</Text>
                <Text style={styles.capexValue}>{formatNaira(item.amount)}</Text>
              </View>
              {i < venture.capex_breakdown.length - 1 && <View style={styles.hairline} />}
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <Feather name="info" size={16} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={styles.noticeText}>
            Expressing interest reserves your spot for this venture. Our team will contact you with
            full terms and documentation before any capital changes hands.
          </Text>
        </View>

        <PrimaryButton
          label="Express interest"
          onPress={handleExpressInterest}
          loading={expressing}
          disabled={venture.status !== 'open'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  summary: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xl },
  progressCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: spacing.md },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontFamily: fonts.body, fontSize: 11.5, color: '#BFD3C6', marginBottom: 2 },
  progressValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.md },
  capexCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  capexRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  capexLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, flex: 1, marginRight: spacing.sm },
  capexValue: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  hairline: { height: 1, backgroundColor: colors.border },
  noticeCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.primary },
});