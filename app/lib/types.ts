import type { Category } from './products';

export type Item = {
  id: string; name: string; quantity: string; notes: string;
  category: Category; emoji: string; bought: boolean;
  addedBy: string; createdAt: number; updatedAt?: number;
};

export type Expense = {
  id: string; paidBy: string;
  amount: number; note: string; createdAt: number; settledAt?: number;
  category?: Category;
};

export type HistoryGroup = { settledAt: number; total: number; expenses: Expense[] };

export type CustomProduct = {
  id: string; name: string; category: Category;
};

export type Tab = 'shop' | 'find' | 'split';
