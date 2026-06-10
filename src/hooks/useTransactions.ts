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
}

const MOCK: Transaction[] = [
  { id: '1', merchant: 'Salary Credit', category: 'Income', amount: 95000, type: 'income', date: '2026-06-01', account: 'HDFC Savings', note: 'Monthly salary' },
  { id: '2', merchant: 'Home Loan EMI', category: 'EMI', amount: -25000, type: 'expense', date: '2026-06-05', account: 'HDFC Savings', note: 'HDFC Home Loan' },
  { id: '3', merchant: 'Swiggy', category: 'Food', amount: -450, type: 'expense', date: '2026-06-10', account: 'SBI Credit Card', note: 'Dinner order' },
  { id: '4', merchant: 'Airtel Recharge', category: 'Utilities', amount: -499, type: 'expense', date: '2026-06-08', account: 'HDFC Savings', note: 'Monthly plan' },
  { id: '5', merchant: 'Amazon', category: 'Shopping', amount: -2340, type: 'expense', date: '2026-05-31', account: 'SBI Credit Card', note: 'Kitchen items' },
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
