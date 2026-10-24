import { getDb } from './database';
import { 
  TransactionRecord, 
  TransactionWithCategory, 
  MonthSummary,
  SubscriptionRecord,
  SubscriptionWithCategory,
  BillingCycle
} from './schema';
import { CategoryItem, CategoryType } from '../constants/categories';

// ----------------- Settings -----------------

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row ? row.value : defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// ----------------- Categories -----------------

export async function getCategories(typeFilter?: CategoryType): Promise<CategoryItem[]> {
  const db = await getDb();
  let query = 'SELECT * FROM categories';
  const params: any[] = [];
  
  if (typeFilter) {
    query += ' WHERE type = ?';
    params.push(typeFilter);
  }
  query += ' ORDER BY is_essential DESC, name ASC';

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    easyName: r.easy_name,
    icon: r.icon,
    color: r.color,
    type: r.type as CategoryType,
    monthlyTarget: Number(r.monthly_target) || 0,
    isEssential: Boolean(r.is_essential),
    description: r.description || '',
  }));
}

export async function updateCategoryTarget(id: string, newTarget: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE categories SET monthly_target = ? WHERE id = ?',
    [newTarget, id]
  );
}

export async function addCategory(category: CategoryItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO categories (id, name, easy_name, icon, color, type, monthly_target, is_essential, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      category.id,
      category.name,
      category.easyName || category.name,
      category.icon,
      category.color,
      category.type,
      category.monthlyTarget || 0,
      category.isEssential ? 1 : 0,
      category.description || '',
    ]
  );
}

export async function deleteCategory(id: string): Promise<boolean> {
  const db = await getDb();
  const txCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
    [id]
  );
  if (txCountRow && txCountRow.count > 0) {
    return false;
  }
  const subCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM subscriptions WHERE category_id = ?',
    [id]
  );
  if (subCountRow && subCountRow.count > 0) {
    return false;
  }
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}

// ----------------- Transactions -----------------

export async function addTransaction(data: {
  type: 'expense' | 'income' | 'investment';
  amount: number;
  categoryId: string;
  note?: string;
  paymentMethod?: 'cash' | 'upi' | 'card';
  timestamp?: number;
}): Promise<TransactionRecord> {
  const db = await getDb();
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = data.timestamp || Date.now();
  const paymentMethod = data.paymentMethod || 'upi';

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category_id, note, payment_method, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.type, data.amount, data.categoryId, data.note || '', paymentMethod, timestamp]
  );

  return {
    id,
    type: data.type,
    amount: data.amount,
    category_id: data.categoryId,
    note: data.note,
    payment_method: paymentMethod,
    timestamp,
  };
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getRecentTransactions(limit = 20): Promise<TransactionWithCategory[]> {
  const db = await getDb();
  const query = `
    SELECT 
      t.id, t.type, t.amount, t.category_id, t.note, t.payment_method, t.timestamp,
      c.name as category_name,
      c.easy_name as category_easy_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.timestamp DESC
    LIMIT ?
  `;
  return await db.getAllAsync<TransactionWithCategory>(query, [limit]);
}

export async function getMonthSummary(year: number, month: number): Promise<MonthSummary> {
  const db = await getDb();

  // Start & End of given month in milliseconds
  const startOfMonth = new Date(year, month, 1).getTime();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

  const transactions = await db.getAllAsync<{
    type: string;
    amount: number;
    category_id: string;
  }>(
    `SELECT type, amount, category_id FROM transactions WHERE timestamp >= ? AND timestamp <= ?`,
    [startOfMonth, endOfMonth]
  );

  let totalExpense = 0;
  let totalIncome = 0;
  let totalInvestment = 0;
  const categorySpend: Record<string, number> = {};

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'expense') {
      totalExpense += amt;
      categorySpend[t.category_id] = (categorySpend[t.category_id] || 0) + amt;
    } else if (t.type === 'income') {
      totalIncome += amt;
    } else if (t.type === 'investment') {
      totalInvestment += amt;
      categorySpend[t.category_id] = (categorySpend[t.category_id] || 0) + amt;
    }
  }

  // Get total monthly targets for all expense categories
  const expenseCategories = await db.getAllAsync<{ monthly_target: number }>(
    `SELECT monthly_target FROM categories WHERE type = 'expense'`
  );
  const totalBudget = expenseCategories.reduce((acc, cat) => acc + (Number(cat.monthly_target) || 0), 0);
  const remainingSafeSpend = Math.max(0, totalBudget - totalExpense);

  return {
    totalExpense,
    totalIncome,
    totalInvestment,
    remainingSafeSpend,
    categorySpend,
  };
}

