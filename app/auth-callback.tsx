import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';
import { parseAuthParams } from '../lib/parseAuthDeepLink';
import { supabase } from '../lib/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error_description?: string;
  }>();
  const currentUrl = Linking.useURL(); // reactive, doesn't fight the router
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const resolve = async () => {
      // 1. Query-param based (PKCE / some verify redirects)
      if (params.error_description) {
        handled.current = true;
        setError(params.error_description);
        return;
      }
      if (params.code) {
        handled.current = true;
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeErr) { setError(exchangeErr.message); return; }
        router.replace('/(tabs)/home');
        return;
      }
      if (params.access_token && params.refresh_token) {
        handled.current = true;
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sessionErr) { setError(sessionErr.message); return; }
        router.replace('/(tabs)/home');
        return;
      }

      // 2. Hash-fragment based (implicit flow) — read from the raw URL directly
      if (currentUrl) {
        const { access_token, refresh_token, error: linkError } = parseAuthParams(currentUrl);

        if (linkError) {
          handled.current = true;
          setError(linkError);
          return;
        }
        if (access_token && refresh_token) {
          handled.current = true;
          const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionErr) { setError(sessionErr.message); return; }
          router.replace('/(tabs)/home');
          return;
        }
      }

      // 3. Neither format present yet — check if the account is already confirmed
      // (Supabase confirms server-side before redirecting, so a session may already exist)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        handled.current = true;
        router.replace('/(tabs)/home');
      }
    };

    resolve();
  }, [params, currentUrl]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!handled.current) {
        setError('This link could not be verified automatically. Your email may already be confirmed — try signing in.');
      }
    }, 8000);
    return () => clearTimeout(timeout);
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