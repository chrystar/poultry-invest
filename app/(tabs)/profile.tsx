import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const menuItems: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }[] = [
  { icon: 'briefcase', label: 'My Investments', onPress: () => router.push('/(tabs)/my-assets') },
  { icon: 'file-text', label: 'Documentation Status', onPress: () => router.push('/documentation-status') },
  { icon: 'bell', label: 'Notifications', onPress: () => router.push('/notification-settings') },
  { icon: 'shield', label: 'Security', onPress: () => router.push('/security') },
  { icon: 'help-circle', label: 'Help & Support', onPress: () => router.push('/(tabs)/others') },
];

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>

        <Pressable style={[styles.card, shadow.card]} onPress={() => router.push('/edit-profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.name}>{profile?.full_name ?? 'Loading...'}</Text>
            <Text style={styles.email}>{profile?.email ?? ''}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textFaint} />
        </Pressable>

        <View style={{ marginTop: spacing.xl }}>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={[styles.menuRow, shadow.card]} onPress={item.onPress}>
              <View style={styles.menuIconWrap}>
                <Feather name={item.icon} size={16} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutRow} onPress={handleSignOut}>
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>

        {profile?.is_admin && (
  <Pressable style={[styles.menuRow, shadow.card, { marginTop: spacing.sm }]} onPress={() => router.push('/admin')}>
    <View style={styles.menuIconWrap}>
      <Feather name="settings" size={16} color={colors.primary} />
    </View>
    <Text style={styles.menuLabel}>Admin Dashboard</Text>
    <Feather name="chevron-right" size={18} color={colors.textFaint} />
  </Pressable>
)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text, marginBottom: spacing.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display, fontSize: 20, color: colors.primary },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 15.5, color: colors.text, marginBottom: 2 },
  email: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  menuIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.md },
  logoutText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.danger },
});