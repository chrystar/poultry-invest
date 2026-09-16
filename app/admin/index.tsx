import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  

  const fetchStats = useCallback(async () => {
    const [livestock, equity, ventures] = await Promise.all([
      supabase.from('investment_interests').select('status'),
      supabase.from('equity_interests').select('status'),
      supabase.from('venture_interests').select('status'),
    ]);

    const all = [
      ...(livestock.data ?? []),
      ...(equity.data ?? []),
      ...(ventures.data ?? []),
    ];

    setPendingCount(all.filter((r) => r.status === 'pending').length);
    setConfirmedCount(all.filter((r) => r.status === 'confirmed' || r.status === 'active').length);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const manageLinks: { icon: keyof typeof Feather.glyphMap; label: string; route: string; highlight?: boolean }[] = [
    { icon: 'user-plus', label: 'Log Manual Reservation', route: '/admin/manual-reservation', highlight: true },
    { icon: 'package', label: 'Manage Livestock Packages', route: '/admin/packages' },
    { icon: 'pie-chart', label: 'Manage Equity Offers', route: '/admin/equity-offers' },
    { icon: 'trending-up', label: 'Manage Capital Ventures', route: '/admin/ventures' },
    { icon: 'bar-chart-2', label: 'Manage Batch Performance', route: '/admin/batches' },
    { icon: 'send', label: 'Broadcast Notification', route: '/admin/broadcast' },
    { icon: 'file-text', label: 'Edit App Content', route: '/admin/content' },
{ icon: 'map-pin', label: 'Edit Office Details', route: '/admin/office-settings' },
{ icon: 'image', label: 'Manage Farm Operations', route: '/admin/farm-media' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>ADMIN</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <Pressable onPress={() => router.replace('/(tabs)/home')} style={styles.exitBtn}>
            <Feather name="log-out" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Pressable
            style={[styles.statCard, shadow.raised, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/admin/reservations', params: { filter: 'pending' } })}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.statValueLight}>{pendingCount}</Text>
                <Text style={styles.statLabelLight}>Awaiting documentation</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.statCard, shadow.card]}
            onPress={() => router.push({ pathname: '/admin/reservations', params: { filter: 'confirmed' } })}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.statValueDark}>{confirmedCount}</Text>
                <Text style={styles.statLabelDark}>Confirmed positions</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Reservations entry point */}
        <Pressable style={[styles.reservationsRow, shadow.card]} onPress={() => router.push('/admin/reservations')}>
          <View style={styles.reservationsIconWrap}>
            <Feather name="clipboard" size={17} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reservationsTitle}>All Reservations</Text>
            <Text style={styles.reservationsSubtitle}>Review, confirm, and manage batch dates</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textFaint} />
        </Pressable>

        <Text style={styles.sectionLabel}>MANAGE</Text>
        {manageLinks.map((link) => (
          <Pressable
            key={link.label}
            style={[styles.manageRow, link.highlight ? shadow.raised : shadow.card, link.highlight && { backgroundColor: colors.primary }]}
            onPress={() => router.push(link.route as any)}
          >
            <Feather name={link.icon} size={16} color={link.highlight ? '#fff' : colors.primary} />
            <Text style={[styles.manageRowText, link.highlight && { color: '#fff' }]}>{link.label}</Text>
            <Feather name="chevron-right" size={16} color={link.highlight ? 'rgba(255,255,255,0.7)' : colors.textFaint} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  exitBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: colors.surface, minHeight: 88, justifyContent: 'center' },
  statValueLight: { fontFamily: fonts.display, fontSize: 28, color: '#fff', marginBottom: 4 },
  statLabelLight: { fontFamily: fonts.body, fontSize: 11.5, color: '#D8E3DC' },
  statValueDark: { fontFamily: fonts.display, fontSize: 28, color: colors.text, marginBottom: 4 },
  statLabelDark: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },

  reservationsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl },
  reservationsIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  reservationsTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: 2 },
  reservationsSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },

  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textFaint, marginBottom: spacing.sm },
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  manageRowText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
});