import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Content card for the 3D-styled pages (Ideas, Tips). It sits tilted back in
 * perspective with a stepped edge and straightens up on hover or focus; the
 * icon floats forward off the card. Alternate cards tilt the other way, so a
 * grid of them reads as a fanned-out stack rather than a flat wall.
 */
export function DepthCard({
  index,
  icon: Icon,
  iconClassName,
  title,
  children,
  footer,
  fontClassName = 'font-syne',
}: {
  /** Position in the list; shown as a large outlined numeral. */
  index: number;
  icon: LucideIcon;
  /** Colour classes for the icon tile, e.g. `bg-success`. */
  iconClassName: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Display face for the numeral and title, matching the page hero. */
  fontClassName?: string;
}) {
  return (
    <article className="card-3d h-full">
      <div className="card-3d-inner relative h-full overflow-hidden rounded-3xl border bg-card p-7 sm:p-8">
        <span
          aria-hidden
          className={cn(
            'numeral-3d pointer-events-none absolute -right-2 -top-4 select-none text-[6.5rem] font-extrabold leading-none',
            fontClassName,
          )}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <span
          className={cn(
            'icon-3d card-3d-pop relative flex h-14 w-14 items-center justify-center rounded-2xl text-white',
            iconClassName,
          )}
        >
          <Icon className="h-6 w-6" />
        </span>

        <h3 className={cn('relative mt-6 text-xl font-bold leading-snug tracking-tight', fontClassName)}>
          {title}
        </h3>
        <div className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
        {footer ? <div className="relative mt-5">{footer}</div> : null}
      </div>
    </article>
  );
}
