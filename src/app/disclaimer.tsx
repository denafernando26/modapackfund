import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '../components/theme';

const POINTS = [
  'Setiap investasi mengandung risiko, termasuk risiko kehilangan sebagian atau seluruh modal yang ditanamkan.',
  'Estimasi imbal hasil yang ditampilkan merupakan proyeksi perusahaan, bukan janji atau jaminan hasil.',
  'Dana investasi bersifat tidak likuid; penarikan sebelum tenor berakhir mungkin tidak dapat dilakukan.',
  'Aplikasi ini hanya sarana informasi proyek dan pengajuan minat. Perjanjian investasi yang mengikat dibuat terpisah dan ditandatangani kedua belah pihak.',
  'Aplikasi ini tidak memproses pembayaran. Transfer dana hanya dilakukan ke rekening resmi atas nama perusahaan sebagaimana tercantum dalam perjanjian.',
  'Pastikan Anda telah membaca proposal proyek dan, bila perlu, berkonsultasi dengan penasihat keuangan independen sebelum mengambil keputusan.',
];

export default function DisclaimerScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md }}>
      <Text style={styles.title}>Harap dibaca sebelum berinvestasi</Text>
      {POINTS.map((p, i) => (
        <Text key={i} style={styles.point}>
          {i + 1}. {p}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  point: { fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: spacing.md },
});
