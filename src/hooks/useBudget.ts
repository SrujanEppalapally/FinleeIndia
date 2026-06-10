import { useState, useCallback } from 'react';

// TODO: replace mock with API call
// import * as budgetApi from '../api/budget';

export interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
  month: string;
}

const MOCK: BudgetCategory[] = [
  { id: 'food', name: 'Food', spent: 8200, limit: 10000, month: '2026-06' },
  { id: 'transport', name: 'Transport', spent: 5100, limit: 5000, month: '2026-06' },
  { id: 'shopping', name: 'Shopping', spent: 12400, limit: 12000, month: '2026-06' },
  { id: 'utilities', name: 'Utilities', spent: 3800, limit: 5000, month: '2026-06' },
  { id: 'entertainment', name: 'Entertainment', spent: 4200, limit: 5000, month: '2026-06' },
  { id: 'health', name: 'Health', spent: 1200, limit: 3000, month: '2026-06' },
  { id: 'education', name: 'Education', spent: 0, limit: 2000, month: '2026-06' },
  { id: 'emi', name: 'EMI / Loans', spent: 28500, limit: 30000, month: '2026-06' },
];

export interface UseBudgetReturn {
  data: BudgetCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  update: (id: string, limit: number) => void;
  add: (name: string, limit: number, month: string) => void;
  remove: (id: string) => void;
}

export function useBudget(): UseBudgetReturn {
  // TODO: replace mock with API call — budgetApi.getAll(currentMonth)
  const [data, setData] = useState<BudgetCategory[]>(MOCK);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const refetch = useCallback(() => {
    // TODO: replace mock with API call — budgetApi.getAll(month).then(setData)
  }, []);

  const update = useCallback((id: string, limit: number) => {
    // TODO: replace mock with API call — budgetApi.update({ id, limit, month }).then(...)
    setData((prev) => prev.map((b) => (b.id === id ? { ...b, limit } : b)));
  }, []);

  const add = useCallback((name: string, limit: number, month: string) => {
    // TODO: replace mock with API call — budgetApi.update({ id: newId, limit, month }).then(...)
    const id = name.toLowerCase().replace(/\s+/g, '-');
    setData((prev) => [...prev, { id, name, spent: 0, limit, month }]);
  }, []);

  const remove = useCallback((id: string) => {
    // TODO: replace mock with API call — no current endpoint; add when backend supports it
    setData((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { data, loading, error, refetch, update, add, remove };
}
