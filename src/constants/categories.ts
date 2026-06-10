export interface CategoryDefinition {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'food',          name: 'Food',           color: '#b45309', icon: 'Utensils'       },
  { id: 'transport',     name: 'Transport',       color: '#0e7490', icon: 'Car'            },
  { id: 'shopping',      name: 'Shopping',        color: '#a12c7b', icon: 'ShoppingBag'    },
  { id: 'utilities',     name: 'Utilities',       color: '#6b7280', icon: 'Zap'            },
  { id: 'entertainment', name: 'Entertainment',   color: '#437a22', icon: 'Film'           },
  { id: 'health',        name: 'Health',          color: '#dc2626', icon: 'Heart'          },
  { id: 'education',     name: 'Education',       color: '#01696f', icon: 'BookOpen'       },
  { id: 'emi',           name: 'EMI/Loans',       color: '#b45309', icon: 'Home'           },
  { id: 'income',        name: 'Income',          color: '#437a22', icon: 'TrendingUp'     },
  { id: 'other',         name: 'Other',           color: '#6b7280', icon: 'MoreHorizontal' },
];

export const CATEGORY_MAP: Record<string, CategoryDefinition> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.id, c]),
);
