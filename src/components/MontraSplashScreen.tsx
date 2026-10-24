import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MontraLogo } from './MontraLogo';

export interface MontraSplashScreenProps {
  /** Optional callback triggered when the entrance animation finishes */
  onAnimationComplete?: () => void;
  /** Optional custom tagline override (defaults to "Money gets organised.") */
  tagline?: string;
  /** Optional custom container style */
  style?: ViewStyle;
  /** Optional testID */
  testID?: string;
}

/**
 * Montra Brand Color Palette
 */
const BRAND_COLORS = {
  background: '#F7F5EE', // Warm cream
  primaryOlive: '#747B4B', // Primary olive green
  darkOlive: '#555D36', // Dark olive
  softSage: '#DDE1D1', // Soft sage
  darkText: '#25271F', // Dark text
  white: '#FFFFFF', // White
};

/**
 * Production-quality, minimalist splash screen for Montra.
 * Features a calm, elegant entrance animation with balanced typography,
 * generous whitespace, and pure vector rendering.
 */
export function MontraSplashScreen({
  onAnimationComplete,
  tagline = 'Money gets organised.',
  style,
  testID = 'montra-splash-screen',
}: MontraSplashScreenProps) {
  // Logo entrance animation values (fade-in + subtle upward drift)
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(14)).current;

  // Tagline entrance animation values (staggered fade-in + subtle drift)
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    // Elegant, smooth entrance animation (~800ms total duration)
    const animation = Animated.parallel([
      // 1. Logo fades in gently while rising (duration: 650ms, ease-out)
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // 2. Tagline fades in shortly afterward with a gentle 180ms delay
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });

    return () => {
      animation.stop();
    };
  }, [logoOpacity, logoTranslateY, taglineOpacity, taglineTranslateY, onAnimationComplete]);

  return (
    <SafeAreaView style={[styles.root, style]} testID={testID}>
      <StatusBar style="dark" />

      {/* Main Center Stage */}
      <View style={styles.centerContainer}>
        {/* Animated Logo Unit (Official Montra Emblem + Wordmark) */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <MontraLogo
            size={72}
            wordmark="Montra"
            wordmarkColor={BRAND_COLORS.darkText}
            wordmarkSize={32}
            layout="vertical"
          />
        </Animated.View>

        {/* Animated Tagline Unit */}
        <Animated.View
          style={[
            styles.taglineWrap,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <Text style={styles.taglineText}>{tagline}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineWrap: {
    marginTop: 14,
    alignItems: 'center',
  },
  taglineText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    fontWeight: '500',
    color: BRAND_COLORS.darkOlive,
    letterSpacing: 0.2,
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default MontraSplashScreen;
