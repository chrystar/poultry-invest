import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type ExpenseRow = { label: string; amount: string };

export default function BatchFormScreen() {
  const { batchId } = useLocalSearchParams<{ batchId?: string }>();
  const isEditing = !!batchId;

  const [batchLabel, setBatchLabel] = useState('');
  const [birdsStarted, setBirdsStarted] = useState('');
  const [birdsSold, setBirdsSold] = useState('');
  const [mortalityRate, setMortalityRate] = useState('');
  const [roiPercent, setRoiPercent] = useState('');
  const [cycleCompletedAt, setCycleCompletedAt] = useState('');
  const [totalRevenue, setTotalRevenue] = useState('');
  const [totalExpenses, setTotalExpenses] = useState('');
  const [netProfit, setNetProfit] = useState('');
  const [auditReportUrl, setAuditReportUrl] = useState('');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([{ label: '', amount: '' }]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    const load = async () => {
      const { data } = await supabase.from('batch_performance').select('*').eq('id', batchId).single();
      if (data) {
        setBatchLabel(data.batch_label);
        setBirdsStarted(String(data.birds_started));
        setBirdsSold(String(data.birds_sold));
        setMortalityRate(String(data.mortality_rate));
        setRoiPercent(String(data.roi_percent));
        setCycleCompletedAt(data.cycle_completed_at);
        setTotalRevenue(data.total_revenue !== null ? String(data.total_revenue) : '');
        setTotalExpenses(data.total_expenses !== null ? String(data.total_expenses) : '');
        setNetProfit(data.net_profit !== null ? String(data.net_profit) : '');
        setAuditReportUrl(data.audit_report_url ?? '');
        setExpenses(
          (data.expense_breakdown ?? [{ label: '', amount: '' }]).map((e: any) => ({ label: e.label, amount: String(e.amount) }))
        );
      }
      setLoading(false);
    };
    load();
  }, [batchId]);

  const updateExpenseRow = (index: number, field: 'label' | 'amount', value: string) => {
    setExpenses((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addExpenseRow = () => setExpenses((prev) => [...prev, { label: '', amount: '' }]);
  const removeExpenseRow = (index: number) => setExpenses((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!batchLabel || !birdsStarted || !birdsSold || !mortalityRate || !roiPercent || !cycleCompletedAt) {
      Alert.alert('Missing fields', 'Please fill in all the core batch fields.');
      return;
    }

    const cleanExpenses = expenses
      .filter((row) => row.label.trim() && row.amount.trim())
      .map((row) => ({ label: row.label.trim(), amount: parseFloat(row.amount) }));

    setSaving(true);
    const payload = {
      batch_label: batchLabel,
      birds_started: parseInt(birdsStarted, 10),
      birds_sold: parseInt(birdsSold, 10),
      mortality_rate: parseFloat(mortalityRate),
      roi_percent: parseFloat(roiPercent),
      cycle_completed_at: cycleCompletedAt,
      total_revenue: totalRevenue ? parseFloat(totalRevenue) : null,
      total_expenses: totalExpenses ? parseFloat(totalExpenses) : null,
      net_profit: netProfit ? parseFloat(netProfit) : null,
      audit_report_url: auditReportUrl || null,
      expense_breakdown: cleanExpenses,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('batch_performance').update(payload).eq('id', batchId));
    } else {
      ({ error } = await supabase.from('batch_performance').insert(payload));
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
          <Text style={styles.title}>{isEditing ? 'Edit batch' : 'New batch'}</Text>

          <InputField label="Batch label (e.g. Batch #15 — Broiler)" value={batchLabel} onChangeText={setBatchLabel} />
          <InputField label="Birds started" keyboardType="number-pad" value={birdsStarted} onChangeText={setBirdsStarted} />
          <InputField label="Birds sold" keyboardType="number-pad" value={birdsSold} onChangeText={setBirdsSold} />
          <InputField label="Mortality rate (%)" keyboardType="decimal-pad" value={mortalityRate} onChangeText={setMortalityRate} />
          <InputField label="ROI (%)" keyboardType="decimal-pad" value={roiPercent} onChangeText={setRoiPercent} />
          <InputField label="Cycle completed date (YYYY-MM-DD)" value={cycleCompletedAt} onChangeText={setCycleCompletedAt} placeholder="2026-07-15" />
          <InputField label="Total revenue (₦)" keyboardType="decimal-pad" value={totalRevenue} onChangeText={setTotalRevenue} />
          <InputField label="Total expenses (₦)" keyboardType="decimal-pad" value={totalExpenses} onChangeText={setTotalExpenses} />
          <InputField label="Net profit (₦)" keyboardType="decimal-pad" value={netProfit} onChangeText={setNetProfit} />
          <InputField label="Audit report URL (optional)" value={auditReportUrl} onChangeText={setAuditReportUrl} autoCapitalize="none" />

          <Text style={styles.fieldLabel}>Expense breakdown</Text>
          {expenses.map((row, i) => (
            <View key={i} style={styles.expenseRow}>
              <View style={{ flex: 1.4 }}>
                <InputField label="Label" value={row.label} onChangeText={(v) => updateExpenseRow(i, 'label', v)} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <InputField label="Amount" keyboardType="decimal-pad" value={row.amount} onChangeText={(v) => updateExpenseRow(i, 'amount', v)} />
              </View>
              <Pressable onPress={() => removeExpenseRow(i)} style={styles.removeBtn}>
                <Feather name="x" size={16} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          <Pressable onPress={addExpenseRow} style={styles.addRowBtn}>
            <Feather name="plus" size={14} color={colors.primary} />
            <Text style={styles.addRowText}>Add line item</Text>
          </Pressable>

          <PrimaryButton label={isEditing ? 'Save changes' : 'Create batch'} onPress={handleSave} loading={saving} />
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
  expenseRow: { flexDirection: 'row', alignItems: 'flex-start' },
  removeBtn: { width: 36, height: 52, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xl, marginTop: -spacing.xs },
  addRowText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.primary },
});