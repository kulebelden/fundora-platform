'use client';

import * as React from 'react';
import { Globe2, HeartHandshake, Sparkles, TrendingUp } from 'lucide-react';
import { formatMoney, formatNumber } from '@/lib/currency';
import { usePlatformStats } from '@/lib/queries';
import { cn } from '@/lib/utils';

/** Counts up to `value` once the tile is on screen; respects reduced-motion. */
function useCountUp(value: number, durationMs = 1100): number {
  const [display, setDisplay] = React.useState(value);

  React.useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return display;
}

function StatTile({
  Icon,
  value,
  label,
  accent,
}: {
  Icon: typeof Globe2;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="tabular text-xl font-extrabold leading-tight text-white sm:text-2xl">
          {value}
        </p>
        <p className="truncate text-xs font-medium text-white/65">{label}</p>
      </div>
    </div>
  );
}

export function StatsTicker() {
  const { data: stats, isError } = usePlatformStats();

  // Hooks must run unconditionally, so count up from zero until the data lands.
  const donors = useCountUp(stats?.totalDonors ?? 0);
  const causes = useCountUp(stats?.successfulCauses ?? 0);
  const countries = useCountUp(stats?.activeCountries ?? 0);

  /** Placeholder rather than a misleading zero while the request is in flight. */
  const show = (rendered: string) => (stats ? rendered : '—');

  const otherCurrencies = stats
    ? Object.keys(stats.totalRaisedByCurrency).filter(
        (code) => code !== stats.reportingCurrency,
      )
    : [];

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        <StatTile
          Icon={HeartHandshake}
          value={show(formatNumber(donors, true))}
          label="Global donors"
          accent="bg-success/20 text-success"
        />
        <StatTile
          Icon={TrendingUp}
          value={show(
            formatMoney(stats?.totalRaised ?? 0, stats?.reportingCurrency ?? 'USD', {
              compact: true,
            }),
          )}
          label={stats ? `Funds raised (${stats.reportingCurrency})` : 'Funds raised'}
          accent="bg-warm/20 text-warm"
        />
        <StatTile
          Icon={Sparkles}
          value={show(formatNumber(causes, true))}
          label="Successful causes"
          accent="bg-white/15 text-white"
        />
        <StatTile
          Icon={Globe2}
          value={show(formatNumber(countries))}
          label="Countries served"
          accent="bg-accent/25 text-white"
        />
      </div>

      {/*
        Totals are never converted between currencies, so anything raised outside the
        reporting currency is named here instead of being silently added to the figure.
      */}
      {otherCurrencies.length ? (
        <p className="mt-4 text-[11px] text-white/45">
          Plus funds raised in {otherCurrencies.join(', ')}, shown separately because
          HopeNest does not convert between currencies.
        </p>
      ) : null}

      {isError ? (
        <p className="mt-4 text-[11px] text-white/45">
          Live platform statistics are unavailable right now.
        </p>
      ) : null}
    </div>
  );
}
