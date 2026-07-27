import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, type } from './theme';

/** Large bold title block, à la Apple Music section headers. */
export function LargeHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={headerStyles.wrap}>
      <View style={headerStyles.textWrap}>
        <Text style={type.largeTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={[type.footnote, headerStyles.sub]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={headerStyles.right}>{right}</View> : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  textWrap: { flex: 1 },
  sub: { marginTop: 2 },
  right: { marginLeft: spacing.md },
});

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/** The one and only button. Pill-shaped, restrained. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        btn.base,
        isPrimary && btn.primary,
        variant === 'secondary' && btn.secondary,
        isGhost && btn.ghost,
        (disabled || loading) && btn.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onAccent : colors.text} size="small" />
      ) : (
        <Text
          style={[
            btn.label,
            isPrimary ? { color: colors.onAccent } : { color: isGhost ? colors.accent : colors.text },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const btn = StyleSheet.create({
  base: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceHigh },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, fontWeight: '600' },
});

/** Inset hairline divider between list rows. */
export function Separator({ inset = spacing.lg }: { inset?: number }) {
  return <View style={[sep.line, { marginLeft: inset }]} />;
}

const sep = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
});
