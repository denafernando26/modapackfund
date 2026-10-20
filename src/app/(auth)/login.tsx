import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { AuthShell } from '../../components/AuthShell';
import { colors, spacing } from '../../components/theme';
import { Button, ErrorText, Field } from '../../components/ui';
import { backend } from '../../lib/backend';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await backend.signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Masuk" subtitle="Pantau proyek dan minat investasi Anda.">
      <ErrorText message={error} />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="nama@email.com"
      />
      <Field
        label="Kata sandi"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="••••••••"
      />
      <Button title="Masuk" onPress={onSubmit} loading={loading} />
      <Text style={{ textAlign: 'center', marginTop: spacing.lg, color: colors.muted }}>
        Belum punya akun?{' '}
        <Link href="/register" style={{ color: colors.primary, fontWeight: '700' }}>
          Daftar sebagai investor
        </Link>
      </Text>
    </AuthShell>
  );
}
