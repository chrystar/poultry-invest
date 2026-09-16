import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type CapexRow = { label: string; amount: string };

const STATUS_OPTIONS = ['open', 'funded', 'closed'];

export default function VentureFormScreen() {
  const { ventureId } = useLocalSearchParams<{ ventureId?: string }>();
  const isEditing = !!ventureId;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [targetCapital, setTargetCapital] = useState('');
  const [capitalRaised, setCapitalRaised] = useState('0');
  const [status, setStatus] = useState('open');
  const [capex, setCapex] = useState<CapexRow[]>([{ label: '', amount: '' }]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ventureId) return;
    const load = async () => {
      const { data } = await supabase.from('capital_ventures').select('*').eq('id', ventureId).single();
      if (data) {
        setTitle(data.title);
        setSummary(data.summary);
        setTargetCapital(String(data.target_capital));
        setCapitalRaised(String(data.capital_raised));
        setStatus(data.status);
        setCapex(
          (data.capex_breakdown ?? []).map((c: any) => ({ label: c.label, amount: String(c.amount) }))
        );
      }
      setLoading(false);
    };
    load();
  }, [ventureId]);

  const updateCapexRow = (index: number, field: 'label' | 'amount', value: string) => {
    setCapex((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addCapexRow = () => setCapex((prev) => [...prev, { label: '', amount: '' }]);
  const removeCapexRow = (index: number) => setCapex((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!title || !summary || !targetCapital) {
      Alert.alert('Missing fields', 'Please fill in title, summary, and target capital.');
      return;
    }

    const cleanCapex = capex
      .filter((row) => row.label.trim() && row.amount.trim())
      .map((row) => ({ label: row.label.trim(), amount: parseFloat(row.amount) }));

    setSaving(true);
    const payload = {
      title,
      summary,
      target_capital: parseFloat(targetCapital),
      capital_raised: parseFloat(capitalRaised || '0'),
      status,
      capex_breakdown: cleanCapex,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('capital_ventures').update(payload).eq('id', ventureId));
    } else {
      const newId = `venture-${Date.now()}`;
      ({ error } = await supabase.from('capital_ventures').insert({ id: newId, ...payload }));
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
          <Text style={styles.title}>{isEditing ? 'Edit venture' : 'New venture'}</Text>

          <InputField label="Title" value={title} onChangeText={setTitle} />
          <InputField label="Summary" value={summary} onChangeText={setSummary} multiline style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }} />
          <InputField label="Target capital (₦)" keyboardType="decimal-pad" value={targetCapital} onChangeText={setTargetCapital} />
          <InputField label="Capital raised so far (₦)" keyboardType="decimal-pad" value={capitalRaised} onChangeText={setCapitalRaised} />

          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((s) => (
              <Pressable key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
                <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>CAPEX breakdown</Text>
          {capex.map((row, i) => (
            <View key={i} style={styles.capexRow}>
              <View style={{ flex: 1.4 }}>
                <InputField label="Label" value={row.label} onChangeText={(v) => updateCapexRow(i, 'label', v)} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <InputField label="Amount" keyboardType="decimal-pad" value={row.amount} onChangeText={(v) => updateCapexRow(i, 'amount', v)} />
              </View>
              <Pressable onPress={() => removeCapexRow(i)} style={styles.removeBtn}>
                <Feather name="x" size={16} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={addCapexRow} style={styles.addRowBtn}>
            <Feather name="plus" size={14} color={colors.primary} />
            <Text style={styles.addRowText}>Add line item</Text>
          </Pressable>

          <PrimaryButton label={isEditing ? 'Save changes' : 'Create venture'} onPress={handleSave} loading={saving} />
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
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginBottom: 8, marginTop: spacing.xs },
  statusRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statusChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, textTransform: 'capitalize' },
  statusChipTextActive: { color: '#fff' },
  capexRow: { flexDirection: 'row', alignItems: 'flex-start' },
  removeBtn: { width: 36, height: 52, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xl, marginTop: -spacing.xs },
  addRowText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary },
});