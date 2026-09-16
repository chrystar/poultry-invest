import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import type { InvestmentPackage, InvestmentType } from '../../hooks/useInvestments';
import { supabase } from '../../lib/supabase';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function AdminPackagesScreen() {
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [types, setTypes] = useState<Record<string, InvestmentType>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [pkgRes, typeRes] = await Promise.all([
      supabase.from('investment_packages').select('*').order('sort_order'),
      supabase.from('investment_types').select('*'),
    ]);
    if (pkgRes.data) setPackages(pkgRes.data as InvestmentPackage[]);
    if (typeRes.data) {
      const map: Record<string, InvestmentType> = {};
      (typeRes.data as InvestmentType[]).forEach((t) => { map[t.id] = t; });
      setTypes(map);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/admin/package-form')} style={styles.addBtn}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>MANAGE</Text>
        <Text style={styles.title}>Livestock Packages</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          packages.map((pkg) => (
            <Pressable
              key={pkg.id}
              style={[styles.card, shadow.card]}
              onPress={() => router.push({ pathname: '/admin/package-form', params: { packageId: pkg.id } })}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{types[pkg.type_id]?.title ?? pkg.type_id} · {pkg.birds} birds</Text>
                <Feather name="edit-2" size={14} color={colors.textFaint} />
              </View>
              <View style={styles.cardFiguresRow}>
                <Text style={styles.cardFigure}>{formatNaira(pkg.amount)}</Text>
                <Feather name="arrow-right" size={12} color={colors.textFaint} />
                <Text style={[styles.cardFigure, { color: colors.gold }]}>{formatNaira(pkg.estimated_profit)}</Text>
              </View>
              <Text style={styles.cardMeta}>{pkg.duration} · {pkg.profit_share_percent}% share {pkg.is_recommended ? '· Recommended' : ''}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
  cardFiguresRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardFigure: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  cardMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
});