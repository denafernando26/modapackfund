import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../components/theme';
import { Badge, Button, Card, Centered, ErrorText, Loading, ProgressBar } from '../../components/ui';
import { backend } from '../../lib/backend';
import { formatRupiahShort, PROJECT_STATUS_LABEL } from '../../lib/format';
import { useLoader } from '../../lib/useLoader';

export default function AdminProjectsScreen() {
  const { data, error, loading, refreshing, refresh } = useLoader(() => backend.adminListProjects());

  if (loading && !data) return <Loading />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md }}>
          <ErrorText message={error} />
          <Button title="+ Tambah Proyek" onPress={() => router.push('/admin/project/new')} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/admin/project/${item.id}`)}>
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Badge label={item.published ? 'Dipublikasikan' : 'Draf'} tone={item.published ? 'success' : 'warning'} />
            </View>
            <Text style={styles.muted}>
              {PROJECT_STATUS_LABEL[item.status]} · {item.category}
            </Text>
            <View style={{ marginVertical: spacing.sm }}>
              <ProgressBar value={item.raisedAmount / item.targetAmount} />
            </View>
            <Text style={styles.muted}>
              {formatRupiahShort(item.raisedAmount)} dari {formatRupiahShort(item.targetAmount)}
            </Text>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <Centered>
          <Text style={styles.muted}>Belum ada proyek.</Text>
        </Centered>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
