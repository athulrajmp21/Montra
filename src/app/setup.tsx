import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { Check, Sun, Moon, ShieldCheck, User, Edit3, Sparkles, Save, RotateCcw, Download, Trash2 } from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';
import { ThemeMode, UIMode } from '../constants/theme';
import { BottomNavBar } from '../components/BottomNavBar';
import { CustomAlert } from '../components/CustomAlert';
import { getAllTransactionsForExport, clearAllUserData } from '../db/repository';

export default function SetupScreen() {
  const {
    theme,
    typography,
    layout,
    uiMode,
    themeMode,
    setThemeMode,
    currency,
    setCurrency,
    userName,
    userAge,
    userAvatar,
    financialGoal,
    saveUserProfile,
    setHasCompletedOnboarding,
    notifyDataChanged,
  } = useMontra();

  const { triggerMedium, triggerSuccess, triggerLight } = useHaptics();

  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(userName || '');
  const [editAge, setEditAge] = useState<string>(userAge ? String(userAge) : '');
  const [editMode, setEditMode] = useState<UIMode>(uiMode || 'standard');
  const [selectedGoal, setSelectedGoal] = useState<string>(financialGoal || 'essentials');

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning';
    primaryBtnText?: string;
    onPrimaryPress?: () => void;
    secondaryBtnText?: string;
    onSecondaryPress?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const parsedEditAge = parseInt(editAge, 10);
  const isAbove35 = !isNaN(parsedEditAge) && parsedEditAge >= 35;

  const handleSaveProfile = async () => {
    const finalAge = !isNaN(parsedEditAge) && parsedEditAge > 0 ? parsedEditAge : (userAge || 28);
    const finalName = editName.trim() || userName || 'Friend';
    const finalMode = finalAge >= 35 ? editMode : 'standard';

    await saveUserProfile({
      name: finalName,
      age: finalAge,
      uiMode: finalMode,
      financialGoal: selectedGoal,
    });

    setIsEditingProfile(false);
    triggerSuccess();

    setAlertConfig({
      visible: true,
      type: 'success',
      title: 'Profile Updated',
      message: `Your changes have been saved. Active mode: ${finalMode === 'easy' ? 'Senior Citizen Mode' : 'Standard Mode'}.`,
      primaryBtnText: 'Awesome',
      onPrimaryPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
    });
  };

  const handleThemeChange = async (tm: ThemeMode) => {
    triggerMedium();
    await setThemeMode(tm);
    triggerSuccess();
  };

  const handleCurrencyChange = async (c: string) => {
    triggerMedium();
    await setCurrency(c);
    triggerSuccess();
  };

  const handleGoalChange = async (goalId: string) => {
    triggerLight();
    setSelectedGoal(goalId);
    await saveUserProfile({
      name: userName || 'Friend',
      age: userAge,
      uiMode,
      financialGoal: goalId,
    });
  };

  const handleRerunOnboarding = () => {
    triggerLight();
    setAlertConfig({
      visible: true,
      type: 'info',
      title: 'Rerun Setup Wizard',
      message: 'Would you like to step through the guided setup questions again?',
      primaryBtnText: 'Start Setup',
      onPrimaryPress: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        await setHasCompletedOnboarding(false);
        router.push('/onboarding');
      },
      secondaryBtnText: 'Cancel',
      onSecondaryPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
    });
  };

  const handleExportCSV = async () => {
    triggerLight();
    try {
      const records = await getAllTransactionsForExport();
      if (!records || records.length === 0) {
        setAlertConfig({
          visible: true,
          type: 'info',
          title: 'No Data to Export',
          message: 'You have not added any transactions yet. Add some expenses or income first!',
          primaryBtnText: 'OK',
          onPrimaryPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
        });
        return;
      }

      const headers = 'ID,Date,Type,Category,Amount,Note\n';
      const rows = records
        .map((r) => {
          const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
          const cleanNote = (r.note || '').replace(/"/g, '""');
          return `"${r.id}","${dateStr}","${r.type}","${r.category_name || ''}",${r.amount},"${cleanNote}"`;
        })
        .join('\n');

      const csvContent = headers + rows;

      await Share.share({
        title: 'Montra_Financial_Report.csv',
        message: csvContent,
      });
      triggerSuccess();
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handleClearData = () => {
    triggerLight();
    setAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Reset & Clear All Data',
      message: 'Are you sure you want to delete all transactions, recurring bills, and reset category limits? This action cannot be undone.',
      primaryBtnText: 'Clear All Data',
      onPrimaryPress: async () => {
        try {
          await clearAllUserData();
          notifyDataChanged();
          triggerSuccess();
          setAlertConfig({
            visible: true,
            type: 'success',
            title: 'Data Reset Complete',
            message: 'All transactions, limits, and records have been safely reset to clean defaults.',
            primaryBtnText: 'Got It',
            onPrimaryPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
          });
        } catch (err) {
          console.error('Failed to clear data:', err);
        }
      },
      secondaryBtnText: 'Cancel',
      onSecondaryPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
    });
  };

  const currencies = [
    { symbol: '₹', label: 'Rupee (₹)' },
    { symbol: '$', label: 'Dollar ($)' },
    { symbol: '€', label: 'Euro (€)' },
    { symbol: '£', label: 'Pound (£)' },
    { symbol: '¥', label: 'Yen (¥)' },
    { symbol: 'AED', label: 'Dirham (AED)' },
  ];

  const financialGoals = [
    { id: 'essentials', title: 'Daily Essentials & Healthcare', icon: '🛡️' },
    { id: 'wealth', title: 'Grow Savings & Wealth', icon: '🚀' },
    { id: 'budget', title: 'Smart Daily Budgeting', icon: '⚖️' },
    { id: 'retirement', title: 'Retirement & Safety Buffer', icon: '🏖️' },
  ];

  const currentAge = userAge || 28;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              borderRadius: layout.borderRadius,
              padding: layout.cardPadding,
            },
          ]}
        >
          <View style={styles.profileRow}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.softSage, borderColor: theme.primary, borderWidth: 2 }]}>
              <Text style={{ fontSize: 26 }}>
                {userAvatar || '🧑‍💻'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.title, { color: theme.textPrimary, fontSize: uiMode === 'easy' ? 22 : 19 }]}>
                {userName || 'Personal Account'}
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 13, marginTop: 2 }]}>
                Age: {currentAge} years
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.editBtn,
                {
                  backgroundColor: isEditingProfile ? theme.primary : theme.softSage,
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => {
                triggerLight();
                if (isEditingProfile) {
                  handleSaveProfile();
                } else {
                  setEditName(userName || '');
                  setEditAge(userAge ? String(userAge) : '');
                  setEditMode(uiMode || 'standard');
                  setIsEditingProfile(true);
                }
              }}
            >
              {isEditingProfile ? (
                <Save size={16} color="#FFFFFF" />
              ) : (
                <Edit3 size={16} color={theme.primary} />
              )}
              <Text
                style={[
                  typography.caption,
                  {
                    color: isEditingProfile ? '#FFFFFF' : theme.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                {isEditingProfile ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inline Edit Form if toggled */}
          {isEditingProfile && (
            <View style={[styles.inlineEditBox, { borderTopColor: theme.surfaceBorder }]}>
              <Text style={[typography.caption, { color: theme.textMuted, marginBottom: 4 }]}>
                Your Name
              </Text>
              <TextInput
                style={[
                  styles.profileInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius - 6,
                  },
                ]}
                placeholder="Your name"
                placeholderTextColor={theme.textMuted}
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 10, marginBottom: 4 }]}>
                Your Age
              </Text>
              <TextInput
                style={[
                  styles.profileInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius - 6,
                  },
                ]}
                placeholder="Your age (e.g. 35)"
                placeholderTextColor={theme.textMuted}
                value={editAge}
                onChangeText={(v) => {
                  const cleaned = v.replace(/[^0-9]/g, '');
                  setEditAge(cleaned);
                  const parsed = parseInt(cleaned, 10);
                  if (parsed >= 60) {
                    setEditMode('easy');
                  } else if (parsed < 35) {
                    setEditMode('standard');
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
              />

              {/* Mode Selection ONLY if age is 35+ (clean, no bulky bullet points) */}
              {isAbove35 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[typography.caption, { color: theme.textMuted, marginBottom: 6 }]}>
                    Experience Mode (Available for Age 35+)
                  </Text>
                  <View style={styles.modeToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.modeToggleBtn,
                        {
                          backgroundColor: editMode === 'standard' ? theme.softSage : theme.background,
                          borderColor: editMode === 'standard' ? theme.primary : theme.surfaceBorder,
                          borderWidth: editMode === 'standard' ? 2 : 1.5,
                          borderRadius: layout.borderRadius - 6,
                        },
                      ]}
                      onPress={() => setEditMode('standard')}
                    >
                      <Text style={{ fontSize: 16 }}>⚡</Text>
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: editMode === 'standard' ? theme.primary : theme.textPrimary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        Standard Mode
                      </Text>
                      {editMode === 'standard' && (
                        <View style={[styles.checkDot, { backgroundColor: theme.primary }]}>
                          <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modeToggleBtn,
                        {
                          backgroundColor: editMode === 'easy' ? theme.softSage : theme.background,
                          borderColor: editMode === 'easy' ? theme.primary : theme.surfaceBorder,
                          borderWidth: editMode === 'easy' ? 2 : 1.5,
                          borderRadius: layout.borderRadius - 6,
                        },
                      ]}
                      onPress={() => setEditMode('easy')}
                    >
                      <Text style={{ fontSize: 16 }}>👵</Text>
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: editMode === 'easy' ? theme.primary : theme.textPrimary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        Senior Mode
                      </Text>
                      {editMode === 'easy' && (
                        <View style={[styles.checkDot, { backgroundColor: theme.primary }]}>
                          <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 1. Primary Financial Priority */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
            Primary Financial Priority
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            Guides your safe-to-spend limits and recommendations
          </Text>
        </View>

        <View style={styles.goalsGrid}>
          {financialGoals.map((g) => {
            const isSelected = selectedGoal === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.goalItem,
                  {
                    backgroundColor: isSelected ? theme.softSage : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                    borderWidth: isSelected ? 2 : 1.5,
                    borderRadius: layout.borderRadius - 6,
                  },
                ]}
                onPress={() => handleGoalChange(g.id)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>{g.icon}</Text>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? theme.primary : theme.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                      flex: 1,
                      fontSize: 12,
                    },
                  ]}
                >
                  {g.title}
                </Text>
                {isSelected && (
                  <View style={[styles.goalCheck, { backgroundColor: theme.primary }]}>
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Theme Mode Selection (Light / Dark for all users) */}
        <View style={[styles.sectionHeader, { marginTop: 18 }]}>
          <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
            Theme Appearance
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            Choose between Warm Cream and Deep Forest Dark Mode
          </Text>
        </View>

        <View style={styles.themeSelectorRow}>
          {/* Light Mode */}
          <TouchableOpacity
            style={[
              styles.themeOptionCard,
              {
                backgroundColor: themeMode === 'light' ? theme.softSage : theme.surface,
                borderColor: themeMode === 'light' ? theme.primary : theme.surfaceBorder,
                borderWidth: themeMode === 'light' ? 2 : 1.5,
                borderRadius: layout.borderRadius - 4,
              },
            ]}
            onPress={() => handleThemeChange('light')}
            activeOpacity={0.8}
          >
            <View style={[styles.themeIconCircle, { backgroundColor: '#FDFCF7' }]}>
              <Sun size={20} color="#D97745" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                Warm Cream
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                Light Mode
              </Text>
            </View>
            {themeMode === 'light' && (
              <View style={[styles.themeCheckBadge, { backgroundColor: theme.primary }]}>
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>

          {/* Dark Mode */}
          <TouchableOpacity
            style={[
              styles.themeOptionCard,
              {
                backgroundColor: themeMode === 'dark' ? theme.softSage : theme.surface,
                borderColor: themeMode === 'dark' ? theme.primary : theme.surfaceBorder,
                borderWidth: themeMode === 'dark' ? 2 : 1.5,
                borderRadius: layout.borderRadius - 4,
              },
            ]}
            onPress={() => handleThemeChange('dark')}
            activeOpacity={0.8}
          >
            <View style={[styles.themeIconCircle, { backgroundColor: '#1A2419' }]}>
              <Moon size={20} color="#A9BC9F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                Deep Forest
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                Dark Mode
              </Text>
            </View>
            {themeMode === 'dark' && (
              <View style={[styles.themeCheckBadge, { backgroundColor: theme.primary }]}>
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. Currency Selection */}
        <View style={[styles.sectionHeader, { marginTop: 18 }]}>
          <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
            Currency Symbol
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            Active currency for transactions and limits
          </Text>
        </View>

        <View style={styles.currencyGrid}>
          {currencies.map((curr) => {
            const isSelected = currency === curr.symbol;
            return (
              <TouchableOpacity
                key={curr.symbol}
                style={[
                  styles.currencyBtn,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                    borderRadius: layout.borderRadius - 6,
                  },
                ]}
                onPress={() => handleCurrencyChange(curr.symbol)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    typography.body,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {curr.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Export Data (CSV) Button */}
        <TouchableOpacity
          style={[
            styles.rerunBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              borderRadius: layout.borderRadius - 4,
              marginBottom: 10,
            },
          ]}
          onPress={handleExportCSV}
          activeOpacity={0.8}
        >
          <Download size={16} color={theme.primary} />
          <Text style={[typography.caption, { color: theme.textPrimary, fontWeight: '700', fontSize: 13 }]}>
            Export Financial Report (CSV)
          </Text>
        </TouchableOpacity>

        {/* Rerun Setup Wizard Button */}
        <TouchableOpacity
          style={[
            styles.rerunBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              borderRadius: layout.borderRadius - 4,
            },
          ]}
          onPress={handleRerunOnboarding}
          activeOpacity={0.8}
        >
          <RotateCcw size={16} color={theme.primary} />
          <Text style={[typography.caption, { color: theme.textPrimary, fontWeight: '700', fontSize: 13 }]}>
            Rerun Initial Setup Wizard
          </Text>
        </TouchableOpacity>

        {/* Reset & Clear All Data Button */}
        <TouchableOpacity
          style={[
            styles.rerunBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.expense + '40',
              borderRadius: layout.borderRadius - 4,
              marginTop: 10,
            },
          ]}
          onPress={handleClearData}
          activeOpacity={0.8}
        >
          <Trash2 size={16} color={theme.expense} />
          <Text style={[typography.caption, { color: theme.expense, fontWeight: '700', fontSize: 13 }]}>
            Reset & Clear All Data
          </Text>
        </TouchableOpacity>

        {/* Clean Privacy Assurance */}
        <View
          style={[
            styles.privacyCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              borderRadius: layout.borderRadius,
              padding: layout.cardPadding,
              marginTop: 16,
              marginBottom: 24,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <View style={[styles.privacyIconBubble, { backgroundColor: theme.softSage }]}>
              <ShieldCheck size={18} color={theme.primary} />
            </View>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 16 }]}>
              Privacy & On-Device Security
            </Text>
          </View>
          <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 22, fontSize: 14 }]}>
            Your finances remain strictly on your personal phone. We never transmit or share your numbers with external servers or advertisers.
          </Text>
        </View>
      </ScrollView>

      {/* Custom Theme Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type || 'info'}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryBtnText={alertConfig.primaryBtnText || 'OK'}
        onPrimaryPress={alertConfig.onPrimaryPress || (() => setAlertConfig((prev) => ({ ...prev, visible: false })))}
        secondaryBtnText={alertConfig.secondaryBtnText}
        onSecondaryPress={alertConfig.onSecondaryPress}
      />

      {/* 5-Item Mobile Bottom Navigation Bar */}
      <BottomNavBar activeTab="accounts" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  profileCard: {
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  inlineEditBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  profileInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
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
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  checkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 10,
  },
  goalsGrid: {
    gap: 8,
    marginBottom: 4,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  goalCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  themeOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  themeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  themeCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  currencyBtn: {
    flexBasis: '48%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  rerunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  privacyCard: {
    borderWidth: 1.5,
  },
  privacyIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
