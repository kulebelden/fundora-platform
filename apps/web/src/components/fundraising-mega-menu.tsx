'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, HeartHandshake, Megaphone } from 'lucide-react';
import { FUNDRAISE_MENU, SUPPORT_POINTS, isNavPathActive } from '@/lib/site-nav';
import { cn } from '@/lib/utils';

/**
 * Panel contents for the header's "Fundraise" menu. Two clean columns with a
 * highlighted hero card at the bottom. The wrapper in site-header owns the
 * open/close state and positioning; this renders only the interior, marking the
 * page currently being viewed.
 */
export function FundraisingMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="w-full max-w-2xl rounded-xl border border-border bg-popover p-4 shadow-2xl">
      <div className="grid grid-cols-2 gap-4">
        {FUNDRAISE_MENU.map((column) => (
          <div key={column.heading} className="min-w-0">
            <p className="mb-2 px-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
              {column.heading}
            </p>
            <ul className="space-y-0.5">
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
                        isCurrent ? 'border-success bg-success/10' : 'border-transparent',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:bg-success/12 group-hover:text-success',
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
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-gradient-to-br from-success via-success to-primary p-5 text-white sm:flex-row sm:items-center">
        <div className="flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-white/90 motion-safe:animate-pulse" />
            Start raising today
          </span>
          <h3 className="mt-3 text-lg font-extrabold leading-tight">
            Your cause, verified and funded.
          </h3>
        </div>
        <div className="flex flex-col gap-2 sm:w-56">
          <Link
            href="/create"
            onClick={onNavigate}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-primary shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-success"
          >
            <HeartHandshake className="h-4 w-4" />
            Start a Campaign
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/fundraise/tips"
            onClick={onNavigate}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/15"
          >
            <Megaphone className="h-4 w-4" />
            Read tips
          </Link>
        </div>
      </div>
    </div>
  );
}