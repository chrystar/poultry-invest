import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

function toDateOnlyString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SetBatchDateScreen() {
  const { interestId, referenceCode } = useLocalSearchParams<{ interestId: string; referenceCode: string }>();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleSave = async () => {

    setSaving(true);
    const dateString = toDateOnlyString(date);
    const { error } = await supabase
      .from('investment_interests')
      .update({ batch_started_at: dateString })
      .eq('id', interestId);
    setSaving(false);

    if (error) {
      Alert.alert('Failed', error.message);
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>{referenceCode}</Text>
        <Text style={styles.title}>Set batch start date</Text>
        <Text style={styles.subtitle}>This determines when the 6-week cycle began for this reservation.</Text>

        <Pressable style={styles.dateButton} onPress={() => setShowPicker(!showPicker)}>
          <Feather name="calendar" size={16} color={colors.primary} />
          <Text style={styles.dateButtonText}>{toDateOnlyString(date)}</Text>
          <Feather name={showPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textFaint} />
        </Pressable>

        {showPicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleChange}
              themeVariant="light"
            />
          </View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <PrimaryButton label="Save date" onPress={handleSave} loading={saving} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: spacing.xl },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, padding: spacing.md,
  },
  dateButtonText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  pickerWrap: { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.md, overflow: 'hidden' },
});