import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

type Props = {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({ label, onPress, variant = 'primary', loading, disabled }: Props) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.filled,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.label, isOutline ? { color: colors.primary } : { color: '#fff' }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  filled: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.2, borderColor: colors.primary },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, letterSpacing: 0.2 },
});