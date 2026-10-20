import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ProjectCard } from '../../components/ProjectCard';
import { colors, spacing } from '../../components/theme';
import { Centered, ChipGroup, ErrorText, Loading } from '../../components/ui';
import { backend } from '../../lib/backend';
import type { ProjectStatus } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Dibuka', value: 'open' },
  { label: 'Berjalan', value: 'running' },
  { label: 'Selesai', value: 'completed' },
];

export default function ProjectsScreen() {
  const { data, error, loading, refreshing, refresh } = useLoader(() => backend.listProjects());
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');

  if (loading && !data) return <Loading />;

  const projects = (data ?? []).filter((p) => filter === 'all' || p.status === filter);

  return (
    <FlatList
      data={projects}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>Peluang Investasi</Text>
          <Text style={styles.sub}>Pilih proyek Modapack yang ingin Anda danai.</Text>
          <View style={styles.filters}>
            <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
          </View>
          <ErrorText message={error} />
        </View>
      }
      renderItem={({ item }) => <ProjectCard project={item} />}
      ListEmptyComponent={
        <Centered>
          <Text style={styles.sub}>Belum ada proyek pada kategori ini.</Text>
        </Centered>
      }
    />
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  filters: { marginVertical: spacing.md },
});
