import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import React from 'react';

export type GoalStatus = 'on-track' | 'at-risk' | 'behind';

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  type: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  monthlyContribution: number;
  status: GoalStatus;
  linkedCalculator?: string;
  linkedCalculatorName?: string;
  source?: string;
}

export const MOCK_GOALS: Goal[] = [
  {
    id: '1',
    name: 'Dream House',
    emoji: '🏠',
    type: 'house',
    targetAmount: 6000000,
    savedAmount: 800000,
    targetDate: '2031-12',
    monthlyContribution: 45000,
    status: 'at-risk',
  },
  {
    id: '2',
    name: 'Dream Car',
    emoji: '🚗',
    type: 'vehicle',
    targetAmount: 1200000,
    savedAmount: 320000,
    targetDate: '2028-06',
    monthlyContribution: 18000,
    status: 'on-track',
  },
  {
    id: '3',
    name: 'Europe Trip',
    emoji: '🏖️',
    type: 'travel',
    targetAmount: 300000,
    savedAmount: 120000,
    targetDate: '2027-03',
    monthlyContribution: 8000,
    status: 'on-track',
  },
];

export function formatTargetDate(ym: string): string {
  const [year, month] = ym.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function monthsUntil(ym: string): number {
  const now = new Date();
  const target = new Date(Number(ym.split('-')[0]), Number(ym.split('-')[1]) - 1, 1);
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

export function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthlyNeeded(goal: Goal): number {
  const months = monthsUntil(goal.targetDate);
  if (months <= 0) return 0;
  return Math.max(0, Math.ceil((goal.targetAmount - goal.savedAmount) / months));
}

// ── Shared in-memory goal store ───────────────────────────────

type GoalInput = Omit<Goal, 'id'>;

interface GoalsContextValue {
  goals: Goal[];
  addGoal: (goalInput: GoalInput) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getGoal: (id: string) => Goal | undefined;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);

  const addGoal = useCallback((goalInput: GoalInput): Goal => {
    const newGoal: Goal = { ...goalInput, id: `goal-${Date.now()}` };
    setGoals((prev) => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const getGoal = useCallback((id: string): Goal | undefined => {
    return goals.find((g) => g.id === id);
  }, [goals]);

  return React.createElement(GoalsContext.Provider, { value: { goals, addGoal, updateGoal, deleteGoal, getGoal } }, children);
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within a GoalsProvider');
  return ctx;
}
