import React, { useState, useEffect } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MontraProvider, useMontra } from '../hooks/useMontraStore';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { MontraSplashScreen } from '../components/MontraSplashScreen';
import { MontraLockScreen } from '../components/MontraLockScreen';

// Keep the native splash screen visible until the React tree mounts
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore on reload */
});

function RootLayoutNav() {
  const {
    theme,
    typography,
    layout,
    isReady,
    uiMode,
    themeMode,
    hasCompletedOnboarding,
    isAppLocked,
    biometricPin,
    unlockApp,
  } = useMontra();
  const pathname = usePathname();
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // Once React tree is mounted, hide native splash to allow MontraSplashScreen to run
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const isAppReady = isReady && fontsLoaded && isSplashAnimationDone;

  useEffect(() => {
    if (isAppReady && !hasCompletedOnboarding && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [isAppReady, hasCompletedOnboarding, pathname]);

  if (!isAppReady) {
    return (
      <MontraSplashScreen
        onAnimationComplete={() => setIsSplashAnimationDone(true)}
      />
    );
  }

  return (
    <>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: {
            fontFamily: 'PlusJakartaSans_700Bold',
            fontSize: uiMode === 'easy' ? 22 : 18,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Montra',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            title: 'Welcome to Montra',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: 'Add Entry',
            presentation: 'modal',
            headerTitle: uiMode === 'easy' ? 'Add Transaction' : 'New Transaction',
          }}
        />
        <Stack.Screen
          name="limits"
          options={{
            title: uiMode === 'easy' ? 'Monthly Limits' : 'Budgets & Planning',
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: uiMode === 'easy' ? 'Insights & History' : 'Insights & Activity',
          }}
        />
        <Stack.Screen
          name="setup"
          options={{
            title: 'Accounts & Preferences',
          }}
        />
      </Stack>

      {/* Biometric & PIN App Lock Overlay */}
      <MontraLockScreen
        visible={isAppLocked}
        onUnlock={unlockApp}
        fallbackPin={biometricPin}
        theme={theme}
        typography={typography}
        layout={layout}
        uiMode={uiMode}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MontraProvider>
        <RootLayoutNav />
      </MontraProvider>
    </SafeAreaProvider>
  );
}
