import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '../components/theme';
import { Loading } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth';

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/login');
    else if (user && inAuthGroup) router.replace('/');
  }, [user, loading, segments, router]);

  if (loading) return <Loading />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="project/[id]" options={{ title: 'Detail Proyek' }} />
      <Stack.Screen name="invest/[id]" options={{ title: 'Ajukan Minat Investasi', presentation: 'modal' }} />
      <Stack.Screen name="disclaimer" options={{ title: 'Penafian Risiko' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}
