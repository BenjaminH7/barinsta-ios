import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from './theme';

interface Props {
  uri?: string;
  size?: number;
  ring?: boolean; // show a story ring
}

export function Avatar({ uri, size = 48, ring = false }: Props) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      style={[
        styles.wrap,
        dim,
        ring && { borderWidth: 2, borderColor: colors.accent },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={dim} />
      ) : (
        <View style={[dim, styles.placeholder]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  placeholder: { backgroundColor: colors.surfaceAlt },
});
