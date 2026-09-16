import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { BatchPerformance, fetchBatchById } from '../../hooks/useTrackRecord';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
const formatCompact = (n: number) => {
  if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return `₦${n}`;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

const EXPENSE_COLORS = [colors.primary, '#4A7A5C', '#7BA88C', colors.gold, '#C9A86A', '#D9C49A'];

function DonutChart({ profit, expenses }: { profit: number; expenses: number }) {
  const size = 168;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = profit + expenses;
  const profitRatio = total > 0 ? profit / total : 0;
  const profitLength = circumference * profitRatio;
  const marginPercent = total > 0 ? Math.round(profitRatio * 100) : 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={`${profitLength} ${circumference}`}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.text }}>{marginPercent}%</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted }}>profit margin</Text>
        </View>
      </View>
    </View>
  );
}

export default function BatchDetailScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const [batch, setBatch] = useState<BatchPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batchId) return;
    fetchBatchById(batchId).then(setBatch).finally(() => setLoading(false));
  }, [batchId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!batch) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ padding: spacing.lg, fontFamily: fonts.body, color: colors.textMuted }}>Batch not found.</Text>
      </SafeAreaView>
    );
  }

  const revenue = batch.total_revenue ?? 0;
  const expenses = batch.total_expenses ?? 0;
  const profit = batch.net_profit ?? revenue - expenses;
  const breakdown = batch.expense_breakdown ?? [];
  const maxExpenseItem = Math.max(...breakdown.map((e) => e.amount), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Completed</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>{formatDate(batch.cycle_completed_at)}</Text>
        <Text style={styles.title}>{batch.batch_label}</Text>

        {/* KPI row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <View style={styles.kpiIconWrap}><Feather name="feather" size={13} color={colors.primary} /></View>
            <Text style={styles.kpiValue}>{batch.birds_sold}/{batch.birds_started}</Text>
            <Text style={styles.kpiLabel}>Birds sold</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <View style={styles.kpiIconWrap}><Feather name="activity" size={13} color={colors.primary} /></View>
            <Text style={styles.kpiValue}>{batch.mortality_rate}%</Text>
            <Text style={styles.kpiLabel}>Mortality</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <View style={styles.kpiIconWrap}><Feather name="trending-up" size={13} color={colors.primary} /></View>
            <Text style={[styles.kpiValue, { color: colors.gold }]}>{batch.roi_percent}%</Text>
            <Text style={styles.kpiLabel}>ROI</Text>
          </View>
        </View>

        {/* Financial overview with donut */}
        <Text style={styles.sectionTitle}>Financial overview</Text>
        <View style={[styles.overviewCard, shadow.raised]}>
          <View style={styles.overviewTop}>
            <DonutChart profit={profit} expenses={expenses} />
            <View style={styles.overviewFigures}>
              <View style={styles.figureBlock}>
                <View style={styles.figureHeader}>
                  <View style={[styles.dot, { backgroundColor: colors.text }]} />
                  <Text style={styles.figureLabel}>Revenue</Text>
                </View>
                <Text style={styles.figureValue}>{formatNaira(revenue)}</Text>
              </View>
              <View style={styles.figureBlock}>
                <View style={styles.figureHeader}>
                  <View style={[styles.dot, { backgroundColor: colors.border }]} />
                  <Text style={styles.figureLabel}>Expenses</Text>
                </View>
                <Text style={styles.figureValue}>{formatNaira(expenses)}</Text>
              </View>
              <View style={styles.figureBlock}>
                <View style={styles.figureHeader}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.figureLabel}>Net profit</Text>
                </View>
                <Text style={[styles.figureValue, { color: colors.primary }]}>{formatNaira(profit)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expense breakdown as horizontal bars */}
        {breakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Expense breakdown</Text>
            <View style={[styles.expenseCard, shadow.card]}>
              {breakdown.map((item, i) => (
                <View key={item.label} style={styles.expenseItem}>
                  <View style={styles.expenseTopRow}>
                    <View style={styles.expenseLabelRow}>
                      <View style={[styles.expenseDot, { backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }]} />
                      <Text style={styles.expenseLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.expenseValue}>{formatCompact(item.amount)}</Text>
                  </View>
                  <View style={styles.expenseBarTrack}>
                    <View
                      style={[
                        styles.expenseBarFill,
                        { width: `${(item.amount / maxExpenseItem) * 100}%`, backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {batch.audit_report_url && (
          <Pressable style={[styles.reportBtn, shadow.card]} onPress={() => Linking.openURL(batch.audit_report_url!)}>
            <Feather name="file-text" size={15} color={colors.primary} />
            <Text style={styles.reportText}>View full audit report</Text>
            <Feather name="external-link" size={13} color={colors.textFaint} />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.primary },

  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.xl },

  kpiRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl, ...shadow.card },
  kpiItem: { flex: 1, alignItems: 'center' },
  kpiIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiValue: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: 2 },
  kpiLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted },
  kpiDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.sm },

  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.md },
  overviewCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  overviewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  overviewFigures: { flex: 1, gap: spacing.md },
  figureBlock: {},
  figureHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  figureLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  figureValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },

  expenseCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl },
  expenseItem: { marginBottom: spacing.md },
  expenseTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  expenseLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expenseDot: { width: 8, height: 8, borderRadius: 4 },
  expenseLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  expenseValue: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.textMuted },
  expenseBarTrack: { height: 6, backgroundColor: colors.primaryMuted, borderRadius: 3, overflow: 'hidden' },
  expenseBarFill: { height: '100%', borderRadius: 3 },

  reportBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, justifyContent: 'center' },
  reportText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text, textAlign: 'center' },
});