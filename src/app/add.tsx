import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Edit3, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { useHaptics } from '../hooks/useHaptics';
import { getCategories, addTransaction, getMonthSummary } from '../db/repository';
import { CategoryItem, CategoryType } from '../constants/categories';
import { CategoryIcon } from '../components/CategoryIcon';
import { Keypad } from '../components/Keypad';
import { CustomAlert } from '../components/CustomAlert';
import { formatAmountInput, getDenominationLabel } from '../utils/formatCurrency';

export default function AddTransactionScreen() {
  const { defaultType } = useLocalSearchParams<{ defaultType?: string }>();
  const { theme, typography, layout, uiMode, currency, notifyDataChanged } = useMontra();
  const { triggerLight, triggerSuccess, triggerWarning } = useHaptics();

  const [txType, setTxType] = useState<CategoryType>(
    (defaultType === 'income' ? 'income' : 'expense') as CategoryType
  );
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card'>('upi');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [categoryCurrentSpend, setCategoryCurrentSpend] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'info' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    async function loadCats() {
      const all = await getCategories(txType);
      setCategories(all);
      if (all.length > 0) {
        setSelectedCatId(all[0].id);
      }
    }
    loadCats();
  }, [txType]);

  useEffect(() => {
    async function checkCurrentSpend() {
      if (!selectedCatId) return;
      const now = new Date();
      const summary = await getMonthSummary(now.getFullYear(), now.getMonth());
      setCategoryCurrentSpend(summary.categorySpend[selectedCatId] || 0);
    }
    checkCurrentSpend();
  }, [selectedCatId]);

  const handleKeyPress = (char: string) => {
    if (amountStr.length >= 9) return;
    if (amountStr === '' && char === '0') return;
    setAmountStr((prev) => prev + char);
  };

  const handleDelete = () => {
    setAmountStr((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmountStr('');
  };

  const handleSave = async () => {
    const numericAmount = parseFloat(amountStr);
    if (!numericAmount || numericAmount <= 0) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Enter Amount',
        message: 'Please enter a valid amount greater than zero.',
      });
      return;
    }

    if (!selectedCatId) {
      triggerWarning();
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Select Category',
        message: 'Please choose a category before saving.',
      });
      return;
    }

    try {
      setIsSaving(true);
      await addTransaction({
        type: txType,
        amount: numericAmount,
        categoryId: selectedCatId,
        note: note.trim() || undefined,
        paymentMethod: paymentMethod,
        timestamp: selectedDate.getTime(),
      });

      triggerSuccess();
      notifyDataChanged();
      router.back();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Error Saving',
        message: 'Could not save this entry. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const isYesterday = (d: Date) => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };

  const isDaysAgo = (d: Date, days: number) => {
    const target = new Date();
    target.setDate(target.getDate() - days);
    return d.toDateString() === target.toDateString();
  };

  const formatDateBadge = (d: Date) => {
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const calendarGridDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(new Date(year, month, d));
    }
    return grid;
  }, [calendarMonth]);

  const selectedCategory = categories.find((c) => c.id === selectedCatId);
  const currentNumAmount = parseFloat(amountStr) || 0;
  const projectedTotal = categoryCurrentSpend + currentNumAmount;
  const target = selectedCategory?.monthlyTarget || 0;

  const getShortName = (cat: CategoryItem) => {
    if (cat.id === 'household') return 'Home';
    if (cat.id === 'utilities') return 'Bills';
    if (cat.id === 'vehicle') return 'Vehicle';
    if (cat.id === 'health') return 'Health';
    if (cat.id === 'personal') return 'Leisure';
    if (cat.id === 'skills') return 'Skill';
    if (cat.id === 'invest_future') return 'Invest';
    if (cat.id === 'invest_emergency') return 'Safety';
    if (cat.id === 'income_primary') return 'Salary';
    if (cat.id === 'income_other') return 'Freelance';
    return cat.name.split(' ')[0];
  };

  const typeColor =
    txType === 'income'
      ? theme.income
      : txType === 'investment'
      ? theme.investment
      : theme.expense;

  const typePrefix = txType === 'income' ? '+' : txType === 'investment' ? '★' : '−';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Half: Type Switcher, Amount Card and Real-time Impact Guide */}
      <View style={styles.topSection}>
        {/* Top Type Switcher */}
        <View style={styles.topTypeRow}>
          <TouchableOpacity
            style={[
              styles.topTypePill,
              txType === 'expense'
                ? { backgroundColor: theme.expense, borderColor: theme.expense }
                : { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              { borderRadius: layout.borderRadius - 8 },
            ]}
            onPress={() => {
              triggerLight();
              setTxType('expense');
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.typeDot, { backgroundColor: txType === 'expense' ? '#FFFFFF' : theme.expense }]} />
            <Text
              style={[
                typography.caption,
                {
                  color: txType === 'expense' ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: '700',
                  fontSize: 12,
                },
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.topTypePill,
              txType === 'income'
                ? { backgroundColor: theme.income, borderColor: theme.income }
                : { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              { borderRadius: layout.borderRadius - 8 },
            ]}
            onPress={() => {
              triggerLight();
              setTxType('income');
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.typeDot, { backgroundColor: txType === 'income' ? '#FFFFFF' : theme.income }]} />
            <Text
              style={[
                typography.caption,
                {
                  color: txType === 'income' ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: '700',
                  fontSize: 12,
                },
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.topTypePill,
              txType === 'investment'
                ? { backgroundColor: theme.investment, borderColor: theme.investment }
                : { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              { borderRadius: layout.borderRadius - 8 },
            ]}
            onPress={() => {
              triggerLight();
              setTxType('investment');
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.typeDot, { backgroundColor: txType === 'investment' ? '#FFFFFF' : theme.investment }]} />
            <Text
              style={[
                typography.caption,
                {
                  color: txType === 'investment' ? '#FFFFFF' : theme.textPrimary,
                  fontWeight: '700',
                  fontSize: 12,
                },
              ]}
            >
              Savings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Display */}
        <View
          style={[
            styles.amountCard,
            {
              backgroundColor: theme.surface,
              borderColor: typeColor + '40',
              borderRadius: layout.borderRadius,
            },
          ]}
        >
          <Text style={[typography.caption, { color: theme.textMuted, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }]}>
            {txType === 'income' ? 'Income Amount' : txType === 'investment' ? 'Savings Goal' : 'Expense Amount'}
          </Text>

          {(() => {
            const formattedDisplay = formatAmountInput(amountStr, currency);
            const numVal = parseFloat(amountStr) || 0;
            const denominationLabel = getDenominationLabel(numVal, currency);
            const dynamicFontSize =
              uiMode === 'easy'
                ? formattedDisplay.length > 9
                  ? 28
                  : formattedDisplay.length > 7
                  ? 34
                  : 40
                : formattedDisplay.length > 9
                ? 24
                : formattedDisplay.length > 7
                ? 28
                : 34;

            return (
              <>
                <View style={styles.amountRow}>
                  <Text style={[styles.currencyPrefix, { color: typeColor }]}>
                    {typePrefix} {currency}
                  </Text>
                  <Text
                    style={[
                      typography.hero,
                      styles.amountText,
                      { color: theme.textPrimary, fontSize: dynamicFontSize },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    {formattedDisplay}
                  </Text>
                </View>

                {denominationLabel ? (
                  <View style={[styles.denominationPill, { backgroundColor: theme.softSage }]}>
                    <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 11 }]}>
                      ≈ {currency} {denominationLabel}
                    </Text>
                  </View>
                ) : null}
              </>
            );
          })()}

          {/* Real-time Impact Guide Badge */}
          {selectedCategory && txType === 'expense' && target > 0 && currentNumAmount > 0 && (
            <View
              style={[
                styles.impactBadge,
                {
                  backgroundColor:
                    projectedTotal > target ? theme.dangerRedBg : theme.softSage,
                  borderColor:
                    projectedTotal > target ? theme.dangerRed : theme.secondary,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: projectedTotal > target ? theme.dangerRed : theme.primary,
                    fontWeight: '700',
                    fontSize: 12,
                  },
                ]}
              >
                {projectedTotal > target
                  ? `⚠️ Over budget by ${currency}${(projectedTotal - target).toLocaleString()}`
                  : `✓ Safe: ${currency}${(target - projectedTotal).toLocaleString()} will remain`}
              </Text>
            </View>
          )}

          {txType === 'investment' && currentNumAmount > 0 && (
            <View
              style={[
                styles.impactBadge,
                {
                  backgroundColor: theme.investmentBg,
                  borderColor: theme.investment,
                },
              ]}
            >
              <Text style={[typography.caption, { color: theme.investment, fontWeight: '700', fontSize: 12 }]}>
                ✨ Saving {currency}{currentNumAmount.toLocaleString()} towards future security!
              </Text>
            </View>
          )}

          {/* Active Category Indicator */}
          {selectedCategory && (
            <View style={[styles.activeCategoryPill, { backgroundColor: theme.softSage }]}>
              <CategoryIcon
                name={selectedCategory.id === 'household' ? 'ShoppingCart' : selectedCategory.icon}
                size={14}
                color={selectedCategory.color || theme.primary}
              />
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '700', fontSize: 12 }]}>
                {selectedCategory.id === 'household' ? 'Home' : (uiMode === 'easy' ? selectedCategory.easyName : selectedCategory.name)}
              </Text>
            </View>
          )}
        </View>

        {/* Optional Note / Tag Field & Custom Date Picker */}
        <View style={styles.noteDateRow}>
          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
                borderRadius: layout.borderRadius,
              },
            ]}
          >
            <Edit3 size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={[
                typography.body,
                styles.noteInput,
                { color: theme.textPrimary },
              ]}
              placeholder="Add note (optional)"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
              maxLength={40}
              returnKeyType="done"
            />
            {note.length > 0 && (
              <TouchableOpacity onPress={() => setNote('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.dateBtn,
              {
                backgroundColor: isToday(selectedDate) ? theme.surface : theme.softSage,
                borderColor: isToday(selectedDate) ? theme.surfaceBorder : theme.primary,
                borderRadius: layout.borderRadius,
              },
            ]}
            onPress={() => {
              triggerLight();
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <Calendar size={14} color={isToday(selectedDate) ? theme.textSecondary : theme.primary} />
            <Text
              style={[
                typography.caption,
                {
                  color: isToday(selectedDate) ? theme.textPrimary : theme.primary,
                  fontWeight: '700',
                  fontSize: 11,
                },
              ]}
            >
              {formatDateBadge(selectedDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Account Method (Cash, UPI/Bank, Card) */}
        <View style={styles.paymentMethodRow}>
          {[
            { id: 'upi', label: '📱 UPI / Bank' },
            { id: 'cash', label: '💵 Cash' },
            { id: 'card', label: '💳 Card' },
          ].map((pm) => {
            const isSelected = paymentMethod === pm.id;
            return (
              <TouchableOpacity
                key={pm.id}
                style={[
                  styles.paymentPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                    borderRadius: layout.borderRadius - 4,
                  },
                ]}
                onPress={() => {
                  triggerLight();
                  setPaymentMethod(pm.id as any);
                }}
                activeOpacity={0.7}
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
                  {pm.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom Pinned One-Handed Zone: Category Carousel, Keypad & Confirm */}
      <View
        style={[
          styles.bottomSection,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.surfaceBorder,
          },
        ]}
      >

        {/* Smart 4-Picks Row directly above Keypad (Zero Scrolling) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPicksRow}
        >
          {categories.map((cat) => {
            const isSelected = cat.id === selectedCatId;
            const shortName = getShortName(cat);

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.quickPickChip,
                  {
                    backgroundColor: isSelected ? theme.softSage : theme.background,
                    borderColor: isSelected ? theme.primary : theme.surfaceBorder,
                    borderRadius: layout.borderRadius - 8,
                  },
                ]}
                onPress={() => {
                  triggerLight();
                  setSelectedCatId(cat.id);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.chipIconBubble,
                    {
                      backgroundColor: (cat.color || theme.primary) + (isSelected ? '2A' : '14'),
                    },
                  ]}
                >
                  <CategoryIcon
                    name={cat.id === 'household' ? 'ShoppingCart' : cat.icon}
                    size={15}
                    color={cat.color || theme.primary}
                  />
                </View>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? theme.primary : theme.textPrimary,
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: 11,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Keypad
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onClear={handleClear}
        />

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            {
              backgroundColor: theme.primary,
              borderRadius: layout.borderRadius - 4,
              minHeight: layout.buttonHeight - 4,
            },
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
          accessibilityLabel="Save transaction"
        >
          <Check size={22} color="#FFFFFF" strokeWidth={3} />
          <Text style={[typography.button, { color: '#FFFFFF', fontSize: 17 }]}>
            {isSaving ? 'Saving...' : 'Confirm & Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View
            style={[
              styles.dateModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
                borderRadius: layout.borderRadius + 4,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.dateModalHeader}>
              <Text style={[typography.title, { color: theme.textPrimary, fontSize: 17 }]}>
                Select Entry Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.quickDatePresets}>
              <TouchableOpacity
                style={[
                  styles.quickPresetPill,
                  isToday(selectedDate) && { backgroundColor: theme.primary },
                  { borderColor: theme.surfaceBorder },
                ]}
                onPress={() => {
                  triggerLight();
                  setSelectedDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isToday(selectedDate) ? '#FFFFFF' : theme.textPrimary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickPresetPill,
                  isYesterday(selectedDate) && { backgroundColor: theme.primary },
                  { borderColor: theme.surfaceBorder },
                ]}
                onPress={() => {
                  triggerLight();
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  setSelectedDate(y);
                  setShowDatePicker(false);
                }}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isYesterday(selectedDate) ? '#FFFFFF' : theme.textPrimary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  Yesterday
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickPresetPill,
                  isDaysAgo(selectedDate, 2) && { backgroundColor: theme.primary },
                  { borderColor: theme.surfaceBorder },
                ]}
                onPress={() => {
                  triggerLight();
                  const d2 = new Date();
                  d2.setDate(d2.getDate() - 2);
                  setSelectedDate(d2);
                  setShowDatePicker(false);
                }}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isDaysAgo(selectedDate, 2) ? '#FFFFFF' : theme.textPrimary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  2 Days Ago
                </Text>
              </TouchableOpacity>
            </View>

            {/* Month Navigator */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                onPress={() => {
                  triggerLight();
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                }}
                style={[styles.navArrow, { backgroundColor: theme.softSage }]}
              >
                <ChevronLeft size={18} color={theme.primary} />
              </TouchableOpacity>

              <Text style={[typography.subtitle, { color: theme.textPrimary, fontWeight: '700' }]}>
                {calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  triggerLight();
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                }}
                style={[styles.navArrow, { backgroundColor: theme.softSage }]}
              >
                <ChevronRight size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekdayRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={[typography.caption, styles.weekdayText, { color: theme.textMuted }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.calendarGrid}>
              {calendarGridDays.map((item, idx) => {
                if (!item) {
                  return <View key={`blank_${idx}`} style={styles.calendarDayCell} />;
                }
                const isSelected =
                  item.getDate() === selectedDate.getDate() &&
                  item.getMonth() === selectedDate.getMonth() &&
                  item.getFullYear() === selectedDate.getFullYear();

                const isCurrentToday = isToday(item);

                return (
                  <TouchableOpacity
                    key={item.toISOString()}
                    style={[
                      styles.calendarDayCell,
                      isSelected && [styles.selectedDayCell, { backgroundColor: theme.primary }],
                      !isSelected && isCurrentToday && { borderColor: theme.secondary, borderWidth: 1.5 },
                    ]}
                    onPress={() => {
                      triggerLight();
                      setSelectedDate(item);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        typography.caption,
                        styles.dayNumberText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : isCurrentToday
                            ? theme.primary
                            : theme.textPrimary,
                          fontWeight: isSelected || isCurrentToday ? '800' : '500',
                        },
                      ]}
                    >
                      {item.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.closeDatePickerBtn, { backgroundColor: theme.softSage }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                Selected: {formatDateBadge(selectedDate)} (Tap to confirm)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Themed Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type || 'warning'}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryBtnText="OK"
        onPrimaryPress={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    paddingTop: 12,
  },
  topTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topTypePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  amountCard: {
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  amountText: {
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  denominationPill: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  impactBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  noteDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  noteInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 6,
    gap: 6,
  },
  paymentPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderWidth: 1.5,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalCard: {
    width: '100%',
    maxWidth: 340,
    padding: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickDatePresets: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  quickPresetPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 11,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDayCell: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 8,
  },
  selectedDayCell: {
    borderRadius: 8,
  },
  dayNumberText: {
    fontSize: 13,
  },
  closeDatePickerBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  quickPicksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  quickPickChip: {
    minWidth: 58,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    gap: 3,
  },
  chipIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    borderTopWidth: 1.5,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
    marginTop: 10,
    shadowColor: '#526B45',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
