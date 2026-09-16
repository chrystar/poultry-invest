import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error);
      return;
    }
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>Sign in to your{'\n'}account</Text>

        <View style={{ marginTop: spacing.xl }}>
          <InputField label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <InputField label="Password" placeholder="Your password" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <Link href="/(auth)/forgot-password" asChild>
  <Text style={styles.forgotLink}>Forgot password?</Text>
</Link>

        <PrimaryButton label="Sign in" onPress={handleLogin} loading={loading} />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/(auth)/register" asChild>
            <Text style={styles.footerLink}>Create an account</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: 100, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.text },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  footerLink: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  forgotLink: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary, textAlign: 'right', marginBottom: spacing.lg },
});