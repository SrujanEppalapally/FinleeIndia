import apiClient from './client';

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

export interface CreateTransactionPayload {
  merchant: string;
  category: string;
  amount: number;
  type: TxnType;
  date: string;
  account: string;
  note?: string;
}

export interface UpdateTransactionPayload extends Partial<CreateTransactionPayload> {
  id: string;
}

export interface TransactionFilters {
  month?: string;
  category?: string;
  type?: TxnType | 'all';
  search?: string;
}

export async function getAll(filters?: TransactionFilters): Promise<Transaction[]> {
  const { data } = await apiClient.get<Transaction[]>('/transactions', { params: filters });
  return data;
}

export async function create(payload: CreateTransactionPayload): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>('/transactions', payload);
  return data;
}

export async function update(payload: UpdateTransactionPayload): Promise<Transaction> {
  const { id, ...body } = payload;
  const { data } = await apiClient.put<Transaction>(`/transactions/${id}`, body);
  return data;
}

export async function remove(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
