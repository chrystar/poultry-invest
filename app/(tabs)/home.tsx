import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../lib/supabase';

type ActivityItem = {
  id: string;
  status: string;
  reference_code: string;
  created_at: string;
  amount: number;
  title: string;
  track: 'Livestock' | 'Equity' | 'Venture';
};

const categories: { icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { icon: 'feather', label: 'Livestock' },
  { icon: 'pie-chart', label: 'Equity' },
  { icon: 'trending-up', label: 'Ventures' },
];

const statusIconMap: Record<string, keyof typeof Feather.glyphMap> = {
  pending: 'clock',
  confirmed: 'check-circle',
  active: 'trending-up',
};

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function HomeScreen() {
  const { profile, user } = useAuth();
  const { unreadCount } = useNotifications();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [livestockRes, equityRes, ventureRes, packagesRes, typesRes, offersRes, venturesRes] = await Promise.all([
      supabase.from('investment_interests').select('id, package_id, status, reference_code, created_at').eq('user_id', user.id),
      supabase.from('equity_interests').select('id, offer_id, amount, status, reference_code, created_at').eq('user_id', user.id),
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

    const livestock: ActivityItem[] = (livestockRes.data ?? []).map((r) => {
      const pkg = packagesById[r.package_id];
      const type = pkg ? typesById[pkg.type_id] : null;
      return {
        id: r.id,
        status: r.status,
        reference_code: r.reference_code,
        created_at: r.created_at,
        amount: pkg?.amount ?? 0,
        title: pkg ? `${pkg.birds.toLocaleString()} birds` : type?.title ?? 'Livestock Package',
        track: 'Livestock',
      };
    });

    const equity: ActivityItem[] = (equityRes.data ?? []).map((r) => {
      const offer = offersById[r.offer_id];
      return {
        id: r.id,
        status: r.status,
        reference_code: r.reference_code,
        created_at: r.created_at,
        amount: r.amount,
        title: offer?.title ?? 'Equity Shares',
        track: 'Equity',
      };
    });

    const ventures: ActivityItem[] = (ventureRes.data ?? []).map((r) => {
      const venture = venturesById[r.venture_id];
      return {
        id: r.id,
        status: r.status,
        reference_code: r.reference_code,
        created_at: r.created_at,
        amount: r.amount,
        title: venture?.title ?? 'Capital Venture',
        track: 'Venture',
      };
    });

    const all = [...livestock, ...equity, ...ventures].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setActivity(all);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const totalInvested = activity
    .filter((a) => a.status === 'confirmed' || a.status === 'active')
    .reduce((sum, a) => sum + a.amount, 0);

  const activeCount = activity.filter((a) => a.status === 'confirmed' || a.status === 'active').length;
  const recentActivity = activity.slice(0, 3);
  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            <View>
              <Text style={styles.greeting}>Hello, {firstName || 'there'}</Text>
              <Text style={styles.greetingSub}>Welcome back</Text>
            </View>
          </View>
          <Pressable style={styles.bellBtn} onPress={() => router.push('/notifications')}>
            <Feather name="bell" size={18} color={colors.text} />
            {unreadCount > 0 && <View style={styles.bellDot} />}
          </Pressable>
        </View>

        <View style={[styles.summaryCard, shadow.raised]}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryIconWrap}>
              <Feather name="briefcase" size={16} color="#fff" />
            </View>
            <Pressable onPress={() => setBalanceHidden(!balanceHidden)}>
              <Feather name={balanceHidden ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
          <Text style={styles.summaryLabel}>Total invested</Text>
          <Text style={styles.summaryValue}>{balanceHidden ? '••••••••' : formatNaira(totalInvested)}</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBottomRow}>
            <Text style={styles.summarySub}>Active positions</Text>
            <Text style={styles.summarySubValue}>{activeCount}</Text>
          </View>
        </View>

        {bannerVisible && (
          <View style={styles.banner}>
            <View style={styles.bannerIconWrap}>
              <Feather name="info" size={15} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Registration is manual</Text>
              <Text style={styles.bannerText}>Visit our office or call us to complete documentation for any package.</Text>
            </View>
            <Pressable onPress={() => setBannerVisible(false)} hitSlop={8}>
              <Feather name="x" size={16} color={colors.textFaint} />
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionTitle}>Finish setting up</Text>
        <Pressable style={[styles.setupRow, shadow.card]} onPress={() => router.push('/(tabs)/profile')}>
          <View style={styles.setupIconWrap}>
            <Feather name="check-circle" size={16} color={colors.primary} />
          </View>
          <Text style={styles.setupText}>Complete your profile</Text>
          <Feather name="chevron-right" size={16} color={colors.textFaint} />
        </Pressable>
        <Pressable style={[styles.setupRow, shadow.card]} onPress={() => router.push('/investment-track')}>
          <View style={styles.setupIconWrap}>
            <Feather name="package" size={16} color={colors.primary} />
          </View>
          <Text style={styles.setupText}>Choose your first package</Text>
          <Feather name="chevron-right" size={16} color={colors.textFaint} />
        </Pressable>

        <Text style={styles.sectionTitle}>Invest in</Text>
        <View style={styles.categoryRow}>
          {categories.map((c) => (
            <Pressable key={c.label} style={styles.categoryItem} onPress={() => router.push('/investment-track')}>
              <View style={[styles.categoryIconWrap, shadow.card]}>
                <Feather name={c.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.categoryLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : recentActivity.length === 0 ? (
          <View style={[styles.emptyActivity, shadow.card]}>
            <Feather name="inbox" size={18} color={colors.textFaint} />
            <Text style={styles.emptyText}>No activity yet. Reserve a package to get started.</Text>
          </View>
        ) : (
          recentActivity.map((item) => (
            <View key={item.id} style={[styles.activityRow, shadow.card]}>
              <View style={styles.activityIconWrap}>
                <Feather name={statusIconMap[item.status] ?? 'file-text'} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityMeta}>{item.track} · Ref: {item.reference_code} · {item.status}</Text>
              </View>
              <Text style={styles.activityTime}>{timeAgo(item.created_at)}</Text>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 17, color: colors.primary },
  greeting: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text },
  greetingSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  bellBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  bellDot: { position: 'absolute', top: 10, right: 11, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  summaryCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  summaryIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontFamily: fonts.body, fontSize: 12.5, color: '#BFD3C6', marginBottom: 4 },
  summaryValue: { fontFamily: fonts.display, fontSize: 30, color: '#fff' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.md },
  summaryBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summarySub: { fontFamily: fonts.body, fontSize: 12.5, color: '#BFD3C6' },
  summarySubValue: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: '#fff' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  bannerIconWrap: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  bannerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text, marginBottom: 2 },
  bannerText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16.5, color: colors.textMuted },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm },
  setupRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  setupIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  setupText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  categoryRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl },
  categoryItem: { alignItems: 'center', gap: 8 },
  categoryIconWrap: { width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted },
  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  activityIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: 2 },
  activityMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  activityTime: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
  emptyActivity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, flex: 1 },
});