import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProviders } from '@/src/providers';
import { createNavigationTheme } from '@/src/theme';

// The app's real entry flow is "/" -> AuthGate -> role group (see app/index.tsx),
// not the stock Expo template's (tabs) group.
export const unstable_settings = {
  anchor: '(public)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const appColorScheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <AppProviders colorScheme={appColorScheme}>
      <NavigationThemeProvider value={createNavigationTheme(appColorScheme)}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
          <Stack.Screen name="(setup)" options={{ headerShown: false }} />
          <Stack.Screen name="(patient)" options={{ headerShown: false }} />
          <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
          <Stack.Screen name="(staff)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
        </Stack>
        <StatusBar style="auto" />
      </NavigationThemeProvider>
    </AppProviders>
  );
}
