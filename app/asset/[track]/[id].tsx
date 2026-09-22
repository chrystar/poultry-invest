import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, radius, shadow, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending documentation', color: colors.gold, bg: '#FBF3E4' },
  confirmed: { label: 'Confirmed', color: colors.primary, bg: colors.primaryMuted },
  active: { label: 'Active', color: colors.primary, bg: colors.primaryMuted },
  rejected: { label: 'Rejected', color: colors.danger, bg: '#FBEAE5' },
};

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getStageLabel(week: number) {
  const stages: Record<number, string> = {
    1: 'Chicks arrive & settle in',
    2: 'Early growth phase',
    3: 'Rapid growth phase',
    4: 'Feathering & development',
    5: 'Final growth stretch',
    6: 'Ready for sale',
  };
  return stages[week] ?? '';
}

export default function AssetDetailScreen() {
  const { track, id } = useLocalSearchParams<{ track: string; id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!track || !id) return;

    const load = async () => {
      if (track === 'livestock') {
        const { data: interest } = await supabase.from('investment_interests').select('*').eq('id', id).single();
        if (interest) {
          const { data: pkg } = await supabase.from('investment_packages').select('*').eq('id', interest.package_id).single();
          const { data: type } = pkg ? await supabase.from('investment_types').select('*').eq('id', pkg.type_id).single() : { data: null };
          setData({ interest, pkg, type });
        }
      } else if (track === 'equity') {
        const { data: interest } = await supabase.from('equity_interests').select('*').eq('id', id).single();
        if (interest) {
          const { data: equitycampaign } = await supabase.from('equity_campaigns').select('*').eq('id', interest.campaign_id).single();
          setData({ interest, equitycampaign });
        }
      } else if (track === 'venture') {
        const { data: interest } = await supabase.from('venture_interests').select('*').eq('id', id).single();
        if (interest) {
          const { data: venture } = await supabase.from('capital_ventures').select('*').eq('id', interest.venture_id).single();
          setData({ interest, venture });
        }
      }
      setLoading(false);
    };
    load();
  }, [track, id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ padding: spacing.lg, fontFamily: fonts.body, color: colors.textMuted }}>Investment not found.</Text>
      </SafeAreaView>
    );
  }

  const { interest } = data;
  const status = statusMeta[interest.status] ?? statusMeta.pending;

  // Livestock figures: always prefer the locked-in snapshot from reservation time.
  // Falls back to the live package only for old rows created before snapshots existed.
  const displayBirds = track === 'livestock' ? interest.snapshot_birds ?? data.pkg?.birds : null;
  const displayAmount = track === 'livestock' ? interest.snapshot_amount ?? data.pkg?.amount ?? 0 : interest.amount;
  const displayDuration = track === 'livestock' ? interest.snapshot_duration ?? data.pkg?.duration : null;
  const displayEstimatedProfit = track === 'livestock' ? interest.snapshot_estimated_profit ?? data.pkg?.estimated_profit : null;
  const displayProfitShare = track === 'livestock' ? interest.snapshot_profit_share_percent ?? data.pkg?.profit_share_percent : null;
  const displayTypeTitle = track === 'livestock' ? interest.snapshot_type_title ?? data.type?.title ?? 'Livestock' : null;

  let batchInfo: {
    startDate: Date;
    expectedCompletion: Date;
    progress: number;
    elapsedDays: number;
    totalDays: number;
    isComplete: boolean;
    isFuture: boolean;
    currentWeek: number;
    daysRemaining: number;
  } | null = null;

  if (track === 'livestock' && interest.batch_started_at) {
    const startDate = new Date(interest.batch_started_at);
    const totalDays = 42;
    const expectedCompletion = addDays(interest.batch_started_at, totalDays);
    const now = new Date();
    const rawElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, Math.min(totalDays, rawElapsed));
    const progress = elapsedDays / totalDays;
    const isComplete = rawElapsed >= totalDays;
    const isFuture = rawElapsed < 0;
    const currentWeek = isFuture ? 0 : Math.min(6, Math.floor(elapsedDays / 7) + 1);
    const daysRemaining = Math.max(0, totalDays - elapsedDays);

    batchInfo = { startDate, expectedCompletion, progress, elapsedDays, totalDays, isComplete, isFuture, currentWeek, daysRemaining };
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {track === 'livestock' && (
          <>
            <Text style={styles.eyebrow}>{displayTypeTitle?.toUpperCase()}</Text>
            <Text style={styles.title}>{displayBirds ? `${displayBirds.toLocaleString()} Birds Package` : 'Livestock Package'}</Text>
          </>
        )}
        {track === 'equity' && (
          <>
            <Text style={styles.eyebrow}>EQUITY STAKEHOLDER</Text>
            <Text style={styles.title}>{data.offer?.title ?? 'Equity Shares'}</Text>
          </>
        )}
        {track === 'venture' && (
          <>
            <Text style={styles.eyebrow}>CAPITAL VENTURE</Text>
            <Text style={styles.title}>{data.venture?.title ?? 'Capital Venture'}</Text>
          </>
        )}

        {interest.status === 'rejected' && interest.rejection_note && (
          <View style={styles.rejectedCard}>
            <Feather name="x-circle" size={16} color={colors.danger} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectedTitle}>Reservation rejected</Text>
              <Text style={styles.rejectedNote}>{interest.rejection_note}</Text>
            </View>
          </View>
        )}

        <View style={[styles.figuresCard, shadow.card]}>
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Reference code</Text>
            <Text style={styles.figureValue}>{interest.reference_code}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Amount invested</Text>
            <Text style={styles.figureValue}>{formatNaira(displayAmount)}</Text>
          </View>
          {track === 'livestock' && (
            <>
              <View style={styles.hairline} />
              <View style={styles.figureRow}>
                <Text style={styles.figureLabel}>Estimated profit</Text>
                <Text style={[styles.figureValue, { color: colors.gold }]}>
                  {displayEstimatedProfit != null ? formatNaira(displayEstimatedProfit) : '—'}
                </Text>
              </View>
              <View style={styles.hairline} />
              <View style={styles.figureRow}>
                <Text style={styles.figureLabel}>Profit share</Text>
                <Text style={styles.figureValue}>{displayProfitShare != null ? `${displayProfitShare}%` : '—'}</Text>
              </View>
              <View style={styles.hairline} />
              <View style={styles.figureRow}>
                <Text style={styles.figureLabel}>Cycle duration</Text>
                <Text style={styles.figureValue}>{displayDuration ?? '—'}</Text>
              </View>
            </>
          )}
          <View style={styles.hairline} />
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Date submitted</Text>
            <Text style={styles.figureValue}>{formatDate(interest.created_at)}</Text>
          </View>
        </View>

        {track === 'livestock' && interest.status !== 'rejected' && (
          <>
            <Text style={styles.sectionTitle}>Batch progress</Text>

            {!interest.batch_started_at ? (
              <View style={[styles.noBatchCard, shadow.card]}>
                <Feather name="clock" size={16} color={colors.textFaint} />
                <Text style={styles.noBatchText}>
                  Your batch hasn't started yet. This will update once our team begins production for your reservation.
                </Text>
              </View>
            ) : batchInfo!.isFuture ? (
              <View style={[styles.scheduledCard, shadow.raised]}>
                <View style={styles.scheduledIconWrap}>
                  <Feather name="calendar" size={20} color="#fff" />
                </View>
                <Text style={styles.scheduledLabel}>Batch scheduled to start</Text>
                <Text style={styles.scheduledDate}>{formatDate(batchInfo!.startDate)}</Text>
              </View>
            ) : batchInfo!.isComplete ? (
              <View style={[styles.completeCard, shadow.raised]}>
                <View style={styles.completeIconWrap}>
                  <Feather name="check-circle" size={22} color="#fff" />
                </View>
                <Text style={styles.completeTitle}>Cycle complete</Text>
                <Text style={styles.completeText}>
                  This batch finished its 6-week cycle on {formatDate(batchInfo!.expectedCompletion)}.
                </Text>
              </View>
            ) : (
              <View style={[styles.progressCard, shadow.raised]}>
                <View style={styles.ringRow}>
                  <View style={{ width: 108, height: 108 }}>
                    <Svg width={108} height={108}>
                      <Circle cx={54} cy={54} r={46} stroke="rgba(255,255,255,0.2)" strokeWidth={10} fill="none" />
                      <Circle
                        cx={54}
                        cy={54}
                        r={46}
                        stroke="#fff"
                        strokeWidth={10}
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 46 * batchInfo!.progress} ${2 * Math.PI * 46}`}
                        strokeLinecap="round"
                        rotation={-90}
                        origin="54, 54"
                      />
                    </Svg>
                    <View style={styles.ringCenter}>
                      <Text style={styles.ringDays}>{batchInfo!.daysRemaining}</Text>
                      <Text style={styles.ringDaysLabel}>days left</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: spacing.lg }}>
                    <Text style={styles.progressWeekLabel}>Week {batchInfo!.currentWeek} of 6</Text>
                    <Text style={styles.progressPercent}>{Math.round(batchInfo!.progress * 100)}% complete</Text>
                    <View style={styles.progressDivider} />
                    <Text style={styles.progressDateLabel}>Started {formatDate(batchInfo!.startDate)}</Text>
                    <Text style={styles.progressDateLabel}>Ready {formatDate(batchInfo!.expectedCompletion)}</Text>
                  </View>
                </View>

                <View style={styles.milestoneRow}>
                  {[1, 2, 3, 4, 5, 6].map((week) => {
                    const filled = week <= batchInfo!.currentWeek;
                    const isCurrent = week === batchInfo!.currentWeek;
                    return (
                      <View key={week} style={styles.milestoneItem}>
                        <View style={[styles.milestoneDot, filled && styles.milestoneDotFilled, isCurrent && styles.milestoneDotCurrent]}>
                          {filled && !isCurrent && <Feather name="check" size={10} color={colors.primary} />}
                        </View>
                        {week < 6 && <View style={[styles.milestoneLine, week < batchInfo!.currentWeek && styles.milestoneLineFilled]} />}
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.milestoneStageLabel}>{getStageLabel(batchInfo!.currentWeek)}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11.5 },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.lg },
  rejectedCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FBEAE5', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  rejectedTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.danger, marginBottom: 3 },
  rejectedNote: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.text },
  figuresCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  figureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  figureLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  figureValue: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
  hairline: { height: 1, backgroundColor: colors.border },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.md },

  progressCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg },
  ringRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringDays: { fontFamily: fonts.display, fontSize: 22, color: '#fff' },
  ringDaysLabel: { fontFamily: fonts.body, fontSize: 9.5, color: '#D8E3DC' },
  progressWeekLabel: { fontFamily: fonts.display, fontSize: 17, color: '#fff', marginBottom: 2 },
  progressPercent: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: '#D8E3DC', marginBottom: spacing.sm },
  progressDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: spacing.sm },
  progressDateLabel: { fontFamily: fonts.body, fontSize: 11, color: '#BFD3C6', marginBottom: 2 },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  milestoneItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  milestoneDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  milestoneDotFilled: { backgroundColor: '#fff' },
  milestoneDotCurrent: { backgroundColor: colors.gold, width: 24, height: 24, borderRadius: 12 },
  milestoneLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  milestoneLineFilled: { backgroundColor: '#fff' },
  milestoneStageLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#D8E3DC', textAlign: 'center' },

  scheduledCard: { backgroundColor: colors.gold, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  scheduledIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  scheduledLabel: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  scheduledDate: { fontFamily: fonts.display, fontSize: 19, color: '#fff' },

  completeCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  completeIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  completeTitle: { fontFamily: fonts.display, fontSize: 19, color: '#fff', marginBottom: 6 },
  completeText: { fontFamily: fonts.body, fontSize: 12.5, color: '#D8E3DC', textAlign: 'center' },

  noBatchCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  noBatchText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },
});