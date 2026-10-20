import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../components/theme';
import { Button, Card, ErrorText, Field, Loading } from '../../components/ui';
import { backend, contact } from '../../lib/backend';
import { useLoader } from '../../lib/useLoader';

export default function ProfileScreen() {
  const { data: profile, loading } = useLoader(() => backend.getProfile());
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setCity(profile.city);
    setOccupation(profile.occupation);
  }, [profile]);

  if (loading && !profile) return <Loading />;

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      await backend.updateProfile({ fullName: fullName.trim(), phone: phone.trim(), city: city.trim(), occupation: occupation.trim() });
      Alert.alert('Tersimpan', 'Profil Anda berhasil diperbarui.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Hapus akun?',
      'Akun dan seluruh data pengajuan Anda akan dihapus permanen. Investasi yang sudah berjalan tetap diatur oleh perjanjian yang telah ditandatangani.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus akun',
          style: 'destructive',
          onPress: async () => {
            try {
              await backend.deleteAccount();
            } catch (e) {
              Alert.alert('Gagal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.email}>{profile?.email}</Text>
        <Text style={styles.muted}>Akun investor</Text>
      </Card>

      <Card>
        <Text style={styles.section}>Data Diri</Text>
        <ErrorText message={error} />
        <Field label="Nama lengkap" value={fullName} onChangeText={setFullName} />
        <Field label="Nomor HP / WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Kota domisili" value={city} onChangeText={setCity} />
        <Field label="Pekerjaan" value={occupation} onChangeText={setOccupation} />
        <Button title="Simpan Profil" onPress={onSave} loading={saving} />
      </Card>

      <Card>
        <Text style={styles.section}>Bantuan</Text>
        <View style={{ gap: spacing.sm }}>
          {contact.whatsapp ? (
            <Button
              title="Hubungi Tim Investor (WhatsApp)"
              variant="outline"
              onPress={() => Linking.openURL(`https://wa.me/${contact.whatsapp}`)}
            />
          ) : null}
          {contact.email ? (
            <Button
              title={`Email ${contact.email}`}
              variant="outline"
              onPress={() => Linking.openURL(`mailto:${contact.email}`)}
            />
          ) : null}
          <Button title="Penafian Risiko" variant="outline" onPress={() => router.push('/disclaimer')} />
        </View>
      </Card>

      <Button title="Keluar" variant="outline" onPress={() => backend.signOut()} />
      <Button title="Hapus Akun" variant="danger" onPress={confirmDelete} />
      <Text style={[styles.muted, { textAlign: 'center' }]}>
        Modapack Fund v1.0.0{backend.mode === 'demo' ? ' · mode demo' : ''}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  email: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
});
