import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Lock, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, Delete } from 'lucide-react-native';
import { ThemeColors, TypographyTheme, LayoutTheme, UIMode } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

interface MontraLockScreenProps {
  visible: boolean;
  onUnlock: () => void;
  fallbackPin?: string;
  theme: ThemeColors;
  typography: TypographyTheme;
  layout: LayoutTheme;
  uiMode: UIMode;
}

export function MontraLockScreen({
  visible,
  onUnlock,
  fallbackPin,
  theme,
  typography,
  layout,
  uiMode,
}: MontraLockScreenProps) {
  const { triggerLight, triggerSuccess, triggerWarning } = useHaptics();

  const [authMode, setAuthMode] = useState<'biometric' | 'pin'>('biometric');
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');

  // Check hardware and supported biometric types on mount
  useEffect(() => {
    async function checkBiometrics() {
      try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else {
          setBiometricType('Biometrics');
        }
      } catch {
        setBiometricType('Biometrics');
      }
    }
    if (visible) {
      checkBiometrics();
    }
  }, [visible]);

  // Attempt biometric prompt on initial open
  useEffect(() => {
    if (visible && authMode === 'biometric') {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [visible, authMode]);

  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        if (fallbackPin) {
          setAuthMode('pin');
        } else {
          setErrorMessage('Biometrics not enrolled on device. Enter device passcode.');
        }
        setIsAuthenticating(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Montra',
        promptSubtitle: 'Protecting your financial privacy',
        cancelLabel: fallbackPin ? 'Use PIN' : 'Cancel',
        disableDeviceFallback: !!fallbackPin,
      });

      if (result.success) {
        triggerSuccess();
        setPinInput('');
        setErrorMessage('');
        onUnlock();
      } else {
        triggerWarning();
        if (result.error === 'user_cancel' && fallbackPin) {
          setAuthMode('pin');
        } else if (result.error === 'user_fallback' && fallbackPin) {
          setAuthMode('pin');
        } else {
          setErrorMessage('Authentication canceled or unsuccessful.');
        }
      }
    } catch (err: any) {
      triggerWarning();
      setErrorMessage(err?.message || 'Authentication error.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    triggerLight();
    setErrorMessage('');
    if (pinInput.length >= 4) return;

    const newPin = pinInput + digit;
    setPinInput(newPin);

    if (newPin.length === 4) {
      if (fallbackPin && newPin === fallbackPin) {
        triggerSuccess();
        setTimeout(() => {
          setPinInput('');
          onUnlock();
        }, 200);
      } else {
        triggerWarning();
        setErrorMessage('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setPinInput('');
        }, 400);
      }
    }
  };

  const handlePinDelete = () => {
    triggerLight();
    setErrorMessage('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Top Decorative Header */}
        <View style={styles.topSection}>
          <View
            style={[
              styles.shieldBadge,
              {
                backgroundColor: theme.softSage,
                borderColor: theme.primary + '30',
              },
            ]}
          >
            {authMode === 'biometric' ? (
              <Lock size={36} color={theme.primary} strokeWidth={2.2} />
            ) : (
              <KeyRound size={36} color={theme.primary} strokeWidth={2.2} />
            )}
          </View>

          <Text
            style={[
              typography.title,
              styles.title,
              {
                color: theme.textPrimary,
                fontSize: uiMode === 'easy' ? 26 : 22,
              },
            ]}
          >
            {authMode === 'biometric' ? 'Montra is Locked' : 'Enter 4-Digit PIN'}
          </Text>

          <Text
            style={[
              typography.caption,
              styles.subtitle,
              { color: theme.textMuted },
            ]}
          >
            {authMode === 'biometric'
              ? `Confirm ${biometricType} to access your financial records`
              : 'Enter your personal backup PIN to unlock'}
          </Text>

          {errorMessage ? (
            <View style={[styles.errorPill, { backgroundColor: theme.dangerRed + '15' }]}>
              <Text style={[typography.caption, { color: theme.dangerRed, fontWeight: '700' }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Content Area */}
        {authMode === 'biometric' ? (
          <View style={styles.biometricSection}>
            <TouchableOpacity
              style={[
                styles.unlockBtn,
                {
                  backgroundColor: theme.primary,
                  borderRadius: layout.borderRadius,
                  shadowColor: theme.primary,
                },
              ]}
              onPress={handleBiometricAuth}
              activeOpacity={0.8}
            >
              <ShieldCheck size={20} color="#FFFFFF" />
              <Text style={[typography.button, { color: '#FFFFFF', marginLeft: 8 }]}>
                Unlock with {biometricType}
              </Text>
            </TouchableOpacity>

            {fallbackPin ? (
              <TouchableOpacity
                style={[
                  styles.fallbackBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.surfaceBorder,
                    borderRadius: layout.borderRadius,
                  },
                ]}
                onPress={() => {
                  triggerLight();
                  setAuthMode('pin');
                  setErrorMessage('');
                }}
                activeOpacity={0.7}
              >
                <KeyRound size={16} color={theme.textPrimary} />
                <Text style={[typography.caption, { color: theme.textPrimary, fontWeight: '700', marginLeft: 6 }]}>
                  Use Backup PIN
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          /* PIN Input Mode */
          <View style={styles.pinSection}>
            {/* PIN Indicator Dots */}
            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinInput.length > idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.pinDot,
                      {
                        backgroundColor: isFilled ? theme.primary : 'transparent',
                        borderColor: isFilled ? theme.primary : theme.surfaceBorder,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Tactile Keypad */}
            <View style={styles.keypadGrid}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['switch_bio', '0', 'delete'],
              ].map((row, rowIdx) => (
                <View key={`row_${rowIdx}`} style={styles.keypadRow}>
                  {row.map((item) => {
                    if (item === 'switch_bio') {
                      return (
                        <TouchableOpacity
                          key={item}
                          style={styles.keypadSpecialKey}
                          onPress={() => {
                            triggerLight();
                            setAuthMode('biometric');
                            setErrorMessage('');
                          }}
                        >
                          <Lock size={20} color={theme.primary} />
                        </TouchableOpacity>
                      );
                    }
                    if (item === 'delete') {
                      return (
                        <TouchableOpacity
                          key={item}
                          style={styles.keypadSpecialKey}
                          onPress={handlePinDelete}
                        >
                          <Delete size={22} color={theme.textPrimary} />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.keypadKey,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.surfaceBorder,
                          },
                        ]}
                        onPress={() => handlePinDigit(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.keyText, { color: theme.textPrimary }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Security Note */}
        <View style={styles.footer}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', fontSize: 11 }]}>
            🔒 100% Local Device Security • No Cloud or Telemetry
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 80 : 70,
    paddingBottom: 36,
  },
  topSection: {
    alignItems: 'center',
  },
  shieldBadge: {
    width: 80,
    height: 80,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  errorPill: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  biometricSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  pinSection: {
    alignItems: 'center',
    width: '100%',
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 32,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 290,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  keyText: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  keypadSpecialKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
  },
});
