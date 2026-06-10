import apiClient from './client';

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

export interface NetWorthSnapshot {
  items: NetWorthItem[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  asOf: string;
}

export interface AssetPayload {
  name: string;
  value: number;
  category: AssetCategory | LiabilityCategory;
  type: ItemType;
}

export async function getSnapshot(): Promise<NetWorthSnapshot> {
  const { data } = await apiClient.get<NetWorthSnapshot>('/networth');
  return data;
}

export async function addAsset(payload: AssetPayload): Promise<NetWorthItem> {
  const { data } = await apiClient.post<NetWorthItem>('/networth/items', payload);
  return data;
}

export async function updateAsset(id: string, payload: Partial<AssetPayload>): Promise<NetWorthItem> {
  const { data } = await apiClient.put<NetWorthItem>(`/networth/items/${id}`, payload);
  return data;
}

export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`/networth/items/${id}`);
}
