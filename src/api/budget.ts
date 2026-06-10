import apiClient from './client';

export interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
  month: string;
}

export interface UpdateBudgetPayload {
  id: string;
  limit: number;
  month: string;
}

export async function getAll(month: string): Promise<BudgetCategory[]> {
  const { data } = await apiClient.get<BudgetCategory[]>('/budget', { params: { month } });
  return data;
}

export async function update(payload: UpdateBudgetPayload): Promise<BudgetCategory> {
  const { id, ...body } = payload;
  const { data } = await apiClient.put<BudgetCategory>(`/budget/${id}`, body);
  return data;
}
