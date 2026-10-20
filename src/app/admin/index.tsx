import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../components/theme';
import { Badge, Button, Card, ErrorText, Loading, Stat } from '../../components/ui';
import { backend } from '../../lib/backend';
import { formatRupiah, INVESTMENT_STATUS_LABEL, INVESTMENT_STATUS_TONE } from '../../lib/format';
import type { InvestmentStatus } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';

const STATUSES: InvestmentStatus[] = ['pending', 'contacted', 'approved', 'rejected', 'cancelled'];

export default function AdminDashboardScreen() {
  const { data, error, loading, refreshing, refresh } = useLoader(async () => {
    const [investments, projects] = await Promise.all([backend.adminListInvestments(), backend.adminListProjects()]);
    return { investments, projects };
  });

  if (loading && !data) return <Loading />;

  const investments = data?.investments ?? [];
  const projects = data?.projects ?? [];
  const count = (s: InvestmentStatus) => investments.filter((i) => i.status === s).length;
  const sum = (statuses: InvestmentStatus[]) =>
    investments.filter((i) => statuses.includes(i.status)).reduce((total, i) => total + i.amount, 0);

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <ErrorText message={error} />
      {backend.mode === 'demo' ? (
        <Text style={styles.muted}>Mode demo: semua akun dapat membuka panel ini dan data hanya ada di perangkat.</Text>
      ) : null}

      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>Perlu ditinjau</Text>
          <Text style={styles.summaryValue}>{count('pending')} pengajuan</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>Nominal dalam proses</Text>
          <Text style={styles.summaryValue}>{formatRupiah(sum(['pending', 'contacted']))}</Text>
        </View>
      </View>

      <Card>
        <Text style={styles.section}>Pengajuan Investasi</Text>
        <View style={styles.badges}>
          {STATUSES.map((s) => (
            <Badge key={s} label={`${INVESTMENT_STATUS_LABEL[s]}: ${count(s)}`} tone={INVESTMENT_STATUS_TONE[s]} />
          ))}
        </View>
        <View style={styles.row}>
          <Stat label="Total disetujui" value={formatRupiah(sum(['approved']))} />
          <Stat label="Jumlah pengajuan" value={String(investments.length)} />
        </View>
        <Button title="Kelola Pengajuan" onPress={() => router.push('/admin/investments')} />
      </Card>

      <Card>
        <Text style={styles.section}>Proyek</Text>
        <View style={styles.row}>
          <Stat label="Dipublikasikan" value={String(projects.filter((p) => p.published).length)} />
          <Stat label="Draf" value={String(projects.filter((p) => !p.published).length)} />
          <Stat label="Dibuka" value={String(projects.filter((p) => p.published && p.status === 'open').length)} />
        </View>
        <Button title="Kelola Proyek" onPress={() => router.push('/admin/projects')} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
  },
  summaryLabel: { color: colors.onPrimaryMuted, fontSize: 12 },
  summaryValue: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 4 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  muted: { fontSize: 13, color: colors.muted },
});
