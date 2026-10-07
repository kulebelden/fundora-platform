'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Compass, Search, SearchX } from 'lucide-react';
import { CampaignCard, CampaignCardSkeleton } from '@/components/campaign-card';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api';
import { DISCOVER_CATEGORIES } from '@/lib/category-data';
import { formatNumber } from '@/lib/currency';
import { useCampaignSearch } from '@/lib/queries';
import { searchPages } from '@/lib/site-search';

const PAGE_SIZE = 12;

/** Full results for `/search?q=`: matching pages first, then every matching live campaign. */
export function SearchResultsClient() {
  const router = useRouter();
  const params = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [draft, setDraft] = React.useState(query);
  React.useEffect(() => setDraft(query), [query]);

  const campaigns = useCampaignSearch(query, PAGE_SIZE, page);
  const pages = React.useMemo(() => searchPages(query, 8), [query]);
  const rows = query.length >= 2 ? (campaigns.data?.data ?? []) : [];
  const meta = query.length >= 2 ? campaigns.data?.meta : undefined;
  const loading = query.length >= 2 && campaigns.isLoading;

  const goTo = (next: { q?: string; page?: number }) => {
    const search = new URLSearchParams();
    const q = (next.q ?? query).trim();
    if (q) search.set('q', q);
    if (next.page && next.page > 1) search.set('page', String(next.page));
    router.push(`/search?${search.toString()}`);
  };

  return (
    <>
      <SiteHeader />

      <main id="main" className="container pb-12 pt-6 sm:pt-10">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            goTo({ q: draft, page: 1 });
          }}
          className="relative max-w-2xl"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search campaigns, causes, pages…"
            aria-label="Search HopeNest"
            enterKeyHint="search"
            maxLength={100}
            className="h-14 w-full rounded-2xl border border-input bg-background pl-12 pr-28 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
            Search
          </Button>
        </form>

        {!query ? (
          <EmptyPrompt />
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Results for “{query}”
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? 'Searching…'
                : `${formatNumber(meta?.total ?? 0)} ${meta?.total === 1 ? 'campaign' : 'campaigns'} · ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`}
            </p>

            {pages.length ? (
              <section aria-label="Pages" className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pages</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {pages.map((result) => (
                    <li key={result.href}>
                      <Link
                        href={result.href}
                        className="flex h-full items-start gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                          <result.icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{result.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {result.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-label="Campaigns" className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaigns</h2>
              {query.length < 2 ? (
                <p className="mt-3 text-sm text-muted-foreground">Type at least two characters to search campaigns.</p>
              ) : loading ? (
                <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <CampaignCardSkeleton key={i} />
                  ))}
                </div>
              ) : campaigns.isError ? (
                <p className="mt-3 text-sm text-destructive">{apiErrorMessage(campaigns.error)}</p>
              ) : rows.length ? (
                <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed px-6 py-12 text-center">
                  <SearchX className="mx-auto h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-3 font-semibold">No live campaigns match “{query}”</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try fewer words, or browse by cause below.</p>
                  <CategoryChips className="mt-5 justify-center" />
                </div>
              )}

              {meta && meta.totalPages > 1 ? (
                <nav aria-label="Result pages" className="mt-8 flex items-center justify-between gap-3">
                  <Button variant="outline" disabled={page <= 1} onClick={() => goTo({ page: page - 1 })}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {meta.totalPages}
                  </span>
                  <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => goTo({ page: page + 1 })}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              ) : null}
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}

function CategoryChips({ className }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {DISCOVER_CATEGORIES.slice(0, 8).map((category) => (
        <Link
          key={category.slug}
          href={`/discover/${category.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary"
        >
          <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
          {category.shortName}
        </Link>
      ))}
    </div>
  );
}

function EmptyPrompt() {
  return (
    <div className="mt-10 max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Search HopeNest</h1>
      <p className="mt-2 text-muted-foreground">Find a campaign by cause, place or organiser, or jump to any page.</p>
      <p className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Compass className="h-4 w-4" />
        Browse causes
      </p>
      <CategoryChips className="mt-3" />
    </div>
  );
}
