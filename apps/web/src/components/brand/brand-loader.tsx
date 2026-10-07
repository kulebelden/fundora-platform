import { useId } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

type LoaderSize = 'sm' | 'md' | 'lg';

const SIZES: Record<LoaderSize, { box: string; mark: string; stroke: number }> = {
  sm: { box: 'h-12 w-12', mark: 'h-5', stroke: 3 },
  md: { box: 'h-20 w-20', mark: 'h-8', stroke: 3.5 },
  lg: { box: 'h-28 w-28', mark: 'h-12', stroke: 4 },
};

/**
 * The HopeNest loader: the heart mark beating gently inside a ring that sweeps
 * from brand emerald to brand blue. Use it wherever the page is waiting on
 * something it cannot yet sketch — a route, a sign-in check. Where the layout
 * of the coming content is known, a skeleton is still the better choice.
 *
 * The mark is a PNG and already preloaded by the header, so it is on screen by
 * the time any loader shows.
 */
export function BrandLoader({
  size = 'md',
  label,
  className,
}: {
  size?: LoaderSize;
  /** Shown under the mark and read out by screen readers. */
  label?: string;
  className?: string;
}) {
  const gradientId = useId();
  const { box, mark, stroke } = SIZES[size];
  const radius = 50 - stroke;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('brand-loader flex flex-col items-center gap-4', className)}
    >
      <div className={cn('relative grid place-items-center', box)}>
        {/* Soft halo, so the mark reads on light and brand-gradient surfaces alike. */}
        <span aria-hidden className="brand-loader-halo absolute inset-[12%] rounded-full bg-success/15 blur-md" />

        <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00a86b" />
              <stop offset="100%" stopColor="#0066ff" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth={stroke} className="stroke-border/70" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="28 72"
            className="brand-loader-arc origin-center"
          />
        </svg>

        <LogoMark className={cn('brand-loader-mark relative w-auto', mark)} />
      </div>

      {label ? (
        <p className="whitespace-nowrap text-center text-sm font-semibold text-muted-foreground">
          {label}
          <span aria-hidden className="brand-loader-dots" />
        </p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

/**
 * Full-screen loader for route transitions and auth gates. It fades in after a
 * short delay, so a fast navigation never flashes it.
 */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="brand-loader-delayed flex min-h-[70dvh] items-center justify-center px-4">
      <BrandLoader size="lg" label={label} />
    </div>
  );
}
