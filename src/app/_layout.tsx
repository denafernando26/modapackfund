import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '../components/theme';
import { Loading } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth';

function AuthGate() {
  const { user, isAdmin, loading } = useAuth();
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
      {/* Hanya mencegah navigasi; hak akses sebenarnya ditegakkan oleh RLS di Supabase. */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="admin/index" options={{ title: 'Panel Admin' }} />
        <Stack.Screen name="admin/investments" options={{ title: 'Pengajuan Investasi' }} />
        <Stack.Screen name="admin/investment/[id]" options={{ title: 'Detail Pengajuan' }} />
        <Stack.Screen name="admin/projects" options={{ title: 'Kelola Proyek' }} />
        <Stack.Screen name="admin/project/[id]" options={{ title: 'Data Proyek' }} />
      </Stack.Protected>
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
