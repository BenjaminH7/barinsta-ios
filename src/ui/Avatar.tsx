import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from './theme';

interface Props {
  uri?: string;
  size?: number;
  ring?: boolean; // show an unseen-story ring
}

export function Avatar({ uri, size = 48, ring = false }: Props) {
  const inner = ring ? size - 6 : size;
  const dim = { width: inner, height: inner, borderRadius: inner / 2 };
  const image = uri ? (
    <Image source={{ uri }} style={dim} />
  ) : (
    <View style={[dim, styles.placeholder]} />
  );

  if (!ring) return <View style={styles.wrap}>{image}</View>;

  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  placeholder: { backgroundColor: colors.surfaceHigh },
});
