import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
import { parseAuthParams } from '../lib/parseAuthDeepLink';
import { supabase } from '../lib/supabase';

export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;

      const { access_token, refresh_token, error: linkError } = parseAuthParams(url);

      const codeMatch = url.match(/[?&]code=([^&]+)/);
      if (codeMatch) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(codeMatch[1]);
        if (exchangeErr) {
          setError(exchangeErr.message);
          return;
        }
        router.replace('/(tabs)/home');
        return;
      }

      if (linkError) {
        setError(linkError);
        return;
      }

      if (access_token && refresh_token) {
        const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionErr) {
          setError(sessionErr.message);
          return;
        }
      }

      router.replace('/(tabs)/home');
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Confirming your email...</Text>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  loadingText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.textMuted, marginTop: spacing.md },
  errorText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.danger, textAlign: 'center' },
});