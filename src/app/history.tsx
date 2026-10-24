import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Sparkles,
  Search,
  X,
  PieChart,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
} from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';
import {
  getTransactionsByMonth,
  getMonthOverMonthComparison,
  deleteTransaction,
} from '../db/repository';
import { TransactionWithCategory } from '../db/schema';
import { CategoryIcon } from '../components/CategoryIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { CustomAlert } from '../components/CustomAlert';
import { formatCurrency } from '../utils/formatCurrency';

export default function HistoryScreen() {
  const { theme, typography, layout, uiMode, currency, notifyDataChanged } = useMontra();
  const { triggerLight, triggerSuccess } = useHaptics();

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [momData, setMomData] = useState<{
    currentExpense: number;
    prevExpense: number;
    diffPercent: number;
    currentIncome: number;
    currentSavings: number;
  } | null>(null);

  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'investment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<TransactionWithCategory | null>(null);

  const loadData = useCallback(async () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const list = await getTransactionsByMonth(year, month);
    setTransactions(list);

    const mom = await getMonthOverMonthComparison(year, month);
    setMomData(mom);
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (tx: TransactionWithCategory) => {
    triggerLight();
    setItemToDelete(tx);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteTransaction(itemToDelete.id);
    triggerSuccess();
    notifyDataChanged();
    setItemToDelete(null);
    await loadData();
  };

  // Spending analytics breakdown for selected month
  const expenseTx = transactions.filter((t) => t.type === 'expense');
  const totalExpenseAmount = expenseTx.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals: Record<string, { name: string; color: string; amount: number }> = {};
  expenseTx.forEach((t) => {
    const catName = uiMode === 'easy' ? (t.category_easy_name || t.category_name) : t.category_name;
    const color = t.category_color || theme.primary;
    const id = t.category_id || catName;
    if (!categoryTotals[id]) {
      categoryTotals[id] = { name: catName, color, amount: 0 };
    }
    categoryTotals[id].amount += t.amount;
  });

  const categoryBreakdown = Object.values(categoryTotals)
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      ...item,
      percentage: totalExpenseAmount > 0 ? Math.round((item.amount / totalExpenseAmount) * 100) : 0,
    }));

  // Filtering + Searching
  const filtered = transactions
    .filter((t) => (filter === 'all' ? true : t.type === filter))
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchCat =
        (t.category_name || '').toLowerCase().includes(q) ||
        (t.category_easy_name || '').toLowerCase().includes(q);
      const matchNote = (t.note || '').toLowerCase().includes(q);
      return matchCat || matchNote;
    });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Month Switcher Navigation Header */}
      <View
        style={[
          styles.monthSwitcher,
          {
            backgroundColor: theme.surface,
            borderColor: theme.surfaceBorder,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            triggerLight();
            setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
          }}
          style={[styles.monthNavBtn, { backgroundColor: theme.softSage }]}
        >
          <ChevronLeft size={18} color={theme.primary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '800', fontSize: 16 }]}>
            {selectedMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </Text>
          {momData && momData.prevExpense > 0 ? (
            <Text
              style={[
                typography.caption,
                {
                  color: momData.diffPercent <= 0 ? theme.primary : theme.expense,
                  fontWeight: '700',
                  fontSize: 11,
                  marginTop: 2,
                },
              ]}
            >
              {momData.diffPercent <= 0
                ? `🌿 ${Math.abs(momData.diffPercent)}% lower than previous month`
                : `⚠️ ${momData.diffPercent}% higher than previous month`}
            </Text>
          ) : (
            <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11, marginTop: 2 }]}>
              Monthly Financial Insights
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            triggerLight();
            setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
          }}
          style={[styles.monthNavBtn, { backgroundColor: theme.softSage }]}
        >
          <ChevronRight size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.surface,
            borderColor: theme.surfaceBorder,
            borderRadius: layout.borderRadius,
          },
        ]}
      >
        <Search size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[typography.body, styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search by category or note..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Segment Control in Soft Sage */}
      <View
        style={[
          styles.filterRow,
          {
            backgroundColor: theme.softSage,
            borderRadius: layout.borderRadius,
          },
        ]}
      >
        {(['all', 'expense', 'income', 'investment'] as const).map((f) => {
          const isSelected = filter === f;
          const label = f === 'investment' ? 'savings' : f;

          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                isSelected && {
                  backgroundColor: theme.surface,
                  borderRadius: layout.borderRadius - 4,
                  shadowColor: '#1E2B18',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              onPress={() => {
                triggerLight();
                setFilter(f);
              }}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: isSelected ? theme.primary : theme.textSecondary,
                    fontWeight: isSelected ? '800' : '500',
                    textTransform: 'capitalize',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transactions List with Analytics Header */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filter === 'all' || filter === 'expense' ? (
            <View>
              {/* Income vs Expense Comparative Bar */}
              {momData && (momData.currentIncome > 0 || momData.currentExpense > 0) && (
                <View
                  style={[
                    styles.inOutCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.surfaceBorder,
                      borderRadius: layout.borderRadius,
                      padding: layout.cardPadding - 2,
                    },
                  ]}
                >
                  <View style={styles.inOutHeader}>
                    <View style={styles.inOutStat}>
                      <ArrowDownLeft size={14} color={theme.income} />
                      <Text style={[typography.caption, { color: theme.income, fontWeight: '700', fontSize: 12 }]}>
                        Inflow: {formatCurrency(momData.currentIncome, currency)}
                      </Text>
                    </View>
                    <View style={styles.inOutStat}>
                      <ArrowUpRight size={14} color={theme.expense} />
                      <Text style={[typography.caption, { color: theme.expense, fontWeight: '700', fontSize: 12 }]}>
                        Outflow: {formatCurrency(momData.currentExpense, currency)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inOutTrack}>
                    <View
                      style={{
                        flex: Math.max(1, Math.round(momData.currentIncome)),
                        backgroundColor: theme.income,
                        height: '100%',
                        borderTopLeftRadius: 4,
                        borderBottomLeftRadius: 4,
                        marginRight: 2,
                      }}
                    />
                    <View
                      style={{
                        flex: Math.max(1, Math.round(momData.currentExpense)),
                        backgroundColor: theme.expense,
                        height: '100%',
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4,
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Category Spending Breakdown Bar */}
              {totalExpenseAmount > 0 && (
                <View
                  style={[
                    styles.analyticsCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.surfaceBorder,
                      borderRadius: layout.borderRadius,
                      padding: layout.cardPadding,
                    },
                  ]}
                >
                  <View style={styles.analyticsHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <PieChart size={16} color={theme.primary} />
                      <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700', fontSize: 14 }]}>
                        Spending Breakdown
                      </Text>
                    </View>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      Total {formatCurrency(totalExpenseAmount, currency)}
                    </Text>
                  </View>

                  {/* Segmented Distribution Bar */}
                  <View style={styles.distributionBar}>
                    {categoryBreakdown.map((cat, idx) => {
                      const flexVal = Math.max(1, cat.percentage);
                      return (
                        <View
                          key={cat.name}
                          style={{
                            flex: flexVal,
                            backgroundColor: cat.color,
                            height: '100%',
                            borderTopLeftRadius: idx === 0 ? 6 : 0,
                            borderBottomLeftRadius: idx === 0 ? 6 : 0,
                            borderTopRightRadius: idx === categoryBreakdown.length - 1 ? 6 : 0,
                            borderBottomRightRadius: idx === categoryBreakdown.length - 1 ? 6 : 0,
                            marginRight: idx < categoryBreakdown.length - 1 ? 2 : 0,
                          }}
                        />
                      );
                    })}
                  </View>

                  {/* Top Category Legend Chips */}
                  <View style={styles.legendRow}>
                    {categoryBreakdown.slice(0, 4).map((cat) => (
                      <View key={cat.name} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                        <Text style={[typography.caption, { color: theme.textSecondary, fontSize: 11, fontWeight: '600' }]}>
                          {cat.name} {cat.percentage}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconBadge, { backgroundColor: theme.softSage }]}>
              <Sparkles size={24} color={theme.primary} />
            </View>
            <Text style={[typography.subtitle, { color: theme.textPrimary, textAlign: 'center', marginTop: 12 }]}>
              {searchQuery
                ? 'No matching records found'
                : `No activity records in ${selectedMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}`}
            </Text>
            <Text
              style={[
                typography.body,
                { color: theme.textMuted, textAlign: 'center', marginTop: 4 },
              ]}
            >
              {searchQuery
                ? 'Try a different search keyword.'
                : "Add expenses or income using the bottom '+' button to track here."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExp = item.type === 'expense';
          const isInv = item.type === 'investment';
          const isInc = item.type === 'income';

          const catName =
            uiMode === 'easy' ? item.category_easy_name : item.category_name;

          const amountColor = isExp
            ? theme.expense
            : isInc
            ? theme.income
            : theme.investment;

          const paymentMethodLabel =
            item.payment_method === 'cash'
              ? '💵 Cash'
              : item.payment_method === 'card'
              ? '💳 Card'
              : '📱 UPI';

          return (
            <View
              style={[
                styles.txCard,
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
                    styles.iconBox,
                    {
                      backgroundColor: (item.category_color || theme.primary) + '1A',
                      borderColor: (item.category_color || theme.primary) + '25',
                    },
                  ]}
                >
                  <CategoryIcon
                    name={item.category_icon || 'HelpCircle'}
                    size={layout.iconSize}
                    color={item.category_color || theme.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
                    {catName || (isInc ? 'Income' : isInv ? 'Savings' : 'Expense')}
                  </Text>
                  {item.note ? (
                    <Text
                      style={[typography.caption, { color: theme.primary, fontWeight: '600', fontSize: 11 }]}
                      numberOfLines={1}
                    >
                      📝 {item.note}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <View style={[styles.methodBadge, { backgroundColor: theme.softSage }]}>
                      <Text style={[typography.caption, { color: theme.primary, fontSize: 9, fontWeight: '700' }]}>
                        {paymentMethodLabel}
                      </Text>
                    </View>
                    <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.txRight}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {isInc ? (
                    <ArrowDownLeft size={16} color={theme.income} />
                  ) : isInv ? (
                    <TrendingUp size={16} color={theme.investment} />
                  ) : (
                    <ArrowUpRight size={16} color={theme.expense} />
                  )}
                  <Text
                    style={[
                      typography.subtitle,
                      {
                        color: amountColor,
                        fontWeight: '800',
                      },
                    ]}
                  >
                    {isExp ? '−' : '+'}
                    {formatCurrency(item.amount, currency)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.delBtn, { backgroundColor: theme.softSage }]}
                  onPress={() => handleDelete(item)}
                  accessibilityLabel="Delete entry"
                >
                  <Trash2 size={15} color={theme.dangerRed} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* 5-Item Mobile Bottom Navigation Bar */}
      <BottomNavBar activeTab="insights" />

      {/* Themed Custom Danger Alert */}
      <CustomAlert
        visible={itemToDelete !== null}
        type="danger"
        title="Delete Entry?"
        message={itemToDelete ? `Are you sure you want to delete this ${formatCurrency(itemToDelete.amount, currency)} record?` : ''}
        primaryBtnText="Delete"
        onPrimaryPress={confirmDelete}
        secondaryBtnText="Cancel"
        onSecondaryPress={() => setItemToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    padding: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  inOutCard: {
    borderWidth: 1.5,
    marginBottom: 10,
    marginTop: 4,
  },
  inOutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inOutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inOutTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E5EBDD',
  },
  analyticsCard: {
    borderWidth: 1.5,
    marginBottom: 12,
    marginTop: 2,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E5EBDD',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  txCard: {
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
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  delBtn: {
    padding: 6,
    borderRadius: 8,
  },
  emptyWrap: {
    marginTop: 50,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
