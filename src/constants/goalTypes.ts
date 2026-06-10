export interface GoalType {
  id: string;
  label: string;
  emoji: string;
  // TODO: link to calculator route when wired
  // suggestedCalculator: string | null;
  // e.g. 'House'       → '/calculators/emi'
  // e.g. 'Retirement'  → '/calculators/retirement'
  // e.g. 'Vehicle'     → '/calculators/emi'
  // e.g. 'Education'   → '/calculators/sip'
  // e.g. 'Custom'      → null
}

export const GOAL_TYPES: GoalType[] = [
  { id: 'house',          label: 'House',          emoji: '🏠' },
  { id: 'vehicle',        label: 'Vehicle',        emoji: '🚗' },
  { id: 'travel',         label: 'Travel',         emoji: '🏖️' },
  { id: 'education',      label: 'Education',      emoji: '🎓' },
  { id: 'emergency-fund', label: 'Emergency Fund', emoji: '🛡️' },
  { id: 'retirement',     label: 'Retirement',     emoji: '🏡' },
  { id: 'custom',         label: 'Custom',         emoji: '🎯' },
];

export const GOAL_TYPE_MAP: Record<string, GoalType> = Object.fromEntries(
  GOAL_TYPES.map((g) => [g.id, g]),
);
