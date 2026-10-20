import { router } from 'expo-router';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../components/theme';
import { Badge, Button, Card, Centered, ErrorText, Loading } from '../../components/ui';
import { backend } from '../../lib/backend';
import { formatDate, formatRupiah, INVESTMENT_STATUS_LABEL, INVESTMENT_STATUS_TONE } from '../../lib/format';
import type { Investment } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';

export default function PortfolioScreen() {
  const { data, error, loading, refreshing, refresh } = useLoader(() => backend.listMyInvestments());

  if (loading && !data) return <Loading />;

  const items = data ?? [];
  const approvedTotal = items.filter((i) => i.status === 'approved').reduce((s, i) => s + i.amount, 0);
  const pendingTotal = items
    .filter((i) => i.status === 'pending' || i.status === 'contacted')
    .reduce((s, i) => s + i.amount, 0);

  function confirmCancel(item: Investment) {
    Alert.alert('Batalkan pengajuan?', `Pengajuan untuk "${item.projectTitle}" akan dibatalkan.`, [
      { text: 'Tidak', style: 'cancel' },
      {
        text: 'Ya, batalkan',
        style: 'destructive',
        onPress: async () => {
          try {
            await backend.cancelInvestment(item.id);
            refresh();
          } catch (e) {
            Alert.alert('Gagal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
          }
        },
      },
    ]);
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          <ErrorText message={error} />
          <View style={styles.summary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Investasi disetujui</Text>
              <Text style={styles.summaryValue}>{formatRupiah(approvedTotal)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Dalam proses</Text>
              <Text style={styles.summaryValue}>{formatRupiah(pendingTotal)}</Text>
            </View>
          </View>
          {items.length > 0 ? <Text style={styles.heading}>Riwayat Pengajuan</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <Card style={{ marginBottom: spacing.sm }}>
          <View style={styles.row}>
            <Text style={styles.title} numberOfLines={2}>
              {item.projectTitle}
            </Text>
            <Badge label={INVESTMENT_STATUS_LABEL[item.status]} tone={INVESTMENT_STATUS_TONE[item.status]} />
          </View>
          <Text style={styles.amount}>{formatRupiah(item.amount)}</Text>
          <Text style={styles.muted}>Diajukan {formatDate(item.createdAt)}</Text>
          {item.note ? <Text style={[styles.muted, { marginTop: 4 }]}>Catatan: {item.note}</Text> : null}
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <Button
              title="Lihat proyek"
              variant="outline"
              style={{ flex: 1, minHeight: 40 }}
              onPress={() => router.push(`/project/${item.projectId}`)}
            />
            {item.status === 'pending' ? (
              <Button
                title="Batalkan"
                variant="danger"
                style={{ flex: 1, minHeight: 40 }}
                onPress={() => confirmCancel(item)}
              />
            ) : null}
          </View>
        </Card>
      )}
      ListEmptyComponent={
        <Centered>
          <Text style={[styles.muted, { textAlign: 'center', marginBottom: spacing.md }]}>
            Anda belum mengajukan minat investasi.
          </Text>
          <Button title="Jelajahi Proyek" onPress={() => router.navigate('/')} />
        </Centered>
      }
    />
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryLabel: { color: colors.onPrimaryMuted, fontSize: 12 },
  summaryValue: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 4 },
  heading: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary, marginTop: spacing.sm },
  muted: { fontSize: 13, color: colors.muted },
});
