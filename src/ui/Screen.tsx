import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from './theme';

export function Screen({
  children,
  edges,
}: {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

export function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

export function Loading({ label }: { label?: string }) {
  return (
    <Centered>
      <ActivityIndicator color={colors.textMuted} />
      {label ? <Text style={styles.muted}>{label}</Text> : null}
    </Centered>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Centered>
      <Text style={styles.emptyText}>{text}</Text>
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
  muted: { ...type.footnote, marginTop: spacing.md, textAlign: 'center' },
  emptyText: { ...type.subhead, textAlign: 'center' },
});
