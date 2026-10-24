import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  Home,
  BarChart3,
  Plus,
  SlidersHorizontal,
  User,
} from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';

interface BottomNavBarProps {
  activeTab?: 'home' | 'insights' | 'planning' | 'accounts';
}

export function BottomNavBar({ activeTab = 'home' }: BottomNavBarProps) {
  const pathname = usePathname();
  const { theme, typography, uiMode } = useMontra();
  const { triggerLight, triggerMedium } = useHaptics();

  // Determine current active tab
  let current = activeTab;
  if (pathname === '/') current = 'home';
  else if (pathname.includes('/history')) current = 'insights';
  else if (pathname.includes('/limits')) current = 'planning';
  else if (pathname.includes('/setup')) current = 'accounts';

  const navigateTo = (path: string) => {
    triggerLight();
    if (pathname !== path) {
      router.push(path as any);
    }
  };

  const openAdd = () => {
    triggerMedium();
    router.push({ pathname: '/add', params: { defaultType: 'expense' } });
  };

  const navItems = [
    { key: 'home', label: 'Home', icon: Home, path: '/' },
    { key: 'insights', label: 'Insights', icon: BarChart3, path: '/history' },
    { key: 'add', isCenter: true },
    { key: 'planning', label: 'Planning', icon: SlidersHorizontal, path: '/limits' },
    { key: 'accounts', label: 'Accounts', icon: User, path: '/setup' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.surfaceBorder,
        },
      ]}
    >
      <View style={styles.navRow}>
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <View key="center-add" style={styles.centerButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.centerAddButton,
                    {
                      backgroundColor: theme.primary, // Olive Green #526B45
                      borderColor: theme.surface,
                      borderWidth: 3,
                      shadowColor: theme.primary,
                    },
                  ]}
                  onPress={openAdd}
                  activeOpacity={0.85}
                  accessibilityLabel="Add transaction"
                >
                  <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
                </TouchableOpacity>
              </View>
            );
          }

          const isActive = current === item.key;
          const IconComponent = item.icon!;
          const activeColor = theme.primary;
          const inactiveColor = theme.textMuted;

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabItem}
              onPress={() => navigateTo(item.path!)}
              activeOpacity={0.7}
              accessibilityLabel={item.label}
            >
              <IconComponent
                size={uiMode === 'easy' ? 24 : 22}
                color={isActive ? activeColor : inactiveColor}
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: isActive ? activeColor : inactiveColor,
                    fontWeight: isActive ? '700' : '500',
                    fontSize: uiMode === 'easy' ? 12 : 11,
                    marginTop: 3,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1.5,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  centerButtonContainer: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  centerAddButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
