import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function AdminOfficeSettingsScreen() {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('office_settings').select('*').eq('id', 1).single();
      if (data) {
        setAddress(data.address);
        setPhone(data.phone);
        setEmail(data.email);
        setHours(data.hours);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('office_settings')
      .update({ address, phone, email, hours, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    Alert.alert('Saved', 'Office details updated.');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>

          <Text style={styles.eyebrow}>ADMIN</Text>
          <Text style={styles.title}>Office details</Text>

          <InputField label="Address" value={address} onChangeText={setAddress} multiline style={{ height: 70, textAlignVertical: 'top', paddingTop: spacing.sm }} />
          <InputField label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <InputField label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <InputField label="Office hours" value={hours} onChangeText={setHours} />

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
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginBottom: spacing.lg },
});