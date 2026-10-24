import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  UIMode, 
  ThemeMode,
  lightTheme, 
  darkTheme, 
  typography, 
  layoutSizes, 
  ThemeColors,
  TypographyTheme,
  LayoutTheme
} from '../constants/theme';
import { getSetting, setSetting } from '../db/repository';
import { initDatabase } from '../db/database';

interface MontraContextValue {
  uiMode: UIMode;
  themeMode: ThemeMode;
  currency: string;
  userName: string;
  userAge: number | null;
  userAvatar: string;
  financialGoal: string;
  monthlyBudget: number;
  theme: ThemeColors;
  typography: TypographyTheme;
  layout: LayoutTheme;
  isReady: boolean;
  hasCompletedOnboarding: boolean;
  refreshTrigger: number;
  isBiometricEnabled: boolean;
  biometricAutoLockDelay: number;
  biometricPin: string;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  setIsBiometricEnabled: (enabled: boolean) => Promise<void>;
  setBiometricAutoLockDelay: (delay: number) => Promise<void>;
  setBiometricPin: (pin: string) => Promise<void>;
  unlockApp: () => void;
  setUIMode: (mode: UIMode) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setUserAvatar: (avatar: string) => Promise<void>;
  setHasCompletedOnboarding: (done: boolean) => Promise<void>;
  saveUserProfile: (profile: {
    name: string;
    age?: number | null;
    avatar?: string;
    uiMode?: UIMode;
    financialGoal?: string;
    monthlyBudget?: number;
  }) => Promise<void>;
  notifyDataChanged: () => void;
}

const MontraContext = createContext<MontraContextValue | null>(null);

