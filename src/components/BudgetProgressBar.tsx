import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CategoryItem } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { useMontra } from '../hooks/useMontraStore';
import { formatCurrency } from '../utils/formatCurrency';

interface BudgetProgressBarProps {
  category: CategoryItem;
  spent: number;
  onPress?: () => void;
}

export function BudgetProgressBar({ category, spent, onPress }: BudgetProgressBarProps) {
  const { theme, typography, layout, uiMode, currency } = useMontra();

  const target = category.monthlyTarget;
  const isInvestment = category.type === 'investment';
  const percentage = target > 0 ? Math.min(100, Math.round((spent / target) * 100)) : 0;
  const actualRatio = target > 0 ? (spent / target) * 100 : 0;

  // Status colors based on user's exact palette
  let statusText = 'Safe';
  let barColor = theme.secondary; // Sage #8FA17B
  let badgeBg = theme.softSage;   // Soft Sage #E5EBDD
  let badgeColor = theme.primary; // Olive #526B45

  if (isInvestment) {
    statusText = actualRatio >= 100 ? 'Goal Reached 🎉' : `${percentage}% Saved`;
    barColor = theme.investment; // Savings #6486B5
    badgeBg = theme.investmentBg;
    badgeColor = theme.investment;
  } else {
    if (actualRatio >= 100) {
      statusText = 'Over Limit';
      barColor = theme.dangerRed;
      badgeBg = theme.dangerRedBg;
      badgeColor = theme.dangerRed;
    } else if (actualRatio >= 75) {
      statusText = `${percentage}% Used`;
      barColor = theme.expense; // Expenses #D97745
      badgeBg = theme.expenseBg;
      badgeColor = theme.expense;
    } else {
      statusText = 'On Track';
      barColor = theme.secondary; // Sage #8FA17B
      badgeBg = theme.softSage;
      badgeColor = theme.primary;
    }
  }

  const displayName = uiMode === 'easy' ? category.easyName : category.name;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          borderRadius: layout.borderRadius,
          padding: layout.cardPadding,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isInvestment ? theme.investmentBg : theme.softSage,
                borderColor: isInvestment ? theme.investment + '30' : theme.secondary + '40',
                borderRadius: layout.borderRadius - 6,
              },
            ]}
          >
            <CategoryIcon
              name={category.icon}
              size={layout.iconSize}
              color={isInvestment ? theme.investment : category.color || theme.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.subtitle,
                { color: theme.textPrimary, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>
              {isInvestment ? 'Monthly Goal' : 'Budget Limit'}: {formatCurrency(target, currency)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeBg,
              borderColor: badgeColor + '30',
            },
          ]}
        >
          <Text style={[typography.caption, { color: badgeColor, fontWeight: '700', fontSize: 11 }]}>
            {statusText}
          </Text>
        </View>
      </View>

      {/* Progress Bar Track in Soft Sage */}
      <View
        style={[
          styles.track,
          { backgroundColor: theme.softSage, borderColor: theme.surfaceBorder },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(5, percentage))}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      {/* Amounts footer */}
      <View style={styles.footer}>
        <Text style={[typography.body, { color: theme.textPrimary, fontWeight: '700' }]}>
          {formatCurrency(spent, currency)}
          <Text style={[typography.caption, { color: theme.textMuted, fontWeight: '400' }]}>
            {isInvestment ? ' saved' : ' spent'}
          </Text>
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '600' }]}>
          {target > spent
            ? `${formatCurrency(target - spent, currency)} remaining`
            : `${formatCurrency(Math.abs(spent - target), currency)} over budget`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    marginBottom: 12,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  track: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 0.5,
    marginVertical: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});
