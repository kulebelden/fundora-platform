'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  HandCoins,
  Megaphone,
  UserPlus,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { formatMoney, formatNumber, timeAgo } from '@/lib/currency';
import type { AdminActivityItem, AdminActivityKind, CurrencyAmount } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ----------------------------------------------------------------- layout */

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** White card with a titled header row; the console's basic container. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('min-w-0 rounded-2xl border bg-card shadow-card', className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md text-xs font-bold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-bold">{title}</p>
      {body ? <p className="mt-1 max-w-xs text-xs text-muted-foreground">{body}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ stats */

/** Headline number with a one-line context below it. */
export function StatTile({
  label,
  value,
  context,
  icon: Icon,
  tint,
  href,
}: {
  label: string;
  value: ReactNode;
  context?: ReactNode;
  icon: LucideIcon;
  /** Classes for the icon chip, e.g. `bg-success/12 text-success`. */
  tint: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tint)}>
          <Icon className="h-[1.1rem] w-[1.1rem]" />
        </span>
      </div>
      <div className="tabular mt-3 text-3xl font-extrabold tracking-tight">{value}</div>
      {context ? <div className="mt-1.5 text-xs text-muted-foreground">{context}</div> : null}
    </>
  );

  const className =
    'block min-w-0 rounded-2xl border bg-card p-5 shadow-card transition-shadow';
  return href ? (
    <Link
      href={href}
      className={cn(className, 'hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * Magnitude comparison as a list of labelled bars. One hue throughout: the
 * bars compare size, they do not identify series.
 */
export function BarList({
  items,
  emptyLabel = 'Nothing to show yet.',
}: {
  items: Array<{ key: string; label: ReactNode; value: number; note?: ReactNode }>;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{item.label}</span>
            <span className="tabular shrink-0 font-bold">
              {formatNumber(item.value)}
              {item.note ? (
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">{item.note}</span>
              ) : null}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="viz-bar h-full rounded-full"
              style={{ width: `${item.value ? Math.max(3, (item.value / max) * 100) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Totals per currency, largest first. Never converted or summed across currencies. */
export function MoneyList({
  amounts,
  emptyLabel,
  size = 'md',
}: {
  amounts: CurrencyAmount[];
  emptyLabel: string;
  size?: 'md' | 'lg';
}) {
  if (!amounts.length) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }
  return (
    <span className="flex flex-col gap-0.5">
      {amounts.map((row) => (
        <span key={row.currency} className={cn('tabular', size === 'lg' ? 'text-3xl' : 'text-sm font-bold')}>
          {formatMoney(row.amount, row.currency, { compact: size === 'lg' })}
        </span>
      ))}
    </span>
  );
}

/* --------------------------------------------------------------- activity */

const ACTIVITY: Record<AdminActivityKind, { icon: LucideIcon; tint: string; verb: string }> = {
  signup: { icon: UserPlus, tint: 'bg-accent/10 text-accent', verb: 'joined as' },
  campaign_created: { icon: Megaphone, tint: 'bg-success/12 text-success', verb: 'created' },
  donation: { icon: HandCoins, tint: 'bg-warm/15 text-[#8a5200]', verb: 'donated to' },
  withdrawal_requested: { icon: Wallet, tint: 'bg-primary/10 text-primary', verb: 'requested a payout from' },
  kyc_submitted: { icon: BadgeCheck, tint: 'bg-secondary text-foreground', verb: 'sent identity documents' },
};

function readableRole(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase();
}

export function ActivityFeed({ items }: { items: AdminActivityItem[] }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No activity yet"
        body="Sign-ups, new campaigns, donations and payout requests will appear here as they happen."
      />
    );
  }

  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-px before:bg-border">
      {items.map((item, index) => {
        const meta = ACTIVITY[item.kind];
        const Icon = meta.icon;
        const subject =
          item.kind === 'signup'
            ? readableRole(item.subject ?? 'member')
            : item.kind === 'kyc_submitted'
              ? null
              : item.subject;
        return (
          <li key={`${item.kind}-${item.at}-${index}`} className="relative flex gap-3">
            <span
              className={cn(
                'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card',
                meta.tint,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm leading-snug">
                <span className="font-bold">{item.actor}</span>{' '}
                <span className="text-muted-foreground">{meta.verb}</span>{' '}
                {subject ? (
                  item.slug ? (
                    <Link href={`/campaigns/${item.slug}`} className="font-semibold hover:underline">
                      {subject}
                    </Link>
                  ) : (
                    <span className="font-semibold">{subject}</span>
                  )
                ) : null}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <time dateTime={item.at}>{timeAgo(item.at)}</time>
                {item.amount && item.currency ? (
                  <span className="tabular font-semibold text-foreground">
                    {formatMoney(item.amount, item.currency)}
                  </span>
                ) : null}
                {item.status ? <span>· {readableRole(item.status)}</span> : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
