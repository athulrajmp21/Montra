/**
 * Currency & Number Formatting Utility
 * Supports Indian Numbering Standard (Lakhs & Crores: 1,00,000 / 1,00,00,000)
 * and International Standard (Thousands & Millions: 100,000 / 1,000,000).
 */

/**
 * Determines if the given currency symbol or code represents Indian Rupee.
 */
export function isIndianCurrency(currency?: string): boolean {
  if (!currency) return true; // Default in Montra is ₹
  const c = currency.trim().toLowerCase();
  return c === '₹' || c === 'inr' || c === 'rs' || c === 'rs.';
}

/**
 * Real-time amount formatting for entry screens (Keypad / Input).
 * Automatically formats digits using Indian or International comma grouping.
 *
 * Examples:
 * - Indian (₹):
 *   "1000"     -> "1,000"
 *   "10000"    -> "10,000"
 *   "100000"   -> "1,00,000"    (1 Lakh)
 *   "1000000"  -> "10,00,000"   (10 Lakhs)
 *   "10000000" -> "1,00,00,000" (1 Crore)
 *
 * - International ($, €, etc.):
 *   "1000"     -> "1,000"
 *   "10000"    -> "10,000"
 *   "100000"   -> "100,000"     (100 Thousand)
 *   "1000000"  -> "1,000,000"   (1 Million)
 *   "10000000" -> "10,000,000"  (10 Million)
 */
export function formatAmountInput(val: string, currency?: string): string {
  if (!val || val === '') return '0';

  const parts = val.split('.');
  const intPart = parts[0];
  const decPart = parts.length > 1 ? '.' + parts[1] : '';

  if (!intPart || intPart === '') {
    return '0' + decPart;
  }

  const isIndian = isIndianCurrency(currency);

  let formattedInt = '';
  if (isIndian) {
    if (intPart.length <= 3) {
      formattedInt = intPart;
    } else {
      const last3 = intPart.slice(-3);
      const remaining = intPart.slice(0, -3);
      // In the Indian system, digits before the last 3 are grouped in pairs of 2
      formattedInt = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    }
  } else {
    // International standard: groups of 3
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return formattedInt + decPart;
}

/**
 * Formats a numeric value with currency-aware comma grouping (Indian vs International).
 */
export function formatNumber(
  amount: number,
  currency: string = '₹',
  options: { decimals?: number } = {}
): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';

  const isIndian = isIndianCurrency(currency);
  const locale = isIndian ? 'en-IN' : 'en-US';

  const decimals =
    options.decimals !== undefined
      ? options.decimals
      : amount % 1 !== 0
      ? 2
      : 0;

  return amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a numeric value with the currency symbol prefix and appropriate comma grouping.
 */
export function formatCurrency(
  amount: number,
  currency: string = '₹',
  options: { decimals?: number } = {}
): string {
  return `${currency}${formatNumber(amount, currency, options)}`;
}

/**
 * Returns a friendly verbal denomination label for large numbers
 * (e.g. "1 Lakh", "2.5 Crore" for Indian Rupee, or "1 Million" for International).
 */
export function getDenominationLabel(num: number, currency: string = '₹'): string | null {
  if (!num || isNaN(num) || num < 100000) return null;
  const isIndian = isIndianCurrency(currency);

  if (isIndian) {
    if (num >= 10000000) {
      const cr = num / 10000000;
      const formattedCr = Number.isInteger(cr) ? cr.toString() : cr.toFixed(2).replace(/\.?0+$/, '');
      return `${formattedCr} Crore`;
    }
    const lk = num / 100000;
    const formattedLk = Number.isInteger(lk) ? lk.toString() : lk.toFixed(2).replace(/\.?0+$/, '');
    return `${formattedLk} Lakh`;
  } else {
    if (num >= 1000000) {
      const m = num / 1000000;
      const formattedM = Number.isInteger(m) ? m.toString() : m.toFixed(2).replace(/\.?0+$/, '');
      return `${formattedM} Million`;
    }
    const k = num / 1000;
    const formattedK = Number.isInteger(k) ? k.toString() : k.toFixed(1).replace(/\.?0+$/, '');
    return `${formattedK}K`;
  }
}

