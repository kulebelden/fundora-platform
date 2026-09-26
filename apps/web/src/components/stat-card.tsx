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
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={cn('tabular mt-3 text-2xl font-extrabold leading-tight', valueClassName)}>
        {value}
      </p>
      {sub ? <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div> : null}
    </Card>
  );
}
