import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';

type InvestorRow = {
  interestId: string;
  reference_code: string;
  status: string;
  full_name: string;
  phone: string;
  email: string;
};

export default function ProductionBatchDetailScreen() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const [batch, setBatch] = useState<{ label: string; start_date: string } | null>(null);
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactTarget, setContactTarget] = useState<InvestorRow | null>(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    const { data: batchData } = await supabase.from('production_batches').select('label, start_date').eq('id', batchId).single();
    setBatch(batchData);

    const { data: interests } = await supabase
      .from('investment_interests')
      .select('id, reference_code, status, user_id')
      .eq('batch_id', batchId);

    if (interests && interests.length > 0) {
      const userIds = interests.map((i) => i.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone, email').in('id', userIds);
      const profilesById: Record<string, any> = {};
      (profiles ?? []).forEach((p) => { profilesById[p.id] = p; });

      setInvestors(
        interests.map((i) => ({
          interestId: i.id,
          reference_code: i.reference_code,
          status: i.status,
          full_name: profilesById[i.user_id]?.full_name ?? 'Unknown',
          phone: profilesById[i.user_id]?.phone ?? '',
          email: profilesById[i.user_id]?.email ?? '',
        }))
      );
    }
    setLoading(false);
  }, [batchId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
          <View>
            <Text style={styles.headerTitle}>{batch?.label}</Text>
            <Text style={styles.headerSub}>
              Started {batch ? new Date(batch.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{investors.length} INVESTOR{investors.length !== 1 ? 'S' : ''} IN THIS BATCH</Text>

        {investors.map((inv) => (
          <Pressable key={inv.interestId} style={[styles.row, shadow.card]} onPress={() => setContactTarget(inv)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{inv.full_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{inv.full_name}</Text>
              <Text style={styles.rowMeta}>Ref: {inv.reference_code}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </ScrollView>

      {contactTarget && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setContactTarget(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{contactTarget.full_name}</Text>
            <Text style={styles.sheetSubtitle}>{contactTarget.phone || 'No phone on file'} · {contactTarget.email || 'No email'}</Text>
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

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.text },
  headerSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textFaint, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 14, color: colors.primary },
  rowName: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: 2 },
  rowMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xl },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: 4 },
  sheetSubtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  contactBtn: { flex: 1, height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  contactBtnTextLight: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: '#fff' },
  contactBtnTextDark: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.primary },
});