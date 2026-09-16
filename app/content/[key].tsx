import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '../../constants/theme';
import { useAppContent } from '../../hooks/useAppContent';

export default function ContentScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { content, loading } = useAppContent(key ?? '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : content ? (
          <>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.body}>{content.body}</Text>
          </>
        ) : (
          <Text style={styles.body}>Content not available.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginBottom: spacing.lg },
  body: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 23, color: colors.textMuted },
});