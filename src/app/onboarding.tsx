import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, Sun, Moon, ArrowRight } from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';
import { ThemeMode, UIMode } from '../constants/theme';
import { CustomAlert } from '../components/CustomAlert';
import { getCategories, updateCategoryTarget } from '../db/repository';
import { formatCurrency, formatAmountInput, isIndianCurrency } from '../utils/formatCurrency';

export default function OnboardingScreen() {
  const {
    theme,
    typography,
    layout,
    themeMode,
    setThemeMode,
    currency,
    setCurrency,
    setHasCompletedOnboarding,
    saveUserProfile,
    notifyDataChanged,
    userName: initialName,
    userAge: initialAge,
    financialGoal: initialGoal,
    uiMode: currentUIMode,
  } = useMontra();

  const { triggerLight, triggerSuccess, triggerMedium } = useHaptics();

  const [name, setName] = useState<string>(initialName || '');
  const [ageStr, setAgeStr] = useState<string>(initialAge ? String(initialAge) : '');
  const [selectedGoal, setSelectedGoal] = useState<string>(initialGoal || 'essentials');
  const [targetBudgetStr, setTargetBudgetStr] = useState<string>('21000');
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(themeMode);
  const [selectedCurr, setSelectedCurr] = useState<string>(currency);
  const [selectedMode, setSelectedMode] = useState<UIMode>(currentUIMode || 'standard');
  const [showSeniorModal, setShowSeniorModal] = useState<boolean>(false);

  const numericAge = parseInt(ageStr, 10);
  const isAbove35 = !isNaN(numericAge) && numericAge >= 35;

  const financialGoals = [
    {
      id: 'essentials',
      title: 'Daily Essentials & Healthcare',
      desc: 'Comfortably track groceries, bills, and medical costs with zero stress',
      icon: '🛡️',
    },
    {
      id: 'wealth',
      title: 'Grow Savings & Wealth',
      desc: 'Build investment habits, maximize returns, and secure the future',
      icon: '🚀',
    },
    {
      id: 'budget',
      title: 'Smart Daily Budgeting',
      desc: 'Cut unnecessary expenses and keep every monthly category in check',
      icon: '⚖️',
    },
    {
      id: 'retirement',
      title: 'Retirement & Safety Buffer',
      desc: 'Manage fixed income, pension, and preserve an emergency cushion',
      icon: '🏖️',
    },
  ];

  const currencies = [
    { symbol: '₹', label: 'Rupee (₹)' },
    { symbol: '$', label: 'Dollar ($)' },
    { symbol: '€', label: 'Euro (€)' },
    { symbol: '£', label: 'Pound (£)' },
    { symbol: '¥', label: 'Yen (¥)' },
    { symbol: 'AED', label: 'Dirham (AED)' },
  ];

  const handleFinish = async () => {
    triggerSuccess();
    const finalAge = !isNaN(numericAge) && numericAge > 0 ? numericAge : 28;
    const finalMode = isAbove35 ? selectedMode : 'standard';

    const targetBudget = parseFloat(targetBudgetStr.replace(/,/g, ''));
    if (!isNaN(targetBudget) && targetBudget > 0 && targetBudget !== 21000) {
      try {
        const cats = await getCategories();
        const expenseCats = cats.filter((c) => c.type === 'expense');
        const currentSum = expenseCats.reduce((acc, c) => acc + (c.monthlyTarget || 0), 0);
        let allocatedSum = 0;
        const updated = expenseCats.map((c) => {
          const weight = currentSum > 0 ? (c.monthlyTarget / currentSum) : (1 / expenseCats.length);
          const target = Math.round((targetBudget * weight) / 100) * 100;
          allocatedSum += target;
          return { ...c, monthlyTarget: target };
        });
        const diff = targetBudget - allocatedSum;
        if (diff !== 0 && updated.length > 0) {
          updated[0].monthlyTarget = Math.max(0, updated[0].monthlyTarget + diff);
        }
        for (const cat of updated) {
          await updateCategoryTarget(cat.id, cat.monthlyTarget);
        }
        notifyDataChanged();
      } catch (err) {
        console.error('Failed to initialize custom budget during onboarding:', err);
      }
    }

    await saveUserProfile({
      name: name.trim() || 'Friend',
      age: finalAge,
      uiMode: finalMode,
      financialGoal: selectedGoal,
      monthlyBudget: !isNaN(targetBudget) && targetBudget > 0 ? targetBudget : 21000,
    });
    await setThemeMode(selectedTheme);
    await setCurrency(selectedCurr);
    await setHasCompletedOnboarding(true);
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/favicon.png')}
              style={styles.logoBadge}
              resizeMode="contain"
            />
            <Text style={[typography.hero, { color: theme.textPrimary, marginTop: 14, textAlign: 'center' }]}>
              Welcome to Montra
            </Text>
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: 4, textAlign: 'center' }]}>
              Money gets organised.
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 6, textAlign: 'center', maxWidth: 320 }]}>
              Let's customize your profile so your financial tracker feels personal and effortless.
            </Text>
          </View>

          {/* 1. Name Input */}
          <View style={styles.section}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              1. What should we call you?
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, marginBottom: 8 }]}>
              Used for your greeting and dashboard
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: name.trim() ? theme.primary : theme.surfaceBorder,
                  color: theme.textPrimary,
                  borderRadius: layout.borderRadius - 4,
                },
              ]}
              placeholder="e.g. Robert, Aditi, Maria"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* 2. Age Input & Conditional Mode Selection for Age 35+ */}
          <View style={styles.section}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              2. What is your age?
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, marginBottom: 8 }]}>
              Tailors experience and options to your lifestyle
            </Text>

            <View style={styles.ageInputRow}>
              <TextInput
                style={[
                  styles.ageInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: ageStr ? theme.primary : theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius - 4,
                  },
                ]}
                placeholder="e.g. 35"
                placeholderTextColor={theme.textMuted}
                value={ageStr}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  setAgeStr(cleaned);
                  const parsed = parseInt(cleaned, 10);
                  if (parsed >= 60) {
                    setSelectedMode('easy');
                  } else {
                    setSelectedMode('standard');
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
              <View style={styles.quickAgeGroup}>
                {[22, 35, 50, 68].map((sampleAge) => (
                  <TouchableOpacity
                    key={sampleAge}
                    style={[
                      styles.quickAgeChip,
                      {
                        backgroundColor: numericAge === sampleAge ? theme.softSage : theme.surface,
                        borderColor: numericAge === sampleAge ? theme.primary : theme.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      triggerLight();
                      setAgeStr(String(sampleAge));
                      if (sampleAge >= 60) {
                        setSelectedMode('easy');
                        setShowSeniorModal(true);
                      } else {
                        setSelectedMode('standard');
                      }
                    }}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: numericAge === sampleAge ? theme.primary : theme.textPrimary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {sampleAge}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Option to select mode ONLY if age is 35+ (clean, no bulky text) */}
            {isAbove35 && (
              <View style={styles.modeOptionWrapper}>
                <Text style={[typography.caption, { color: theme.textMuted, marginBottom: 6 }]}>
                  Choose Experience Mode:
                </Text>
                <View style={styles.modeToggleRow}>
                  {/* Standard Mode */}
                  <TouchableOpacity
                    style={[
                      styles.modeToggleBtn,
                      {
                        backgroundColor: selectedMode === 'standard' ? theme.softSage : theme.surface,
                        borderColor: selectedMode === 'standard' ? theme.primary : theme.surfaceBorder,
                        borderWidth: selectedMode === 'standard' ? 2 : 1.5,
                        borderRadius: layout.borderRadius - 6,
                      },
                    ]}
                    onPress={() => {
                      triggerLight();
                      setSelectedMode('standard');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 16 }}>⚡</Text>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: selectedMode === 'standard' ? theme.primary : theme.textPrimary,
                          fontWeight: '700',
                          fontSize: 13,
                        },
                      ]}
                    >
                      Standard Mode
                    </Text>
                    {selectedMode === 'standard' && (
                      <View style={[styles.checkDot, { backgroundColor: theme.primary }]}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Senior Citizen Mode */}
                  <TouchableOpacity
                    style={[
                      styles.modeToggleBtn,
                      {
                        backgroundColor: selectedMode === 'easy' ? theme.softSage : theme.surface,
                        borderColor: selectedMode === 'easy' ? theme.primary : theme.surfaceBorder,
                        borderWidth: selectedMode === 'easy' ? 2 : 1.5,
                        borderRadius: layout.borderRadius - 6,
                      },
                    ]}
                    onPress={() => {
                      triggerMedium();
                      setShowSeniorModal(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 16 }}>👵</Text>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: selectedMode === 'easy' ? theme.primary : theme.textPrimary,
                          fontWeight: '700',
                          fontSize: 13,
                        },
                      ]}
                    >
                      Senior Mode
                    </Text>
                    {selectedMode === 'easy' && (
                      <View style={[styles.checkDot, { backgroundColor: theme.primary }]}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* 3. Primary Financial Priority */}
          <View style={styles.section}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              3. What is your primary financial priority?
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, marginBottom: 8 }]}>
              Guides your smart budgeting limits and insights
            </Text>

            <View style={styles.goalsContainer}>
              {financialGoals.map((g) => {
                const isSelected = selectedGoal === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.goalCard,
                      {
                        backgroundColor: isSelected ? theme.softSage : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                        borderWidth: isSelected ? 2 : 1.5,
                        borderRadius: layout.borderRadius - 4,
                      },
                    ]}
                    onPress={() => {
                      triggerLight();
                      setSelectedGoal(g.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.goalRow}>
                      <Text style={{ fontSize: 24, marginRight: 12 }}>{g.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                          {g.title}
                        </Text>
                        <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2, fontSize: 12 }]}>
                          {g.desc}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.checkCircle,
                          {
                            borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Target Monthly Spending Limit */}
          <View style={styles.section}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              4. What is your expected monthly spending budget?
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, marginBottom: 8 }]}>
              Can be adjusted anytime in Planning. Defaults to {formatCurrency(21000, selectedCurr)}.
            </Text>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: targetBudgetStr.trim() ? theme.primary : theme.surfaceBorder,
                  color: theme.textPrimary,
                  borderRadius: layout.borderRadius - 4,
                  fontSize: 18,
                  fontWeight: '800',
                },
              ]}
              placeholder="e.g. 25000"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              value={formatAmountInput(targetBudgetStr, selectedCurr)}
              onChangeText={(val) => setTargetBudgetStr(val.replace(/[^0-9]/g, ''))}
            />

            {/* Quick preset chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {(isIndianCurrency(selectedCurr)
                ? [15000, 25000, 35000, 50000, 100000]
                : [1500, 2500, 4000, 6000, 10000]
              ).map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.budgetPresetChip,
                    {
                      backgroundColor: targetBudgetStr === String(preset) ? theme.softSage : theme.surface,
                      borderColor: targetBudgetStr === String(preset) ? theme.primary : theme.surfaceBorder,
                    },
                  ]}
                  onPress={() => {
                    triggerLight();
                    setTargetBudgetStr(String(preset));
                  }}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: targetBudgetStr === String(preset) ? theme.primary : theme.textPrimary,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {formatCurrency(preset, selectedCurr)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 5. Preferred Currency */}
          <View style={styles.section}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              5. Preferred Currency
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, marginBottom: 8 }]}>
              Select active currency for transactions
            </Text>

            <View style={styles.currencyGrid}>
              {currencies.map((curr) => {
                const isSelected = selectedCurr === curr.symbol;
                return (
                  <TouchableOpacity
                    key={curr.symbol}
                    style={[
                      styles.currBtn,
                      {
                        backgroundColor: isSelected ? theme.softSage : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                        borderWidth: isSelected ? 2 : 1.5,
                        borderRadius: layout.borderRadius - 6,
                      },
                    ]}
                    onPress={() => {
                      triggerLight();
                      setSelectedCurr(curr.symbol);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        typography.subtitle,
                        {
                          color: isSelected ? theme.primary : theme.textPrimary,
                          fontWeight: '800',
                          fontSize: 16,
                        },
                      ]}
                    >
                      {curr.symbol}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isSelected ? theme.primary : theme.textSecondary,
                          fontSize: 11,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {curr.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 6. Visual Theme */}
          <View style={styles.section}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              6. Visual Theme
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2, marginBottom: 8 }]}>
              Warm light cream or deep forest dark mode
            </Text>

            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: selectedTheme === 'light' ? theme.softSage : theme.surface,
                    borderColor: selectedTheme === 'light' ? theme.primary : theme.surfaceBorder,
                    borderWidth: selectedTheme === 'light' ? 2 : 1.5,
                    borderRadius: layout.borderRadius - 4,
                  },
                ]}
                onPress={() => {
                  triggerLight();
                  setSelectedTheme('light');
                }}
                activeOpacity={0.8}
              >
                <Sun size={22} color={selectedTheme === 'light' ? theme.primary : theme.textMuted} />
                <View>
                  <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                    Warm Light
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                    Warm Cream Surface
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: selectedTheme === 'dark' ? theme.softSage : theme.surface,
                    borderColor: selectedTheme === 'dark' ? theme.primary : theme.surfaceBorder,
                    borderWidth: selectedTheme === 'dark' ? 2 : 1.5,
                    borderRadius: layout.borderRadius - 4,
                  },
                ]}
                onPress={() => {
                  triggerLight();
                  setSelectedTheme('dark');
                }}
                activeOpacity={0.8}
              >
                <Moon size={22} color={selectedTheme === 'dark' ? theme.primary : theme.textMuted} />
                <View>
                  <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                    Deep Dark
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                    Deep Forest Night
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Finish Button */}
          <TouchableOpacity
            style={[
              styles.finishBtn,
              {
                backgroundColor: theme.primary,
                borderRadius: layout.borderRadius,
                minHeight: layout.buttonHeight,
              },
            ]}
            onPress={handleFinish}
            activeOpacity={0.85}
          >
            <Text style={[typography.button, { color: '#FFFFFF', fontSize: 17, fontWeight: '700' }]}>
              Get Started with Montra
            </Text>
            <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Senior Mode Details Popup Modal */}
      <CustomAlert
        visible={showSeniorModal}
        type="senior"
        title="Senior Citizen Mode"
        message="Designed for effortless comfort, larger text, and simplified terms:"
        primaryBtnText="Apply Senior Mode"
        onPrimaryPress={() => {
          setSelectedMode('easy');
          setShowSeniorModal(false);
        }}
        secondaryBtnText="Keep Standard"
        onSecondaryPress={() => {
          setSelectedMode('standard');
          setShowSeniorModal(false);
        }}
      >
        <View style={[styles.seniorDetailsBox, { backgroundColor: theme.softSage, borderRadius: layout.borderRadius - 6 }]}>
          <Text style={[typography.body, { color: theme.textPrimary, fontSize: 13, lineHeight: 20 }]}>
            • <Text style={{ fontWeight: '700' }}>Extra-Large Text (20pt+)</Text> for effortless reading without squinting{'\n'}
            • <Text style={{ fontWeight: '700' }}>Giant Keypad</Text> pinned at bottom for natural one-handed reach{'\n'}
            • <Text style={{ fontWeight: '700' }}>Friendly Language</Text> without confusing finance jargon
          </Text>
        </View>
      </CustomAlert>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 18,
    shadowColor: '#526B45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 22,
  },
  textInput: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  ageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ageInput: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    width: 90,
    textAlign: 'center',
  },
  quickAgeGroup: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  quickAgeChip: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeOptionWrapper: {
    marginTop: 12,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  checkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seniorDetailsBox: {
    padding: 12,
    marginTop: 4,
  },
  goalsContainer: {
    gap: 8,
  },
  goalCard: {
    padding: 14,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currBtn: {
    width: '31%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  budgetPresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  finishBtn: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#526B45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
