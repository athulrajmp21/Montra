export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  easy_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL,
  monthly_target REAL DEFAULT 0,
  is_essential INTEGER DEFAULT 1,
  description TEXT
);
`;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id TEXT NOT NULL,
  note TEXT,
  payment_method TEXT DEFAULT 'upi',
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);
`;

export const CREATE_INDEX_TRANSACTIONS_DATE = `
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
`;

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export const CREATE_SUBSCRIPTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id TEXT NOT NULL,
  billing_day INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'upi',
  cycle TEXT DEFAULT 'monthly',
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);
`;

export interface TransactionRecord {
  id: string;
  type: 'expense' | 'income' | 'investment';
  amount: number;
  category_id: string;
  note?: string;
  payment_method?: 'cash' | 'upi' | 'card';
  timestamp: number;
}

export interface TransactionWithCategory extends TransactionRecord {
  category_name: string;
  category_easy_name: string;
  category_icon: string;
  category_color: string;
}

export interface SubscriptionRecord {
  id: string;
  name: string;
  amount: number;
  category_id: string;
  billing_day: number;
  payment_method: 'upi' | 'bank' | 'cash' | 'card';
  cycle?: BillingCycle;
  is_active: boolean;
  created_at: number;
}

export interface SubscriptionWithCategory extends SubscriptionRecord {
  category_name: string;
  category_easy_name: string;
  category_icon: string;
  category_color: string;
}

export interface MonthSummary {
  totalExpense: number;
  totalIncome: number;
  totalInvestment: number;
  remainingSafeSpend: number;
  categorySpend: Record<string, number>;
}
