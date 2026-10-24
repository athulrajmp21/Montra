import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Menu,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Repeat,
  Wallet,
  Landmark,
  CreditCard,
  X,
} from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';
import {
  getCategories,
  getMonthSummary,
  getRecentTransactions,
  getUpcomingSubscriptions,
  getAccountBalances,
} from '../db/repository';
import { CategoryItem } from '../constants/categories';
import { MonthSummary, TransactionWithCategory, SubscriptionWithCategory } from '../db/schema';
import { AdvisorCard } from '../components/AdvisorCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { formatNumber, formatCurrency } from '../utils/formatCurrency';

const AVATAR_OPTIONS = [
  { icon: '🧑‍💻', name: 'Digital Pro' },
  { icon: '⚡', name: 'High Energy' },
  { icon: '🌿', name: 'Mindful' },
  { icon: '🚀', name: 'Growth' },
  { icon: '🦊', name: 'Smart Saver' },
  { icon: '💼', name: 'Executive' },
  { icon: '🦁', name: 'Leader' },
  { icon: '💎', name: 'Investor' },
  { icon: '👵', name: 'Matriarch' },
  { icon: '🧓', name: 'Patriarch' },
  { icon: '🌟', name: 'Star' },
  { icon: '☕', name: 'Cozy Life' },
];

