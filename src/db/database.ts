import * as SQLite from 'expo-sqlite';
import { 
  CREATE_SETTINGS_TABLE, 
  CREATE_CATEGORIES_TABLE, 
  CREATE_TRANSACTIONS_TABLE,
  CREATE_INDEX_TRANSACTIONS_DATE,
  CREATE_SUBSCRIPTIONS_TABLE
} from './schema';
import { DEFAULT_CATEGORIES } from '../constants/categories';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('montra.db');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDb();

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    ${CREATE_SETTINGS_TABLE}
    ${CREATE_CATEGORIES_TABLE}
    ${CREATE_TRANSACTIONS_TABLE}
    ${CREATE_INDEX_TRANSACTIONS_DATE}
    ${CREATE_SUBSCRIPTIONS_TABLE}
  `);

  // Migration: Ensure payment_method column exists in transactions
  const txTableInfo = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(transactions)`
  );
  const hasPaymentMethod = txTableInfo.some((col) => col.name === 'payment_method');
  if (!hasPaymentMethod) {
    try {
      await db.runAsync(`ALTER TABLE transactions ADD COLUMN payment_method TEXT DEFAULT 'upi'`);
    } catch {
      // Ignore if already added
    }
  }

  // Migration: Ensure cycle column exists in subscriptions
  const subTableInfo = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(subscriptions)`
  );
  const hasCycle = subTableInfo.some((col) => col.name === 'cycle');
  if (!hasCycle) {
    try {
      await db.runAsync(`ALTER TABLE subscriptions ADD COLUMN cycle TEXT DEFAULT 'monthly'`);
    } catch {
      // Ignore if already added
    }
  }

  // Check if categories are seeded
  const categoryCountRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );

  if (!categoryCountRow || categoryCountRow.count === 0) {
    // Seed default categories
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (id, name, easy_name, icon, color, type, monthly_target, is_essential, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cat.id,
          cat.name,
          cat.easyName,
          cat.icon,
          cat.color,
          cat.type,
          cat.monthlyTarget,
          cat.isEssential ? 1 : 0,
          cat.description,
        ]
      );
    }
  } else {
    // Migration: update existing household category to 'Home'
    await db.runAsync(
      `UPDATE categories SET name = 'Home', easy_name = 'Home', icon = 'ShoppingCart', description = 'Groceries, rent, supplies & home essentials' WHERE id = 'household'`
    );

    // Migration: Ensure 'vehicle' category exists
    const vehicleRow = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM categories WHERE id = ?',
      ['vehicle']
    );
    if (!vehicleRow) {
      await db.runAsync(
        `INSERT INTO categories (id, name, easy_name, icon, color, type, monthly_target, is_essential, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'vehicle',
          'Vehicle & Transport',
          'Vehicle & Fuel',
          'Car',
          '#4B6B94',
          'expense',
          2500,
          1,
          'Fuel, vehicle service, parking, tolls & travel',
        ]
      );
    }
  }

  // Check default settings
  const modeSetting = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['ui_mode']
  );
  if (!modeSetting) {
    // Default to 'easy' so seniors and new users have the most accessible experience out-of-the-box
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', ['ui_mode', 'easy']);
  }

  const currencySetting = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['currency']
  );
  if (!currencySetting) {
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', ['currency', '₹']);
  }

  const hapticsSetting = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['haptics_enabled']
  );
  if (!hapticsSetting) {
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', ['haptics_enabled', '1']);
  }

  return db;
}
