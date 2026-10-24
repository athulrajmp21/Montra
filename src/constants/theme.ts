import { TextStyle } from 'react-native';

export type UIMode = 'easy' | 'standard';
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;           // Olive Green #526B45
  secondary: string;         // Sage #8FA17B
  softSage: string;          // Soft Sage #E5EBDD
  background: string;        // Warm Cream #F7F6F0 (or deep green-black in dark)
  surface: string;           // White #FFFFFF
  surfaceElevated: string;
  surfaceBorder: string;
  surfaceBorderHighlight: string;
  
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  accent: string;
  accentSoft: string;
  accentGlow: string;
  
  // Financial colors
  income: string;            // Income #27845B
  incomeBg: string;
  expense: string;           // Expenses #D97745
  expenseBg: string;
  investment: string;        // Savings #6486B5
  investmentBg: string;
  
  safeGreen: string;         // #27845B
  safeGreenBg: string;
  warningAmber: string;      // #D97745
  warningAmberBg: string;
  dangerRed: string;         // #C04930
  dangerRedBg: string;

  // Gradients
  heroGradient: [string, string, ...string[]];
  oliveGradient: [string, string, ...string[]];
  investmentGradient: [string, string, ...string[]];
  expenseGradient: [string, string, ...string[]];
  incomeGradient: [string, string, ...string[]];
  cardGradient: [string, string, ...string[]];
}

export const lightTheme: ThemeColors = {
  primary: '#526B45',
  secondary: '#8FA17B',
  softSage: '#E5EBDD',
  background: '#F7F6F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceBorder: '#E5EADF',
  surfaceBorderHighlight: '#D3DEC9',
  
  textPrimary: '#263A2B',
  textSecondary: '#4A5B42',
  textMuted: '#7A8C73',
  textInverse: '#FFFFFF',
  
  accent: '#526B45',
  accentSoft: '#E5EBDD',
  accentGlow: 'rgba(82, 107, 69, 0.18)',
  
  income: '#27845B',
  incomeBg: '#E4F4EC',
  expense: '#D97745',
  expenseBg: '#FCEFE8',
  investment: '#6486B5',
  investmentBg: '#EDF3FA',
  
  safeGreen: '#27845B',
  safeGreenBg: '#E4F4EC',
  warningAmber: '#D97745',
  warningAmberBg: '#FCEFE8',
  dangerRed: '#C04930',
  dangerRedBg: '#FDECE9',

  heroGradient: ['#49613C', '#526B45', '#5E794F'],
  oliveGradient: ['#526B45', '#435837'],
  investmentGradient: ['#6486B5', '#50709C'],
  expenseGradient: ['#D97745', '#BF6030'],
  incomeGradient: ['#27845B', '#1E6947'],
  cardGradient: ['#FFFFFF', '#FAFAF7'],
};

export const darkTheme: ThemeColors = {
  primary: '#779767',
  secondary: '#8FA17B',
  softSage: 'rgba(143, 161, 123, 0.18)',
  background: '#121911',
  surface: '#1A2419',
  surfaceElevated: '#233022',
  surfaceBorder: 'rgba(255, 255, 255, 0.09)',
  surfaceBorderHighlight: 'rgba(143, 161, 123, 0.25)',
  
  textPrimary: '#F5F8F3',
  textSecondary: '#A9BC9F',
  textMuted: '#6E8066',
  textInverse: '#121911',
  
  accent: '#8FA17B',
  accentSoft: 'rgba(143, 161, 123, 0.22)',
  accentGlow: 'rgba(143, 161, 123, 0.3)',
  
  income: '#3EB07E',
  incomeBg: 'rgba(62, 176, 126, 0.16)',
  expense: '#E88B5B',
  expenseBg: 'rgba(232, 139, 91, 0.16)',
  investment: '#7E9EC9',
  investmentBg: 'rgba(126, 158, 201, 0.16)',
  
  safeGreen: '#3EB07E',
  safeGreenBg: 'rgba(62, 176, 126, 0.16)',
  warningAmber: '#E88B5B',
  warningAmberBg: 'rgba(232, 139, 91, 0.16)',
  dangerRed: '#E66147',
  dangerRedBg: 'rgba(230, 97, 71, 0.16)',

  heroGradient: ['#1C2A1B', '#141E13', '#0E160D'],
  oliveGradient: ['#526B45', '#3E5234'],
  investmentGradient: ['#6486B5', '#4D6B94'],
  expenseGradient: ['#D97745', '#B85E32'],
  incomeGradient: ['#27845B', '#1B6443'],
  cardGradient: ['#1A2419', '#151D14'],
};

// Aliases for backwards compatibility
export const easyTheme = lightTheme;
export const standardTheme = darkTheme;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export interface TypographyToken {
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
}

export interface TypographyTheme {
  hero: TypographyToken;
  title: TypographyToken;
  subtitle: TypographyToken;
  body: TypographyToken;
  caption: TypographyToken;
  button: TypographyToken;
  keypad: TypographyToken;
}

export interface LayoutTheme {
  buttonHeight: number;
  touchTargetMin: number;
  iconSize: number;
  cardPadding: number;
  borderRadius: number;
  keypadKeyHeight: number;
}

export const typography: { easy: TypographyTheme; standard: TypographyTheme } = {
  easy: {
    hero: { fontSize: 34, fontWeight: '800', lineHeight: 42, letterSpacing: -0.4, fontFamily: 'PlusJakartaSans_800ExtraBold' },
    title: { fontSize: 23, fontWeight: '700', lineHeight: 30, letterSpacing: -0.2, fontFamily: 'PlusJakartaSans_700Bold' },
    subtitle: { fontSize: 18, fontWeight: '600', lineHeight: 26, fontFamily: 'PlusJakartaSans_600SemiBold' },
    body: { fontSize: 16, fontWeight: '500', lineHeight: 24, fontFamily: 'PlusJakartaSans_500Medium' },
    caption: { fontSize: 13, fontWeight: '600', lineHeight: 18, fontFamily: 'PlusJakartaSans_600SemiBold' },
    button: { fontSize: 18, fontWeight: '700', letterSpacing: 0.2, fontFamily: 'PlusJakartaSans_700Bold' },
    keypad: { fontSize: 27, fontWeight: '800', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  },
  standard: {
    hero: { fontSize: 30, fontWeight: '800', lineHeight: 38, letterSpacing: -0.5, fontFamily: 'PlusJakartaSans_800ExtraBold' },
    title: { fontSize: 20, fontWeight: '700', lineHeight: 27, letterSpacing: -0.3, fontFamily: 'PlusJakartaSans_700Bold' },
    subtitle: { fontSize: 15, fontWeight: '600', lineHeight: 22, letterSpacing: -0.1, fontFamily: 'PlusJakartaSans_600SemiBold' },
    body: { fontSize: 14, fontWeight: '500', lineHeight: 21, fontFamily: 'PlusJakartaSans_500Medium' },
    caption: { fontSize: 12, fontWeight: '600', lineHeight: 17, fontFamily: 'PlusJakartaSans_600SemiBold' },
    button: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2, fontFamily: 'PlusJakartaSans_700Bold' },
    keypad: { fontSize: 24, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  },
};

export const layoutSizes = {
  easy: {
    buttonHeight: 60,
    touchTargetMin: 56,
    iconSize: 26,
    cardPadding: 20,
    borderRadius: 22,
    keypadKeyHeight: 66,
  },
  standard: {
    buttonHeight: 50,
    touchTargetMin: 44,
    iconSize: 22,
    cardPadding: 16,
    borderRadius: 18,
    keypadKeyHeight: 54,
  },
};
