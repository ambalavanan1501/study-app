import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native'; // Use standard RN hook
// import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '../lib/theme';
import { AppLockProvider, useAppLock } from '../contexts/AppLockContext';
import LockScreen from '../components/LockScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { registerForPushNotificationsAsync } from '../lib/notifications';
import * as Notifications from 'expo-notifications';
import { useRef } from 'react';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // const [loaded] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  // });

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    SplashScreen.hideAsync();

    // Register for notifications
    registerForPushNotificationsAsync().then(token => {
      // console.log("Init token:", token);
    });

    // Listeners for foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // console.log("Received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // console.log("User tapped:", response);
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  // if (!loaded) {
  //   return null;
  // }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <AppLockProvider>
      <ProtectedLayout theme={theme} />
    </AppLockProvider>
  );
}

function ProtectedLayout({ theme }: { theme: 'light' | 'dark' }) {
  const { isLocked, isAuthenticated } = useAppLock();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="security-settings"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Security Settings',
            headerStyle: { backgroundColor: theme === 'dark' ? '#000' : '#fff' },
            headerTintColor: theme === 'dark' ? '#fff' : '#000'
          }}
        />
      </Stack>
      {isLocked && <LockScreen />}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
