import type * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  Icon,
  label,
  value,
  sub,
  accent = 'bg-secondary text-secondary-foreground',
  valueClassName,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: string;
  valueClassName?: string;
}) {
  return (
    // Sized to sit two-up on a phone: tighter padding and a smaller figure below `sm`.
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <p className="text-[11px] font-bold uppercase leading-snug tracking-wide text-muted-foreground sm:text-xs">
          {label}
        </p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={cn('tabular mt-2 truncate text-xl font-extrabold leading-tight sm:mt-3 sm:text-2xl', valueClassName)}>
        {value}
      </p>
      {sub ? <div className="mt-1 text-[11px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-xs">{sub}</div> : null}
    </Card>
  );
}