export default function HomeScreen() {
  const {
    theme,
    typography,
    layout,
    uiMode,
    currency,
    userName,
    userAvatar,
    setUserAvatar,
    refreshTrigger,
  } = useMontra();
  const { triggerLight, triggerMedium } = useHaptics();

  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [recentTx, setRecentTx] = useState<TransactionWithCategory[]>([]);
  const [summary, setSummary] = useState<MonthSummary>({
    totalExpense: 0,
    totalIncome: 0,
    totalInvestment: 0,
    remainingSafeSpend: 0,
    categorySpend: {},
  });
  const [upcomingBills, setUpcomingBills] = useState<SubscriptionWithCategory[]>([]);
  const [accountBalances, setAccountBalances] = useState<{
    cash: { balance: number; income: number; expense: number; count: number };
    upi: { balance: number; income: number; expense: number; count: number };
    card: { balance: number; income: number; expense: number; count: number };
    totalBalance: number;
  } | null>(null);
  const [showAccountsModal, setShowAccountsModal] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const allCats = await getCategories();
      setCategories(allCats);

      const now = new Date();
      const monthData = await getMonthSummary(now.getFullYear(), now.getMonth());
      setSummary(monthData);

      const txList = await getRecentTransactions(4);
      setRecentTx(txList);

      const bills = await getUpcomingSubscriptions(5);
      setUpcomingBills(bills);

      const accts = await getAccountBalances();
      setAccountBalances(accts);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshTrigger])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Dynamic greeting & icon based on current local hour
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', icon: '🌅' };
    }
    if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon', icon: '☀️' };
    }
    if (hour >= 17 && hour < 21) {
      return { text: 'Good evening', icon: '🌇' };
    }
    return { text: 'Good night', icon: '🌙' };
  };

  const getFirstName = () => {
    if (!userName || !userName.trim()) return 'Friend';
    return userName.trim().split(' ')[0];
  };

  const getGreetingHeadline = () => {
    const hour = new Date().getHours();
    const firstName = getFirstName();
    if (hour >= 5 && hour < 12) {
      return `Rise & shine, ${firstName} ☀️`;
    }
    if (hour >= 12 && hour < 17) {
      return `Hey, ${firstName} ✨`;
    }
    if (hour >= 17 && hour < 22) {
      return `Good evening, ${firstName} 🌇`;
    }
    return `Rest well, ${firstName} 🌙`;
  };

  const getSmartSubtitle = () => {
    if (summary.totalExpense === 0 && summary.totalIncome === 0) {
      return 'Wallet is fresh & ready for today';
    }
    if (totalBudgetTarget > 0 && summary.totalExpense > totalBudgetTarget) {
      return `⚠️ Over monthly budget by ${formatCurrency(summary.totalExpense - totalBudgetTarget, currency)}`;
    }
    if (totalBudgetTarget > 0) {
      const remaining = Math.max(0, totalBudgetTarget - summary.totalExpense);
      return `🌿 ${formatCurrency(remaining, currency)} safe to spend this month`;
    }
    return 'Track today to grow lasting wealth';
  };

  const getCalendarDate = () => {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      month: months[now.getMonth()],
      day: now.getDate(),
    };
  };

  const greetingInfo = getGreetingData();
  const calDate = getCalendarDate();

  // Calculate total monthly budget target
  const totalBudgetTarget = categories
    .filter((c) => c.type === 'expense')
    .reduce((acc, c) => acc + (c.monthlyTarget || 0), 0);

  const budgetUsedPercent =
    totalBudgetTarget > 0
      ? Math.min(100, Math.round((summary.totalExpense / totalBudgetTarget) * 100))
      : 0;

  // Net Balance (Income - Expense - Investment, or base display)
  const netBalance = Math.max(0, summary.totalIncome - summary.totalExpense);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailySafeSpend = Math.max(0, Math.round(summary.remainingSafeSpend / daysLeft));

  const savingsTargetTotal =
    categories
      .filter((c) => c.type === 'investment')
      .reduce((acc, cat) => acc + (cat.monthlyTarget || 0), 0) || 5000;
  const savingsProgressPercent =
    savingsTargetTotal > 0
      ? Math.min(100, Math.round((summary.totalInvestment / savingsTargetTotal) * 100))
      : 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Aesthetic Mobile Greeting Header */}
        <View style={styles.greetingHeader}>
          <View style={styles.greetingLeft}>
            {/* Interactive Luxury Multi-Ring Persona Avatar */}
            <TouchableOpacity
              onPress={() => {
                triggerLight();
                setShowAvatarModal(true);
              }}
              activeOpacity={0.8}
              style={styles.avatarTouchArea}
            >
              <LinearGradient
                colors={['#526B45', '#8EA971', '#34D399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientRing}
              >
                <View style={[styles.avatarInner, { backgroundColor: theme.surface }]}>
                  <Text style={styles.avatarPersonaEmoji}>
                    {userAvatar || '🧑‍💻'}
                  </Text>
                </View>
              </LinearGradient>

              {/* Sparkle edit badge on avatar */}
              <View style={[styles.avatarBadge, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
                <Sparkles size={9} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Dynamic Greeting Headline & Subtitle */}
            <View style={styles.greetingTexts}>
              {/* Dynamic Main Greeting */}
              <Text
                style={[
                  typography.title,
                  styles.greetingHeadline,
                  {
                    color: theme.textPrimary,
                    fontSize: uiMode === 'easy' ? 24 : 20,
                  },
                ]}
                numberOfLines={1}
              >
                {getGreetingHeadline()}
              </Text>

              {/* Smart Financial Context Subtitle */}
              <Text
                style={[
                  typography.caption,
                  styles.greetingSmartSubtitle,
                  { color: theme.textMuted },
                ]}
                numberOfLines={1}
              >
                {getSmartSubtitle()}
              </Text>
            </View>
          </View>

          {/* Aesthetic Calendar Tile Widget */}
          <TouchableOpacity
            style={[
              styles.calendarTile,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorderHighlight,
              },
            ]}
            activeOpacity={0.75}
            onPress={() => {
              triggerLight();
              router.push('/history');
            }}
          >
            <View style={[styles.calendarMonthHeader, { backgroundColor: theme.softSage }]}>
              <Text style={[styles.calendarMonthText, { color: theme.primary }]}>
                {calDate.month}
              </Text>
            </View>
            <Text style={[styles.calendarDayText, { color: theme.textPrimary }]}>
              {calDate.day}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Balance Card (Ultra-Modern Glassmorphic Luxury Palette) */}
        <LinearGradient
          colors={['#2A3C23', '#3B5232', '#4B673F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.balanceCard,
            {
              borderRadius: layout.borderRadius + 6,
            },
          ]}
        >
          {/* Subtle Ambient Glow Circles for Depth */}
          <View style={styles.cardAmbientGlowTop} pointerEvents="none" />
          <View style={styles.cardAmbientGlowBottom} pointerEvents="none" />

          {/* Card Header Row */}
          <View style={styles.balanceHeaderRow}>
            <View style={styles.balanceLabelGroup}>
              <View style={styles.balanceLiveDot} />
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            <TouchableOpacity
              style={styles.balanceActivePill}
              onPress={() => {
                triggerLight();
                setShowAccountsModal(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.balanceActivePillText}>ALL ACCOUNTS ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Balance Amount */}
          <Text style={[typography.hero, styles.balanceAmount]}>
            {formatCurrency(netBalance, currency, { decimals: 2 })}
          </Text>

          {/* Modern Glassmorphic Income & Expenses Capsules (No + or - signs) */}
          <View style={styles.capsulesRow}>
            {/* Income Capsule */}
            <View style={styles.capsule}>
              <View style={styles.capsuleHeader}>
                <View style={[styles.capsuleIconWrap, { backgroundColor: 'rgba(52, 211, 153, 0.20)' }]}>
                  <ArrowDownLeft size={13} color="#34D399" strokeWidth={2.5} />
                </View>
                <Text style={styles.capsuleTitle}>Income</Text>
              </View>
              <Text style={styles.capsuleValue}>
                {formatCurrency(summary.totalIncome, currency)}
              </Text>
            </View>

            {/* Expenses Capsule */}
            <View style={styles.capsule}>
              <View style={styles.capsuleHeader}>
                <View style={[styles.capsuleIconWrap, { backgroundColor: 'rgba(248, 113, 113, 0.20)' }]}>
                  <ArrowUpRight size={13} color="#F87171" strokeWidth={2.5} />
                </View>
                <Text style={styles.capsuleTitle}>Expenses</Text>
              </View>
              <Text style={styles.capsuleValue}>
                {formatCurrency(summary.totalExpense, currency)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Monthly Budget Card */}
        <View
          style={[
            styles.budgetCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              borderRadius: layout.borderRadius,
              padding: layout.cardPadding,
            },
          ]}
        >
          <View style={styles.budgetCardHeader}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              Monthly budget
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerLight();
                router.push('/limits');
              }}
              style={styles.viewDetailsRow}
            >
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                View details
              </Text>
              <ChevronRight size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.budgetAmountsRow}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>
              Monthly spending
            </Text>
            <Text style={[typography.body, { color: theme.textPrimary, fontWeight: '700' }]}>
              {formatCurrency(summary.totalExpense, currency)}{' '}
              <Text style={{ color: theme.textMuted, fontWeight: '400' }}>
                / {formatCurrency(totalBudgetTarget, currency)}
              </Text>
            </Text>
          </View>

          {/* Progress Indicator in Sage #8FA17B */}
          <View style={[styles.budgetTrack, { backgroundColor: theme.softSage }]}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min(100, Math.max(4, budgetUsedPercent))}%`,
                  backgroundColor: budgetUsedPercent >= 95 ? theme.expense : theme.secondary,
                },
              ]}
            />
          </View>

          <View style={styles.budgetFooter}>
            <View>
              <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
                {formatCurrency(summary.remainingSafeSpend, currency)} remaining this month
              </Text>
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 11, marginTop: 2 }]}>
                ⚡ {formatCurrency(dailySafeSpend, currency)} / day safe spend ({daysLeft}d left)
              </Text>
            </View>
            <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
              {budgetUsedPercent}% used
            </Text>
          </View>
        </View>

        {/* Upcoming Recurring Bills Alert Card */}
        {upcomingBills.length > 0 && (
          <TouchableOpacity
            style={[
              styles.upcomingBillsCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.secondary + '60',
                borderRadius: layout.borderRadius,
                padding: layout.cardPadding,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              triggerLight();
              router.push('/limits');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.upcomingIconBadge, { backgroundColor: theme.softSage }]}>
                  <Repeat size={16} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
                    Upcoming Bill ({upcomingBills.length} due soon)
                  </Text>
                  <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 14 }]} numberOfLines={1}>
                    {upcomingBills[0].name} • Due on {upcomingBills[0].billing_day}th
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '800' }]}>
                  {formatCurrency(upcomingBills[0].amount, currency)}
                </Text>
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 11 }]}>
                  Manage →
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Dedicated Savings Milestones Banner */}
        <View
          style={[
            styles.savingsCard,
            {
              backgroundColor: theme.investmentBg,
              borderColor: theme.investment + '40',
              borderRadius: layout.borderRadius,
              padding: layout.cardPadding,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.savingsIconBadge, { backgroundColor: theme.investment }]}>
                <TrendingUp size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 16 }]}>
                  Savings Milestones
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  Goal: {formatCurrency(savingsTargetTotal, currency)} / mo
                </Text>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[typography.subtitle, { color: theme.investment, fontWeight: '800' }]}>
                {formatCurrency(summary.totalInvestment, currency)}
              </Text>
              <Text style={[typography.caption, { color: theme.investment, fontWeight: '700', fontSize: 11 }]}>
                {savingsProgressPercent}% reached
              </Text>
            </View>
          </View>

          {/* Savings Milestone Track */}
          <View style={[styles.budgetTrack, { backgroundColor: theme.investment + '20', height: 6, marginVertical: 2 }]}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min(100, Math.max(savingsProgressPercent > 0 ? 5 : 0, savingsProgressPercent))}%`,
                  backgroundColor: theme.investment,
                  height: 6,
                },
              ]}
            />
          </View>
        </View>

        {/* Proactive Advisor Card */}
        <AdvisorCard
          categories={categories}
          categorySpend={summary.categorySpend}
          totalInvestment={summary.totalInvestment}
          remainingSafeSpend={summary.remainingSafeSpend}
        />

        {/* Recent Transactions Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
              Recent transactions
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerLight();
                router.push('/history');
              }}
              style={styles.viewDetailsRow}
            >
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                See all
              </Text>
              <ChevronRight size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {recentTx.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: layout.borderRadius,
                  padding: layout.cardPadding,
                },
              ]}
            >
              <Text style={[typography.body, { color: theme.textMuted, textAlign: 'center' }]}>
                No transactions recorded yet.
              </Text>
              <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: 4 }]}>
                Tap the central '+' button below to add your first expense!
              </Text>
            </View>
          ) : (
            recentTx.map((tx) => {
              const isExp = tx.type === 'expense';
              const isInc = tx.type === 'income';

              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txItemCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.surfaceBorder,
                      borderRadius: layout.borderRadius - 4,
                      padding: layout.cardPadding - 2,
                    },
                  ]}
                >
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.txIconBubble,
                        {
                          backgroundColor: (tx.category_color || theme.primary) + '1A',
                        },
                      ]}
                    >
                      <CategoryIcon
                        name={tx.category_icon || 'HelpCircle'}
                        size={20}
                        color={tx.category_color || theme.primary}
                      />
                    </View>
                    <View>
                      <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 16 }]}>
                        {uiMode === 'easy' ? tx.category_easy_name : tx.category_name}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        {isInc ? 'Income' : isExp ? 'Home & daily' : 'Savings'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      typography.subtitle,
                      {
                        color: isExp ? theme.expense : isInc ? theme.income : theme.investment,
                        fontWeight: '800',
                      },
                    ]}
                  >
                    {isExp ? '−' : '+'}
                    {formatCurrency(tx.amount, currency)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 5-Item Mobile Bottom Navigation Bar */}
      <BottomNavBar activeTab="home" />

      {/* Avatar Persona Selector Modal */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorderHighlight,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: theme.softSage }]}>
                <Sparkles size={20} color={theme.primary} />
              </View>
              <Text style={[typography.title, styles.modalTitle, { color: theme.textPrimary }]}>
                Choose Your Persona
              </Text>
              <Text style={[typography.caption, styles.modalSubtitle, { color: theme.textMuted }]}>
                Pick an avatar that reflects your vibe & financial journey
              </Text>
            </View>

            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = userAvatar === item.icon;
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[
                      styles.avatarOptionCard,
                      {
                        backgroundColor: isSelected ? theme.softSage : theme.background,
                        borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      triggerMedium();
                      setUserAvatar(item.icon);
                      setShowAvatarModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.avatarOptionEmoji}>{item.icon}</Text>
                    <Text
                      style={[
                        typography.caption,
                        styles.avatarOptionLabel,
                        {
                          color: isSelected ? theme.primary : theme.textPrimary,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                { backgroundColor: theme.background, borderColor: theme.surfaceBorder },
              ]}
              onPress={() => setShowAvatarModal(false)}
              activeOpacity={0.75}
            >
              <Text style={[typography.body, { color: theme.textPrimary, fontWeight: '700' }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Account Balances Breakdown Sheet Modal */}
      <Modal
        visible={showAccountsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorderHighlight,
              },
            ]}
          >
            <View style={styles.accountModalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.title, { color: theme.textPrimary, fontSize: 18, fontWeight: '800' }]}>
                  Payment Methods & Accounts
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  Live balance & transactions per method
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAccountsModal(false)}
                style={[styles.closeIconBtn, { backgroundColor: theme.softSage }]}
                activeOpacity={0.75}
              >
                <X size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* List of 3 payment methods */}
            <View style={{ gap: 10, marginVertical: 14 }}>
              {/* UPI & Bank */}
              <View style={[styles.accountItemCard, { backgroundColor: theme.background, borderColor: theme.surfaceBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.accountMethodIconWrap, { backgroundColor: '#34D39920' }]}>
                    <Landmark size={18} color="#34D399" />
                  </View>
                  <View>
                    <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                      UPI & Bank Accounts
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      {accountBalances?.upi.count || 0} transactions
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '800' }]}>
                    {formatCurrency(accountBalances?.upi.balance || 0, currency)}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
                    Net Inflow
                  </Text>
                </View>
              </View>

              {/* Cash in Hand */}
              <View style={[styles.accountItemCard, { backgroundColor: theme.background, borderColor: theme.surfaceBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.accountMethodIconWrap, { backgroundColor: '#F59E0B20' }]}>
                    <Wallet size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                      Cash in Hand
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      {accountBalances?.cash.count || 0} transactions
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '800' }]}>
                    {formatCurrency(accountBalances?.cash.balance || 0, currency)}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
                    Net Inflow
                  </Text>
                </View>
              </View>

              {/* Cards Spends */}
              <View style={[styles.accountItemCard, { backgroundColor: theme.background, borderColor: theme.surfaceBorder }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.accountMethodIconWrap, { backgroundColor: '#6366F120' }]}>
                    <CreditCard size={18} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 15 }]}>
                      Cards
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      {accountBalances?.card.count || 0} transactions
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.subtitle, { color: theme.expense, fontWeight: '800' }]}>
                    {formatCurrency(accountBalances?.card.expense || 0, currency)}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
                    Spent
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseBtn,
                { backgroundColor: theme.softSage, borderColor: theme.primary + '30', marginTop: 4 },
              ]}
              onPress={() => setShowAccountsModal(false)}
              activeOpacity={0.75}
            >
              <Text style={[typography.body, { color: theme.primary, fontWeight: '700' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 4,
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarTouchArea: {
    position: 'relative',
  },
  avatarGradientRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInner: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPersonaEmoji: {
    fontSize: 25,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingHeadline: {
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    lineHeight: 25,
  },
  greetingSmartSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  calendarTile: {
    width: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarMonthHeader: {
    width: '100%',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
  },
  calendarDayText: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    paddingVertical: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 25, 17, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarOptionCard: {
    width: '30%',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarOptionEmoji: {
    fontSize: 26,
  },
  avatarOptionLabel: {
    fontSize: 11,
  },
  modalCloseBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    padding: 22,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardAmbientGlowTop: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardAmbientGlowBottom: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  balanceLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  balanceLabel: {
    color: '#D4E2CD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  balanceActivePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  balanceActivePillText: {
    color: '#E4EDE0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  balanceAmount: {
    color: '#FFFFFF',
    marginTop: 2,
    marginBottom: 20,
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.5,
  },
  capsulesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  capsule: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  capsuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  capsuleIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capsuleTitle: {
    color: '#DBE7D7',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  capsuleValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  budgetCard: {
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  budgetAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetTrack: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 6,
  },
  budgetFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  upcomingBillsCard: {
    borderWidth: 1.5,
    marginBottom: 14,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsCard: {
    borderWidth: 1.5,
    marginBottom: 14,
  },
  savingsIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSection: {
    marginTop: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyCard: {
    borderWidth: 1.5,
  },
  txItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 8,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  accountMethodIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
