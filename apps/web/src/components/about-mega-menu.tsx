'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ABOUT_MENU, SUPPORT_POINTS, isNavPathActive } from '@/lib/site-nav';
import { cn } from '@/lib/utils';

/**
 * Panel contents for the header's "About" menu. Three-column layout with a
 * bordered card grid — distinct from the Fundraise menu's two-column card
 * grid and the Categories menu's compact list. The page currently being viewed
 * is marked in place, so the menu doubles as a "you are here" indicator.
 */
export function AboutMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="grid gap-5 rounded-2xl border bg-popover p-5 shadow-lift lg:grid-cols-[1fr_1fr_0.95fr]">
      {ABOUT_MENU.map((column) => (
        <div key={column.heading} className="rounded-xl border border-border/60 p-4">
          <p className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
            {column.heading}
          </p>
          <ul className="mt-2.5 space-y-0.5">
            {column.links.map((link) => {
              const Icon = link.icon;
              const isCurrent = isNavPathActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={cn(
                      'group flex items-start gap-3 rounded-lg border-l-2 p-2.5 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isCurrent
                        ? 'border-success bg-success/10'
                        : 'border-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:bg-accent/12 group-hover:text-accent',
                        isCurrent && 'bg-success/15 text-success',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block text-sm font-bold transition-colors group-hover:text-accent',
                          isCurrent && 'text-success',
                        )}
                      >
                        {link.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                        {link.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* -------------------------------------------- support card */}
      <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-primary via-primary to-success p-5 text-white shadow-lift">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-white/90 motion-safe:animate-pulse" />
            Need help?
          </span>

          <h3 className="mt-3 text-xl font-extrabold leading-tight">Talk to a real person</h3>

          <ul className="mt-4 space-y-2.5">
            {SUPPORT_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.label} className="flex items-center gap-2 text-xs font-medium text-white/90">
                  <Icon className="h-4 w-4 shrink-0 text-white/70" />
                  {point.label}
                </li>
              );
            })}
          </ul>
        </div>

        <Link
          href="/contact"
          onClick={onNavigate}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 text-xs font-black text-primary shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-success"
        >
          Contact Support
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}