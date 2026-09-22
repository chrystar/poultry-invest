import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { notifyUsers } from '../../lib/notifyUsers';
import { supabase } from '../../lib/supabase';


function toDateOnlyString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EquityCampaignFormScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId?: string }>();
  const isEditing = !!campaignId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetBirds, setTargetBirds] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [minShares, setMinShares] = useState('1');
  const [netProfit, setNetProfit] = useState('');
  const [status, setStatus] = useState<'raising' | 'active' | 'completed'>('raising');
  const [batchDate, setBatchDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sharesSold, setSharesSold] = useState(0);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const totalShares = useMemo(() => {
    const amt = parseFloat(targetAmount);
    const price = parseFloat(pricePerShare);
    if (!amt || !price) return 0;
    return Math.floor(amt / price);
  }, [targetAmount, pricePerShare]);

  const fullyFunded = totalShares > 0 && sharesSold >= totalShares;

  useEffect(() => {
    if (!campaignId) return;
    const load = async () => {
      const { data } = await supabase.from('equity_campaigns').select('*').eq('id', campaignId).single();
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setTargetBirds(String(data.target_birds));
        setTargetAmount(String(data.target_amount));
        setPricePerShare(String(data.price_per_share));
        setMinShares(String(data.min_shares));
        setNetProfit(data.net_profit != null ? String(data.net_profit) : '');
        setStatus(data.status);
        if (data.batch_started_at) setBatchDate(new Date(data.batch_started_at));
      }
      const { data: interests } = await supabase
        .from('equity_interests')
        .select('shares_requested')
        .eq('campaign_id', campaignId)
        .in('status', ['confirmed', 'active']);
      setSharesSold((interests ?? []).reduce((s, r) => s + r.shares_requested, 0));
      setLoading(false);
    };
    load();
  }, [campaignId]);

  const handleSave = async () => {
    if (!title || !targetBirds || !targetAmount || !pricePerShare || !minShares) {
      Alert.alert('Missing fields', 'Please fill in every required field.');
      return;
    }

    setSaving(true);
    const payload = {
      title,
      description,
      target_birds: parseInt(targetBirds, 10),
      target_amount: parseFloat(targetAmount),
      price_per_share: parseFloat(pricePerShare),
      total_shares: totalShares,
      min_shares: parseInt(minShares, 10),
      net_profit: netProfit ? parseFloat(netProfit) : null,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('equity_campaigns').update(payload).eq('id', campaignId));
    } else {
      ({ error } = await supabase.from('equity_campaigns').insert(payload));
    }
    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }
    router.back();
  };

  const handleStartBatch = async () => {
    Alert.alert('Start this batch?', `This confirms funding is complete and sets the batch start date to ${toDateOnlyString(batchDate)}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start batch',
        onPress: async () => {
          const { error } = await supabase
            .from('equity_campaigns')
            .update({ status: 'active', batch_started_at: toDateOnlyString(batchDate) })
            .eq('id', campaignId);
  
          if (error) {
            Alert.alert('Failed', error.message);
            return;
          }
  
          setStatus('active');
  
          // Notify every confirmed investor in this campaign — in-app + native push
          const { data: interests } = await supabase
            .from('equity_interests')
            .select('user_id')
            .eq('campaign_id', campaignId)
            .in('status', ['confirmed', 'active']);
  
          const investorIds = Array.from(new Set((interests ?? []).map((r) => r.user_id)));
  
          if (investorIds.length > 0) {
            await notifyUsers({
              userIds: investorIds,
              title: 'Your batch has started',
              body: `"${title}" is now active. Track its progress and view updates in the app.`,
              type: 'general',
              route: `/equity-campaign/${campaignId}`,
            });
          }
  
          Alert.alert('Batch started', 'Investors have been notified.');
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
          <Text style={styles.title}>{isEditing ? 'Edit equity raise' : 'New equity raise'}</Text>

          <InputField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. 1000 Birds Equity Raise" />
          <InputField label="Description" value={description} onChangeText={setDescription} multiline style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }} />
          <InputField label="Target birds" keyboardType="number-pad" value={targetBirds} onChangeText={setTargetBirds} />
          <InputField label="Total capital required (₦)" keyboardType="decimal-pad" value={targetAmount} onChangeText={setTargetAmount} />
          <InputField label="Price per share (₦)" keyboardType="decimal-pad" value={pricePerShare} onChangeText={setPricePerShare} />
          <InputField label="Minimum shares per investor" keyboardType="number-pad" value={minShares} onChangeText={setMinShares} />

          {totalShares > 0 && (
            <View style={styles.computedCard}>
              <Feather name="hash" size={14} color={colors.primary} />
              <Text style={styles.computedText}>
                This raise will have <Text style={styles.computedBold}>{totalShares.toLocaleString()} shares</Text> available.
              </Text>
            </View>
          )}

          <InputField
            label="Estimated net profit (₦, optional — can be edited anytime)"
            keyboardType="decimal-pad"
            value={netProfit}
            onChangeText={setNetProfit}
          />

          <PrimaryButton label={isEditing ? 'Save changes' : 'Create raise'} onPress={handleSave} loading={saving} />

          {isEditing && status === 'raising' && (
            <View style={styles.batchSection}>
              <Text style={styles.batchSectionTitle}>
                Funding: {sharesSold.toLocaleString()} / {totalShares.toLocaleString()} shares
                {fullyFunded ? ' — fully funded' : ` — ${(totalShares - sharesSold).toLocaleString()} remaining`}
              </Text>

              <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Feather name="calendar" size={15} color={colors.primary} />
                <Text style={styles.dateButtonText}>{toDateOnlyString(batchDate)}</Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={batchDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(e, d) => { if (Platform.OS === 'android') setShowDatePicker(false); if (d) setBatchDate(d); }}
                  themeVariant="light"
                />
              )}

              <View style={{ marginTop: spacing.md }}>
                <PrimaryButton
                  label={fullyFunded ? 'Start batch' : `Start batch anyway (${totalShares - sharesSold} unsold)`}
                  onPress={handleStartBatch}
                  variant={fullyFunded ? 'primary' : 'outline'}
                />
              </View>
            </View>
          )}

          {isEditing && status === 'active' && (
            <View style={styles.activeNotice}>
              <Feather name="check-circle" size={15} color={colors.primary} />
              <Text style={styles.activeNoticeText}>
                Batch started {toDateOnlyString(batchDate)}. Manage updates from Campaign Media.
              </Text>
            </View>
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
  computedCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryMuted, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.lg },
  computedText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.primary },
  computedBold: { fontFamily: fonts.bodyBold },
  batchSection: { marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg },
  batchSectionTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: spacing.md },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.surface },
  dateButtonText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  activeNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryMuted, borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.xl },
  activeNoticeText: { flex: 1, fontFamily: fonts.body, fontSize: 12.5, color: colors.primary },
});