import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address';
    if (!/^[0-9+\s]{10,15}$/.test(phone)) e.phone = 'Enter a valid phone number';
    if (password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const { error, needsConfirmation } = await signUp(name.trim(), trimmedEmail, phone.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Registration failed', error);
      return;
    }

    if (needsConfirmation) {
      // Never navigate into the app on an unconfirmed account — go to the
      // dedicated "check your email" screen instead.
      router.replace({ pathname: '/(auth)/verify-email', params: { email: trimmedEmail } });
      return;
    }

    // Only reached if your Supabase project has email confirmation disabled,
    // in which case signUp already returns a real session.
    router.replace('/(tabs)/home');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
        <Text style={styles.title}>Start your{'\n'}poultry investment</Text>
        <Text style={styles.subtitle}>
          Register to view packages and reserve your slot. Final documentation is completed in person.
        </Text>

        <View style={{ marginTop: spacing.xl }}>
          <InputField label="Full name" placeholder="e.g. Adaeze Okafor" value={name} onChangeText={setName} error={errors.name} />
          <InputField label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={errors.email} />
          <InputField label="Phone number" placeholder="080X XXX XXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} error={errors.phone} />
          <InputField label="Password" placeholder="Minimum 8 characters" secureTextEntry value={password} onChangeText={setPassword} error={errors.password} />
        </View>

        <PrimaryButton label="Create account" onPress={handleRegister} loading={loading} />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Text style={styles.footerLink}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: 80, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  footerLink: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
});