import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

type InvestorRow = {
  interestId: string;
  userId: string;
  reference_code: string;
  status: string;
  shares_requested: number;
  amount: number;
  full_name: string;
  phone: string;
  email: string;
};

export default function EquityInvestorsScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<{ title: string; total_shares: number; price_per_share: number } | null>(null);
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactTarget, setContactTarget] = useState<InvestorRow | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) return;
    const { data: campaignData } = await supabase
      .from('equity_campaigns')
      .select('title, total_shares, price_per_share')
      .eq('id', campaignId)
      .single();
    setCampaign(campaignData);

    const { data: interests } = await supabase
      .from('equity_interests')
      .select('id, reference_code, status, shares_requested, amount, user_id')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (interests && interests.length > 0) {
      const userIds = Array.from(new Set(interests.map((i) => i.user_id)));
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone, email').in('id', userIds);
      const profilesById: Record<string, any> = {};
      (profiles ?? []).forEach((p) => { profilesById[p.id] = p; });

      setInvestors(
        interests.map((i) => ({
          interestId: i.id,
          userId: i.user_id,
          reference_code: i.reference_code,
          status: i.status,
          shares_requested: i.shares_requested,
          amount: i.amount,
          full_name: profilesById[i.user_id]?.full_name ?? 'Unknown',
          phone: profilesById[i.user_id]?.phone ?? '',
          email: profilesById[i.user_id]?.email ?? '',
        }))
      );
    } else {
      setInvestors([]);
    }
    setLoading(false);
  }, [campaignId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmed = investors.filter((i) => i.status === 'confirmed' || i.status === 'active');
  const pending = investors.filter((i) => i.status === 'pending');
  const rejected = investors.filter((i) => i.status === 'rejected');
  const sharesSold = confirmed.reduce((sum, i) => sum + i.shares_requested, 0);
  const totalRaised = confirmed.reduce((sum, i) => sum + i.amount, 0);

  const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: colors.gold, bg: '#FBF3E4' },
    confirmed: { label: 'Confirmed', color: colors.primary, bg: colors.primaryMuted },
    active: { label: 'Active', color: colors.primary, bg: colors.primaryMuted },
    rejected: { label: 'Rejected', color: colors.danger, bg: '#FBEAE5' },
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{campaign?.title ?? 'Investors'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>{confirmed.length}</Text>
            <Text style={styles.statLabel}>Investors</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>{sharesSold.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Shares sold</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Text style={styles.statValue}>{formatNaira(totalRaised)}</Text>
            <Text style={styles.statLabel}>Raised</Text>
          </View>
        </View>

        {pending.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PENDING ({pending.length})</Text>
            {pending.map((inv) => (
              <InvestorRowCard key={inv.interestId} inv={inv} statusMeta={statusMeta} onPress={() => setContactTarget(inv)} />
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}>CONFIRMED ({confirmed.length})</Text>
        {confirmed.length === 0 ? (
          <Text style={styles.emptyText}>No confirmed investors yet.</Text>
        ) : (
          confirmed.map((inv) => (
            <InvestorRowCard key={inv.interestId} inv={inv} statusMeta={statusMeta} onPress={() => setContactTarget(inv)} />
          ))
        )}

        {rejected.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>REJECTED ({rejected.length})</Text>
            {rejected.map((inv) => (
              <InvestorRowCard key={inv.interestId} inv={inv} statusMeta={statusMeta} onPress={() => setContactTarget(inv)} />
            ))}
          </>
        )}
      </ScrollView>

      {contactTarget && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setContactTarget(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{contactTarget.full_name}</Text>
            <Text style={styles.sheetSubtitle}>
              {contactTarget.shares_requested} shares · {formatNaira(contactTarget.amount)} · Ref: {contactTarget.reference_code}
            </Text>
            <Text style={styles.sheetSubtitle}>{contactTarget.phone || 'No phone'} · {contactTarget.email || 'No email'}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable
                style={[styles.contactBtn, { backgroundColor: colors.primary }]}
                onPress={() => contactTarget.phone && Linking.openURL(`tel:${contactTarget.phone.replace(/\s/g, '')}`)}
              >
                <Text style={styles.contactBtnTextLight}>Call</Text>
              </Pressable>
              <Pressable
                style={[styles.contactBtn, { borderWidth: 1, borderColor: colors.primary }]}
                onPress={() => contactTarget.email && Linking.openURL(`mailto:${contactTarget.email}`)}
              >
                <Text style={styles.contactBtnTextDark}>Email</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function InvestorRowCard({ inv, statusMeta, onPress }: { inv: InvestorRow; statusMeta: any; onPress: () => void }) {
  const meta = statusMeta[inv.status] ?? statusMeta.pending;
  return (
    <Pressable style={[styles.row, shadow.card]} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{inv.full_name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{inv.full_name}</Text>
        <Text style={styles.rowMeta}>{inv.shares_requested} shares · {formatNaira(inv.amount)}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: meta.bg }]}>
        <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { fontFamily: fonts.display, fontSize: 17, color: colors.text, marginBottom: 4 },
  statLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, textAlign: 'center' },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textFaint, marginBottom: spacing.sm, marginTop: spacing.md },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 14, color: colors.primary },
  rowName: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: 2 },
  rowMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5 },
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: 4 },
  sheetSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, marginBottom: 2 },
  contactBtn: { flex: 1, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  contactBtnTextLight: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: '#fff' },
  contactBtnTextDark: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.primary },
});