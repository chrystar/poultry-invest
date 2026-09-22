import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendConfirmation, signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await resendConfirmation(email);
    setResending(false);

    if (error) {
      Alert.alert('Could not resend', error);
      return;
    }
    setResent(true);
  };

  const handleBackToLogin = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconWrap}>
          <Feather name="mail" size={26} color="#fff" />
        </View>

        <Text style={styles.eyebrow}>ONE MORE STEP</Text>
        <Text style={styles.title}>Confirm your email</Text>
        <Text style={styles.subtitle}>
          We've sent a confirmation link to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.instructions}>
          Open the email on this device and tap the link — it will bring you straight back into the app,
          signed in and ready to go.
        </Text>

        {resent && (
          <View style={styles.resentBanner}>
            <Feather name="check" size={14} color={colors.primary} />
            <Text style={styles.resentText}>Confirmation email resent.</Text>
          </View>
        )}

        <PrimaryButton label="Resend email" onPress={handleResend} loading={resending} variant="outline" />

        <Pressable onPress={handleBackToLogin} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 80, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.sm, textAlign: 'center' },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  emailText: { fontFamily: fonts.bodySemiBold, color: colors.text },
  instructions: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textFaint, textAlign: 'center', marginBottom: spacing.xl },
  resentBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryMuted, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.lg },
  resentText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.primary },
  backLink: { marginTop: spacing.xl, padding: spacing.sm },
  backLinkText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
});