export async function getTodaySpend(): Promise<number> {
  const db = await getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND timestamp >= ?`,
    [startOfDay.getTime()]
  );
  return Number(row?.total) || 0;
}

// ----------------- Subscriptions & Recurring Bills -----------------

export async function getSubscriptions(activeOnly = false): Promise<SubscriptionWithCategory[]> {
  const db = await getDb();
  let query = `
    SELECT 
      s.id, s.name, s.amount, s.category_id, s.billing_day, s.payment_method, s.is_active, s.created_at,
      c.name as category_name,
      c.easy_name as category_easy_name,
      c.icon as category_icon,
      c.color as category_color
    FROM subscriptions s
    LEFT JOIN categories c ON s.category_id = c.id
  `;
  if (activeOnly) {
    query += ' WHERE s.is_active = 1';
  }
  query += ' ORDER BY s.billing_day ASC, s.name ASC';

  const rows = await db.getAllAsync<any>(query);
  return rows.map((r) => ({
    ...r,
    cycle: (r.cycle || 'monthly') as BillingCycle,
    is_active: Boolean(r.is_active),
    payment_method: (r.payment_method || 'upi') as 'upi' | 'bank' | 'cash' | 'card',
  }));
}

export async function addSubscription(data: {
  name: string;
  amount: number;
  categoryId: string;
  billingDay: number;
  paymentMethod?: 'upi' | 'bank' | 'cash' | 'card';
  cycle?: BillingCycle;
}): Promise<SubscriptionRecord> {
  const db = await getDb();
  const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = Date.now();
  const method = data.paymentMethod || 'upi';
  const cycle = data.cycle || 'monthly';

  await db.runAsync(
    `INSERT INTO subscriptions (id, name, amount, category_id, billing_day, payment_method, cycle, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [id, data.name, data.amount, data.categoryId, data.billingDay, method, cycle, createdAt]
  );

  return {
    id,
    name: data.name,
    amount: data.amount,
    category_id: data.categoryId,
    billing_day: data.billingDay,
    payment_method: method,
    cycle,
    is_active: true,
    created_at: createdAt,
  };
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM subscriptions WHERE id = ?', [id]);
}

export async function toggleSubscriptionActive(id: string, isActive: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE subscriptions SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

export async function getUpcomingSubscriptions(withinDays = 5): Promise<SubscriptionWithCategory[]> {
  const all = await getSubscriptions(true);
  const now = new Date();
  const todayDate = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return all.filter((sub) => {
    let diff = sub.billing_day - todayDate;
    if (diff < 0) {
      diff += daysInMonth;
    }
    return diff >= 0 && diff <= withinDays;
  });
}

// ----------------- Export & Month Filtering -----------------

export async function getTransactionsByMonth(
  year: number,
  month: number
): Promise<TransactionWithCategory[]> {
  const db = await getDb();
  const startOfMonth = new Date(year, month, 1).getTime();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

  const query = `
    SELECT 
      t.id, t.type, t.amount, t.category_id, t.note, t.payment_method, t.timestamp,
      c.name as category_name,
      c.easy_name as category_easy_name,
      c.icon as category_icon,
      c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.timestamp >= ? AND t.timestamp <= ?
    ORDER BY t.timestamp DESC
  `;
  return await db.getAllAsync<TransactionWithCategory>(query, [startOfMonth, endOfMonth]);
}

export async function getMonthOverMonthComparison(
  year: number,
  month: number
): Promise<{
  currentExpense: number;
  prevExpense: number;
  diffPercent: number;
  currentIncome: number;
  currentSavings: number;
}> {
  const currentSummary = await getMonthSummary(year, month);
  const prevDate = new Date(year, month - 1, 1);
  const prevSummary = await getMonthSummary(prevDate.getFullYear(), prevDate.getMonth());

  let diffPercent = 0;
  if (prevSummary.totalExpense > 0) {
    diffPercent = Math.round(
      ((currentSummary.totalExpense - prevSummary.totalExpense) / prevSummary.totalExpense) * 100
    );
  }

  return {
    currentExpense: currentSummary.totalExpense,
    prevExpense: prevSummary.totalExpense,
    diffPercent,
    currentIncome: currentSummary.totalIncome,
    currentSavings: currentSummary.totalInvestment,
  };
}

export async function getAccountBalances(): Promise<{
  cash: { balance: number; income: number; expense: number; count: number };
  upi: { balance: number; income: number; expense: number; count: number };
  card: { balance: number; income: number; expense: number; count: number };
  totalBalance: number;
}> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    type: string;
    amount: number;
    payment_method: string | null;
  }>('SELECT type, amount, payment_method FROM transactions');

  const accounts = {
    cash: { balance: 0, income: 0, expense: 0, count: 0 },
    upi: { balance: 0, income: 0, expense: 0, count: 0 },
    card: { balance: 0, income: 0, expense: 0, count: 0 },
  };

  for (const row of rows) {
    const method =
      row.payment_method === 'cash' || row.payment_method === 'card'
        ? row.payment_method
        : 'upi';
    accounts[method].count += 1;
    if (row.type === 'income') {
      accounts[method].income += row.amount;
      accounts[method].balance += row.amount;
    } else {
      accounts[method].expense += row.amount;
      accounts[method].balance -= row.amount;
    }
  }

  const totalBalance =
    accounts.cash.income +
    accounts.upi.income +
    accounts.card.income -
    (accounts.cash.expense + accounts.upi.expense + accounts.card.expense);

  return {
    ...accounts,
    totalBalance,
  };
}

export async function clearAllUserData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM subscriptions;
  `);
}

export async function getAllTransactionsForExport(): Promise<any[]> {
  const db = await getDb();
  const query = `
    SELECT 
      t.id, t.type, t.amount, t.note, t.payment_method, t.timestamp,
      c.name as category_name,
      c.type as category_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.timestamp DESC
  `;
  return await db.getAllAsync<any>(query);
}

