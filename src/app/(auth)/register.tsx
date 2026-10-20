import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthShell } from '../../components/AuthShell';
import { colors, spacing } from '../../components/theme';
import { Button, ErrorText, Field } from '../../components/ui';
import { backend } from '../../lib/backend';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError('Nama, nomor HP, dan email wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (!agreed) {
      setError('Anda perlu menyetujui penafian risiko investasi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { needsEmailConfirmation } = await backend.signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      if (needsEmailConfirmation) {
        setInfo('Pendaftaran berhasil. Silakan konfirmasi email Anda, lalu masuk.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Daftar Investor" subtitle="Buat akun untuk mengajukan minat investasi.">
      <ErrorText message={error} />
      {info ? (
        <Text style={{ color: colors.success, marginBottom: spacing.md, fontWeight: '600' }}>{info}</Text>
      ) : null}
      <Field label="Nama lengkap (sesuai KTP)" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <Field
        label="Nomor HP / WhatsApp"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="08xxxxxxxxxx"
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field
        label="Kata sandi"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        hint="Minimal 6 karakter."
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed((v) => !v)}
        style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: agreed ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {agreed ? <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text> : null}
        </View>
        <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>
          Saya memahami bahwa setiap investasi memiliki risiko, termasuk kehilangan sebagian atau seluruh
          modal, dan imbal hasil yang ditampilkan hanyalah estimasi.
        </Text>
      </Pressable>

      <Button title="Daftar" onPress={onSubmit} loading={loading} />
      <Text style={{ textAlign: 'center', marginTop: spacing.lg, color: colors.muted }}>
        Sudah punya akun?{' '}
        <Link href="/login" style={{ color: colors.primary, fontWeight: '700' }}>
          Masuk
        </Link>
      </Text>
    </AuthShell>
  );
}
