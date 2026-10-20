import { Link, router, useLocalSearchParams } from 'expo-router';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../components/theme';
import { Badge, Button, Card, Centered, Loading, ProgressBar, Stat } from '../../components/ui';
import { backend, contact } from '../../lib/backend';
import { daysLeft, formatDate, formatRupiah, formatRupiahShort, PROJECT_STATUS_LABEL } from '../../lib/format';
import { useLoader } from '../../lib/useLoader';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: project, loading, error } = useLoader(() => backend.getProject(id));

  if (loading) return <Loading />;
  if (!project) {
    return (
      <Centered>
        <Text style={styles.muted}>{error ?? 'Proyek tidak ditemukan.'}</Text>
      </Centered>
    );
  }

  const progress = project.targetAmount > 0 ? project.raisedAmount / project.targetAmount : 0;
  const remaining = daysLeft(project.closingDate);
  const isOpen = project.status === 'open';

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {project.imageUrl ? (
          <Image source={{ uri: project.imageUrl }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroText}>{project.category}</Text>
          </View>
        )}

        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View>
            <Badge label={PROJECT_STATUS_LABEL[project.status]} tone={isOpen ? 'success' : 'neutral'} />
            <Text style={styles.title}>{project.title}</Text>
            <Text style={styles.muted}>
              {project.category} · {project.location}
            </Text>
          </View>

          <Card>
            <Text style={styles.raised}>{formatRupiah(project.raisedAmount)}</Text>
            <Text style={styles.muted}>terkumpul dari target {formatRupiah(project.targetAmount)}</Text>
            <View style={{ marginVertical: spacing.sm }}>
              <ProgressBar value={progress} />
            </View>
            <Text style={styles.muted}>
              {Math.round(progress * 100)}% terpenuhi
              {isOpen && project.closingDate
                ? ` · ditutup ${formatDate(project.closingDate)} (${remaining} hari lagi)`
                : ''}
            </Text>
          </Card>

          <Card>
            <View style={styles.statsRow}>
              <Stat label="Estimasi imbal hasil" value={`${project.expectedReturnPct}% / thn`} />
              <Stat label="Tenor" value={`${project.tenorMonths} bulan`} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.md }]}>
              <Stat label="Minimum investasi" value={formatRupiahShort(project.minInvestment)} />
              <Stat label="Tingkat risiko" value={project.riskLevel} />
            </View>
          </Card>

          <View>
            <Text style={styles.section}>Tentang Proyek</Text>
            <Text style={styles.body}>{project.description}</Text>
          </View>

          {project.highlights.length > 0 ? (
            <View>
              <Text style={styles.section}>Poin Utama</Text>
              {project.highlights.map((h) => (
                <Text key={h} style={styles.body}>
                  •  {h}
                </Text>
              ))}
            </View>
          ) : null}

          {project.prospectusUrl ? (
            <Button
              title="Lihat Prospektus / Proposal"
              variant="outline"
              onPress={() => Linking.openURL(project.prospectusUrl!)}
            />
          ) : null}

          {contact.whatsapp ? (
            <Button
              title="Tanya Tim Investor via WhatsApp"
              variant="outline"
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                    `Halo, saya ingin bertanya tentang proyek "${project.title}".`,
                  )}`,
                )
              }
            />
          ) : null}

          <Text style={styles.disclaimer}>
            Estimasi imbal hasil bukan jaminan. Baca{' '}
            <Link href="/disclaimer" style={{ color: colors.primary, fontWeight: '700' }}>
              penafian risiko
            </Link>{' '}
            sebelum berinvestasi.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isOpen ? 'Ajukan Minat Investasi' : 'Penggalangan Ditutup'}
          disabled={!isOpen}
          onPress={() => router.push(`/invest/${project.id}`)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 200 },
  heroPlaceholder: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  heroText: { color: colors.accent, fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  muted: { fontSize: 13, color: colors.muted },
  raised: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  disclaimer: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
