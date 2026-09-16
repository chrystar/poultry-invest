import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Row = { id: string; status: string; reference_code: string; source: 'Livestock' | 'Equity' | 'Venture' };

export default function DocumentationStatusScreen() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [livestock, equity, ventures] = await Promise.all([
      supabase.from('investment_interests').select('id, status, reference_code').eq('user_id', user.id),
      supabase.from('equity_interests').select('id, status, reference_code').eq('user_id', user.id),
      supabase.from('venture_interests').select('id, status, reference_code').eq('user_id', user.id),
    ]);

    const combined: Row[] = [
      ...(livestock.data ?? []).map((r) => ({ ...r, source: 'Livestock' as const })),
      ...(equity.data ?? []).map((r) => ({ ...r, source: 'Equity' as const })),
      ...(ventures.data ?? []).map((r) => ({ ...r, source: 'Venture' as const })),
    ];
    setRows(combined);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const confirmedCount = rows.filter((r) => r.status === 'confirmed' || r.status === 'active').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>STATUS</Text>
        <Text style={styles.title}>Documentation Status</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, shadow.card]}>
            <Text style={[styles.summaryValue, { color: colors.gold }]}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={[styles.summaryCard, shadow.card]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{confirmedCount}</Text>
            <Text style={styles.summaryLabel}>Confirmed</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>All submissions</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : rows.length === 0 ? (
          <Text style={styles.emptyText}>No submissions yet.</Text>
        ) : (
          rows.map((row) => (
            <View key={row.id} style={[styles.row, shadow.card]}>
              <View>
                <Text style={styles.rowSource}>{row.source}</Text>
                <Text style={styles.rowRef}>Ref: {row.reference_code}</Text>
              </View>
              <View style={[styles.statusPill, row.status === 'pending' ? styles.pendingPill : styles.confirmedPill]}>
                <Text style={[styles.statusText, row.status === 'pending' ? { color: colors.gold } : { color: colors.primary }]}>
                  {row.status}
                </Text>
              </View>
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
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.xl },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  summaryValue: { fontFamily: fonts.display, fontSize: 24, marginBottom: 4 },
  summaryLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.text, marginBottom: spacing.md },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  rowSource: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: 2 },
  rowRef: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pendingPill: { backgroundColor: '#FBF3E4' },
  confirmedPill: { backgroundColor: colors.primaryMuted },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5, textTransform: 'capitalize' },
});