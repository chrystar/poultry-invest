import { Feather } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';

type Props = {
  title: string;
  subtitle: string;
  durationLabel: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
};

export default function InvestmentTypeCard({ title, subtitle, durationLabel, icon, active, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.card, active ? styles.cardActive : styles.cardInactive, !active && shadow.card]}
      >
        <View style={[styles.iconWrap, active && { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
          <Feather name={icon} size={18} color={active ? '#fff' : colors.primary} />
        </View>
        <Text style={[styles.title, active && { color: '#fff' }]}>{title}</Text>
        <Text style={[styles.subtitle, active && { color: '#D8E3DC' }]} numberOfLines={2}>{subtitle}</Text>
        <View style={[styles.durationPill, active && styles.durationPillActive]}>
          <Text style={[styles.duration, active && { color: '#fff' }]}>{durationLabel}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 190,
  },
  cardActive: { backgroundColor: colors.primary, ...shadow.raised },
  cardInactive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  iconWrap: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: colors.text, marginBottom: 4 },
  subtitle: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: colors.textMuted, marginBottom: spacing.md },
  durationPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
  },
  durationPillActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  duration: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.primary },
});