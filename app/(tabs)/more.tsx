import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useOfficeSettings } from '../../hooks/useOfficeSettings';

type LinkItem = { icon: keyof typeof Feather.glyphMap; label: string; onPress?: () => void };

export default function OthersScreen() {
  const { settings, loading } = useOfficeSettings();

  const quickActions = settings
    ? [
        { icon: 'phone' as const, label: 'Call', action: () => Linking.openURL(`tel:${settings.phone.replace(/\s/g, '')}`) },
        { icon: 'mail' as const, label: 'Email', action: () => Linking.openURL(`mailto:${settings.email}`) },
        { icon: 'map-pin' as const, label: 'Directions', action: () => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`) },
      ]
    : [];

  const insightsLinks: LinkItem[] = [
    { icon: 'bar-chart-2', label: 'Track Record', onPress: () => router.push('/track-record') },
    { icon: 'trending-up', label: 'Capital Ventures', onPress: () => router.push('/ventures') },
    { icon: 'image', label: 'Farm Operations', onPress: () => router.push('/farm-media') },
  ];

  const generalLinks: LinkItem[] = [
    { icon: 'book-open', label: 'About us', onPress: () => router.push('/content/about_us') },
    { icon: 'file-text', label: 'Terms & conditions', onPress: () => router.push('/content/terms') },
    { icon: 'lock', label: 'Privacy policy', onPress: () => router.push('/content/privacy') },
    { icon: 'star', label: 'Rate the app' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      <Text style={styles.eyebrow}>ABOUT & RESOURCES</Text>
<Text style={styles.title}>More</Text>
<Text style={styles.subtitle}>
  Company insights, contact details, and everything else about PoultryInvest.
</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.xl }} />
        ) : (
          <>
            <View style={styles.quickRow}>
              {quickActions.map((item) => (
                <Pressable key={item.label} style={styles.quickItem} onPress={item.action}>
                  <View style={[styles.quickIconWrap, shadow.card]}>
                    <Feather name={item.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.officeCard, shadow.raised]}>
              <View style={styles.officeIconWrap}>
                <Feather name="home" size={16} color="#fff" />
              </View>
              <Text style={styles.officeLabel}>Our office</Text>
              <Text style={styles.officeAddress}>{settings?.address}</Text>
              <View style={styles.officeDivider} />
              <View style={styles.officeMetaRow}>
                <Feather name="clock" size={13} color="#BFD3C6" />
                <Text style={styles.officeHours}>{settings?.hours}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>INSIGHTS</Text>
        <View style={[styles.groupCard, shadow.card]}>
          {insightsLinks.map((item, i) => (
            <View key={item.label}>
              <Pressable style={styles.groupRow} onPress={item.onPress}>
                <View style={styles.groupIconWrap}>
                  <Feather name={item.icon} size={15} color={colors.primary} />
                </View>
                <Text style={styles.groupLabel}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={colors.textFaint} />
              </Pressable>
              {i < insightsLinks.length - 1 && <View style={styles.groupDivider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>GENERAL</Text>
        <View style={[styles.groupCard, shadow.card]}>
          {generalLinks.map((item, i) => (
            <View key={item.label}>
              <Pressable style={styles.groupRow} onPress={item.onPress}>
                <View style={styles.groupIconWrap}>
                  <Feather name={item.icon} size={15} color={colors.primary} />
                </View>
                <Text style={styles.groupLabel}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={colors.textFaint} />
              </Pressable>
              {i < generalLinks.length - 1 && <View style={styles.groupDivider} />}
            </View>
          ))}
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.xl },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  quickItem: { alignItems: 'center', gap: 8, flex: 1 },
  quickIconWrap: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  officeCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  officeIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  officeLabel: { fontFamily: fonts.body, fontSize: 12, color: '#BFD3C6', marginBottom: 4 },
  officeAddress: { fontFamily: fonts.displayMedium, fontSize: 16, lineHeight: 22, color: '#fff' },
  officeDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: spacing.md },
  officeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  officeHours: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#BFD3C6' },
  sectionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textFaint, marginBottom: spacing.sm },
  groupCard: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.xl },
  groupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  groupIconWrap: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  groupLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  groupDivider: { height: 1, backgroundColor: colors.border },
  version: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.textFaint, marginTop: spacing.sm },
});