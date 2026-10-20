import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../components/theme';
import { Badge, Button, Card, Centered, ErrorText, Field, Loading } from '../../../components/ui';
import { ADMIN_TRANSITIONS, toWhatsAppNumber } from '../../../lib/admin';
import { backend } from '../../../lib/backend';
import { formatDate, formatRupiah, INVESTMENT_STATUS_LABEL, INVESTMENT_STATUS_TONE } from '../../../lib/format';
import type { InvestmentStatus } from '../../../lib/types';
import { useLoader } from '../../../lib/useLoader';

const ACTION_LABEL: Record<InvestmentStatus, string> = {
  pending: 'Kembalikan ke Menunggu',
  contacted: 'Tandai Sudah Dihubungi',
  approved: 'Setujui',
  rejected: 'Tolak',
  cancelled: 'Batalkan',
};

export default function AdminInvestmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, refresh } = useLoader(async () => {
    const [investment, history] = await Promise.all([
      backend.adminGetInvestment(id),
      backend.adminInvestmentHistory(id),
    ]);
    return { investment, history };
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading && !data) return <Loading />;
  const investment = data?.investment;
  if (!investment) {
    return (
      <Centered>
        <ErrorText message={error} />
        <Text>Pengajuan tidak ditemukan.</Text>
      </Centered>
    );
  }

  const { investor } = investment;
  const whatsapp = toWhatsAppNumber(investor.phone);
  const actions = ADMIN_TRANSITIONS[investment.status];

  function confirmStatus(status: InvestmentStatus) {
    Alert.alert(
      `${ACTION_LABEL[status]}?`,
      `Status pengajuan ${formatRupiah(investment!.amount)} akan diubah menjadi "${INVESTMENT_STATUS_LABEL[status]}". Investor melihat status ini di menu Portofolio.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, ubah',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setSaving(true);
            setActionError(null);
            try {
              await backend.adminSetInvestmentStatus(investment!.id, status, note.trim());
              setNote('');
              refresh();
            } catch (e) {
              setActionError(e instanceof Error ? e.message : 'Gagal mengubah status.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }} keyboardShouldPersistTaps="handled">
        <ErrorText message={error} />
        <Card>
          <View style={styles.row}>
            <Text style={styles.amount}>{formatRupiah(investment.amount)}</Text>
            <Badge label={INVESTMENT_STATUS_LABEL[investment.status]} tone={INVESTMENT_STATUS_TONE[investment.status]} />
          </View>
          <Text style={styles.link} onPress={() => router.push(`/admin/project/${investment.projectId}`)}>
            {investment.projectTitle}
          </Text>
          <Text style={styles.muted}>Diajukan {formatDate(investment.createdAt)}</Text>
          {investment.note ? <Text style={[styles.text, { marginTop: spacing.sm }]}>Catatan investor: {investment.note}</Text> : null}
        </Card>

        <Card>
          <Text style={styles.section}>Investor</Text>
          <Info label="Nama" value={investor.fullName} />
          <Info label="Email" value={investor.email} />
          <Info label="HP / WhatsApp" value={investor.phone} />
          <Info label="Kota" value={investor.city} />
          <Info label="Pekerjaan" value={investor.occupation} />
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            {whatsapp ? (
              <Button title="WhatsApp" variant="outline" onPress={() => Linking.openURL(`https://wa.me/${whatsapp}`)} />
            ) : null}
            {investor.phone ? (
              <Button title="Telepon" variant="outline" onPress={() => Linking.openURL(`tel:${investor.phone}`)} />
            ) : null}
            {investor.email ? (
              <Button title="Email" variant="outline" onPress={() => Linking.openURL(`mailto:${investor.email}`)} />
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>Ubah Status</Text>
          {actions.length === 0 ? (
            <Text style={styles.muted}>Pengajuan yang dibatalkan investor tidak dapat diubah.</Text>
          ) : (
            <>
              <ErrorText message={actionError} />
              <Field
                label="Catatan internal (opsional)"
                value={note}
                onChangeText={setNote}
                multiline
                style={{ minHeight: 70, textAlignVertical: 'top' }}
                placeholder="Contoh: sudah dihubungi via WhatsApp, menunggu KTP"
                hint="Disimpan di riwayat status. Tidak terlihat oleh investor."
              />
              <View style={{ gap: spacing.sm }}>
                {actions.map((status) => (
                  <Button
                    key={status}
                    title={ACTION_LABEL[status]}
                    variant={status === 'rejected' ? 'danger' : status === 'approved' ? 'primary' : 'outline'}
                    disabled={saving}
                    onPress={() => confirmStatus(status)}
                  />
                ))}
              </View>
            </>
          )}
        </Card>

        <Card>
          <Text style={styles.section}>Riwayat Status</Text>
          {(data?.history ?? []).length === 0 ? <Text style={styles.muted}>Belum ada riwayat.</Text> : null}
          {(data?.history ?? []).map((h) => (
            <View key={h.id} style={styles.history}>
              <Text style={styles.text}>
                {h.fromStatus ? `${INVESTMENT_STATUS_LABEL[h.fromStatus]} → ` : ''}
                <Text style={{ fontWeight: '700' }}>{INVESTMENT_STATUS_LABEL[h.toStatus]}</Text>
              </Text>
              <Text style={styles.muted}>
                {formatDate(h.createdAt)} · {h.changedBy || 'Supabase Dashboard'}
              </Text>
              {h.note ? <Text style={styles.text}>{h.note}</Text> : null}
            </View>
          ))}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.text, { flexShrink: 1, textAlign: 'right' }]} selectable>
        {value || '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  amount: { fontSize: 22, fontWeight: '800', color: colors.primary },
  link: { fontSize: 15, fontWeight: '700', color: colors.accentStrong, marginTop: spacing.sm },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  text: { fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  info: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginBottom: 6 },
  history: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: spacing.sm, marginBottom: spacing.sm },
});
