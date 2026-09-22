export interface CalculatorLink {
  route: string;
  name: string;
}

export interface GoalType {
  id: string;
  label: string;
  emoji: string;
  suggestedCalculator: CalculatorLink;
}

export const GOAL_TYPES: GoalType[] = [
  { id: 'house',          label: 'House',          emoji: '🏠',  suggestedCalculator: { route: '/calculators/dream-house',      name: 'Dream House Calculator' } },
  { id: 'vehicle',        label: 'Vehicle',        emoji: '🚗',  suggestedCalculator: { route: '/calculators/dream-vehicle',     name: 'Dream Vehicle Calculator' } },
  { id: 'travel',         label: 'Travel',         emoji: '🏖️',  suggestedCalculator: { route: '/calculators/trip-budget',      name: 'Trip Budget Planner' } },
  { id: 'education',      label: 'Education',      emoji: '🎓',  suggestedCalculator: { route: '/calculators',                name: 'Calculator Hub' } },
  { id: 'emergency-fund', label: 'Emergency Fund', emoji: '🛡️',  suggestedCalculator: { route: '/calculators',                name: 'Calculator Hub' } },
  { id: 'retirement',     label: 'Retirement',     emoji: '🏡',  suggestedCalculator: { route: '/calculators/retirement',     name: 'Retirement Calculator' } },
  { id: 'fire',           label: 'FIRE',           emoji: '🔥',  suggestedCalculator: { route: '/calculators/fire',            name: 'FIRE Calculator' } },
  { id: 'investment',     label: 'Investment',     emoji: '📈',  suggestedCalculator: { route: '/calculators/incremental-sip', name: 'Incremental SIP Calculator' } },
  { id: 'custom',         label: 'Custom',         emoji: '🎯',  suggestedCalculator: { route: '/calculators',                name: 'Calculator Hub' } },
];

export const GOAL_TYPE_MAP: Record<string, GoalType> = Object.fromEntries(
  GOAL_TYPES.map((g) => [g.id, g]),
);

const DEFAULT_CALCULATOR: CalculatorLink = { route: '/calculators', name: 'Calculator Hub' };

export function getCalculatorForGoalType(typeId: string): CalculatorLink {
  return GOAL_TYPE_MAP[typeId]?.suggestedCalculator ?? DEFAULT_CALCULATOR;
}
