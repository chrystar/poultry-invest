import { Feather } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../constants/theme';

type Props = {
  birds: number;
  amount: number;
  estimatedProfit: number;
  duration: string;
  recommended?: boolean;
  onPress: () => void;
};

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export default function PackageCard({ birds, amount, estimatedProfit, duration, recommended, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const roi = Math.round((estimatedProfit / amount) * 100);

  const pressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: spacing.md }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[styles.card, shadow.card]}>
        {recommended && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MOST POPULAR</Text>
          </View>
        )}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.birds}>{birds.toLocaleString()} Birds</Text>
            <Text style={styles.duration}>{duration} cycle</Text>
          </View>
          <View style={styles.roiPill}>
            <Feather name="trending-up" size={11} color={colors.primary} />
            <Text style={styles.roiText}>{roi}% ROI</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.figureLabel}>Investment</Text>
            <Text style={styles.figureValue}>{formatNaira(amount)}</Text>
          </View>
          
          <Feather name="arrow-right" size={14} color={colors.textFaint} style={{ marginHorizontal: spacing.sm }} />
          <View>
            <Text style={styles.figureLabel}>Est. Profit</Text>
            <Text style={[styles.figureValue, { color: colors.gold }]}>{formatNaira(estimatedProfit)}</Text>
          </View>
      
          <View style={{ flex: 1 }} />
          <View style={styles.arrowBtn}>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, position: 'relative' },
  badge: {
    position: 'absolute', top: -1, right: spacing.md,
    backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 4,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9.5, color: '#fff', letterSpacing: 0.5 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md, marginTop: spacing.xs },
  birds: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.text, marginBottom: 2 },
  duration: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted },
  roiPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryMuted, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  roiText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  figureLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint, marginBottom: 2 },
  figureValue: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.text },
  arrowBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
});