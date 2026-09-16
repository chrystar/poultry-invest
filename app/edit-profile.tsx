import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!/^[0-9+\s]{10,15}$/.test(phone)) e.phone = 'Enter a valid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() })
      .eq('id', user.id);
    setSaving(false);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    await refreshProfile();
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>

          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Edit profile</Text>

          <View style={{ marginTop: spacing.xl }}>
            <InputField label="Full name" value={name} onChangeText={setName} error={errors.name} />
            <InputField label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyLabel}>Email address</Text>
              <Text style={styles.readonlyValue}>{profile?.email}</Text>
              <Text style={styles.readonlyHint}>Contact support to change your email</Text>
            </View>
          </View>

          <PrimaryButton label="Save changes" onPress={handleSave} loading={saving} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.sm },
  readonlyField: { marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.primaryMuted, borderRadius: radius.sm },
  readonlyLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  readonlyValue: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginBottom: 4 },
  readonlyHint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textFaint },
});