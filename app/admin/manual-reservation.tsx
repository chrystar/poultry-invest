import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type UserResult = { id: string; full_name: string; email: string; phone: string };
type PackageResult = { id: string; birds: number; amount: number; type_id: string };

const TRACKS = [
  { id: 'livestock', label: 'Livestock' },
  { id: 'equity', label: 'Equity' },
  { id: 'venture', label: 'Venture' },
];

export default function ManualReservationScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  const [track, setTrack] = useState('livestock');
  const [packages, setPackages] = useState<PackageResult[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10);
    setSearching(false);

    if (error) {
      Alert.alert('Search failed', error.message);
      return;
    }
    setResults(data as UserResult[]);
  };

  const selectUser = async (user: UserResult) => {
    setSelectedUser(user);
    setResults([]);
    if (track === 'livestock') await loadPackages();
  };

  const loadPackages = async () => {
    const { data } = await supabase.from('investment_packages').select('id, birds, amount, type_id');
    if (data) setPackages(data as PackageResult[]);
  };

  const handleTrackChange = async (t: string) => {
    setTrack(t);
    setSelectedPackageId('');
    setCustomAmount('');
    if (t === 'livestock') await loadPackages();
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      Alert.alert('Select a user first');
      return;
    }

    setSaving(true);
    let error;
    let referenceCode = '';

    if (track === 'livestock') {
      if (!selectedPackageId) {
        setSaving(false);
        Alert.alert('Select a package');
        return;
      }
      const { data, error: insertError } = await supabase
        .from('investment_interests')
        .insert({ user_id: selectedUser.id, package_id: selectedPackageId, status: 'confirmed' })
        .select('reference_code')
        .single();
      error = insertError;
      referenceCode = data?.reference_code ?? '';
    } else if (track === 'equity') {
      if (!customAmount) {
        setSaving(false);
        Alert.alert('Enter an amount');
        return;
      }
      const { data: offer } = await supabase.from('equity_offers').select('id').limit(1).single();
      const { data, error: insertError } = await supabase
        .from('equity_interests')
        .insert({
          user_id: selectedUser.id,
          offer_id: offer?.id,
          shares_requested: 0,
          amount: parseFloat(customAmount),
          status: 'confirmed',
        })
        .select('reference_code')
        .single();
      error = insertError;
      referenceCode = data?.reference_code ?? '';
    } else {
      if (!customAmount) {
        setSaving(false);
        Alert.alert('Enter an amount');
        return;
      }
      const { data: venture } = await supabase.from('capital_ventures').select('id').limit(1).single();
      const { data, error: insertError } = await supabase
        .from('venture_interests')
        .insert({
          user_id: selectedUser.id,
          venture_id: venture?.id,
          amount: parseFloat(customAmount),
          status: 'confirmed',
        })
        .select('reference_code')
        .single();
      error = insertError;
      referenceCode = data?.reference_code ?? '';
    }

    setSaving(false);

    if (error) {
      Alert.alert('Failed to create record', error.message);
      return;
    }

    Alert.alert('Reservation created', `Reference code: ${referenceCode}\n\nThis now shows as confirmed in the user's account.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>

          <Text style={styles.eyebrow}>ADMIN</Text>
          <Text style={styles.title}>Log a manual reservation</Text>
          <Text style={styles.subtitle}>
            For investors who registered by phone or email instead of through the app.
          </Text>

          {!selectedUser ? (
            <>
              <Text style={styles.fieldLabel}>Find the user</Text>
              <View style={styles.searchRow}>
                <View style={{ flex: 1 }}>
                  <InputField label="Name, email, or phone" value={query} onChangeText={setQuery} />
                </View>
                <Pressable style={styles.searchBtn} onPress={handleSearch}>
                  {searching ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="search" size={16} color="#fff" />}
                </Pressable>
              </View>

              {results.map((user) => (
                <Pressable key={user.id} style={[styles.userCard, shadow.card]} onPress={() => selectUser(user)}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{user.full_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    <Text style={styles.userMeta}>{user.email} · {user.phone}</Text>
                  </View>
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <View style={[styles.selectedUserCard, shadow.raised]}>
                <View style={styles.userAvatar}>
                  <Text style={[styles.userAvatarText, { color: colors.primary }]}>{selectedUser.full_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedUserName}>{selectedUser.full_name}</Text>
                  <Text style={styles.selectedUserMeta}>{selectedUser.email}</Text>
                </View>
                <Pressable onPress={() => setSelectedUser(null)}>
                  <Feather name="x" size={18} color="#fff" />
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>Investment track</Text>
              <View style={styles.trackRow}>
                {TRACKS.map((t) => (
                  <Pressable
                    key={t.id}
                    style={[styles.trackChip, track === t.id && styles.trackChipActive]}
                    onPress={() => handleTrackChange(t.id)}
                  >
                    <Text style={[styles.trackChipText, track === t.id && styles.trackChipTextActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              {track === 'livestock' ? (
                <>
                  <Text style={styles.fieldLabel}>Select package</Text>
                  {packages.map((pkg) => (
                    <Pressable
                      key={pkg.id}
                      style={[styles.pkgRow, selectedPackageId === pkg.id && styles.pkgRowActive]}
                      onPress={() => setSelectedPackageId(pkg.id)}
                    >
                      <Text style={styles.pkgText}>{pkg.birds} birds — ₦{pkg.amount.toLocaleString('en-NG')}</Text>
                      {selectedPackageId === pkg.id && <Feather name="check" size={16} color={colors.primary} />}
                    </Pressable>
                  ))}
                </>
              ) : (
                <InputField
                  label={`${track === 'equity' ? 'Equity' : 'Venture'} amount (₦)`}
                  keyboardType="decimal-pad"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
              )}

              <PrimaryButton label="Create confirmed reservation" onPress={handleSubmit} loading={saving} />
            </>
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
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted, marginBottom: spacing.xl },
  fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginBottom: 8, marginTop: spacing.sm },
  searchRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  searchBtn: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontFamily: fonts.display, fontSize: 15, color: colors.primary },
  userName: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, marginBottom: 2 },
  userMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textMuted },
  selectedUserCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl },
  selectedUserName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: '#fff', marginBottom: 2 },
  selectedUserMeta: { fontFamily: fonts.body, fontSize: 12, color: '#D8E3DC' },
  trackRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  trackChip: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  trackChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  trackChipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  trackChipTextActive: { color: '#fff' },
  pkgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  pkgRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  pkgText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.text },
});