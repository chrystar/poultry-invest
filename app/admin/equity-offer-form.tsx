import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function EquityOfferFormScreen() {
  const { offerId } = useLocalSearchParams<{ offerId?: string }>();
  const isEditing = !!offerId;

  const [title, setTitle] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [minShares, setMinShares] = useState('');
  const [totalShares, setTotalShares] = useState('');
  const [dividendNote, setDividendNote] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!offerId) return;
    const load = async () => {
      const { data } = await supabase.from('equity_offers').select('*').eq('id', offerId).single();
      if (data) {
        setTitle(data.title);
        setPricePerShare(String(data.price_per_share));
        setMinShares(String(data.min_shares));
        setTotalShares(data.total_shares_available !== null ? String(data.total_shares_available) : '');
        setDividendNote(data.dividend_note);
        setDescription(data.description);
      }
      setLoading(false);
    };
    load();
  }, [offerId]);

  const handleSave = async () => {
    if (!title || !pricePerShare || !minShares || !dividendNote || !description) {
      Alert.alert('Missing fields', 'Please fill in every required field.');
      return;
    }

    setSaving(true);
    const payload = {
      title,
      price_per_share: parseFloat(pricePerShare),
      min_shares: parseInt(minShares, 10),
      total_shares_available: totalShares ? parseInt(totalShares, 10) : null,
      dividend_note: dividendNote,
      description,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('equity_offers').update(payload).eq('id', offerId));
    } else {
      const newId = `equity-${Date.now()}`;
      ({ error } = await supabase.from('equity_offers').insert({ id: newId, ...payload }));
    }
    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    router.back();
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

          <Text style={styles.eyebrow}>{isEditing ? 'EDIT' : 'NEW'}</Text>
          <Text style={styles.title}>{isEditing ? 'Edit equity offer' : 'New equity offer'}</Text>

          <InputField label="Title" value={title} onChangeText={setTitle} />
          <InputField label="Price per share (₦)" keyboardType="decimal-pad" value={pricePerShare} onChangeText={setPricePerShare} />
          <InputField label="Minimum shares" keyboardType="number-pad" value={minShares} onChangeText={setMinShares} />
          <InputField label="Total shares available (optional)" keyboardType="number-pad" value={totalShares} onChangeText={setTotalShares} />
          <InputField label="Dividend explanation" value={dividendNote} onChangeText={setDividendNote} multiline style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }} />
          <InputField label="Description" value={description} onChangeText={setDescription} multiline style={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.sm }} />

          <PrimaryButton label={isEditing ? 'Save changes' : 'Create offer'} onPress={handleSave} loading={saving} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.xl },
});