import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import type { EquityCampaign } from '../../hooks/useEquityCampaigns';
import { supabase } from '../../lib/supabase';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function EquityCampaignDetailScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<EquityCampaign | null>(null);
  const [sharesSold, setSharesSold] = useState(0);
  const [investorCount, setInvestorCount] = useState(0);
  const [myShares, setMyShares] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shareInput, setShareInput] = useState('');
  const [reserving, setReserving] = useState(false);

  const load = async () => {
    const { data: c } = await supabase.from('equity_campaigns').select('*').eq('id', campaignId).single();
    setCampaign(c);
  
    const { data: progress } = await supabase.rpc('get_campaign_progress', { p_campaign_id: campaignId });
    if (progress && progress[0]) {
      setSharesSold(Number(progress[0].shares_sold));
      setInvestorCount(Number(progress[0].investor_count));
    }
  
    if (user) {
      const { data: myInterests } = await supabase
        .from('equity_interests')
        .select('shares_requested')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'active']);
      setMyShares((myInterests ?? []).reduce((s, r) => s + r.shares_requested, 0));
    }
  
    setLoading(false);
  };

  useEffect(() => { if (campaignId) load(); }, [campaignId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ padding: spacing.lg, fontFamily: fonts.body, color: colors.textMuted }}>Campaign not found.</Text>
      </SafeAreaView>
    );
  }

  const sharesRemaining = Math.max(0, campaign.total_shares - sharesSold);
  const percentFunded = campaign.total_shares > 0 ? Math.min(1, sharesSold / campaign.total_shares) : 0;
  const sharesNum = parseInt(shareInput, 10) || 0;
  const totalCost = sharesNum * campaign.price_per_share;

  // Projected profit for the shares being bought right now, using the current estimated net profit
  const projectedProfit = campaign.net_profit
    ? (campaign.net_profit * sharesNum) / campaign.total_shares
    : null;

  const handleReserve = async () => {
    if (!user) {
      Alert.alert('Please sign in', 'You need to be logged in to buy shares.');
      return;
    }
    if (sharesNum < campaign.min_shares) {
      Alert.alert('Minimum not met', `You need at least ${campaign.min_shares} shares.`);
      return;
    }
    if (sharesNum > sharesRemaining) {
      Alert.alert('Not enough shares left', `Only ${sharesRemaining} shares remain in this raise.`);
      return;
    }

    setReserving(true);
    const { data, error } = await supabase
      .from('equity_interests')
      .insert({ user_id: user.id, campaign_id: campaign.id, shares_requested: sharesNum, amount: totalCost })
      .select('reference_code')
      .single();
    setReserving(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }

    router.push({
      pathname: '/reservation-confirmed',
      params: { code: data.reference_code, birds: `${sharesNum} shares`, amount: String(totalCost) },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>EQUITY RAISE</Text>
        <Text style={styles.title}>{campaign.title}</Text>
        {!!campaign.description && <Text style={styles.description}>{campaign.description}</Text>}

        {/* Funding dashboard — visible to everyone */}
        <View style={[styles.dashboardCard, shadow.raised]}>
          <View style={styles.dashboardTopRow}>
            <View>
              <Text style={styles.dashboardValue}>{sharesSold.toLocaleString()}</Text>
              <Text style={styles.dashboardLabel}>shares sold</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.dashboardValue}>{investorCount}</Text>
              <Text style={styles.dashboardLabel}>investor{investorCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percentFunded * 100}%` }]} />
          </View>
          <Text style={styles.dashboardSubtext}>
            {sharesRemaining.toLocaleString()} of {campaign.total_shares.toLocaleString()} shares remaining
          </Text>
        </View>

        {myShares > 0 && (
          <View style={styles.myPositionCard}>
            <Feather name="check-circle" size={15} color={colors.primary} />
            <Text style={styles.myPositionText}>You own {myShares.toLocaleString()} shares in this raise.</Text>
          </View>
        )}

{campaign.status === 'active' && myShares > 0 && (
  <Pressable
    style={styles.mediaButton}
    onPress={() => router.push({ pathname: '/equity-campaign/media', params: { campaignId: campaign.id } })}
  >
    <Feather name="image" size={15} color="#fff" />
    <Text style={styles.mediaButtonText}>View batch updates & media</Text>
  </Pressable>
)}

        <View style={[styles.figuresCard, shadow.card]}>
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Price per share</Text>
            <Text style={styles.figureValue}>{formatNaira(campaign.price_per_share)}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Minimum shares</Text>
            <Text style={styles.figureValue}>{campaign.min_shares}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Target birds</Text>
            <Text style={styles.figureValue}>{campaign.target_birds.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Feather name="alert-triangle" size={15} color={colors.gold} style={{ marginTop: 2 }} />
          <Text style={styles.noticeText}>
            Your profit is calculated as (net profit × your shares ÷ total shares). Net profit is an
            estimate that can rise or fall based on actual results — it is not guaranteed.
          </Text>
        </View>

        {campaign.status === 'raising' && sharesRemaining > 0 && (
          <>
            <Text style={styles.sectionTitle}>How many shares?</Text>
            <TextInput
              value={shareInput}
              onChangeText={setShareInput}
              keyboardType="number-pad"
              placeholder={`Minimum ${campaign.min_shares}`}
              placeholderTextColor={colors.textFaint}
              style={styles.input}
            />

            {sharesNum > 0 && (
              <View style={[styles.totalCard, shadow.card]}>
                <View style={styles.figureRow}>
                  <Text style={styles.figureLabel}>Total cost</Text>
                  <Text style={styles.totalValue}>{formatNaira(totalCost)}</Text>
                </View>
                {projectedProfit != null && (
                  <View style={styles.figureRow}>
                    <Text style={styles.figureLabel}>Est. profit for these shares</Text>
                    <Text style={[styles.totalValue, { color: colors.gold }]}>{formatNaira(projectedProfit)}</Text>
                  </View>
                )}
              </View>
            )}

            <PrimaryButton label="Buy these shares" onPress={handleReserve} loading={reserving} />
          </>
        )}

        {campaign.status !== 'raising' && (
          <View style={styles.closedNotice}>
            <Feather name="lock" size={14} color={colors.textMuted} />
            <Text style={styles.closedNoticeText}>
              {campaign.status === 'active' ? 'This batch has started — no longer accepting new investors.' : 'This raise has been completed.'}
            </Text>
          </View>
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
  description: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xl },
  dashboardCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  dashboardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  dashboardValue: { fontFamily: fonts.display, fontSize: 26, color: '#fff' },
  dashboardLabel: { fontFamily: fonts.body, fontSize: 11.5, color: '#BFD3C6' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  dashboardSubtext: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#D8E3DC' },
  myPositionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryMuted, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.lg },
  myPositionText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.primary },
  figuresCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  figureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  figureLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  figureValue: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
  hairline: { height: 1, backgroundColor: colors.border },
  noticeCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FBF3E4', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.text },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  input: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, fontFamily: fonts.body, fontSize: 15, color: colors.text, backgroundColor: colors.surface, marginBottom: spacing.md },
  totalCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  totalValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  closedNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  closedNoticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  mediaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: spacing.md, marginBottom: spacing.lg },
mediaButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: '#fff' },
});