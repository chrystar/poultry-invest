import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useEquityOffers, type EquityOffer } from '../../hooks/useEquityOffers';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function AdminEquityOffersScreen() {
  const { offers, loading, refetch } = useEquityOffers();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
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
          <Pressable onPress={() => router.push('/admin/equity-offer-form')} style={styles.addBtn}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>MANAGE</Text>
        <Text style={styles.title}>Equity Offers</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          offers.map((offer: EquityOffer) => (
            <Pressable
              key={offer.id}
              style={[styles.card, shadow.card]}
              onPress={() => router.push({ pathname: '/admin/equity-offer-form', params: { offerId: offer.id } })}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{offer.title}</Text>
                <Feather name="edit-2" size={14} color={colors.textFaint} />
              </View>
              <Text style={styles.cardFigure}>{formatNaira(offer.price_per_share)} / share</Text>
              <Text style={styles.cardMeta}>
                Min {offer.min_shares} shares
                {offer.total_shares_available !== null ? ` · ${offer.total_shares_available.toLocaleString()} available` : ''}
              </Text>
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
  cardFigure: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: 4 },
  cardMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
});