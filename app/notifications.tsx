import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';

const typeIconMap: Record<string, keyof typeof Feather.glyphMap> = {
  reservation: 'file-text',
  venture: 'trending-up',
  general: 'info',
};

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  const handlePress = (id: string, isRead: boolean, route: string | null) => {
    if (!isRead) markAsRead(id);
    if (route) router.push(route as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          {unreadCount > 0 && (
            <Pressable onPress={markAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.eyebrow}>UPDATES</Text>
        <Text style={styles.title}>Notifications</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="bell" size={24} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>We'll let you know when something changes.</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <Pressable
              key={n.id}
              style={[styles.card, shadow.card, !n.is_read && styles.cardUnread]}
              onPress={() => handlePress(n.id, n.is_read, n.route)}
            >
              <View style={styles.cardIconWrap}>
                <Feather name={typeIconMap[n.type] ?? 'info'} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  {!n.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardBody}>{n.body}</Text>
                <Text style={styles.cardTime}>{timeAgo(n.created_at)}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  markAllText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.primary },
  eyebrow: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.xl },
  card: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardUnread: { backgroundColor: colors.primaryMuted },
  cardIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text, flex: 1, marginRight: spacing.sm },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  cardBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, marginBottom: 4 },
  cardTime: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});