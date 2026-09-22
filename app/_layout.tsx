import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  useFonts,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  function AppContent({ onLayout }: { onLayout: () => void }) {
    usePushNotifications();
    return (
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="investment/[packageId]" options={{ presentation: 'card' }} />
          {/* ...keep all your other existing Stack.Screen entries exactly as they are */}
          <Stack.Screen name="investment-track" options={{ presentation: 'card' }} />
          <Stack.Screen name="equity" options={{ presentation: 'card' }} />
          <Stack.Screen name="reservation-confirmed" options={{ presentation: 'card' }} />
          <Stack.Screen name="ventures" options={{ presentation: 'card' }} />
          <Stack.Screen name="venture/[ventureId]" options={{ presentation: 'card' }} />
          <Stack.Screen name="track-record" options={{ presentation: 'card' }} />
          <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
          <Stack.Screen name="security" options={{ presentation: 'card' }} />
          <Stack.Screen name="notification-settings" options={{ presentation: 'card' }} />
          <Stack.Screen name="documentation-status" options={{ presentation: 'card' }} />
          <Stack.Screen name="admin" />
          <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
          <Stack.Screen name="admin/manual-reservation" options={{ presentation: 'card' }} />
          <Stack.Screen name="admin/set-batch-date" options={{ presentation: 'card' }} />          
          <Stack.Screen name="asset/[track]/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="content/[key]" options={{ presentation: 'card' }} />
          <Stack.Screen name="farm-media" options={{ presentation: 'card' }} />
          <Stack.Screen name="reset-password" options={{ presentation: 'card' }} />
          <Stack.Screen name="auth-callback" options={{ presentation: 'card' }} />
          <Stack.Screen name="equity-campaign/[campaignId]" options={{ presentation: 'card' }} />
          <Stack.Screen name="equity-campaign/media" options={{ presentation: 'card' }} />    
          <Stack.Screen name="verify-email" />
        </Stack>
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppContent onLayout={onLayout} />         
    </AuthProvider>
  );
}
