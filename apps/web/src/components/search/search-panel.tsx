'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, CornerDownLeft, Loader2, Search, X } from 'lucide-react';
import { DISCOVER_CATEGORIES } from '@/lib/category-data';
import { formatMoney, fundedPercent } from '@/lib/currency';
import { useCampaignSearch } from '@/lib/queries';
import { searchPages, type SearchablePage } from '@/lib/site-search';
import type { CampaignSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Debounce for the campaign lookup; page matches are instant. */
const DEBOUNCE_MS = 200;
/** Shown before anything is typed. */
const SUGGESTED = DISCOVER_CATEGORIES.slice(0, 6);

type Result =
  | { kind: 'campaign'; href: string; campaign: CampaignSummary }
  | { kind: 'page'; href: string; page: SearchablePage }
  | { kind: 'all'; href: string };

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function searchHref(query: string): string {
  return `/search?q=${encodeURIComponent(query.trim())}`;
}

/**
 * Site-wide search: live campaigns from the API plus every page in the menus.
 * Full-screen on a phone, a centred panel on wider screens. Arrow keys move
 * through results, Enter opens one, and Enter with nothing picked opens the
 * full results page.
 */
export function SearchPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const debounced = useDebounced(query, DEBOUNCE_MS);
  const trimmed = query.trim();

  const campaigns = useCampaignSearch(debounced, 5);
  const pages = React.useMemo(() => searchPages(trimmed, 5), [trimmed]);
  const campaignRows = trimmed.length >= 2 ? (campaigns.data?.data ?? []) : [];
  const searching = trimmed.length >= 2 && (campaigns.isFetching || debounced !== query);

  const results: Result[] = React.useMemo(() => {
    if (!trimmed) return [];
    return [
      ...campaignRows.map((campaign) => ({ kind: 'campaign' as const, href: `/campaigns/${campaign.slug}`, campaign })),
      ...pages.map((page) => ({ kind: 'page' as const, href: page.href, page })),
      { kind: 'all' as const, href: searchHref(trimmed) },
    ];
  }, [campaignRows, pages, trimmed]);

  // Fresh panel each time it opens.
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);
  React.useEffect(() => setActive(0), [trimmed]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]?.href ?? searchHref(trimmed));
    }
  };

  // Keep the highlighted row in view while arrowing through a long list.
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const campaignStart = 0;
  const pageStart = campaignRows.length;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#001330]/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className={cn(
            'fixed inset-0 z-50 flex flex-col bg-background shadow-lift focus:outline-none',
            'sm:inset-auto sm:left-1/2 sm:top-[10vh] sm:max-h-[78vh] sm:w-[min(40rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95',
          )}
        >
          <DialogPrimitive.Title className="sr-only">Search HopeNest</DialogPrimitive.Title>

          <div className="flex items-center gap-2 border-b px-3 pt-[env(safe-area-inset-top)] sm:px-4">
            {searching ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns, causes, pages…"
              aria-label="Search HopeNest"
              aria-controls="search-results"
              aria-activedescendant={results.length ? `search-result-${active}` : undefined}
              enterKeyHint="search"
              maxLength={100}
              className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <DialogPrimitive.Close className="rounded-md px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden">
              Cancel
            </DialogPrimitive.Close>
            <kbd className="hidden rounded border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:block">
              Esc
            </kbd>
          </div>

          <div ref={listRef} id="search-results" role="listbox" className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
            {!trimmed ? (
              <div className="p-2">
                <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Browse causes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTED.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/discover/${category.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
                    >
                      <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {category.shortName}
                    </Link>
                  ))}
                </div>
                <p className="mt-6 px-1 text-sm text-muted-foreground">
                  Try a cause (“school fees”), a place (“Lisbon”) or a person’s name.
                </p>
              </div>
            ) : (
              <>
                {campaignRows.length ? (
                  <Group label="Campaigns">
                    {campaignRows.map((campaign, i) => (
                      <CampaignResult
                        key={campaign.id}
                        index={campaignStart + i}
                        active={active === campaignStart + i}
                        campaign={campaign}
                        onHover={setActive}
                        onPick={go}
                      />
                    ))}
                  </Group>
                ) : null}

                {pages.length ? (
                  <Group label="Pages">
                    {pages.map((page, i) => (
                      <PageResult
                        key={page.href}
                        index={pageStart + i}
                        active={active === pageStart + i}
                        page={page}
                        onHover={setActive}
                        onPick={go}
                      />
                    ))}
                  </Group>
                ) : null}

                {!campaignRows.length && !pages.length && !searching ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No campaigns or pages match “{trimmed}”.
                  </p>
                ) : null}

                <button
                  type="button"
                  role="option"
                  id={`search-result-${results.length - 1}`}
                  data-index={results.length - 1}
                  aria-selected={active === results.length - 1}
                  onMouseMove={() => setActive(results.length - 1)}
                  onClick={() => go(searchHref(trimmed))}
                  className={cn(
                    'mt-1 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-accent',
                    active === results.length - 1 && 'bg-secondary',
                  )}
                >
                  <span className="min-w-0 truncate">See all results for “{trimmed}”</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
              </>
            )}
          </div>

          <div className="hidden items-center gap-4 border-t px-4 py-2.5 text-[11px] text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-secondary px-1">↑</kbd>
              <kbd className="rounded border bg-secondary px-1">↓</kbd> to move
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-secondary px-1">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              to open
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface RowProps {
  index: number;
  active: boolean;
  onHover: (index: number) => void;
  onPick: (href: string) => void;
}

const ROW = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors';

function CampaignResult({ campaign, index, active, onHover, onPick }: RowProps & { campaign: CampaignSummary }) {
  const percent = Math.round(fundedPercent(campaign.raisedAmount, campaign.targetAmount));
  return (
    <button
      type="button"
      role="option"
      id={`search-result-${index}`}
      data-index={index}
      aria-selected={active}
      onMouseMove={() => onHover(index)}
      onClick={() => onPick(`/campaigns/${campaign.slug}`)}
      className={cn(ROW, active && 'bg-secondary')}
    >
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
        {campaign.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded / remote cover
          <img src={campaign.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="brand-gradient block h-full w-full" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{campaign.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {campaign.category?.name} · {formatMoney(campaign.raisedAmount, campaign.currency, { hideFraction: true })} raised ·{' '}
          {percent}%
        </span>
      </span>
    </button>
  );
}

function PageResult({ page, index, active, onHover, onPick }: RowProps & { page: SearchablePage }) {
  const Icon = page.icon;
  return (
    <button
      type="button"
      role="option"
      id={`search-result-${index}`}
      data-index={index}
      aria-selected={active}
      onMouseMove={() => onHover(index)}
      onClick={() => onPick(page.href)}
      className={cn(ROW, active && 'bg-secondary')}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{page.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{page.description}</span>
      </span>
      <span className="hidden shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground min-[400px]:block">
        {page.section}
      </span>
    </button>
  );
}
