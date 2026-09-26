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
import { BarChart3, Table2 } from 'lucide-react';
import { formatNumber } from '@/lib/currency';
import type { AdminTimelinePoint } from '@/lib/types';
import { cn } from '@/lib/utils';

// See donation-trend-chart.tsx: recharts' class types clash with @types/react 18.3.
const XAxis = RechartsXAxis as unknown as React.ComponentType<XAxisProps>;
const YAxis = RechartsYAxis as unknown as React.ComponentType<YAxisProps>;
const CartesianGrid = RechartsCartesianGrid as unknown as React.ComponentType<CartesianGridProps>;
const Area = RechartsArea as unknown as React.ComponentType<AreaProps>;
const Tooltip = RechartsTooltip as unknown as React.ComponentType<TooltipProps<number, string>>;

type Metric = 'signups' | 'campaigns' | 'donations';

/**
 * The three measures move on very different scales, so the chart shows one at a
 * time (switchable) rather than three lines on a shared axis.
 */
const METRICS: Record<Metric, { label: string; noun: string }> = {
  signups: { label: 'Sign-ups', noun: 'sign-ups' },
  campaigns: { label: 'Campaigns', noun: 'campaigns created' },
  donations: { label: 'Donations', noun: 'settled donations' },
};

function dayLabel(date: string, withYear = false): string {
  // Dates are UTC calendar days; format them as such so they never shift.
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

function ChartTooltip({
  active,
  payload,
  label,
  metric,
}: TooltipProps<number, string> & { metric: Metric }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value ?? 0);
  return (
    <div className="rounded-xl border bg-popover px-3.5 py-2.5 text-xs shadow-lift">
      <p className="font-semibold text-muted-foreground">{dayLabel(String(label), true)}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-foreground">
        <span className="viz-bar h-2.5 w-2.5 rounded-full" />
        <span className="tabular">{formatNumber(value)}</span>
        <span className="font-medium text-muted-foreground">{METRICS[metric].noun}</span>
      </p>
    </div>
  );
}

export function ActivityChart({ timeline }: { timeline: AdminTimelinePoint[] }) {
  const [metric, setMetric] = React.useState<Metric>('signups');
  const [view, setView] = React.useState<'chart' | 'table'>('chart');
  const total = timeline.reduce((sum, point) => sum + point[metric], 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tabular text-2xl font-extrabold tracking-tight">{formatNumber(total)}</p>
          <p className="text-xs text-muted-foreground">
            {METRICS[metric].noun} in the last {timeline.length} days
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Metric" className="flex rounded-lg bg-secondary p-1">
            {(Object.keys(METRICS) as Metric[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={metric === key}
                onClick={() => setMetric(key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  metric === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {METRICS[key].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setView((current) => (current === 'chart' ? 'table' : 'chart'))}
            aria-label={view === 'chart' ? 'Show as table' : 'Show as chart'}
            title={view === 'chart' ? 'Show as table' : 'Show as chart'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {view === 'chart' ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="adminActivityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--viz-series-1)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--viz-series-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => dayLabel(value)}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={<ChartTooltip metric={metric} />}
              />
              <Area
                type="monotone"
                dataKey={metric}
                name={METRICS[metric].label}
                stroke="var(--viz-series-1)"
                strokeWidth={2}
                fill="url(#adminActivityFill)"
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'var(--viz-series-1)' }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border">
          <table className="w-full text-sm">
            <caption className="sr-only">
              {METRICS[metric].label} per day, last {timeline.length} days
            </caption>
            <thead className="sticky top-0 bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Day</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">Sign-ups</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">Campaigns</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">Donations</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...timeline].reverse().map((point) => (
                <tr key={point.date}>
                  <th scope="row" className="px-4 py-2 text-left font-medium">
                    {dayLabel(point.date, true)}
                  </th>
                  <td className="tabular px-4 py-2 text-right">{point.signups}</td>
                  <td className="tabular px-4 py-2 text-right">{point.campaigns}</td>
                  <td className="tabular px-4 py-2 text-right">{point.donations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
