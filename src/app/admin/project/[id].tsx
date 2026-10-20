import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { colors, spacing } from '../../../components/theme';
import { Button, Card, ChipGroup, ErrorText, Field, Loading } from '../../../components/ui';
import { isoToWibDate, validateProject, wibDateToIso } from '../../../lib/admin';
import { backend } from '../../../lib/backend';
import { formatRupiah, groupThousands, parseRupiah, PROJECT_STATUS_LABEL } from '../../../lib/format';
import type { AdminProject, ProjectInput, ProjectStatus, RiskLevel } from '../../../lib/types';
import { useLoader } from '../../../lib/useLoader';

const RISKS: { label: string; value: RiskLevel }[] = [
  { label: 'Rendah', value: 'Rendah' },
  { label: 'Sedang', value: 'Sedang' },
  { label: 'Tinggi', value: 'Tinggi' },
];

const STATUSES = (Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((value) => ({
  label: PROJECT_STATUS_LABEL[value],
  value,
}));

type Form = {
  title: string;
  category: string;
  location: string;
  summary: string;
  description: string;
  imageUrl: string;
  targetAmount: string;
  raisedAmount: string;
  minInvestment: string;
  expectedReturnPct: string;
  tenorMonths: string;
  riskLevel: RiskLevel;
  status: ProjectStatus;
  closingDate: string;
  highlights: string;
  prospectusUrl: string;
  published: boolean;
};

const EMPTY: Form = {
  title: '',
  category: '',
  location: '',
  summary: '',
  description: '',
  imageUrl: '',
  targetAmount: '',
  raisedAmount: '0',
  minInvestment: '',
  expectedReturnPct: '',
  tenorMonths: '',
  riskLevel: 'Sedang',
  status: 'open',
  closingDate: '',
  highlights: '',
  prospectusUrl: '',
  published: false,
};

function toForm(p: AdminProject): Form {
  return {
    title: p.title,
    category: p.category,
    location: p.location,
    summary: p.summary,
    description: p.description,
    imageUrl: p.imageUrl ?? '',
    targetAmount: String(p.targetAmount),
    raisedAmount: String(p.raisedAmount),
    minInvestment: String(p.minInvestment),
    expectedReturnPct: String(p.expectedReturnPct).replace('.', ','),
    tenorMonths: String(p.tenorMonths),
    riskLevel: p.riskLevel,
    status: p.status,
    closingDate: isoToWibDate(p.closingDate),
    highlights: p.highlights.join('\n'),
    prospectusUrl: p.prospectusUrl ?? '',
    published: p.published,
  };
}

export default function AdminProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { data, error: loadError, loading } = useLoader(async () => {
    if (isNew) return null;
    const [project, investments] = await Promise.all([backend.adminGetProject(id), backend.adminListInvestments()]);
    const approvedTotal = investments
      .filter((i) => i.projectId === id && i.status === 'approved')
      .reduce((sum, i) => sum + i.amount, 0);
    return { project, approvedTotal };
  });

  if (loading && !isNew && !data) return <Loading />;
  if (!isNew && !data?.project) {
    return (
      <View style={{ padding: spacing.md }}>
        <ErrorText message={loadError} />
        <Text>Proyek tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <ProjectForm
      id={isNew ? null : id}
      initial={data?.project ? toForm(data.project) : EMPTY}
      approvedTotal={data?.approvedTotal ?? null}
    />
  );
}

/** Formulir terpisah agar isian awal diambil sekali dan tidak tertimpa saat layar dimuat ulang. */
function ProjectForm({ id, initial, approvedTotal }: { id: string | null; initial: Form; approvedTotal: number | null }) {
  const isNew = id === null;
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function onSave() {
    const closingDate = form.closingDate.trim() ? wibDateToIso(form.closingDate.trim()) : null;
    if (form.closingDate.trim() && !closingDate) {
      setError('Tanggal penutupan harus berformat TTTT-BB-HH, contoh 2026-12-31.');
      return;
    }
    const input: ProjectInput = {
      title: form.title.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim() || null,
      targetAmount: parseRupiah(form.targetAmount),
      raisedAmount: parseRupiah(form.raisedAmount),
      minInvestment: parseRupiah(form.minInvestment),
      expectedReturnPct: Number(form.expectedReturnPct.replace(',', '.')),
      tenorMonths: Number(form.tenorMonths),
      riskLevel: form.riskLevel,
      status: form.status,
      closingDate,
      highlights: form.highlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean),
      prospectusUrl: form.prospectusUrl.trim() || null,
      published: form.published,
    };
    const invalid = validateProject(input);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await backend.adminSaveProject(id, input);
      Alert.alert('Tersimpan', input.published ? 'Proyek tampil untuk investor.' : 'Proyek disimpan sebagai draf.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan proyek.');
    } finally {
      setSaving(false);
    }
  }

  const amountProps = (key: 'targetAmount' | 'raisedAmount' | 'minInvestment') => ({
    keyboardType: 'number-pad' as const,
    value: form[key] ? groupThousands(parseRupiah(form[key])) : '',
    onChangeText: set(key),
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isNew ? 'Tambah Proyek' : 'Ubah Proyek' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.section}>Publikasikan</Text>
              <Text style={styles.muted}>Bila mati, proyek tersimpan sebagai draf dan tidak terlihat investor.</Text>
            </View>
            <Switch
              value={form.published}
              onValueChange={set('published')}
              trackColor={{ true: colors.accentStrong, false: colors.border }}
              thumbColor={form.published ? colors.primary : colors.card}
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>Informasi Proyek</Text>
          <Field label="Judul *" value={form.title} onChangeText={set('title')} />
          <Field label="Kategori *" value={form.category} onChangeText={set('category')} placeholder="Contoh: Manufaktur" />
          <Field label="Lokasi" value={form.location} onChangeText={set('location')} />
          <Field label="Ringkasan" value={form.summary} onChangeText={set('summary')} multiline style={styles.multiline} />
          <Field
            label="Deskripsi lengkap"
            value={form.description}
            onChangeText={set('description')}
            multiline
            style={[styles.multiline, { minHeight: 120 }]}
          />
          <Field
            label="Poin utama"
            value={form.highlights}
            onChangeText={set('highlights')}
            multiline
            style={styles.multiline}
            hint="Satu poin per baris."
          />
          <Field
            label="URL gambar"
            value={form.imageUrl}
            onChangeText={set('imageUrl')}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://…"
          />
          <Field
            label="URL prospektus"
            value={form.prospectusUrl}
            onChangeText={set('prospectusUrl')}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://…"
          />
        </Card>

        <Card>
          <Text style={styles.section}>Pendanaan</Text>
          <Field label="Target dana (Rp) *" {...amountProps('targetAmount')} />
          <Field label="Minimum investasi (Rp) *" {...amountProps('minInvestment')} />
          <Field
            label="Dana terkumpul (Rp)"
            {...amountProps('raisedAmount')}
            hint={
              approvedTotal !== null
                ? `Isi setelah dana benar-benar masuk rekening. Acuan: total pengajuan disetujui ${formatRupiah(approvedTotal)}.`
                : 'Isi setelah dana benar-benar masuk rekening.'
            }
          />
          <Field
            label="Estimasi imbal hasil per tahun (%)"
            keyboardType="decimal-pad"
            value={form.expectedReturnPct}
            onChangeText={set('expectedReturnPct')}
            placeholder="Contoh: 12,5"
          />
          <Field label="Tenor (bulan) *" keyboardType="number-pad" value={form.tenorMonths} onChangeText={set('tenorMonths')} />
          <Field
            label="Tanggal penutupan"
            value={form.closingDate}
            onChangeText={set('closingDate')}
            placeholder="TTTT-BB-HH, contoh 2026-12-31"
            hint="Kosongkan bila tanpa batas. Pengajuan ditutup pukul 23.59 WIB."
          />
          <Text style={styles.label}>Tingkat risiko</Text>
          <ChipGroup options={RISKS} value={form.riskLevel} onChange={set('riskLevel')} />
          <Text style={[styles.label, { marginTop: spacing.md }]}>Status proyek</Text>
          <ChipGroup options={STATUSES} value={form.status} onChange={set('status')} />
        </Card>

        <ErrorText message={error} />
        <Button title={isNew ? 'Simpan Proyek Baru' : 'Simpan Perubahan'} onPress={onSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  muted: { fontSize: 13, color: colors.muted },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
