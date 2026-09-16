import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useEquityOffers } from '../hooks/useEquityOffers';
import { supabase } from '../lib/supabase';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function EquityScreen() {
  const { offers, loading } = useEquityOffers();
  const { user } = useAuth();
  const [shares, setShares] = useState('');
  const [reserving, setReserving] = useState(false);

  const offer = offers[0]; // single standard offer for now

  const sharesNum = parseInt(shares, 10) || 0;
  const totalAmount = offer ? sharesNum * offer.price_per_share : 0;

  const handleReserve = async () => {
    if (!user) {
      Alert.alert('Please sign in', 'You need to be logged in to reserve equity shares.');
      return;
    }
    if (!offer) return;
    if (sharesNum < offer.min_shares) {
      Alert.alert('Minimum shares required', `You need at least ${offer.min_shares} shares to invest in this offer.`);
      return;
    }

    setReserving(true);
    const { data, error } = await supabase
      .from('equity_interests')
      .insert({ user_id: user.id, offer_id: offer.id, shares_requested: sharesNum, amount: totalAmount })
      .select('reference_code')
      .single();
    setReserving(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }

    router.push({
      pathname: '/reservation-confirmed',
      params: { code: data.reference_code, birds: `${sharesNum} shares`, amount: String(totalAmount) },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ padding: spacing.lg, fontFamily: fonts.body, color: colors.textMuted }}>
          No equity offers available right now.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>EQUITY STAKEHOLDER</Text>
        <Text style={styles.title}>{offer.title}</Text>
        <Text style={styles.description}>{offer.description}</Text>

        <View style={[styles.priceCard, shadow.raised]}>
          <Text style={styles.priceLabel}>Price per share</Text>
          <Text style={styles.priceValue}>{formatNaira(offer.price_per_share)}</Text>
          <View style={styles.priceDivider} />
          <View style={styles.priceMetaRow}>
            <Text style={styles.priceMetaLabel}>Minimum shares</Text>
            <Text style={styles.priceMetaValue}>{offer.min_shares}</Text>
          </View>
          {offer.total_shares_available !== null && (
            <View style={styles.priceMetaRow}>
              <Text style={styles.priceMetaLabel}>Shares available</Text>
              <Text style={styles.priceMetaValue}>{offer.total_shares_available.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.explainCard}>
          <View style={styles.explainHeader}>
            <Feather name="pie-chart" size={15} color={colors.primary} />
            <Text style={styles.explainTitle}>How dividends work</Text>
          </View>
          <Text style={styles.explainText}>{offer.dividend_note}</Text>
        </View>

        <View style={styles.noticeCard}>
          <Feather name="alert-triangle" size={16} color={colors.gold} style={{ marginTop: 2 }} />
          <Text style={styles.noticeText}>
            Equity capital is non-refundable and perpetual. It is retained by the company to fund operations
            and expansion. This is different from the fixed-term livestock model, where principal is refunded.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How many shares?</Text>
        <View style={styles.inputCard}>
          <TextInput
            value={shares}
            onChangeText={setShares}
            keyboardType="number-pad"
            placeholder={`Minimum ${offer.min_shares}`}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
        </View>

        {sharesNum > 0 && (
          <View style={[styles.totalCard, shadow.card]}>
            <Text style={styles.totalLabel}>Total investment</Text>
            <Text style={styles.totalValue}>{formatNaira(totalAmount)}</Text>
          </View>
        )}

        <PrimaryButton label="Reserve these shares" onPress={handleReserve} loading={reserving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  description: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xl },
  priceCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  priceLabel: { fontFamily: fonts.body, fontSize: 12.5, color: '#BFD3C6', marginBottom: 4 },
  priceValue: { fontFamily: fonts.display, fontSize: 28, color: '#fff' },
  priceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.md },
  priceMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceMetaLabel: { fontFamily: fonts.body, fontSize: 12.5, color: '#BFD3C6' },
  priceMetaValue: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: '#fff' },
  explainCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  explainHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  explainTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  explainText: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 19, color: colors.textMuted },
  noticeCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#FBF3E4', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.text },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  inputCard: { marginBottom: spacing.md },
  input: {
    height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, fontFamily: fonts.body, fontSize: 15, color: colors.text, backgroundColor: colors.surface,
  },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  totalLabel: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.textMuted },
  totalValue: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.gold },
});