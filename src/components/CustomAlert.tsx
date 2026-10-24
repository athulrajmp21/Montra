import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { CheckCircle2, AlertCircle, Info, Sparkles, X, Trash2 } from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'senior' | 'danger';
  primaryBtnText?: string;
  primaryBtnColor?: string;
  onPrimaryPress: () => void;
  secondaryBtnText?: string;
  onSecondaryPress?: () => void;
  children?: React.ReactNode;
}

export function CustomAlert({
  visible,
  title,
  message,
  type = 'success',
  primaryBtnText = 'Got it',
  primaryBtnColor,
  onPrimaryPress,
  secondaryBtnText,
  onSecondaryPress,
  children,
}: CustomAlertProps) {
  const { theme, typography, layout } = useMontra();
  const { triggerLight, triggerSuccess } = useHaptics();

  if (!visible) return null;

  const handlePrimary = () => {
    triggerSuccess();
    onPrimaryPress();
  };

  const handleSecondary = () => {
    triggerLight();
    if (onSecondaryPress) onSecondaryPress();
  };

  const activePrimaryColor =
    primaryBtnColor || (type === 'danger' ? theme.dangerRed : theme.primary);

  const renderIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <View style={[styles.iconCircle, { backgroundColor: theme.dangerRedBg }]}>
            <Trash2 size={28} color={theme.dangerRed} strokeWidth={2.4} />
          </View>
        );
      case 'success':
        return (
          <View style={[styles.iconCircle, { backgroundColor: theme.softSage }]}>
            <CheckCircle2 size={30} color={theme.primary} strokeWidth={2.4} />
          </View>
        );
      case 'senior':
        return (
          <View style={[styles.iconCircle, { backgroundColor: theme.softSage }]}>
            <Text style={{ fontSize: 28 }}>👵</Text>
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconCircle, { backgroundColor: theme.expenseBg }]}>
            <AlertCircle size={30} color={theme.expense} strokeWidth={2.4} />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: theme.softSage }]}>
            <Sparkles size={28} color={theme.primary} strokeWidth={2.4} />
          </View>
        );
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onSecondaryPress || onPrimaryPress}
    >
      <TouchableWithoutFeedback onPress={onSecondaryPress || onPrimaryPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: layout.borderRadius + 4,
                },
              ]}
            >
              {/* Header Icon */}
              <View style={styles.iconContainer}>{renderIcon()}</View>

              {/* Title & Description */}
              <Text style={[typography.title, styles.title, { color: theme.textPrimary }]}>
                {title}
              </Text>
              {message ? (
                <Text style={[typography.body, styles.message, { color: theme.textSecondary }]}>
                  {message}
                </Text>
              ) : null}

              {/* Optional custom content body */}
              {children ? <View style={styles.customContent}>{children}</View> : null}

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                {secondaryBtnText ? (
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.surfaceBorder,
                        borderRadius: layout.borderRadius - 4,
                      },
                    ]}
                    onPress={handleSecondary}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        typography.caption,
                        { color: theme.textSecondary, fontWeight: '700', fontSize: 14 },
                      ]}
                    >
                      {secondaryBtnText}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: activePrimaryColor,
                      shadowColor: activePrimaryColor,
                      borderRadius: layout.borderRadius - 4,
                      flex: secondaryBtnText ? 1 : undefined,
                      width: secondaryBtnText ? undefined : '100%',
                    },
                  ]}
                  onPress={handlePrimary}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      typography.button,
                      { color: '#FFFFFF', fontWeight: '700', fontSize: 15, textAlign: 'center' },
                    ]}
                  >
                    {primaryBtnText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 25, 17, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1.5,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  customContent: {
    width: '100%',
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  primaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#526B45',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
