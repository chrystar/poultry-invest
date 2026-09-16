import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

type Props = {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
};

export default function TypeToggle({ options, active, onChange }: Props) {
  const index = options.findIndex((o) => o.id === active);
  const translateX = useRef(new Animated.Value(0)).current;
  const width = 100 / options.length;

  useEffect(() => {
    Animated.spring(translateX, { toValue: index, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [index]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.thumb,
          {
            width: `${width}%`,
            transform: [{
              translateX: translateX.interpolate({
                inputRange: options.map((_, i) => i),
                outputRange: options.map((_, i) => i * (100 / options.length)),
              }).interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            }],
          },
        ]}
      />
      {options.map((opt) => (
        <Pressable key={opt.id} style={styles.item} onPress={() => onChange(opt.id)}>
          <Text style={[styles.label, active === opt.id && styles.labelActive]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    padding: 4,
    position: 'relative',
    marginBottom: spacing.lg,
  },
  thumb: {
    position: 'absolute',
    top: 4, bottom: 4, left: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  item: { flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.primary },
  labelActive: { color: '#fff' },
});