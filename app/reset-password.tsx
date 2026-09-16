import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, spacing } from '../constants/theme';
import { parseAuthParams } from '../lib/parseAuthDeepLink';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const [verifying, setVerifying] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) {
        setSessionError('This reset link is missing or invalid.');
        setVerifying(false);
        return;
      }

      const { access_token, refresh_token, error } = parseAuthParams(url);

      if (error) {
        setSessionError(error);
        setVerifying(false);
        return;
      }
      if (!access_token || !refresh_token) {
        setSessionError('This reset link is invalid or has expired. Please request a new one.');
        setVerifying(false);
        return;
      }

      const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionErr) {
        setSessionError(sessionErr.message);
        setVerifying(false);
        return;
      }

      setVerifying(false);
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const handleSave = async () => {
    if (password.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords don\'t match', 'Please make sure both fields match.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    Alert.alert('Password updated', 'You can now sign in with your new password.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>RESET PASSWORD</Text>
          <Text style={styles.title}>Choose a new password</Text>

          {verifying ? (
            <View style={styles.verifyingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.verifyingText}>Verifying your reset link...</Text>
            </View>
          ) : sessionError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{sessionError}</Text>
            </View>
          ) : (
            <>
              <View style={{ marginTop: spacing.xl }}>
                <InputField label="New password" placeholder="Minimum 8 characters" secureTextEntry value={password} onChangeText={setPassword} />
                <InputField label="Confirm new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
              </View>
              <PrimaryButton label="Update password" onPress={handleSave} loading={saving} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: 100, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text, marginBottom: spacing.sm },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  verifyingText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted },
  errorCard: { marginTop: spacing.xl, backgroundColor: '#FBEAE5', borderRadius: 10, padding: spacing.md },
  errorText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.danger },
});