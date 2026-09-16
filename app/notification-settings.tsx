import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function NotificationSettingsScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const [reservationUpdates, setReservationUpdates] = useState(profile?.notify_reservation_updates ?? true);
  const [newVentures, setNewVentures] = useState(profile?.notify_new_ventures ?? true);
  const [generalUpdates, setGeneralUpdates] = useState(profile?.notify_general_updates ?? false);

  const updateSetting = async (field: string, value: boolean) => {
    if (!user) return;
    await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
    refreshProfile();
  };

  const rows = [
    {
      key: 'notify_reservation_updates',
      label: 'Reservation updates',
      description: 'Status changes on your reservations and documentation',
      value: reservationUpdates,
      setValue: setReservationUpdates,
    },
    {
      key: 'notify_new_ventures',
      label: 'New capital ventures',
      description: 'When new expansion projects open for investment',
      value: newVentures,
      setValue: setNewVentures,
    },
    {
      key: 'notify_general_updates',
      label: 'General updates',
      description: 'News, tips, and occasional announcements',
      value: generalUpdates,
      setValue: setGeneralUpdates,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        <Text style={styles.eyebrow}>PREFERENCES</Text>
        <Text style={styles.title}>Notifications</Text>

        <View style={[styles.card, shadow.card]}>
          {rows.map((row, i) => (
            <View key={row.key}>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowDescription}>{row.description}</Text>
                </View>
                <Switch
                  value={row.value}
                  onValueChange={(v) => {
                    row.setValue(v);
                    updateSetting(row.key, v);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              {i < rows.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  rowLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginBottom: 2 },
  rowDescription: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border },
});