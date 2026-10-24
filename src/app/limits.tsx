import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import {
  Plus,
  Minus,
  SlidersHorizontal,
  TrendingUp,
  ShieldCheck,
  Repeat,
  Calendar,
  Trash2,
  X,
  CreditCard,
  Check,
  CheckCircle2,
  Edit3,
  Pencil,
  Sparkles,
} from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';
import {
  getCategories,
  updateCategoryTarget,
  addCategory,
  deleteCategory,
  getSubscriptions,
  addSubscription,
  deleteSubscription,
  toggleSubscriptionActive,
  addTransaction,
} from '../db/repository';
import { CategoryItem, DEFAULT_CATEGORIES } from '../constants/categories';
import { SubscriptionWithCategory, BillingCycle } from '../db/schema';
import { CategoryIcon } from '../components/CategoryIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { CustomAlert } from '../components/CustomAlert';
import { formatCurrency, formatAmountInput, isIndianCurrency } from '../utils/formatCurrency';

const AVAILABLE_CATEGORY_ICONS = [
  'ShoppingCart',
  'Utensils',
  'Coffee',
  'Car',
  'Zap',
  'HeartPulse',
  'GraduationCap',
  'TrendingUp',
  'ShieldCheck',
  'Home',
  'Film',
  'Dumbbell',
  'Plane',
  'ShoppingBag',
  'Sparkles',
  'Briefcase',
  'Smile',
  'Gift',
  'Tag',
  'Smartphone',
  'PiggyBank',
  'BookOpen',
  'Baby',
  'PawPrint',
];

const AVAILABLE_CATEGORY_COLORS = [
  '#526B45', // Montra Forest / Olive
  '#8FA17B', // Sage Green
  '#D97745', // Terracotta
  '#C04930', // Crimson / Rust
  '#4B6B94', // Steel Slate Blue
  '#6486B5', // Sky Blue / Investment
  '#B86C4B', // Warm Ochre
  '#27845B', // Emerald Mint
  '#7C5295', // Plum
  '#D4A373', // Sand / Gold
];

