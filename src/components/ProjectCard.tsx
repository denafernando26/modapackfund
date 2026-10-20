import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { daysLeft, formatRupiahShort, PROJECT_STATUS_LABEL } from '../lib/format';
import type { Project } from '../lib/types';
import { colors, radius, spacing } from './theme';
import { Badge, ProgressBar, Stat } from './ui';

export function ProjectCard({ project }: { project: Project }) {
  const progress = project.targetAmount > 0 ? project.raisedAmount / project.targetAmount : 0;
  const remaining = daysLeft(project.closingDate);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/project/${project.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      {project.imageUrl ? (
        <Image source={{ uri: project.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>{project.category}</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Badge label={PROJECT_STATUS_LABEL[project.status]} tone={project.status === 'open' ? 'success' : 'neutral'} />
          {project.status === 'open' && remaining !== null ? (
            <Text style={styles.muted}>{remaining} hari lagi</Text>
          ) : null}
        </View>
        <Text style={styles.title}>{project.title}</Text>
        <Text style={styles.muted}>
          {project.category} · {project.location}
        </Text>

        <View style={{ marginTop: spacing.md }}>
          <ProgressBar value={progress} />
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={styles.raised}>{formatRupiahShort(project.raisedAmount)}</Text>
            <Text style={styles.muted}>
              {Math.round(progress * 100)}% dari {formatRupiahShort(project.targetAmount)}
            </Text>
          </View>
        </View>

        <View style={[styles.row, { marginTop: spacing.md }]}>
          <Stat label="Estimasi imbal hasil" value={`${project.expectedReturnPct}% / thn`} />
          <Stat label="Tenor" value={`${project.tenorMonths} bln`} />
          <Stat label="Risiko" value={project.riskLevel} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: { width: '100%', height: 140 },
  placeholder: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.accent, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  body: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  muted: { fontSize: 13, color: colors.muted },
  raised: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
