import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { InvestmentPackage, InvestmentType } from '../../hooks/useInvestments';
import { useOfficeSettings } from '../../hooks/useOfficeSettings';
import { supabase } from '../../lib/supabase';

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function PackageDetailsScreen() {
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const { user } = useAuth();

  const [reserving, setReserving] = useState(false);
  const [pkg, setPkg] = useState<InvestmentPackage | null>(null);
  const [type, setType] = useState<InvestmentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packageId) return;

    const load = async () => {
      setLoading(true);
      const { data: pkgData, error: pkgError } = await supabase
        .from('investment_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (pkgError || !pkgData) {
        console.log('Failed to load package:', packageId, pkgError);
        setLoading(false);
        return;
      }

      setPkg(pkgData as InvestmentPackage);

      const { data: typeData, error: typeError } = await supabase
        .from('investment_types')
        .select('*')
        .eq('id', pkgData.type_id)
        .single();

      if (typeError) {
        console.log('Failed to load type:', pkgData.type_id, typeError);
      } else {
        setType(typeData as InvestmentType);
      }

      setLoading(false);
    };

    load();
  }, [packageId]);

  const { settings: officeInfo } = useOfficeSettings();

  const handleReserve = async () => {
    if (!user) {
      Alert.alert('Please sign in', 'You need to be logged in to reserve a package.');
      return;
    }
    if (!pkg) return;

    setReserving(true);
    const { data, error } = await supabase
      .from('investment_interests')
      .insert({ user_id: user.id, package_id: pkg.id })
      .select('reference_code')
      .single();
    setReserving(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }

    router.push({
      pathname: '/reservation-confirmed',
      params: { code: data.reference_code, birds: String(pkg.birds), amount: String(pkg.amount) },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!pkg || !type) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={{ padding: spacing.lg, fontFamily: fonts.body, color: colors.textMuted }}>
          Package not found.
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

        <Text style={styles.eyebrow}>{type.title.toUpperCase()}</Text>
        <Text style={styles.title}>{pkg.birds.toLocaleString()} Birds Package</Text>
        <Text style={styles.description}>{pkg.description}</Text>

        <View style={styles.figuresCard}>
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Investment amount</Text>
            <Text style={styles.figureValue}>{formatNaira(pkg.amount)}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Estimated profit</Text>
            <Text style={[styles.figureValue, { color: colors.gold }]}>{formatNaira(pkg.estimated_profit)}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.figureRow}>
            <Text style={styles.figureLabel}>Cycle duration</Text>
            <Text style={styles.figureValue}>{pkg.duration}</Text>
          </View>
        </View>

        <View style={styles.explainCard}>
          <View style={styles.explainHeader}>
            <Feather name="percent" size={15} color={colors.primary} />
            <Text style={styles.explainTitle}>How your profit is calculated</Text>
          </View>
          <Text style={styles.explainText}>
            You earn <Text style={styles.explainBold}>{pkg.profit_share_percent}% of the profit</Text> generated
            from your {pkg.birds.toLocaleString()} birds. The {formatNaira(pkg.estimated_profit)} shown above is an
            estimate based on current market conditions.
          </Text>
          <Text style={styles.explainText}>
            This amount may <Text style={styles.explainBold}>increase</Text> if actual profit generated is higher
            than projected, or <Text style={styles.explainBold}>reduce</Text> if it is lower. It is not a fixed or
            guaranteed return.
          </Text>
        </View>

        <View style={styles.noticeCard}>
          <Feather name="info" size={16} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={styles.noticeText}>
            Registration for this package is completed manually to ensure proper documentation.
            Visit our office or call us to reserve your slot.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Complete your registration</Text>
        {officeInfo && (
          <>
            <View style={styles.contactCard}>
              <Feather name="map-pin" size={16} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.contactLabel}>Visit our office</Text>
                <Text style={styles.contactValue}>{officeInfo.address}</Text>
                <Text style={styles.contactHours}>{officeInfo.hours}</Text>
              </View>
            </View>

            <View style={styles.contactCard}>
              <Feather name="phone" size={16} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.contactLabel}>Call to reserve</Text>
                <Text style={styles.contactValue}>{officeInfo.phone}</Text>
              </View>
            </View>
            <PrimaryButton
              label="Reserve this package"
              onPress={handleReserve}
              loading={reserving}
            />
            <View style={{ height: spacing.sm }} />
            <PrimaryButton
              label={`Call ${officeInfo.phone}`}
              variant="outline"
              onPress={() => Linking.openURL(`tel:${officeInfo.phone.replace(/\s/g, '')}`)}
            />
            <View style={{ height: spacing.sm }} />
            <PrimaryButton
              label="Email us instead"
              variant="outline"
              onPress={() => Linking.openURL(`mailto:${officeInfo.email}`)}
            />
          </>

        )}






      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  description: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textMuted, marginBottom: spacing.xl },
  figuresCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  figureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  figureLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  figureValue: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.text },
  hairline: { height: 1, backgroundColor: colors.border },
  noticeCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.primary },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.md },
  contactCard: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  contactLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: 2 },
  contactValue: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  contactHours: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint, marginTop: 2 },
  explainCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  explainHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  explainTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  explainText: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 19, color: colors.textMuted, marginBottom: spacing.sm },
  explainBold: { fontFamily: fonts.bodySemiBold, color: colors.text },
});