export default function LimitsScreen() {
  const { theme, typography, layout, uiMode, currency, notifyDataChanged } = useMontra();
  const { triggerLight, triggerSuccess, triggerWarning } = useHaptics();

  const [activeSubTab, setActiveSubTab] = useState<'budgets' | 'subscriptions'>('budgets');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCategory[]>([]);

  // Add Subscription Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [subName, setSubName] = useState('');
  const [subAmountStr, setSubAmountStr] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subBillingDay, setSubBillingDay] = useState(1);
  const [subPaymentMethod, setSubPaymentMethod] = useState<'upi' | 'bank' | 'cash' | 'card'>('upi');
  const [subCycle, setSubCycle] = useState<BillingCycle>('monthly');
  const [subFilter, setSubFilter] = useState<'all' | 'due_soon' | 'active' | 'paused'>('all');

  // Total Budget Quick Editor Modal State
  const [isTotalBudgetModalVisible, setIsTotalBudgetModalVisible] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState('');

  // Category Target Direct Edit Modal State
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryTargetInput, setCategoryTargetInput] = useState('');

  // Add Category Modal State
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'investment'>('expense');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryTargetStr, setNewCategoryTargetStr] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('ShoppingCart');
  const [newCategoryColor, setNewCategoryColor] = useState('#526B45');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryIsEssential, setNewCategoryIsEssential] = useState(true);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'danger' | 'info';
    title: string;
    message: string;
    primaryBtnText?: string;
    secondaryBtnText?: string;
    onPrimaryPress?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const loadData = async () => {
    const all = await getCategories();
    setCategories(all.filter((c) => c.type !== 'income'));
    const subs = await getSubscriptions();
    setSubscriptions(subs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const adjustLimit = async (category: CategoryItem, delta: number) => {
    triggerLight();
    const newTarget = Math.max(0, category.monthlyTarget + delta);
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, monthlyTarget: newTarget } : c))
    );
    await updateCategoryTarget(category.id, newTarget);
    notifyDataChanged();
  };

  const handleToggleSub = async (sub: SubscriptionWithCategory) => {
    triggerLight();
    const nextState = !sub.is_active;
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, is_active: nextState } : s))
    );
    await toggleSubscriptionActive(sub.id, nextState);
    notifyDataChanged();
  };

  const handleDeleteSub = (sub: SubscriptionWithCategory) => {
    triggerWarning();
    setAlertConfig({
      visible: true,
      type: 'danger',
      title: 'Delete Subscription',
      message: `Are you sure you want to delete "${sub.name}"? This recurring bill will be removed.`,
      primaryBtnText: 'Delete',
      secondaryBtnText: 'Cancel',
      onPrimaryPress: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        await deleteSubscription(sub.id);
        triggerSuccess();
        loadData();
        notifyDataChanged();
      },
    });
  };

  const handleCreateSubscription = async () => {
    if (!subName.trim()) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Subscription Name',
        message: 'Please enter a name (e.g. Netflix, Gym, Broadband).',
      });
      return;
    }

    const numAmount = parseFloat(subAmountStr);
    if (!numAmount || numAmount <= 0) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount greater than zero.',
      });
      return;
    }

    const catId = subCategoryId || expenseCategories[0]?.id || 'cat_utilities';

    await addSubscription({
      name: subName.trim(),
      amount: numAmount,
      categoryId: catId,
      billingDay: subBillingDay,
      paymentMethod: subPaymentMethod,
      cycle: subCycle,
    });

    triggerSuccess();
    setIsAddModalVisible(false);
    setSubName('');
    setSubAmountStr('');
    setSubBillingDay(1);
    setSubPaymentMethod('upi');
    setSubCycle('monthly');
    loadData();
    notifyDataChanged();
  };

  const handleMarkPaid = async (sub: SubscriptionWithCategory) => {
    triggerLight();
    setAlertConfig({
      visible: true,
      type: 'info',
      title: 'Log Subscription Expense',
      message: `Record ${formatCurrency(sub.amount, currency)} for "${sub.name}" as an expense paid today?`,
      primaryBtnText: 'Confirm & Log',
      secondaryBtnText: 'Cancel',
      onPrimaryPress: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        await addTransaction({
          type: 'expense',
          amount: sub.amount,
          categoryId: sub.category_id,
          note: `Recurring bill: ${sub.name}`,
          paymentMethod: sub.payment_method === 'card' ? 'card' : sub.payment_method === 'cash' ? 'cash' : 'upi',
          timestamp: Date.now(),
        });
        triggerSuccess();
        notifyDataChanged();
      },
    });
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const investmentCategories = categories.filter((c) => c.type === 'investment');

  const totalExpenseBudget = expenseCategories.reduce((acc, c) => acc + (c.monthlyTarget || 0), 0);

  const handleOpenTotalBudgetModal = () => {
    triggerLight();
    setTotalBudgetInput(String(totalExpenseBudget));
    setIsTotalBudgetModalVisible(true);
  };

  const handleSaveTotalBudget = async () => {
    const rawNum = parseFloat(totalBudgetInput.replace(/,/g, ''));
    if (isNaN(rawNum) || rawNum <= 0) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Invalid Budget Amount',
        message: 'Please enter a valid monthly budget amount greater than 0.',
      });
      return;
    }

    const newTotal = Math.round(rawNum);
    const currentSum = expenseCategories.reduce((acc, c) => acc + (c.monthlyTarget || 0), 0);

    const defaultWeights: Record<string, number> = {
      household: 8000 / 21000,
      health: 3000 / 21000,
      utilities: 2500 / 21000,
      vehicle: 2500 / 21000,
      personal: 3000 / 21000,
      skills: 2000 / 21000,
    };

    let allocatedSum = 0;
    const updated = expenseCategories.map((c) => {
      const weight = currentSum > 0 ? (c.monthlyTarget / currentSum) : (defaultWeights[c.id] || 0.2);
      const target = Math.round((newTotal * weight) / 100) * 100;
      allocatedSum += target;
      return { ...c, monthlyTarget: target };
    });

    // Handle minor rounding difference so total matches exactly
    const diff = newTotal - allocatedSum;
    if (diff !== 0 && updated.length > 0) {
      updated[0].monthlyTarget = Math.max(0, updated[0].monthlyTarget + diff);
    }

    for (const cat of updated) {
      await updateCategoryTarget(cat.id, cat.monthlyTarget);
    }

    setCategories((prev) =>
      prev.map((c) => {
        const match = updated.find((u) => u.id === c.id);
        return match ? match : c;
      })
    );

    setIsTotalBudgetModalVisible(false);
    triggerSuccess();
    notifyDataChanged();
  };

  const handleOpenCategoryTargetModal = (cat: CategoryItem) => {
    triggerLight();
    setEditingCategory(cat);
    setCategoryTargetInput(String(cat.monthlyTarget));
    setIsCategoryModalVisible(true);
  };

  const handleSaveCategoryTarget = async () => {
    if (!editingCategory) return;
    const rawNum = parseFloat(categoryTargetInput.replace(/,/g, ''));
    if (isNaN(rawNum) || rawNum < 0) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Invalid Target',
        message: 'Please enter a valid amount (0 or more).',
      });
      return;
    }

    const newTarget = Math.round(rawNum);
    setCategories((prev) =>
      prev.map((c) => (c.id === editingCategory.id ? { ...c, monthlyTarget: newTarget } : c))
    );
    await updateCategoryTarget(editingCategory.id, newTarget);
    setIsCategoryModalVisible(false);
    setEditingCategory(null);
    triggerSuccess();
    notifyDataChanged();
  };

  const handleOpenAddCategoryModal = (type: 'expense' | 'investment') => {
    triggerLight();
    setNewCategoryType(type);
    setNewCategoryName('');
    setNewCategoryTargetStr('');
    setNewCategoryIcon(type === 'expense' ? 'ShoppingCart' : 'TrendingUp');
    setNewCategoryColor(type === 'expense' ? '#526B45' : '#6486B5');
    setNewCategoryDesc('');
    setNewCategoryIsEssential(type === 'expense');
    setIsAddCategoryModalVisible(true);
  };

  const handleSaveNewCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Category Name Required',
        message: 'Please enter a name for your new category.',
      });
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Category Already Exists',
        message: `A category named "${trimmedName}" already exists. Please choose a different name.`,
      });
      return;
    }

    const targetAmount = parseFloat(newCategoryTargetStr.replace(/,/g, '')) || 0;
    const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCatItem: CategoryItem = {
      id: newId,
      name: trimmedName,
      easyName: trimmedName,
      icon: newCategoryIcon,
      color: newCategoryColor,
      type: newCategoryType,
      monthlyTarget: targetAmount,
      isEssential: newCategoryIsEssential,
      description: newCategoryDesc.trim() || `${trimmedName} budget category`,
    };

    await addCategory(newCatItem);
    triggerSuccess();
    setIsAddCategoryModalVisible(false);
    await loadData();
    notifyDataChanged();
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    triggerWarning();
    setAlertConfig({
      visible: true,
      type: 'danger',
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"?`,
      primaryBtnText: 'Delete',
      secondaryBtnText: 'Cancel',
      onPrimaryPress: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        const success = await deleteCategory(cat.id);
        if (success) {
          triggerSuccess();
          await loadData();
          notifyDataChanged();
        } else {
          triggerWarning();
          setTimeout(() => {
            setAlertConfig({
              visible: true,
              type: 'warning',
              title: 'Cannot Delete Category',
              message: `"${cat.name}" cannot be deleted because there are existing transactions or subscriptions linked to it.`,
            });
          }, 300);
        }
      },
    });
  };

  const getSubMonthlyAmount = (sub: { amount: number; cycle?: BillingCycle }) => {
    if (sub.cycle === 'yearly') return Math.round(sub.amount / 12);
    if (sub.cycle === 'quarterly') return Math.round(sub.amount / 3);
    return sub.amount;
  };

  const getSubAnnualAmount = (sub: { amount: number; cycle?: BillingCycle }) => {
    if (sub.cycle === 'yearly') return sub.amount;
    if (sub.cycle === 'quarterly') return sub.amount * 4;
    return sub.amount * 12;
  };

  const getDueInfo = (billingDay: number) => {
    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let diff = billingDay - today;
    if (diff < 0) {
      diff += daysInMonth;
    }
    if (diff === 0) {
      return { label: 'Due Today', color: '#D9534F', bg: '#FCEBEA', isUrgent: true, diff: 0 };
    } else if (diff === 1) {
      return { label: 'Due Tomorrow', color: '#E67E22', bg: '#FEF5EC', isUrgent: true, diff: 1 };
    } else if (diff <= 3) {
      return { label: `Due in ${diff}d`, color: '#F39C12', bg: '#FEF9E7', isUrgent: true, diff };
    } else {
      return { label: `Due in ${diff}d`, color: '#2E7D32', bg: '#E8F5E9', isUrgent: false, diff };
    }
  };

  const totalCommitted = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + getSubMonthlyAmount(s), 0);

  const totalAnnualCommitted = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + getSubAnnualAmount(s), 0);

  const upcomingSubscriptions = subscriptions.filter((s) => s.is_active && getDueInfo(s.billing_day).diff <= 3);

  const filteredSubscriptions = useMemo(() => {
    switch (subFilter) {
      case 'due_soon':
        return subscriptions.filter((s) => s.is_active && getDueInfo(s.billing_day).diff <= 3);
      case 'active':
        return subscriptions.filter((s) => s.is_active);
      case 'paused':
        return subscriptions.filter((s) => !s.is_active);
      default:
        return subscriptions;
    }
  }, [subscriptions, subFilter]);

  const getMethodBadge = (method: 'upi' | 'bank' | 'cash' | 'card') => {
    switch (method) {
      case 'upi':
        return { label: '📱 UPI / AutoPay', bg: '#E5EBDD', color: '#263A2B' };
      case 'bank':
        return { label: '🏦 Bank Auto-debit', bg: '#E3EDF7', color: '#1E4068' };
      case 'cash':
        return { label: '💵 Cash / Handover', bg: '#FDF3E5', color: '#8A5314' };
      case 'card':
        return { label: '💳 Card Payment', bg: '#F0EAF8', color: '#5B358A' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Sub-tab Navigation */}
      <View style={[styles.tabBarWrapper, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
        <View style={[styles.subTabPillGroup, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[
              styles.subTabItem,
              activeSubTab === 'budgets' && [styles.subTabItemActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => {
              triggerLight();
              setActiveSubTab('budgets');
            }}
          >
            <SlidersHorizontal size={14} color={activeSubTab === 'budgets' ? '#FFFFFF' : theme.textMuted} />
            <Text
              style={[
                typography.caption,
                styles.subTabText,
                { color: activeSubTab === 'budgets' ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              Category Budgets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTabItem,
              activeSubTab === 'subscriptions' && [styles.subTabItemActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => {
              triggerLight();
              setActiveSubTab('subscriptions');
            }}
          >
            <Repeat size={14} color={activeSubTab === 'subscriptions' ? '#FFFFFF' : theme.textMuted} />
            <Text
              style={[
                typography.caption,
                styles.subTabText,
                { color: activeSubTab === 'subscriptions' ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              Subscriptions ({subscriptions.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeSubTab === 'budgets' ? (
          <>
            {/* Intro Guide Banner in Soft Sage */}
            <View
              style={[
                styles.introCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: layout.borderRadius,
                  padding: layout.cardPadding,
                },
              ]}
            >
              <View style={styles.bannerHeader}>
                <View style={[styles.badgeIcon, { backgroundColor: theme.softSage }]}>
                  <SlidersHorizontal size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
                    {uiMode === 'easy' ? 'Monthly Limits Guide' : 'Budgets & Planning'}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {uiMode === 'easy'
                      ? 'Set maximum spending caps for each category using + or -.'
                      : 'Configure category limits and ongoing monthly savings goals.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Total Monthly Budget Hero Overview Card */}
            <View
              style={[
                styles.totalBudgetHeroCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.surfaceBorder,
                  borderRadius: layout.borderRadius,
                  padding: layout.cardPadding,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }]}>
                    Total Monthly Budget
                  </Text>
                  <Text style={[typography.hero, { color: theme.primary, fontSize: 26, fontWeight: '800', marginTop: 2 }]}>
                    {formatCurrency(totalExpenseBudget, currency)}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                    Distributed across {expenseCategories.length} categories
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.editTotalBtn, { backgroundColor: theme.softSage, borderColor: theme.primary + '30' }]}
                  onPress={handleOpenTotalBudgetModal}
                  activeOpacity={0.75}
                >
                  <Edit3 size={14} color={theme.primary} />
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', marginLeft: 6 }]}>
                    Edit Total
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Expenses Section */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleLeft}>
                <ShieldCheck size={18} color={theme.primary} />
                <Text
                  style={[
                    typography.title,
                    { color: theme.textPrimary, fontSize: uiMode === 'easy' ? 22 : 18 },
                  ]}
                >
                  {uiMode === 'easy' ? 'Expenditure Limits' : 'Expense Budgets'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.addCategoryHeaderBtn, { backgroundColor: theme.softSage, borderColor: theme.primary + '30' }]}
                onPress={() => handleOpenAddCategoryModal('expense')}
                activeOpacity={0.75}
                accessibilityLabel="Add new expense category"
              >
                <Plus size={14} color={theme.primary} />
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {expenseCategories.map((cat) => {
              const displayName =
                cat.id === 'household'
                  ? 'Food & Groceries'
                  : uiMode === 'easy'
                  ? cat.easyName
                  : cat.name;
              const displayDesc =
                cat.id === 'household'
                  ? 'Vegetables, milk, grains, supermarket supplies'
                  : cat.description;
              const iconName = cat.id === 'household' ? 'ShoppingCart' : cat.icon;

              return (
                <View
                  key={cat.id}
                  style={[
                    styles.limitCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.surfaceBorder,
                      borderRadius: layout.borderRadius,
                      padding: layout.cardPadding,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: theme.softSage,
                          borderColor: theme.secondary + '30',
                        },
                      ]}
                    >
                      <CategoryIcon name={iconName} size={layout.iconSize} color={cat.color || theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
                        {displayName}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        {displayDesc}
                      </Text>
                    </View>
                    {!DEFAULT_CATEGORIES.some((d) => d.id === cat.id) && (
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(cat)}
                        style={{ padding: 6 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={`Delete custom category ${displayName}`}
                      >
                        <Trash2 size={16} color={theme.dangerRed} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.controlRow}>
                    <TouchableOpacity
                      style={[
                        styles.stepperBtn,
                        {
                          backgroundColor: theme.softSage,
                          borderColor: theme.surfaceBorderHighlight,
                        },
                      ]}
                      onPress={() => adjustLimit(cat, -500)}
                      accessibilityLabel={`Decrease limit for ${displayName}`}
                    >
                      <Minus size={18} color={theme.primary} />
                      <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                        500
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.targetDisplay}
                      onPress={() => handleOpenCategoryTargetModal(cat)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                          MONTHLY LIMIT
                        </Text>
                        <Pencil size={10} color={theme.textMuted} />
                      </View>
                      <Text style={[typography.subtitle, { color: theme.primary, fontWeight: '900' }]}>
                        {formatCurrency(cat.monthlyTarget, currency)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.stepperBtn,
                        {
                          backgroundColor: theme.softSage,
                          borderColor: theme.surfaceBorderHighlight,
                        },
                      ]}
                      onPress={() => adjustLimit(cat, 500)}
                      accessibilityLabel={`Increase limit for ${displayName}`}
                    >
                      <Plus size={18} color={theme.primary} />
                      <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                        500
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Future Investments / Savings Section */}
            <View style={{ marginTop: 20 }}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleLeft}>
                  <TrendingUp size={18} color={theme.investment} />
                  <Text
                    style={[
                      typography.title,
                      { color: theme.textPrimary, fontSize: uiMode === 'easy' ? 22 : 18 },
                    ]}
                  >
                    Savings & Future Goals
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.addCategoryHeaderBtn,
                    { backgroundColor: theme.investmentBg, borderColor: theme.investment + '30' },
                  ]}
                  onPress={() => handleOpenAddCategoryModal('investment')}
                  activeOpacity={0.75}
                  accessibilityLabel="Add new savings goal"
                >
                  <Plus size={14} color={theme.investment} />
                  <Text style={[typography.caption, { color: theme.investment, fontWeight: '700' }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>

              {investmentCategories.map((cat) => {
                const displayName = uiMode === 'easy' ? cat.easyName : cat.name;

                return (
                  <View
                    key={cat.id}
                    style={[
                      styles.limitCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.investment + '40',
                        borderRadius: layout.borderRadius,
                        padding: layout.cardPadding,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.iconWrap,
                          {
                            backgroundColor: theme.investmentBg,
                            borderColor: theme.investment + '30',
                          },
                        ]}
                      >
                        <CategoryIcon name={cat.icon} size={layout.iconSize} color={theme.investment} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
                          {displayName}
                        </Text>
                        <Text style={[typography.caption, { color: theme.textMuted }]}>
                          {cat.description}
                        </Text>
                      </View>
                      {!DEFAULT_CATEGORIES.some((d) => d.id === cat.id) && (
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(cat)}
                          style={{ padding: 6 }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel={`Delete custom category ${displayName}`}
                        >
                          <Trash2 size={16} color={theme.dangerRed} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.controlRow}>
                      <TouchableOpacity
                        style={[
                          styles.stepperBtn,
                          {
                            backgroundColor: theme.investmentBg,
                            borderColor: theme.investment + '30',
                          },
                        ]}
                        onPress={() => adjustLimit(cat, -1000)}
                      >
                        <Minus size={18} color={theme.investment} />
                        <Text style={[typography.caption, { color: theme.investment, fontWeight: '700' }]}>
                          1,000
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.targetDisplay}
                        onPress={() => handleOpenCategoryTargetModal(cat)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                            MONTHLY GOAL
                          </Text>
                          <Pencil size={10} color={theme.textMuted} />
                        </View>
                        <Text
                          style={[
                            typography.subtitle,
                            { color: theme.investment, fontWeight: '900' },
                          ]}
                        >
                          {formatCurrency(cat.monthlyTarget, currency)}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.stepperBtn,
                          {
                            backgroundColor: theme.investmentBg,
                            borderColor: theme.investment + '30',
                          },
                        ]}
                        onPress={() => adjustLimit(cat, 1000)}
                      >
                        <Plus size={18} color={theme.investment} />
                        <Text style={[typography.caption, { color: theme.investment, fontWeight: '700' }]}>
                          1,000
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          /* Subscriptions & Recurring Bills Section */
          <>
            {/* Total Committed Monthly & Annual Card */}
            <View
              style={[
                styles.committedCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.primary + '40',
                  borderRadius: layout.borderRadius,
                  padding: layout.cardPadding,
                },
              ]}
            >
              <View style={styles.committedHeader}>
                <View style={[styles.badgeIcon, { backgroundColor: theme.softSage }]}>
                  <Repeat size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: theme.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }]}>
                    Committed Recurring Bills
                  </Text>
                  <View style={styles.committedStatsRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.hero, { color: theme.textPrimary, fontSize: 26 }]}>
                        {formatCurrency(totalCommitted, currency)}
                        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 13 }]}> / mo</Text>
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                        Monthly Budget Impact
                      </Text>
                    </View>

                    <View style={[styles.committedDivider, { backgroundColor: theme.surfaceBorder }]} />

                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <Text style={[typography.hero, { color: theme.textPrimary, fontSize: 22 }]}>
                        {formatCurrency(totalAnnualCommitted, currency)}
                        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 13 }]}> / yr</Text>
                      </Text>
                      <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 11 }]}>
                        Annualized Wealth Impact
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.committedFooterRow, { borderTopColor: theme.surfaceBorder }]}>
                <Text style={[typography.caption, { color: theme.textMuted, flex: 1 }]}>
                  {subscriptions.filter((s) => s.is_active).length} active plans • {upcomingSubscriptions.length} due within 3 days
                </Text>
              </View>
            </View>

            {/* Add Subscription Action Button */}
            <TouchableOpacity
              style={[
                styles.addSubscriptionBtn,
                {
                  backgroundColor: theme.primary,
                  borderRadius: layout.borderRadius,
                },
              ]}
              onPress={() => {
                triggerLight();
                setIsAddModalVisible(true);
              }}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={[typography.button, { color: '#FFFFFF' }]}>
                Add Subscription or Bill
              </Text>
            </TouchableOpacity>

            {/* Filter Pills */}
            {subscriptions.length > 0 && (
              <View style={styles.subFilterRow}>
                {[
                  { key: 'all', label: `All (${subscriptions.length})` },
                  { key: 'due_soon', label: `⚡ Due Soon (${upcomingSubscriptions.length})` },
                  { key: 'active', label: `Active (${subscriptions.filter((s) => s.is_active).length})` },
                  { key: 'paused', label: `Paused (${subscriptions.filter((s) => !s.is_active).length})` },
                ].map((f) => {
                  const isSelected = subFilter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.subFilterChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                        },
                      ]}
                      onPress={() => {
                        triggerLight();
                        setSubFilter(f.key as any);
                      }}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: 11,
                          },
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Subscriptions List */}
            {filteredSubscriptions.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.surfaceBorder,
                    borderRadius: layout.borderRadius,
                  },
                ]}
              >
                <Repeat size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', textAlign: 'center' }]}>
                  {subFilter === 'all' ? 'No Subscriptions Added Yet' : 'No Subscriptions In This Filter'}
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: 4 }]}>
                  {subFilter === 'all'
                    ? 'Track your Netflix, WiFi broadband, Gym, Rent, Milk, or Newspaper fees easily — zero credit card required!'
                    : 'Try selecting "All" above to view your full list of recurring bills.'}
                </Text>
              </View>
            ) : (
              filteredSubscriptions.map((sub) => {
                const badge = getMethodBadge(sub.payment_method);
                const due = getDueInfo(sub.billing_day);
                const monthlyEq = getSubMonthlyAmount(sub);

                return (
                  <View
                    key={sub.id}
                    style={[
                      styles.subscriptionCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: due.isUrgent && sub.is_active ? due.color + '60' : (sub.is_active ? theme.surfaceBorder : theme.surfaceBorderHighlight),
                        borderRadius: layout.borderRadius,
                        opacity: sub.is_active ? 1 : 0.6,
                      },
                    ]}
                  >
                    <View style={styles.subCardTop}>
                      <View
                        style={[
                          styles.iconWrap,
                          {
                            backgroundColor: theme.softSage,
                            borderColor: theme.secondary + '30',
                          },
                        ]}
                      >
                        <CategoryIcon
                          name={sub.category_icon || 'zap'}
                          size={layout.iconSize}
                          color={sub.category_color || theme.primary}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
                            {sub.name}
                          </Text>
                          {sub.is_active && (
                            <View style={[styles.dueBadgePill, { backgroundColor: due.bg }]}>
                              <Text style={{ color: due.color, fontWeight: '800', fontSize: 10 }}>
                                {due.label}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.subMetaRow}>
                          <View style={[styles.methodBadge, { backgroundColor: badge.bg }]}>
                            <Text style={[typography.caption, { color: badge.color, fontWeight: '700', fontSize: 10 }]}>
                              {badge.label}
                            </Text>
                          </View>
                          <Text style={[typography.caption, { color: theme.textMuted }]}>
                            Due on {sub.billing_day}{getOrdinalSuffix(sub.billing_day)}
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '800' }]}>
                          {formatCurrency(sub.amount, currency)}
                        </Text>
                        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                          / {sub.cycle === 'yearly' ? 'year' : sub.cycle === 'quarterly' ? 'quarter' : 'month'}
                        </Text>
                        {sub.cycle && sub.cycle !== 'monthly' && (
                          <Text style={[typography.caption, { color: theme.primary, fontSize: 10, fontWeight: '700' }]}>
                            ({formatCurrency(monthlyEq, currency)}/mo)
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={[styles.subCardActions, { borderTopColor: theme.surfaceBorder }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Switch
                          value={sub.is_active}
                          onValueChange={() => handleToggleSub(sub)}
                          trackColor={{ false: theme.surfaceBorder, true: theme.secondary }}
                          thumbColor={sub.is_active ? theme.primary : '#ccc'}
                        />
                        <Text style={[typography.caption, { color: theme.textMuted, fontSize: 12 }]}>
                          {sub.is_active ? 'Active' : 'Paused'}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {sub.is_active && (
                          <TouchableOpacity
                            style={[styles.markPaidBtn, { backgroundColor: theme.softSage }]}
                            onPress={() => handleMarkPaid(sub)}
                          >
                            <CheckCircle2 size={13} color={theme.primary} />
                            <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 11 }]}>
                              Log Paid
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.deleteSubBtn}
                          onPress={() => handleDeleteSub(sub)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color={theme.dangerRed} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Add Subscription Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderRadius: layout.borderRadius }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.title, { color: theme.textPrimary }]}>
                Add Subscription / Bill
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <X size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>


              {/* Name Input */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                PLAN / SERVICE NAME
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius,
                  },
                ]}
                placeholder="e.g. Netflix, Gym, Broadband, Rent, Milk"
                placeholderTextColor={theme.textMuted}
                value={subName}
                onChangeText={setSubName}
                maxLength={40}
              />

              {/* Amount Input */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                AMOUNT ({currency})
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius,
                  },
                ]}
                placeholder="e.g. 499"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formatAmountInput(subAmountStr, currency)}
                onChangeText={(val) => setSubAmountStr(val.replace(/[^0-9]/g, ''))}
                maxLength={10}
              />

              {/* Billing Cycle Picker */}
              <View style={styles.cycleSectionHeader}>
                <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted, marginTop: 0, marginBottom: 0 }]}>
                  BILLING FREQUENCY
                </Text>
                {subCycle !== 'monthly' && subAmountStr ? (
                  <View style={[styles.dueDayPill, { backgroundColor: theme.softSage }]}>
                    <Text style={[typography.caption, { color: theme.primary, fontWeight: '800', fontSize: 10 }]}>
                      ≈ {formatCurrency(Math.round(parseFloat(subAmountStr || '0') / (subCycle === 'yearly' ? 12 : 3)), currency)}/mo impact
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cyclePickerRow}>
                {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => {
                  const isSelected = subCycle === cycle;
                  const label = cycle === 'monthly' ? 'Monthly' : cycle === 'quarterly' ? 'Quarterly' : 'Yearly (Annual)';
                  return (
                    <TouchableOpacity
                      key={cycle}
                      style={[
                        styles.cyclePill,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.background,
                          borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                        },
                      ]}
                      onPress={() => {
                        triggerLight();
                        setSubCycle(cycle);
                      }}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            fontWeight: isSelected ? '800' : '600',
                            fontSize: 11,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Billing Day Calendar Model (1-31) */}
              <View style={styles.calendarSectionHeader}>
                <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted, marginTop: 0, marginBottom: 0 }]}>
                  DUE DAY OF MONTH (1 - 31)
                </Text>
                <View style={[styles.dueDayPill, { backgroundColor: theme.softSage }]}>
                  <Calendar size={12} color={theme.primary} />
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '800', fontSize: 11 }]}>
                    {subBillingDay}{getOrdinalSuffix(subBillingDay)} of each month
                  </Text>
                </View>
              </View>

              {/* 7x5 Grid Container (1 - 31) */}
              <View style={[styles.grid7x5Container, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, borderRadius: layout.borderRadius }]}>
                {[
                  [1, 2, 3, 4, 5, 6, 7],
                  [8, 9, 10, 11, 12, 13, 14],
                  [15, 16, 17, 18, 19, 20, 21],
                  [22, 23, 24, 25, 26, 27, 28],
                  [29, 30, 31, null, null, null, null],
                ].map((row, rowIdx) => (
                  <View key={`grid_row_${rowIdx}`} style={styles.grid7x5Row}>
                    {row.map((dayNum, colIdx) => {
                      if (dayNum === null) {
                        return <View key={`blank_${rowIdx}_${colIdx}`} style={styles.grid7x5CellBlank} />;
                      }
                      const isSelected = subBillingDay === dayNum;
                      return (
                        <TouchableOpacity
                          key={`day_${dayNum}`}
                          style={[
                            styles.grid7x5Cell,
                            {
                              backgroundColor: isSelected ? theme.primary : theme.background,
                              borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                            },
                          ]}
                          onPress={() => {
                            triggerLight();
                            setSubBillingDay(dayNum);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              typography.caption,
                              styles.grid7x5CellText,
                              {
                                color: isSelected ? '#FFFFFF' : theme.textPrimary,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {dayNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Payment Method Selector (Zero Credit Card Required) */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                PAYMENT METHOD (NO CREDIT CARD NEEDED)
              </Text>
              <View style={styles.methodGrid}>
                {[
                  { id: 'upi', label: '📱 UPI', sub: 'GPay/Paytm' },
                  { id: 'bank', label: '🏦 Bank', sub: 'Auto-debit' },
                  { id: 'cash', label: '💵 Cash', sub: 'Manual' },
                  { id: 'card', label: '💳 Card', sub: 'Debit/Credit' },
                ].map((item) => {
                  const isSelected = subPaymentMethod === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.methodOption,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.background,
                          borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                          borderRadius: layout.borderRadius,
                        },
                      ]}
                      onPress={() => {
                        triggerLight();
                        setSubPaymentMethod(item.id as any);
                      }}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? '#FFFFFFcc' : theme.textMuted,
                            fontSize: 10,
                          },
                        ]}
                      >
                        {item.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category Picker */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                CATEGORY
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {expenseCategories.map((cat) => {
                    const isSelected = (subCategoryId || expenseCategories[0]?.id) === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: isSelected ? theme.softSage : theme.background,
                            borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                            borderRadius: layout.borderRadius,
                          },
                        ]}
                        onPress={() => {
                          triggerLight();
                          setSubCategoryId(cat.id);
                        }}
                      >
                        <CategoryIcon name={cat.icon} size={14} color={cat.color || theme.primary} />
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isSelected ? theme.primary : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {cat.id === 'household' ? 'Home' : (uiMode === 'easy' ? cat.easyName : cat.name)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>

            {/* Pinned Save Subscription Button - Always visible without scrolling */}
            <View style={[styles.modalFooter, { borderTopColor: theme.surfaceBorder }]}>
              <TouchableOpacity
                style={[
                  styles.saveSubBtn,
                  {
                    backgroundColor: theme.primary,
                    borderRadius: layout.borderRadius,
                  },
                ]}
                onPress={handleCreateSubscription}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={[typography.button, { color: '#FFFFFF' }]}>
                  Save Subscription
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Total Budget Quick Editor Modal */}
      <Modal
        visible={isTotalBudgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTotalBudgetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.budgetEditCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorderHighlight,
                borderRadius: layout.borderRadius,
                padding: layout.cardPadding,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.title, { color: theme.textPrimary, fontSize: 18, fontWeight: '800' }]}>
                  Edit Monthly Total Budget
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  Scales all expense categories proportionally
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTotalBudgetModalVisible(false)}
                style={[styles.closeIconBtn, { backgroundColor: theme.softSage }]}
              >
                <X size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Input with Currency Prefix */}
            <View style={{ marginVertical: 14 }}>
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                TOTAL MONTHLY BUDGET ({currency})
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.primary,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius,
                    fontSize: 20,
                    fontWeight: '800',
                  },
                ]}
                placeholder="e.g. 50000"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formatAmountInput(totalBudgetInput, currency)}
                onChangeText={(val) => setTotalBudgetInput(val.replace(/[^0-9]/g, ''))}
                autoFocus
                maxLength={10}
              />

              {/* Quick Preset Chips */}
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 10, marginBottom: 6, fontSize: 11 }]}>
                QUICK PRESETS
              </Text>
              <View style={styles.presetChipRow}>
                {(isIndianCurrency(currency)
                  ? [10000, 20000, 35000, 50000, 75000, 100000]
                  : [1000, 2000, 3500, 5000, 7500, 10000]
                ).map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      triggerLight();
                      setTotalBudgetInput(String(preset));
                    }}
                  >
                    <Text style={[typography.caption, { color: theme.textPrimary, fontWeight: '700' }]}>
                      {formatCurrency(preset, currency)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalActionCancelBtn, { borderColor: theme.surfaceBorder }]}
                onPress={() => setIsTotalBudgetModalVisible(false)}
              >
                <Text style={[typography.body, { color: theme.textMuted, fontWeight: '600' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionConfirmBtn, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={handleSaveTotalBudget}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={[typography.button, { color: '#FFFFFF', marginLeft: 6 }]}>
                  Update All Categories
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Target Direct Edit Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.budgetEditCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorderHighlight,
                borderRadius: layout.borderRadius,
                padding: layout.cardPadding,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.title, { color: theme.textPrimary, fontSize: 18, fontWeight: '800' }]}>
                  Edit {editingCategory ? (editingCategory.id === 'household' ? 'Home' : (uiMode === 'easy' ? editingCategory.easyName : editingCategory.name)) : ''} Limit
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  Set exact monthly target amount
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCategoryModalVisible(false)}
                style={[styles.closeIconBtn, { backgroundColor: theme.softSage }]}
              >
                <X size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 14 }}>
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                TARGET AMOUNT ({currency})
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.primary,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius,
                    fontSize: 20,
                    fontWeight: '800',
                  },
                ]}
                placeholder="e.g. 8000"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formatAmountInput(categoryTargetInput, currency)}
                onChangeText={(val) => setCategoryTargetInput(val.replace(/[^0-9]/g, ''))}
                autoFocus
                maxLength={10}
              />

              {/* Quick Increment Chips */}
              <Text style={[typography.caption, { color: theme.textMuted, marginTop: 10, marginBottom: 6, fontSize: 11 }]}>
                QUICK ADJUST
              </Text>
              <View style={styles.presetChipRow}>
                {[-1000, -500, +500, +1000, +2000].map((delta) => (
                  <TouchableOpacity
                    key={delta}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      triggerLight();
                      const current = parseFloat(categoryTargetInput.replace(/,/g, '')) || 0;
                      setCategoryTargetInput(String(Math.max(0, current + delta)));
                    }}
                  >
                    <Text style={[typography.caption, { color: theme.textPrimary, fontWeight: '700' }]}>
                      {delta > 0 ? `+${delta}` : delta}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalActionCancelBtn, { borderColor: theme.surfaceBorder }]}
                onPress={() => setIsCategoryModalVisible(false)}
              >
                <Text style={[typography.body, { color: theme.textMuted, fontWeight: '600' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionConfirmBtn, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={handleSaveCategoryTarget}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={[typography.button, { color: '#FFFFFF', marginLeft: 6 }]}>
                  Save Target
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={isAddCategoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
                borderRadius: layout.borderRadius,
                maxHeight: '90%',
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.title, { color: theme.textPrimary, fontSize: 18 }]}>
                  {newCategoryType === 'expense' ? 'New Expense Budget' : 'New Savings Goal'}
                </Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  Customize category name, icon, color & target
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddCategoryModalVisible(false)}
                style={styles.closeIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Category Name */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                CATEGORY NAME *
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius,
                  },
                ]}
                placeholder={newCategoryType === 'expense' ? 'e.g. Dining Out, Pets, Gym, Hobbies' : 'e.g. Vacation Fund, Dream Bike, Gold'}
                placeholderTextColor={theme.textMuted}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                maxLength={30}
              />

              {/* Monthly Target / Budget */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted }]}>
                {newCategoryType === 'expense' ? 'MONTHLY BUDGET LIMIT' : 'MONTHLY SAVINGS TARGET'}
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius,
                  },
                ]}
                placeholder="e.g. 3,000"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={formatAmountInput(newCategoryTargetStr, currency)}
                onChangeText={(val) => setNewCategoryTargetStr(val.replace(/[^0-9]/g, ''))}
                maxLength={10}
              />

              {/* Presets */}
              <View style={styles.presetChipRow}>
                {[1000, 2500, 5000, 10000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.surfaceBorder,
                      },
                    ]}
                    onPress={() => {
                      triggerLight();
                      setNewCategoryTargetStr(String(preset));
                    }}
                  >
                    <Text style={[typography.caption, { color: theme.textPrimary, fontWeight: '700' }]}>
                      {formatCurrency(preset, currency)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Icon Picker */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted, marginTop: 14 }]}>
                CHOOSE ICON
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 4 }}>
                  {AVAILABLE_CATEGORY_ICONS.map((iconName) => {
                    const isSelected = newCategoryIcon === iconName;
                    return (
                      <TouchableOpacity
                        key={iconName}
                        style={[
                          styles.iconPickCell,
                          {
                            backgroundColor: isSelected ? newCategoryColor + '20' : theme.background,
                            borderColor: isSelected ? newCategoryColor : theme.surfaceBorder,
                          },
                        ]}
                        onPress={() => {
                          triggerLight();
                          setNewCategoryIcon(iconName);
                        }}
                      >
                        <CategoryIcon name={iconName} size={20} color={isSelected ? newCategoryColor : theme.textMuted} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Color Picker */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted, marginTop: 14 }]}>
                ACCENT COLOR
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {AVAILABLE_CATEGORY_COLORS.map((hex) => {
                  const isSelected = newCategoryColor === hex;
                  return (
                    <TouchableOpacity
                      key={hex}
                      style={[
                        styles.colorPickCell,
                        {
                          backgroundColor: hex,
                          borderWidth: isSelected ? 3 : 1,
                          borderColor: isSelected ? '#FFFFFF' : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        triggerLight();
                        setNewCategoryColor(hex);
                      }}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Description */}
              <Text style={[typography.caption, styles.fieldLabel, { color: theme.textMuted, marginTop: 14 }]}>
                DESCRIPTION (OPTIONAL)
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.surfaceBorder,
                    color: theme.textPrimary,
                    borderRadius: layout.borderRadius,
                  },
                ]}
                placeholder="Short note or items covered"
                placeholderTextColor={theme.textMuted}
                value={newCategoryDesc}
                onChangeText={setNewCategoryDesc}
                maxLength={50}
              />

              {/* Essential Switch for Expenses */}
              {newCategoryType === 'expense' && (
                <View style={[styles.essentialRow, { borderColor: theme.surfaceBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '600', fontSize: 13 }]}>
                      Essential Living Expense
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11 }]}>
                      Factored into mandatory daily safe-to-spend pace
                    </Text>
                  </View>
                  <Switch
                    value={newCategoryIsEssential}
                    onValueChange={(val) => {
                      triggerLight();
                      setNewCategoryIsEssential(val);
                    }}
                    trackColor={{ false: theme.surfaceBorder, true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.modalActionCancelBtn, { borderColor: theme.surfaceBorder }]}
                onPress={() => setIsAddCategoryModalVisible(false)}
              >
                <Text style={[typography.body, { color: theme.textMuted, fontWeight: '600' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalActionConfirmBtn,
                  { backgroundColor: newCategoryType === 'expense' ? theme.primary : theme.investment, flex: 1 },
                ]}
                onPress={handleSaveNewCategory}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={[typography.button, { color: '#FFFFFF', marginLeft: 6 }]}>
                  Create Category
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Confirmation / Alert Dialog */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryBtnText={alertConfig.primaryBtnText || 'OK'}
        secondaryBtnText={alertConfig.secondaryBtnText}
        onPrimaryPress={
          alertConfig.onPrimaryPress || (() => setAlertConfig((prev) => ({ ...prev, visible: false })))
        }
        onSecondaryPress={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* 5-Item Mobile Bottom Navigation Bar */}
      <BottomNavBar activeTab="planning" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  subTabPillGroup: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  subTabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subTabText: {
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  introCard: {
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCategoryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  iconPickCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  essentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    marginTop: 12,
  },
  limitCard: {
    borderWidth: 1.5,
    marginBottom: 10,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  targetDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  committedCard: {
    borderWidth: 1.5,
    marginBottom: 14,
  },
  committedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addSubscriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#526B45',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  subscriptionCard: {
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  subCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  committedStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  committedDivider: {
    width: 1,
    height: 38,
  },
  committedFooterRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  subFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  dueBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  cycleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  cyclePickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  cyclePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  deleteSubBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '92%',
    maxHeight: '95%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  calendarSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  dueDayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  grid7x5Container: {
    borderWidth: 1.5,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
    gap: 6,
  },
  grid7x5Row: {
    flexDirection: 'row',
    gap: 6,
  },
  grid7x5Cell: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid7x5CellBlank: {
    flex: 1,
    height: 38,
  },
  grid7x5CellText: {
    fontSize: 13,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 4,
  },
  totalBudgetHeroCard: {
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  editTotalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  budgetEditCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  presetChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  modalActionCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
