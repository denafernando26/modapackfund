import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { backend } from '../lib/backend';
import { colors, radius, spacing } from './theme';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.logo}>MODAPACK</Text>
            <Text style={styles.logoSub}>FUND</Text>
          </View>
          <View style={styles.panel}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {backend.mode === 'demo' ? (
              <Text style={styles.demo}>
                Mode demo: data tersimpan di perangkat ini saja. Hubungkan Supabase untuk produksi.
              </Text>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  brand: { alignItems: 'center', marginBottom: spacing.lg },
  logo: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 4 },
  logoSub: { color: colors.accent, fontSize: 16, fontWeight: '800', letterSpacing: 8 },
  panel: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  demo: {
    fontSize: 12,
    color: colors.warning,
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
});
