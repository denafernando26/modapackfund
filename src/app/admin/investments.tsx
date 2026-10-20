import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../components/theme';
import { Badge, Card, Centered, ChipGroup, ErrorText, Loading } from '../../components/ui';
import { backend } from '../../lib/backend';
import { formatDate, formatRupiah, INVESTMENT_STATUS_LABEL, INVESTMENT_STATUS_TONE } from '../../lib/format';
import type { InvestmentStatus } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';

const FILTERS: { label: string; value: InvestmentStatus | 'all' }[] = [
  { label: 'Menunggu', value: 'pending' },
  { label: 'Dihubungi', value: 'contacted' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Ditolak', value: 'rejected' },
  { label: 'Dibatalkan', value: 'cancelled' },
  { label: 'Semua', value: 'all' },
];

export default function AdminInvestmentsScreen() {
  const { data, error, loading, refreshing, refresh } = useLoader(() => backend.adminListInvestments());
  const [filter, setFilter] = useState<InvestmentStatus | 'all'>('pending');

  if (loading && !data) return <Loading />;

  const items = (data ?? []).filter((i) => filter === 'all' || i.status === filter);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md }}>
          <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
          <View style={{ height: spacing.md }} />
          <ErrorText message={error} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/admin/investment/${item.id}`)}>
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Text style={styles.title} numberOfLines={1}>
                {item.investor.fullName || item.investor.email || 'Investor'}
              </Text>
              <Badge label={INVESTMENT_STATUS_LABEL[item.status]} tone={INVESTMENT_STATUS_TONE[item.status]} />
            </View>
            <Text style={styles.amount}>{formatRupiah(item.amount)}</Text>
            <Text style={styles.muted} numberOfLines={1}>
              {item.projectTitle}
            </Text>
            <Text style={styles.muted}>Diajukan {formatDate(item.createdAt)}</Text>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <Centered>
          <Text style={styles.muted}>Tidak ada pengajuan dengan status ini.</Text>
        </Centered>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary, marginTop: spacing.sm },
  muted: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
