import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import type { InvestmentType } from '../../hooks/useInvestments';
import { supabase } from '../../lib/supabase';

export default function PackageFormScreen() {
  const { packageId } = useLocalSearchParams<{ packageId?: string }>();
  const isEditing = !!packageId;

  const [types, setTypes] = useState<InvestmentType[]>([]);
  const [typeId, setTypeId] = useState('');
  const [birds, setBirds] = useState('');
  const [amount, setAmount] = useState('');
  const [estimatedProfit, setEstimatedProfit] = useState('');
  const [profitSharePercent, setProfitSharePercent] = useState('30');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTypes = async () => {
      const { data } = await supabase.from('investment_types').select('*').order('sort_order');
      if (data) {
        setTypes(data as InvestmentType[]);
        if (!isEditing && data.length > 0) setTypeId(data[0].id);
      }
    };
    loadTypes();
  }, []);

  useEffect(() => {
    if (!packageId) return;
    const load = async () => {
      const { data } = await supabase.from('investment_packages').select('*').eq('id', packageId).single();
      if (data) {
        setTypeId(data.type_id);
        setBirds(String(data.birds));
        setAmount(String(data.amount));
        setEstimatedProfit(String(data.estimated_profit));
        setProfitSharePercent(String(data.profit_share_percent));
        setDuration(data.duration);
        setDescription(data.description);
        setIsRecommended(data.is_recommended);
      }
      setLoading(false);
    };
    load();
  }, [packageId]);

  const handleSave = async () => {
    if (!typeId || !birds || !amount || !estimatedProfit || !duration || !description) {
      Alert.alert('Missing fields', 'Please fill in every field.');
      return;
    }

    setSaving(true);
    const payload = {
      type_id: typeId,
      birds: parseInt(birds, 10),
      amount: parseFloat(amount),
      estimated_profit: parseFloat(estimatedProfit),
      profit_share_percent: parseInt(profitSharePercent, 10),
      duration,
      description,
      is_recommended: isRecommended,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('investment_packages').update(payload).eq('id', packageId));
    } else {
      const newId = `${typeId}-${birds}-${Date.now()}`;
      ({ error } = await supabase.from('investment_packages').insert({ id: newId, ...payload }));
    }
    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }

    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete package', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('investment_packages').delete().eq('id', packageId);
          if (error) {
            Alert.alert('Delete failed', error.message);
            return;
          }
          router.back();
        },
      },
    ]);
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
          <Text style={styles.title}>{isEditing ? 'Edit package' : 'New package'}</Text>

          <Text style={styles.fieldLabel}>Investment type</Text>
          <View style={styles.typeRow}>
            {types.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.typeChip, typeId === t.id && styles.typeChipActive]}
                onPress={() => setTypeId(t.id)}
              >
                <Text style={[styles.typeChipText, typeId === t.id && styles.typeChipTextActive]}>{t.title.split(' ')[0]}</Text>
              </Pressable>
            ))}
          </View>

          <InputField label="Number of birds" keyboardType="number-pad" value={birds} onChangeText={setBirds} />
          <InputField label="Investment amount (₦)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          <InputField label="Estimated profit (₦)" keyboardType="decimal-pad" value={estimatedProfit} onChangeText={setEstimatedProfit} />
          <InputField label="Profit share %" keyboardType="number-pad" value={profitSharePercent} onChangeText={setProfitSharePercent} />
          <InputField label="Duration (e.g. 6 weeks)" value={duration} onChangeText={setDuration} />
          <InputField label="Description" value={description} onChangeText={setDescription} multiline style={{ height: 90, textAlignVertical: 'top', paddingTop: spacing.sm }} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mark as "Most Popular"</Text>
            <Switch
              value={isRecommended}
              onValueChange={setIsRecommended}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <PrimaryButton label={isEditing ? 'Save changes' : 'Create package'} onPress={handleSave} loading={saving} />

          {isEditing && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Feather name="trash-2" size={15} color={colors.danger} />
              <Text style={styles.deleteText}>Delete package</Text>
            </Pressable>
          )}
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
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  typeChipTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, paddingVertical: spacing.sm },
  switchLabel: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.lg, paddingVertical: spacing.md },
  deleteText: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.danger },
});