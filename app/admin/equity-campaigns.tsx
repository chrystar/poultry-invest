import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useEquityCampaigns } from '../../hooks/useEquityCampaigns';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function AdminEquityCampaignsScreen() {
  const { campaigns, progressById, loading, refetch } = useEquityCampaigns();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Equity Raises</Text>
          <Pressable onPress={() => router.push('/admin/equity-campaign-form')} style={styles.addBtn}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : campaigns.length === 0 ? (
          <Text style={styles.emptyText}>No equity raises yet.</Text>
        ) : (
          campaigns.map((c) => {
            const p = progressById[c.id] ?? { sharesSold: 0, sharesRemaining: c.total_shares, percentFunded: 0, investorCount: 0 };
            return (
              <Pressable
                key={c.id}
                style={[styles.card, shadow.card]}
                onPress={() => router.push({ pathname: '/admin/equity-campaign-form', params: { campaignId: c.id } })}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <View style={[styles.pill, c.status === 'active' && styles.pillActive, c.status === 'completed' && styles.pillDone]}>
                    <Text style={styles.pillText}>{c.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  {p.sharesSold.toLocaleString()}/{c.total_shares.toLocaleString()} shares · {p.investorCount} investors · {formatNaira(c.price_per_share)}/share
                </Text>
                {c.status === 'active' && (
                  <Pressable
                  style={styles.mediaLink}
                  onPress={(e) => { e.stopPropagation(); router.push(`/admin/equity-investors/${c.id}`); }}
                >
                  <Feather name="users" size={13} color={colors.primary} />
                  <Text style={styles.mediaLinkText}>View investors</Text>
                </Pressable>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.text },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginRight: spacing.sm },
  cardMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  pill: { backgroundColor: '#FBF3E4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillActive: { backgroundColor: '#E3F3EC' },
  pillDone: { backgroundColor: colors.primaryMuted },
  pillText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.text, textTransform: 'capitalize' },
  mediaLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  mediaLinkText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary },
});