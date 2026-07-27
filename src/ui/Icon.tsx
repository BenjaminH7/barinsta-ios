import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from './theme';

/**
 * Dependency-free line icons drawn from Views. Thin strokes, monochrome,
 * tintable — the sober, Apple-flavoured look without shipping an icon font.
 */
export type IconName =
  | 'chat'
  | 'ring'
  | 'search'
  | 'person'
  | 'plus'
  | 'mic'
  | 'stop'
  | 'close'
  | 'chevron'
  | 'check';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = colors.text, strokeWidth = 2 }: Props) {
  const box: ViewStyle = { width: size, height: size, alignItems: 'center', justifyContent: 'center' };
  const line = (extra: ViewStyle): ViewStyle => ({
    position: 'absolute',
    backgroundColor: color,
    borderRadius: strokeWidth,
    ...extra,
  });

  switch (name) {
    case 'chat':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.82,
              height: size * 0.66,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRadius: size * 0.24,
              borderBottomLeftRadius: strokeWidth,
            }}
          />
        </View>
      );

    case 'ring':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.82,
              height: size * 0.82,
              borderRadius: size * 0.41,
              borderWidth: strokeWidth,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: size * 0.26,
                height: size * 0.26,
                borderRadius: size * 0.13,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'search':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              borderWidth: strokeWidth,
              borderColor: color,
              position: 'absolute',
              top: size * 0.14,
              left: size * 0.14,
            }}
          />
          <View
            style={line({
              width: strokeWidth,
              height: size * 0.26,
              bottom: size * 0.12,
              right: size * 0.16,
              transform: [{ rotate: '-45deg' }],
            })}
          />
        </View>
      );

    case 'person':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.36,
              height: size * 0.36,
              borderRadius: size * 0.18,
              borderWidth: strokeWidth,
              borderColor: color,
              position: 'absolute',
              top: size * 0.1,
            }}
          />
          <View
            style={{
              width: size * 0.66,
              height: size * 0.4,
              borderTopLeftRadius: size * 0.33,
              borderTopRightRadius: size * 0.33,
              borderWidth: strokeWidth,
              borderBottomWidth: 0,
              borderColor: color,
              position: 'absolute',
              bottom: size * 0.08,
            }}
          />
        </View>
      );

    case 'plus':
      return (
        <View style={box}>
          <View style={line({ width: size * 0.62, height: strokeWidth })} />
          <View style={line({ width: strokeWidth, height: size * 0.62 })} />
        </View>
      );

    case 'mic':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.3,
              height: size * 0.48,
              borderRadius: size * 0.15,
              backgroundColor: color,
              position: 'absolute',
              top: size * 0.1,
            }}
          />
          <View
            style={{
              width: size * 0.5,
              height: size * 0.28,
              borderBottomLeftRadius: size * 0.25,
              borderBottomRightRadius: size * 0.25,
              borderWidth: strokeWidth,
              borderTopWidth: 0,
              borderColor: color,
              position: 'absolute',
              top: size * 0.34,
            }}
          />
          <View style={line({ width: strokeWidth, height: size * 0.14, bottom: size * 0.06 })} />
        </View>
      );

    case 'stop':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: size * 0.12,
              backgroundColor: color,
            }}
          />
        </View>
      );

    case 'close':
      return (
        <View style={box}>
          <View style={line({ width: size * 0.7, height: strokeWidth, transform: [{ rotate: '45deg' }] })} />
          <View style={line({ width: size * 0.7, height: strokeWidth, transform: [{ rotate: '-45deg' }] })} />
        </View>
      );

    case 'chevron':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.34,
              height: size * 0.34,
              borderTopWidth: strokeWidth,
              borderRightWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              left: -size * 0.06,
            }}
          />
        </View>
      );

    case 'check':
      return (
        <View style={box}>
          <View
            style={{
              width: size * 0.3,
              height: size * 0.56,
              borderRightWidth: strokeWidth,
              borderBottomWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              top: -size * 0.04,
            }}
          />
        </View>
      );

    default:
      return <View style={box} />;
  }
}
