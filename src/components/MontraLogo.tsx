import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';

export interface MontraMonogramProps {
  /** Size in pixels (width and height) */
  size?: number;
  /** Whether to show a soft tactile shadow */
  withShadow?: boolean;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
  /** Optional image style override */
  imageStyle?: StyleProp<ImageStyle>;
  /** Maintained for backwards-compatibility */
  color?: string;
  iconColor?: string;
}

/**
 * Authentic Montra brand emblem:
 * Features the signature olive squircle with the organic cream 'M'
 * transitioning into the fresh sage green leaf.
 */
export function MontraMonogram({
  size = 68,
  withShadow = true,
  style,
  imageStyle,
}: MontraMonogramProps) {
  return (
    <View
      style={[
        styles.monogramWrap,
        withShadow && styles.shadow,
        style,
      ]}
    >
      <Image
        source={require('../../assets/icon.png')}
        style={[
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
          },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export interface MontraLogoProps {
  /** Size of the emblem badge in pixels */
  size?: number;
  /** Brand name text (defaults to "Montra") */
  wordmark?: string;
  /** Color of the wordmark text */
  wordmarkColor?: string;
  /** Font size of the wordmark text */
  wordmarkSize?: number;
  /** Whether to render the wordmark text */
  showWordmark?: boolean;
  /** Stack vertically or layout horizontally */
  layout?: 'vertical' | 'horizontal';
  /** Whether to add a soft shadow under the emblem */
  withShadow?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Maintained for backwards-compatibility */
  color?: string;
  iconColor?: string;
}

/**
 * Reusable Montra brand logo component combining the authentic
 * official emblem badge and modern Plus Jakarta Sans typography.
 */
export function MontraLogo({
  size = 68,
  wordmark = 'Montra',
  wordmarkColor = '#25271F',
  wordmarkSize = 32,
  showWordmark = true,
  layout = 'vertical',
  withShadow = true,
  style,
}: MontraLogoProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <View
      style={[
        styles.container,
        isHorizontal ? styles.horizontalContainer : styles.verticalContainer,
        style,
      ]}
    >
      <MontraMonogram size={size} withShadow={withShadow} />
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            isHorizontal ? styles.wordmarkHorizontal : styles.wordmarkVertical,
            { color: wordmarkColor, fontSize: wordmarkSize },
          ]}
        >
          {wordmark}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  monogramWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: '#526B45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  wordmark: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    letterSpacing: -0.6,
    includeFontPadding: false,
  },
  wordmarkVertical: {
    textAlign: 'center',
    marginTop: 2,
  },
  wordmarkHorizontal: {
    textAlign: 'left',
  },
});