export function MontraProvider({ children }: { children: React.ReactNode }) {
  const [uiMode, setModeState] = useState<UIMode>('standard');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [currency, setCurrencyState] = useState<string>('₹');
  const [userName, setUserName] = useState<string>('');
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userAvatar, setUserAvatarState] = useState<string>('🧑‍💻');
  const [financialGoal, setFinancialGoal] = useState<string>('essentials');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [hasCompletedOnboarding, setOnboardingState] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Biometric & App Lock State
  const [isBiometricEnabled, setIsBiometricEnabledState] = useState<boolean>(false);
  const [biometricAutoLockDelay, setBiometricAutoLockDelayState] = useState<number>(0);
  const [biometricPin, setBiometricPinState] = useState<string>('');
  const [isAppLocked, setIsAppLockedState] = useState<boolean>(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        const savedName = await getSetting('user_name', '');
        const savedAgeStr = await getSetting('user_age', '');
        const savedAge = savedAgeStr ? parseInt(savedAgeStr, 10) : null;
        const savedGoal = await getSetting('financial_goal', 'essentials');
        const savedBudgetStr = await getSetting('monthly_budget', '0');
        const savedBudget = savedBudgetStr ? parseFloat(savedBudgetStr) : 0;

        let savedMode = (await getSetting('ui_mode', '')) as UIMode;
        if (!savedMode) {
          if (savedAge !== null && savedAge < 35) {
            savedMode = 'standard';
          } else if (savedAge !== null && savedAge >= 60) {
            savedMode = 'easy';
          } else {
            savedMode = 'standard';
          }
        }

        const savedTheme = (await getSetting('theme_mode', 'light')) as ThemeMode;
        const savedCurrency = await getSetting('currency', '₹');
        const savedAvatar = await getSetting('user_avatar', '');
        const defaultAvatar = savedAge !== null && savedAge >= 60 ? '🧓' : '🧑‍💻';
        const onboardingDone = await getSetting('has_completed_onboarding', 'false');

        // Biometric Settings
        const savedBioEnabled = await getSetting('biometric_enabled', 'false');
        const savedBioDelayStr = await getSetting('biometric_auto_lock_delay', '0');
        const savedBioDelay = parseInt(savedBioDelayStr, 10) || 0;
        const savedBioPin = await getSetting('biometric_pin', '');

        const isBioOn = savedBioEnabled === 'true';
        setIsBiometricEnabledState(isBioOn);
        setBiometricAutoLockDelayState(savedBioDelay);
        setBiometricPinState(savedBioPin);
        if (isBioOn) {
          setIsAppLockedState(true);
        }

        setUserName(savedName);
        setUserAge(savedAge);
        setUserAvatarState(savedAvatar || defaultAvatar);
        setFinancialGoal(savedGoal);
        setMonthlyBudget(savedBudget);
        setModeState(savedMode);
        setThemeModeState(savedTheme);
        setCurrencyState(savedCurrency);
        setOnboardingState(onboardingDone === 'true');
      } catch (err) {
        console.error('Database initialization error:', err);
      } finally {
        setIsReady(true);
      }
    }
    setup();
  }, []);

  // Monitor AppState to lock app when returning from background
  useEffect(() => {
    let lastBackgroundTime = 0;
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        lastBackgroundTime = Date.now();
      } else if (nextAppState === 'active') {
        if (isBiometricEnabled) {
          const elapsedSec = (Date.now() - lastBackgroundTime) / 1000;
          if (elapsedSec >= biometricAutoLockDelay) {
            setIsAppLockedState(true);
          }
        }
      }
    });
    return () => subscription.remove();
  }, [isBiometricEnabled, biometricAutoLockDelay]);

  const setIsBiometricEnabled = async (enabled: boolean) => {
    setIsBiometricEnabledState(enabled);
    await setSetting('biometric_enabled', enabled ? 'true' : 'false');
  };

  const setBiometricAutoLockDelay = async (delay: number) => {
    setBiometricAutoLockDelayState(delay);
    await setSetting('biometric_auto_lock_delay', String(delay));
  };

  const setBiometricPin = async (pin: string) => {
    setBiometricPinState(pin);
    await setSetting('biometric_pin', pin);
  };

  const unlockApp = () => {
    setIsAppLockedState(false);
  };

  const setUIMode = async (mode: UIMode) => {
    setModeState(mode);
    await setSetting('ui_mode', mode);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await setSetting('theme_mode', mode);
  };

  const setCurrency = async (curr: string) => {
    setCurrencyState(curr);
    await setSetting('currency', curr);
  };

  const setUserAvatar = async (avatar: string) => {
    setUserAvatarState(avatar);
    await setSetting('user_avatar', avatar);
  };

  const setHasCompletedOnboarding = async (done: boolean) => {
    setOnboardingState(done);
    await setSetting('has_completed_onboarding', done ? 'true' : 'false');
  };

  const saveUserProfile = async (profile: {
    name: string;
    age?: number | null;
    avatar?: string;
    uiMode?: UIMode;
    financialGoal?: string;
    monthlyBudget?: number;
  }) => {
    setUserName(profile.name);
    await setSetting('user_name', profile.name);

    if (profile.avatar) {
      setUserAvatarState(profile.avatar);
      await setSetting('user_avatar', profile.avatar);
    }

    let chosenMode = profile.uiMode;

    if (profile.age !== undefined && profile.age !== null) {
      setUserAge(profile.age);
      await setSetting('user_age', String(profile.age));
      // Under 35 -> Standard mode
      if (profile.age < 35) {
        chosenMode = 'standard';
      } else if (!chosenMode) {
        chosenMode = profile.age >= 60 ? 'easy' : 'standard';
      }
    }

    if (chosenMode) {
      setModeState(chosenMode);
      await setSetting('ui_mode', chosenMode);
    }

    if (profile.financialGoal !== undefined) {
      setFinancialGoal(profile.financialGoal);
      await setSetting('financial_goal', profile.financialGoal);
    }

    if (profile.monthlyBudget !== undefined) {
      setMonthlyBudget(profile.monthlyBudget);
      await setSetting('monthly_budget', String(profile.monthlyBudget));
    }
  };

  const notifyDataChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const theme = themeMode === 'light' ? lightTheme : darkTheme;
  const typo = uiMode === 'easy' ? typography.easy : typography.standard;
  const layout = uiMode === 'easy' ? layoutSizes.easy : layoutSizes.standard;

  return (
    <MontraContext.Provider
      value={{
        uiMode,
        themeMode,
        currency,
        userName,
        userAge,
        userAvatar,
        financialGoal,
        monthlyBudget,
        theme,
        typography: typo,
        layout,
        isReady,
        hasCompletedOnboarding,
        refreshTrigger,
        isBiometricEnabled,
        biometricAutoLockDelay,
        biometricPin,
        isAppLocked,
        setIsAppLocked: setIsAppLockedState,
        setIsBiometricEnabled,
        setBiometricAutoLockDelay,
        setBiometricPin,
        unlockApp,
        setUIMode,
        setThemeMode,
        setCurrency,
        setUserAvatar,
        setHasCompletedOnboarding,
        saveUserProfile,
        notifyDataChanged,
      }}
    >
      {children}
    </MontraContext.Provider>
  );
}

export function useMontra() {
  const ctx = useContext(MontraContext);
  if (!ctx) {
    throw new Error('useMontra must be used within MontraProvider');
  }
  return ctx;
}

