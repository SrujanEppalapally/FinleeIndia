interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  showSign?: boolean;
}

export function formatINR(amount: number): string {
  const abs = Math.abs(amount);

  if (abs >= 1_00_00_000) {
    return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (abs >= 1_00_000) {
    return `₹${(abs / 1_00_000).toFixed(2)}L`;
  }
  if (abs >= 1_000) {
    return `₹${(abs / 1_000).toFixed(1)}K`;
  }
  return `₹${abs.toLocaleString('en-IN')}`;
}

export function CurrencyDisplay({ amount, className = '', showSign = false }: CurrencyDisplayProps) {
  const formatted = formatINR(amount);
  const sign = showSign && amount > 0 ? '+' : '';

  return (
    <span className={className}>
      {sign}{amount < 0 ? '-' : ''}{formatted}
    </span>
  );
}
