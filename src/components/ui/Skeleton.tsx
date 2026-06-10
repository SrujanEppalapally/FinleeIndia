type SkeletonVariant = 'text' | 'card' | 'table-row';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  lines?: number;
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}

export function Skeleton({ variant = 'text', className = '', lines = 1 }: SkeletonProps) {
  if (variant === 'text') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={`h-4 rounded-[4px] ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`bg-white rounded-[8px] shadow-card p-5 flex flex-col gap-3 ${className}`}
      >
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-8 w-1/2" />
        <SkeletonBlock className="h-3 w-2/3" />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`flex items-center gap-4 py-3 px-4 ${className}`}>
        <SkeletonBlock className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <SkeletonBlock className="h-3.5 w-1/3" />
          <SkeletonBlock className="h-3 w-1/4" />
        </div>
        <SkeletonBlock className="h-4 w-16 flex-shrink-0" />
      </div>
    );
  }

  return null;
}
