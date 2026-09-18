import { useState, useCallback } from 'react';

// TODO: replace mock with API call
// import * as transactionsApi from '../api/transactions';

export type TxnType = 'income' | 'expense';

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  type: TxnType;
  date: string;
  account: string;
  note: string;
  recurring?: boolean;
}

const MOCK: Transaction[] = [
  { id: '1', merchant: 'Salary Credit', category: 'Income', amount: 95000, type: 'income', date: '2026-06-01', account: 'HDFC Savings', note: 'Monthly salary', recurring: true },
  { id: '2', merchant: 'Home Loan EMI', category: 'EMI', amount: -25000, type: 'expense', date: '2026-06-05', account: 'HDFC Savings', note: 'HDFC Home Loan', recurring: true },
  { id: '3', merchant: 'Swiggy', category: 'Food', amount: -450, type: 'expense', date: '2026-06-10', account: 'SBI Credit Card', note: 'Dinner order' },
  { id: '4', merchant: 'Airtel Recharge', category: 'Utilities', amount: -499, type: 'expense', date: '2026-06-08', account: 'HDFC Savings', note: 'Monthly plan', recurring: true },
  { id: '5', merchant: 'Amazon', category: 'Shopping', amount: -2340, type: 'expense', date: '2026-05-31', account: 'SBI Credit Card', note: 'Kitchen items' },
  { id: '6', merchant: 'Ola', category: 'Transport', amount: -280, type: 'expense', date: '2026-05-30', account: 'PhonePe', note: 'Ride to office' },
  { id: '7', merchant: 'BESCOM Bill', category: 'Utilities', amount: -1840, type: 'expense', date: '2026-05-30', account: 'HDFC Savings', note: 'Electricity bill May' },
  { id: '8', merchant: 'Zomato', category: 'Food', amount: -620, type: 'expense', date: '2026-05-29', account: 'PhonePe', note: 'Weekend brunch' },
  { id: '9', merchant: 'PVR Cinemas', category: 'Entertainment', amount: -750, type: 'expense', date: '2026-05-28', account: 'SBI Credit Card', note: 'Movie tickets' },
  { id: '10', merchant: 'Apollo Pharmacy', category: 'Healthcare', amount: -340, type: 'expense', date: '2026-05-27', account: 'HDFC Savings', note: 'Medicines' },
  { id: '11', merchant: 'LIC Premium', category: 'Insurance', amount: -3500, type: 'expense', date: '2026-05-25', account: 'HDFC Savings', note: 'Quarterly premium', recurring: true },
  { id: '12', merchant: 'Flipkart', category: 'Shopping', amount: -4599, type: 'expense', date: '2026-05-24', account: 'SBI Credit Card', note: 'Wireless earbuds' },
  { id: '13', merchant: 'Uber', category: 'Transport', amount: -520, type: 'expense', date: '2026-05-23', account: 'PhonePe', note: 'Airport drop' },
  { id: '14', merchant: 'Swiggy', category: 'Food', amount: -380, type: 'expense', date: '2026-05-22', account: 'PhonePe', note: 'Lunch' },
  { id: '15', merchant: 'SBI Credit Card Bill', category: 'EMI', amount: -8500, type: 'expense', date: '2026-05-20', account: 'HDFC Savings', note: 'Full payment' },
  { id: '16', merchant: 'Airtel Recharge', category: 'Utilities', amount: -499, type: 'expense', date: '2026-05-08', account: 'HDFC Savings', note: 'Monthly plan', recurring: true },
  { id: '17', merchant: 'BESCOM Bill', category: 'Utilities', amount: -1620, type: 'expense', date: '2026-05-05', account: 'HDFC Savings', note: 'Electricity bill April' },
  { id: '18', merchant: 'Salary Credit', category: 'Income', amount: 95000, type: 'income', date: '2026-05-01', account: 'HDFC Savings', note: 'Monthly salary', recurring: true },
  { id: '19', merchant: 'Zomato', category: 'Food', amount: -290, type: 'expense', date: '2026-05-15', account: 'PhonePe', note: 'Snacks' },
  { id: '20', merchant: 'Home Loan EMI', category: 'EMI', amount: -25000, type: 'expense', date: '2026-05-05', account: 'HDFC Savings', note: 'HDFC Home Loan', recurring: true },
  { id: '21', merchant: 'Netflix', category: 'Subscriptions', amount: -649, type: 'expense', date: '2026-06-07', account: 'SBI Credit Card', note: 'Monthly subscription', recurring: true },
  { id: '22', merchant: 'Spotify', category: 'Subscriptions', amount: -119, type: 'expense', date: '2026-05-28', account: 'PhonePe', note: 'Premium plan', recurring: true },
];

export interface UseTransactionsReturn {
  data: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  add: (txn: Omit<Transaction, 'id'>) => void;
  update: (txn: Transaction) => void;
  remove: (id: string) => void;
}

export function useTransactions(): UseTransactionsReturn {
  // TODO: replace mock with API call — transactionsApi.getAll()
  const [data, setData] = useState<Transaction[]>(MOCK);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const refetch = useCallback(() => {
    // TODO: replace mock with API call — setLoading(true); transactionsApi.getAll().then(...)
  }, []);

  const add = useCallback((txn: Omit<Transaction, 'id'>) => {
    // TODO: replace mock with API call — transactionsApi.create(txn).then(created => setData(...))
    setData((prev) => [{ ...txn, id: String(Date.now()) }, ...prev]);
  }, []);

  const update = useCallback((updated: Transaction) => {
    // TODO: replace mock with API call — transactionsApi.update(updated).then(...)
    setData((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const remove = useCallback((id: string) => {
    // TODO: replace mock with API call — transactionsApi.remove(id).then(...)
    setData((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { data, loading, error, refetch, add, update, remove };
}
