import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ProjectCard } from '../../components/ProjectCard';
import { colors, spacing } from '../../components/theme';
import { Centered, ErrorText, Loading } from '../../components/ui';
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
            {FILTERS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.chip, filter === f.value && styles.chipActive]}
              >
                <Text style={[styles.chipText, filter === f.value && { color: '#fff' }]}>{f.label}</Text>
              </Pressable>
            ))}
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
});
