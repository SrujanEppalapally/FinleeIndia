import { useState, useCallback } from 'react';

// TODO: replace mock with API call
// import * as networthApi from '../api/networth';

export type AssetCategory = 'savings' | 'investment' | 'property' | 'gold' | 'epf';
export type LiabilityCategory = 'home-loan' | 'car-loan' | 'credit-card' | 'other';
export type ItemType = 'asset' | 'liability';

export interface NetWorthItem {
  id: string;
  name: string;
  value: number;
  category: AssetCategory | LiabilityCategory;
  type: ItemType;
}

const MOCK: NetWorthItem[] = [
  { id: 'a1', name: 'SBI Savings Account', value: 185000, category: 'savings', type: 'asset' },
  { id: 'a2', name: 'HDFC FD', value: 300000, category: 'savings', type: 'asset' },
  { id: 'a3', name: 'Zerodha Portfolio (Stocks)', value: 420000, category: 'investment', type: 'asset' },
  { id: 'a4', name: 'Zerodha MF', value: 560000, category: 'investment', type: 'asset' },
  { id: 'a5', name: 'EPF Balance', value: 380000, category: 'epf', type: 'asset' },
  { id: 'a6', name: 'Gold (50g)', value: 375000, category: 'gold', type: 'asset' },
  { id: 'l1', name: 'Home Loan Outstanding', value: 2850000, category: 'home-loan', type: 'liability' },
  { id: 'l2', name: 'Car Loan Outstanding', value: 320000, category: 'car-loan', type: 'liability' },
  { id: 'l3', name: 'Credit Card Outstanding', value: 0, category: 'credit-card', type: 'liability' },
];

export interface UseNetWorthReturn {
  data: NetWorthItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  add: (item: Omit<NetWorthItem, 'id'>) => void;
  update: (item: NetWorthItem) => void;
  remove: (id: string) => void;
}

export function useNetWorth(): UseNetWorthReturn {
  // TODO: replace mock with API call — networthApi.getSnapshot().then(s => setData(s.items))
  const [data, setData] = useState<NetWorthItem[]>(MOCK);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const refetch = useCallback(() => {
    // TODO: replace mock with API call — networthApi.getSnapshot().then(...)
  }, []);

  const add = useCallback((item: Omit<NetWorthItem, 'id'>) => {
    // TODO: replace mock with API call — networthApi.addAsset(item).then(created => setData(...))
    setData((prev) => [...prev, { ...item, id: String(Date.now()) }]);
  }, []);

  const update = useCallback((updated: NetWorthItem) => {
    // TODO: replace mock with API call — networthApi.updateAsset(updated.id, updated).then(...)
    setData((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const remove = useCallback((id: string) => {
    // TODO: replace mock with API call — networthApi.deleteAsset(id).then(...)
    setData((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { data, loading, error, refetch, add, update, remove };
}
