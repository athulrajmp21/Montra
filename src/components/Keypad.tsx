import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete, RotateCcw } from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';

interface KeypadProps {
  onKeyPress: (char: string) => void;
  onDelete: () => void;
  onClear?: () => void;
}

export function Keypad({ onKeyPress, onDelete, onClear }: KeypadProps) {
  const { theme, typography, layout, uiMode } = useMontra();
  const { triggerLight, triggerMedium } = useHaptics();

  const handlePress = (key: string) => {
    triggerLight();
    onKeyPress(key);
  };

  const handleDelete = () => {
    triggerMedium();
    onDelete();
  };

  const handleClear = () => {
    triggerMedium();
    if (onClear) onClear();
    else onDelete();
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', 'DEL'],
  ];

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((k) => {
            if (k === 'DEL') {
              return (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.key,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.surfaceBorder,
                      minHeight: layout.keypadKeyHeight,
                      borderRadius: layout.borderRadius - 4,
                    },
                  ]}
                  onPress={handleDelete}
                  activeOpacity={0.65}
                  accessibilityLabel="Delete last digit"
                >
                  <Delete size={uiMode === 'easy' ? 28 : 22} color={theme.textPrimary} />
                </TouchableOpacity>
              );
            }

            if (k === 'C') {
              return (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.key,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.surfaceBorder,
                      minHeight: layout.keypadKeyHeight,
                      borderRadius: layout.borderRadius - 4,
                    },
                  ]}
                  onPress={handleClear}
                  activeOpacity={0.65}
                  accessibilityLabel="Clear input"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <RotateCcw size={16} color={theme.dangerRed} />
                    <Text
                      style={[
                        typography.caption,
                        { color: theme.dangerRed, fontWeight: '800' },
                      ]}
                    >
                      CLR
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={k}
                style={[
                  styles.key,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.surfaceBorder,
                    minHeight: layout.keypadKeyHeight,
                    borderRadius: layout.borderRadius - 4,
                  },
                ]}
                onPress={() => handlePress(k)}
                activeOpacity={0.65}
                accessibilityLabel={`Number ${k}`}
              >
                <Text
                  style={[
                    typography.keypad,
                    { color: theme.textPrimary, letterSpacing: -0.5 },
                  ]}
                >
                  {k}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 8,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  key: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
