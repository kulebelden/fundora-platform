'use client';

import * as React from 'react';
import {
  Area as RechartsArea,
  AreaChart,
  CartesianGrid as RechartsCartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  type AreaProps,
  type CartesianGridProps,
  type TooltipProps,
  type XAxisProps,
  type YAxisProps,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/currency';
import type { DonationFeedItem } from '@/lib/types';

/**
 * recharts 2.15 declares these as class components in a way @types/react 18.3 rejects
 * ("JSX element class does not support attributes because it does not have a 'props'
 * property"). Re-typing them as ComponentType is runtime-identical and keeps their props
 * checked. Remove once recharts ships types compatible with this @types/react.
 */
const XAxis = RechartsXAxis as unknown as React.ComponentType<XAxisProps>;
const YAxis = RechartsYAxis as unknown as React.ComponentType<YAxisProps>;
const CartesianGrid = RechartsCartesianGrid as unknown as React.ComponentType<CartesianGridProps>;
const Area = RechartsArea as unknown as React.ComponentType<AreaProps>;
const Tooltip = RechartsTooltip as unknown as React.ComponentType<
  TooltipProps<number, string>
>;

type Range = 'daily' | 'weekly';

interface Bucket {
  label: string;
  total: number;
  count: number;
}

/** Buckets settled donations into the last 14 days or 8 weeks, filling empty periods with zero. */
function bucketDonations(donations: DonationFeedItem[], range: Range): Bucket[] {
  const periods = range === 'daily' ? 14 : 8;
  const msPerPeriod = range === 'daily' ? 86_400_000 : 7 * 86_400_000;
  const now = Date.now();

  const buckets: Bucket[] = Array.from({ length: periods }, (_, index) => {
    const start = now - (periods - 1 - index) * msPerPeriod;
    const date = new Date(start);
    return {
      label:
        range === 'daily'
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : `w/c ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      total: 0,
      count: 0,
    };
  });

  const windowStart = now - periods * msPerPeriod;

  for (const donation of donations) {
    const at = new Date(donation.createdAt).getTime();
    if (!Number.isFinite(at) || at < windowStart || at > now) continue;

    const index = periods - 1 - Math.floor((now - at) / msPerPeriod);
    if (index < 0 || index >= periods) continue;

    buckets[index].total += Number(donation.amount) || 0;
    buckets[index].count += 1;
  }

  return buckets;
}

export function DonationTrendChart({
  donations,
  currency,
}: {
  donations: DonationFeedItem[] | undefined;
  currency: string;
}) {
  const [range, setRange] = React.useState<Range>('daily');
  const data = React.useMemo(() => bucketDonations(donations ?? [], range), [donations, range]);
  const hasData = data.some((bucket) => bucket.count > 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Donation trend</h3>
          <p className="text-xs text-muted-foreground">
            Settled donations over the last {range === 'daily' ? '14 days' : '8 weeks'}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['daily', 'weekly'] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={range === option ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs capitalize"
              onClick={() => setRange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="donationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A86B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00A86B" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={62}
              tickFormatter={(value: number) =>
                formatMoney(value, currency, { compact: true, hideFraction: true })
              }
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--border))' }}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--popover))',
                fontSize: 12,
              }}
              formatter={(value, _name, item) => [
                `${formatMoney(Number(value), currency)} · ${
                  (item?.payload as Bucket | undefined)?.count ?? 0
                } donations`,
                'Raised',
              ]}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#00A86B"
              strokeWidth={2.5}
              fill="url(#donationFill)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {!hasData ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/70">
            <TrendingUp className="h-7 w-7 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-semibold">No donations in this period yet</p>
            <p className="text-xs text-muted-foreground">
              The chart fills in as donations settle.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
