import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../components/theme';
import { Button, Card, Centered, ErrorText, Field, Loading } from '../../components/ui';
import { backend } from '../../lib/backend';
import { formatRupiah, groupThousands, parseRupiah } from '../../lib/format';
import { useLoader } from '../../lib/useLoader';

export default function InvestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: project, loading } = useLoader(() => backend.getProject(id));
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading />;
  if (!project) {
    return (
      <Centered>
        <Text>Proyek tidak ditemukan.</Text>
      </Centered>
    );
  }

  const amount = parseRupiah(amountText);
  const remainingQuota = Math.max(0, project.targetAmount - project.raisedAmount);
  const presets = [1, 2, 5, 10].map((m) => project.minInvestment * m).filter((v) => v <= remainingQuota);
  const yearlyReturn = (amount * project.expectedReturnPct) / 100;
  const totalReturn = yearlyReturn * (project.tenorMonths / 12);

  async function onSubmit() {
    if (!project) return;
    if (amount < project.minInvestment) {
      setError(`Minimum investasi adalah ${formatRupiah(project.minInvestment)}.`);
      return;
    }
    if (amount > remainingQuota) {
      setError(`Sisa kuota pendanaan proyek ini ${formatRupiah(remainingQuota)}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await backend.submitInvestment(project.id, amount, note.trim());
      Alert.alert(
        'Pengajuan terkirim',
        'Tim investor Modapack akan menghubungi Anda untuk verifikasi data dan penandatanganan perjanjian sebelum dana ditransfer.',
        [{ text: 'Lihat Portofolio', onPress: () => router.replace('/portfolio') }],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim pengajuan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.muted}>
          Minimum {formatRupiah(project.minInvestment)} · sisa kuota {formatRupiah(remainingQuota)}
        </Text>

        <View style={{ height: spacing.lg }} />
        <ErrorText message={error} />

        <Field
          label="Nominal investasi (Rp)"
          keyboardType="number-pad"
          value={amount ? groupThousands(amount) : ''}
          onChangeText={setAmountText}
          placeholder={project.minInvestment.toString()}
        />
        <View style={styles.presets}>
          {presets.map((v) => (
            <Pressable key={v} onPress={() => setAmountText(String(v))} style={styles.preset}>
              <Text style={styles.presetText}>{formatRupiah(v)}</Text>
            </Pressable>
          ))}
        </View>

        <Field
          label="Catatan untuk tim (opsional)"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
          placeholder="Contoh: waktu terbaik untuk dihubungi"
        />

        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.simTitle}>Simulasi (estimasi)</Text>
          <Row label="Imbal hasil per tahun" value={formatRupiah(yearlyReturn)} />
          <Row label={`Total imbal hasil (${project.tenorMonths} bln)`} value={formatRupiah(totalReturn)} />
          <Row label="Perkiraan total di akhir tenor" value={formatRupiah(amount + totalReturn)} bold />
          <Text style={styles.small}>
            Simulasi menggunakan estimasi {project.expectedReturnPct}% per tahun dan tidak menjamin hasil
            sebenarnya.
          </Text>
        </Card>

        <Card style={{ marginBottom: spacing.lg, backgroundColor: colors.primaryLight, borderColor: colors.primaryLight }}>
          <Text style={styles.simTitle}>Apa yang terjadi selanjutnya?</Text>
          <Text style={styles.step}>1. Pengajuan Anda ditinjau oleh tim investor.</Text>
          <Text style={styles.step}>2. Tim menghubungi Anda untuk verifikasi identitas (KYC).</Text>
          <Text style={styles.step}>3. Penandatanganan perjanjian investasi.</Text>
          <Text style={styles.step}>4. Transfer dana ke rekening resmi perusahaan.</Text>
          <Text style={[styles.small, { color: colors.danger }]}>
            Tidak ada pembayaran di aplikasi ini. Waspadai penipuan: transfer hanya ke rekening resmi atas nama
            perusahaan yang tercantum di perjanjian.
          </Text>
        </Card>

        <Button title="Kirim Pengajuan" onPress={onSubmit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.value, bold && { color: colors.primary, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.muted, flexShrink: 1 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  presetText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  simTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginBottom: 6 },
  value: { fontSize: 14, fontWeight: '600', color: colors.text },
  small: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
  step: { fontSize: 14, color: colors.text, marginBottom: 4 },
});
