import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { DrawerProvider } from '@/components/Drawer';
import { UnreachableScreen } from '@/components/UnreachableScreen';
import { AppThemeProvider, useTheme } from '@/theme';

// Keep the splash up until the stored session has been checked, so no screen flashes first.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <ThemedRoot />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot() {
  const { navigationTheme, scheme } = useTheme();
  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <SplashController />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function SplashController() {
  const { status } = useAuth();
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);
  return null;
}

function RootNavigator() {
  const { status } = useAuth();
  const { colors } = useTheme();

  /** Native header for the stack screens opened from the tabs and the menu. */
  const header = useMemo(
    () =>
      ({
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.brand,
        headerTitleStyle: { color: colors.ink },
        headerShadowVisible: false,
        headerBackTitle: 'Geri',
        animation: 'slide_from_right',
      }) as const,
    [colors]
  );
  const modal = useMemo(() => ({ ...header, presentation: 'modal', animation: 'slide_from_bottom' }) as const, [header]);

  if (status === 'loading') return null;
  if (status === 'unreachable') return <UnreachableScreen />;

  const signedIn = status === 'signedIn';
  return (
    <DrawerProvider enabled={signedIn}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.canvas } }}>
        {/* A guard turning false removes that screen's history and redirects to the first allowed screen.
            Every signed-in route is listed here: routes left out of a guard are reachable without one. */}
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="appointment/new" options={{ ...modal, title: 'Yeni randevu' }} />
          <Stack.Screen name="customers" options={{ ...header, title: 'Müşteriler' }} />
          <Stack.Screen name="customers/[id]" options={{ ...header, title: 'Müşteri' }} />
          <Stack.Screen name="services" options={{ ...header, title: 'Hizmetler' }} />
          <Stack.Screen name="services/edit" options={{ ...header, title: 'Hizmet' }} />
          <Stack.Screen name="employees" options={{ ...header, title: 'Çalışanlar' }} />
          <Stack.Screen name="employees/edit" options={{ ...header, title: 'Çalışan' }} />
          <Stack.Screen name="tables" options={{ ...header, title: 'Masa Planı' }} />
          <Stack.Screen name="tables/edit" options={{ ...header, title: 'Masa' }} />
          <Stack.Screen name="reviews" options={{ ...header, title: 'Yorumlar' }} />
          <Stack.Screen name="analytics" options={{ ...header, title: 'İstatistikler' }} />
          <Stack.Screen name="page-builder" options={{ ...header, title: 'Web Sitesi Düzenleyici' }} />
          <Stack.Screen name="gallery" options={{ ...header, title: 'Galeri & Portföy' }} />
          <Stack.Screen name="subscription" options={{ ...header, title: 'Abonelik' }} />
          <Stack.Screen name="settings" options={{ ...header, title: 'İşletme Ayarları' }} />
          <Stack.Screen name="settings/business" options={{ ...header, title: 'İşletme bilgileri' }} />
          <Stack.Screen name="settings/hours" options={{ ...header, title: 'Çalışma saatleri' }} />
          <Stack.Screen name="support" options={{ ...header, title: 'Destek' }} />
          <Stack.Screen name="support/new" options={{ ...modal, title: 'Yeni destek talebi' }} />
          <Stack.Screen name="support/[id]" options={{ ...header, title: 'Destek talebi' }} />
          <Stack.Screen name="profile/edit" options={{ ...header, title: 'Profili düzenle' }} />
          <Stack.Screen name="profile/password" options={{ ...header, title: 'Şifre değiştir' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
      </Stack>
    </DrawerProvider>
  );
}
