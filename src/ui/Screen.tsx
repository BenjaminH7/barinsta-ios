import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from './theme';

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}

export function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

export function Loading({ label }: { label?: string }) {
  return (
    <Centered>
      <ActivityIndicator color={colors.accent} />
      {label ? <Text style={styles.muted}>{label}</Text> : null}
    </Centered>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Centered>
      <Text style={styles.muted}>{text}</Text>
    </Centered>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  muted: { color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
});
