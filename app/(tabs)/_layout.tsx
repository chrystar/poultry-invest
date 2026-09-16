import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../constants/theme';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: keyof typeof Feather.glyphMap; label: string }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
        <Feather name={icon} size={17} color={focused ? '#fff' : colors.textFaint} />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 82,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="home" label="Home" /> }} />
      <Tabs.Screen name="investment" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="trending-up" label="Invest" /> }} />
      <Tabs.Screen name="my-assets" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="briefcase" label="My Assets" /> }} />
      <Tabs.Screen name="more" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="grid" label="More" /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="user" label="Profile" /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4, width: 64 },
  iconBox: {
    width: 34, height: 34, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBoxActive: { backgroundColor: colors.primary },
  label: { fontFamily: fonts.bodyMedium, fontSize: 10.5, color: colors.textFaint },
  labelActive: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});