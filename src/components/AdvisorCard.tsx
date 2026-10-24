import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react-native';
import { useMontra } from '../hooks/useMontraStore';
import { CategoryItem } from '../constants/categories';
import { formatCurrency } from '../utils/formatCurrency';

interface AdvisorCardProps {
  categories: CategoryItem[];
  categorySpend: Record<string, number>;
  totalInvestment: number;
  remainingSafeSpend: number;
}

export function AdvisorCard({
  categories,
  categorySpend,
  totalInvestment,
  remainingSafeSpend,
}: AdvisorCardProps) {
  const { theme, typography, layout, currency, uiMode } = useMontra();

  // Find category with highest ratio
  let highestRatioCat: CategoryItem | null = null;
  let highestRatio = 0;

  for (const cat of categories) {
    if (cat.type === 'expense' && cat.monthlyTarget > 0) {
      const spent = categorySpend[cat.id] || 0;
      const ratio = spent / cat.monthlyTarget;
      if (ratio > highestRatio) {
        highestRatio = ratio;
        highestRatioCat = cat;
      }
    }
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailySafeSpend = Math.max(0, Math.round(remainingSafeSpend / daysLeft));

  let adviceTitle = `${formatCurrency(dailySafeSpend, currency)} / day safe spend`;
  let adviceBody = `You have ${formatCurrency(dailySafeSpend, currency)} safe to spend today across the remaining ${daysLeft} days of this month.`;
  let iconComponent = <CheckCircle size={22} color={theme.income} />;
  let cardBg = theme.surface;
  let borderColor = theme.softSage;
  let accentTag = 'DAILY PACER';
  let accentColor = theme.primary; // Olive #526B45

  if (highestRatio >= 1.0 && highestRatioCat) {
    const catName = uiMode === 'easy' ? highestRatioCat.easyName : highestRatioCat.name;
    adviceTitle = `Limit exceeded: ${catName}`;
    adviceBody = `You have passed your monthly budget for ${catName}. Pausing discretionary spending will keep you safe.`;
    iconComponent = <AlertCircle size={22} color={theme.expense} />;
    cardBg = theme.expenseBg;
    borderColor = theme.expense;
    accentTag = 'ATTENTION';
    accentColor = theme.expense;
  } else if (highestRatio >= 0.8 && highestRatioCat) {
    const catName = uiMode === 'easy' ? highestRatioCat.easyName : highestRatioCat.name;
    const spent = categorySpend[highestRatioCat.id] || 0;
    const left = highestRatioCat.monthlyTarget - spent;
    adviceTitle = `${catName} is at ${Math.round(highestRatio * 100)}%`;
    adviceBody = `${formatCurrency(left, currency)} left for ${catName} this month.`;
    iconComponent = <AlertCircle size={22} color={theme.expense} />;
    cardBg = theme.expenseBg;
    borderColor = theme.expense;
    accentTag = 'HEADS UP';
    accentColor = theme.expense;
  } else if (totalInvestment > 0) {
    adviceTitle = 'Savings growing steadily';
    adviceBody = `You have contributed ${formatCurrency(totalInvestment, currency)} toward future savings this month.`;
    iconComponent = <TrendingUp size={22} color={theme.investment} />;
    cardBg = theme.investmentBg;
    borderColor = theme.investment;
    accentTag = 'SAVINGS GOAL';
    accentColor = theme.investment;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
          borderRadius: layout.borderRadius,
          padding: layout.cardPadding,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.tagPill, { backgroundColor: theme.softSage, borderColor: theme.surfaceBorderHighlight }]}>
          <Sparkles size={11} color={accentColor} />
          <Text style={[typography.caption, { color: accentColor, fontWeight: '800', fontSize: 11 }]}>
            {accentTag}
          </Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.softSage }]}>
          {iconComponent}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.subtitle,
              { color: theme.textPrimary, marginBottom: 2, fontWeight: '700' },
            ]}
          >
            {adviceTitle}
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 22 }]}>
            {adviceBody}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#1E2B18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
});
