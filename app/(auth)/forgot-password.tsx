import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'We need your email to send a reset link.');
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'poultryinvest://reset-password',
    });
    setSending(false);

    if (error) {
      Alert.alert('Something went wrong', error.message);
      return;
    }
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>RESET PASSWORD</Text>
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>
          Enter the email on your account and we'll send you a link to reset it.
        </Text>

        {sent ? (
          <View style={styles.sentCard}>
            <Text style={styles.sentText}>
              Check your inbox — we've sent a reset link to {email.trim()}.
            </Text>
          </View>
        ) : (
          <>
            <View style={{ marginTop: spacing.xl }}>
              <InputField
                label="Email address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <PrimaryButton label="Send reset link" onPress={handleSend} loading={sending} />
          </>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Remembered it? </Text>
          <Link href="/(auth)/login" asChild>
            <Text style={styles.footerLink}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: 100, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  sentCard: { marginTop: spacing.xl, backgroundColor: colors.primaryMuted, borderRadius: 10, padding: spacing.md },
  sentText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.primary },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  footerLink: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
});