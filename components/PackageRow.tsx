import { Feather } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';

type Props = { birds: number; amount: number; duration: string; onPress: () => void };

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function PackageRow({ birds, amount, duration, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[styles.row, shadow.card]}>
        <View style={styles.birdIconWrap}>
          <Feather name="feather" size={15} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.birds}>{birds.toLocaleString()} birds</Text>
          <Text style={styles.meta}>{duration} cycle</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatNaira(amount)}</Text>
          <Feather name="chevron-right" size={18} color={colors.textFaint} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  birdIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  birds: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 2 },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amount: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.gold },
});