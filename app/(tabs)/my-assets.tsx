import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type AssetRow = {
  id: string;
  status: string;
  reference_code: string;
  created_at: string;
  amount: number;
  title: string;
  meta: string;
  track: 'Livestock' | 'Equity' | 'Venture';
};

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending documentation', color: colors.gold, bg: '#FBF3E4' },
  confirmed: { label: 'Confirmed', color: colors.primary, bg: colors.primaryMuted },
  active: { label: 'Active', color: colors.primary, bg: colors.primaryMuted },
};

const trackIcon: Record<string, keyof typeof Feather.glyphMap> = {
  Livestock: 'feather',
  Equity: 'pie-chart',
  Venture: 'trending-up',
};

export default function MyAssetsScreen() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [livestockRes, equityRes, ventureRes, packagesRes, typesRes, offersRes, venturesRes] = await Promise.all([
      supabase.from('investment_interests').select('id, package_id, status, reference_code, created_at').eq('user_id', user.id),
      supabase.from('equity_interests').select('id, offer_id, shares_requested, amount, status, reference_code, created_at').eq('user_id', user.id),
      supabase.from('venture_interests').select('id, venture_id, amount, status, reference_code, created_at').eq('user_id', user.id),
      supabase.from('investment_packages').select('*'),
      supabase.from('investment_types').select('*'),
      supabase.from('equity_offers').select('*'),
      supabase.from('capital_ventures').select('*'),
    ]);

    const packagesById: Record<string, any> = {};
    (packagesRes.data ?? []).forEach((p) => { packagesById[p.id] = p; });
    const typesById: Record<string, any> = {};
    (typesRes.data ?? []).forEach((t) => { typesById[t.id] = t; });
    const offersById: Record<string, any> = {};
    (offersRes.data ?? []).forEach((o) => { offersById[o.id] = o; });
    const venturesById: Record<string, any> = {};
    (venturesRes.data ?? []).forEach((v) => { venturesById[v.id] = v; });

    const livestock: AssetRow[] = (livestockRes.data ?? []).map((r) => {
      const pkg = packagesById[r.package_id];
      const type = pkg ? typesById[pkg.type_id] : null;
      return {
        id: r.id,
        status: r.status,
        reference_code: r.reference_code,
        created_at: r.created_at,
        amount: pkg?.amount ?? 0,
        title: type?.title ?? 'Livestock Package',
        meta: pkg ? `${pkg.birds.toLocaleString()} birds · ${pkg.duration}` : '',
        track: 'Livestock',
      };
    });

    const equity: AssetRow[] = (equityRes.data ?? []).map((r) => {
      const offer = offersById[r.offer_id];
      return {
        id: r.id,
        status: r.status,
        reference_code: r.reference_code,
        created_at: r.created_at,
        amount: r.amount,
        title: offer?.title ?? 'Equity Shares',
        meta: r.shares_requested > 0 ? `${r.shares_requested} shares` : 'Equity investment',
        track: 'Equity',
      };
    });

    const ventures: AssetRow[] = (ventureRes.data ?? []).map((r) => {
      const venture = venturesById[r.venture_id];
      return {
        id: r.id,
        status: r.status,
        reference_code: r.reference_code,
        created_at: r.created_at,
        amount: r.amount,
        title: venture?.title ?? 'Capital Venture',
        meta: 'Expansion capital',
        track: 'Venture',
      };
    });

    const all = [...livestock, ...equity, ...ventures].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setAssets(all);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const totalInvested = assets
    .filter((a) => a.status === 'confirmed' || a.status === 'active')
    .reduce((sum, a) => sum + a.amount, 0);

  const activeCount = assets.filter((a) => a.status === 'confirmed' || a.status === 'active').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.eyebrow}>PORTFOLIO</Text>
        <Text style={styles.title}>My Assets</Text>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : assets.length > 0 ? (
          <>
            <View style={[styles.summaryCard, shadow.raised]}>
              <Text style={styles.summaryLabel}>Total invested</Text>
              <Text style={styles.summaryValue}>₦{totalInvested.toLocaleString('en-NG')}</Text>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summarySub}>Active positions</Text>
                <Text style={styles.summarySubValue}>{activeCount}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Your positions</Text>
            {assets.map((item) => {
              const status = statusMeta[item.status] ?? statusMeta.pending;
              return (
                <Pressable key={item.id} style={[styles.assetCard, shadow.card]} onPress={() => router.push(`/asset/${item.track.toLowerCase()}/${item.id}`)}>
                  <View style={styles.assetTopRow}>
                    <View style={styles.assetIconWrap}>
                      <Feather name={trackIcon[item.track]} size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assetType}>{item.title}</Text>
                      <Text style={styles.assetMeta}>{item.track} · {item.meta}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  <View style={styles.assetDivider} />
                  <View style={styles.assetBottomRow}>
                    <Text style={styles.assetAmount}>₦{item.amount.toLocaleString('en-NG')}</Text>
                    <Text style={styles.assetRef}>Ref: {item.reference_code}</Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="briefcase" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No assets yet</Text>
            <Text style={styles.emptyText}>
              Once you reserve a package and complete documentation at our office, it will appear here.
            </Text>
            <View style={{ marginTop: spacing.lg, width: '100%' }}>
              <PrimaryButton label="Browse packages" onPress={() => router.push('/(tabs)/investment')} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text, marginBottom: spacing.xl },
  summaryCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  summaryLabel: { fontFamily: fonts.body, fontSize: 12.5, color: '#BFD3C6', marginBottom: 4 },
  summaryValue: { fontFamily: fonts.display, fontSize: 28, color: '#fff' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summarySub: { fontFamily: fonts.body, fontSize: 12.5, color: '#BFD3C6' },
  summarySubValue: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: '#fff' },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.md },
  assetCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  assetTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  assetIconWrap: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  assetType: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginBottom: 2 },
  assetMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontFamily: fonts.bodySemiBold, fontSize: 10.5 },
  assetDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  assetBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetAmount: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text },
  assetRef: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.md },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, textAlign: 'center' },
});