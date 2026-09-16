import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, Share, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useOfficeSettings } from '../hooks/useOfficeSettings';

export default function ReservationConfirmedScreen() {
  const { code, birds, amount } = useLocalSearchParams<{ code: string; birds: string; amount: string }>();
  const [copied, setCopied] = useState(false);
  const { settings: officeInfo } = useOfficeSettings();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `My poultry investment reference code is ${code}. I'm reserving ${birds} birds worth ₦${Number(amount).toLocaleString('en-NG')}.`,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <View style={styles.checkWrap}>
          <Feather name="check" size={28} color="#fff" />
        </View>

        <Text style={styles.title}>Reservation received</Text>
        <Text style={styles.subtitle}>
          Bring this code and a valid ID to our office, or quote it when you call, to complete documentation.
        </Text>

        <View style={[styles.codeCard, shadow.raised]}>
          <Text style={styles.codeLabel}>Your reference code</Text>
          <Text style={styles.code}>{code}</Text>
          <Pressable style={styles.copyBtn} onPress={handleCopy}>
            <Feather name={copied ? 'check' : 'copy'} size={14} color={colors.primary} />
            <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy code'}</Text>
          </Pressable>
        </View>

        <View style={[styles.detailCard, shadow.card]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Package</Text>
            <Text style={styles.detailValue}>{birds} birds</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>₦{Number(amount).toLocaleString('en-NG')}</Text>
          </View>
        </View>

      {officeInfo && (
           <View style={[styles.officeCard, shadow.card]}>
           <Feather name="map-pin" size={15} color={colors.primary} />
           <Text style={styles.officeText}>{officeInfo.address}</Text>
         </View>
      )}
       

        <PrimaryButton label="Share reference code" variant="outline" onPress={handleShare} />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton label="Done" onPress={() => router.replace('/(tabs)/my-assets')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, alignItems: 'center' },
  checkWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },

  codeCard: { width: '100%', backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  codeLabel: { fontFamily: fonts.body, fontSize: 12, color: '#BFD3C6', marginBottom: 6 },
  code: { fontFamily: fonts.display, fontSize: 30, color: '#fff', letterSpacing: 1, marginBottom: spacing.md },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  copyText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.primary },

  detailCard: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  detailLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  detailValue: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },

  officeCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  officeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },
});