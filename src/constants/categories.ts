export type CategoryType = 'expense' | 'investment' | 'income';

export interface CategoryItem {
  id: string;
  name: string;
  easyName: string;
  icon: string;
  color: string;
  type: CategoryType;
  monthlyTarget: number;
  isEssential: boolean;
  description: string;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // Expenses (Harmonized with Expenses #D97745 & Sage #8FA17B)
  {
    id: 'household',
    name: 'Home',
    easyName: 'Home',
    icon: 'ShoppingCart',
    color: '#D97745',
    type: 'expense',
    monthlyTarget: 8000,
    isEssential: true,
    description: 'Groceries, rent, supplies & home essentials',
  },
  {
    id: 'health',
    name: 'Health & Medicine',
    easyName: 'Doctor & Medicines',
    icon: 'HeartPulse',
    color: '#C04930',
    type: 'expense',
    monthlyTarget: 3000,
    isEssential: true,
    description: 'Prescriptions, checkups, medical supplies',
  },
  {
    id: 'utilities',
    name: 'Bills & Utilities',
    easyName: 'Electricity & Bills',
    icon: 'Zap',
    color: '#8FA17B',
    type: 'expense',
    monthlyTarget: 2500,
    isEssential: true,
    description: 'Electricity, water, recharge, Wi-Fi',
  },
  {
    id: 'vehicle',
    name: 'Vehicle & Transport',
    easyName: 'Vehicle & Fuel',
    icon: 'Car',
    color: '#4B6B94',
    type: 'expense',
    monthlyTarget: 2500,
    isEssential: true,
    description: 'Fuel, vehicle service, parking, tolls & travel',
  },
  {
    id: 'skills',
    name: 'Skill & Learning',
    easyName: 'Learning & Books',
    icon: 'GraduationCap',
    color: '#526B45',
    type: 'expense',
    monthlyTarget: 2000,
    isEssential: false,
    description: 'Courses, workshops, books, hobbies',
  },
  {
    id: 'personal',
    name: 'Personal & Leisure',
    easyName: 'Coffee & Outings',
    icon: 'Coffee',
    color: '#B86C4B',
    type: 'expense',
    monthlyTarget: 3000,
    isEssential: false,
    description: 'Cafes, dining out, shopping, leisure',
  },

  // Savings & Future Investments (Savings #6486B5)
  {
    id: 'invest_future',
    name: 'Future Investments',
    easyName: 'Future Savings & Growth',
    icon: 'TrendingUp',
    color: '#6486B5',
    type: 'investment',
    monthlyTarget: 5000,
    isEssential: true,
    description: 'Fixed Deposits, Mutual Funds/SIPs, Gold, Retirement',
  },
  {
    id: 'invest_emergency',
    name: 'Emergency Fund',
    easyName: 'Rainy Day Safety Fund',
    icon: 'ShieldCheck',
    color: '#50709C',
    type: 'investment',
    monthlyTarget: 2000,
    isEssential: true,
    description: 'Instant backup fund for emergency safety',
  },

  // Income sources (Income #27845B)
  {
    id: 'income_primary',
    name: 'Salary / Pension / Primary',
    easyName: 'Pension or Salary',
    icon: 'Wallet',
    color: '#27845B',
    type: 'income',
    monthlyTarget: 0,
    isEssential: true,
    description: 'Monthly salary, pension, or primary earnings',
  },
  {
    id: 'income_other',
    name: 'Freelance & Other Income',
    easyName: 'Freelance or Gifts',
    icon: 'Gift',
    color: '#389C6F',
    type: 'income',
    monthlyTarget: 0,
    isEssential: false,
    description: 'Freelance, interest, gifts, side revenue',
  },
];
