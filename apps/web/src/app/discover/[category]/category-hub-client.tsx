'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, HeartHandshake, Plus, Search, ShieldCheck, TrendingUp, Users, X } from 'lucide-react';
import { CampaignCard, CampaignCardSkeleton } from '@/components/campaign-card';
import { FaqAccordion } from '@/components/faq-accordion';
import { PageHero, type PageHeroTone, type PageHeroVariant } from '@/components/page-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatNumber } from '@/lib/currency';
import {
  categoryMatchSlugs,
  relatedCategories,
  resolveCategory,
  SORT_OPTIONS,
  type SortOption,
} from '@/lib/category-data';
import { CATEGORY_HERO_IMAGES } from '@/lib/hero-images';
import { useCampaigns } from '@/lib/queries';
import type { CampaignSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Pulled once and filtered on the client; the list endpoint takes no category param. */
const PAGE_SIZE = 48;

/** Accent colour per category, so the hubs don't all share one green hero. */
const CATEGORY_TONES: Record<string, PageHeroTone> = {
  medical: 'emerald',
  emergency: 'amber',
  memorial: 'sky',
  education: 'sky',
  community: 'emerald',
  creative: 'amber',
  animals: 'amber',
  housing: 'sky',
  environment: 'emerald',
  personal: 'amber',
};

/** Layout per category; anything not listed gets the default aurora hero. */
const CATEGORY_VARIANTS: Record<string, PageHeroVariant> = {
  emergency: 'signal',
  memorial: 'centered',
  education: 'split',
  environment: 'split',
  housing: 'editorial',
};

function toNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentFunded(campaign: CampaignSummary): number {
  const target = toNumber(campaign.targetAmount);
  if (target <= 0) return 0;
  return (toNumber(campaign.raisedAmount) / target) * 100;
}

function endsAt(campaign: CampaignSummary): number {
  const end = campaign.endDate ? new Date(campaign.endDate).getTime() : NaN;
  // Open-ended campaigns are never "urgent"; park them after every dated one.
  return Number.isFinite(end) ? end : Number.POSITIVE_INFINITY;
}

function createdAt(campaign: CampaignSummary): number {
  const created = new Date(campaign.createdAt).getTime();
  return Number.isFinite(created) ? created : 0;
}

function sortCampaigns(campaigns: CampaignSummary[], sort: SortOption): CampaignSummary[] {
  const sorted = [...campaigns];
  switch (sort) {
    case 'urgent':
      return sorted.sort((a, b) => endsAt(a) - endsAt(b));
    case 'near-goal':
      // A campaign already past its goal no longer needs the spotlight, so the
      // ranking is on the remaining gap rather than raw percentage.
      return sorted.sort((a, b) => {
        const gapA = percentFunded(a) >= 100 ? -1 : percentFunded(a);
        const gapB = percentFunded(b) >= 100 ? -1 : percentFunded(b);
        return gapB - gapA;
      });
    case 'top-funded':
      return sorted.sort((a, b) => toNumber(b.raisedAmount) - toNumber(a.raisedAmount));
    case 'recent':
    default:
      return sorted.sort((a, b) => createdAt(b) - createdAt(a));
  }
}

export function CategoryHubClient({ slug }: { slug: string }) {
  const category = React.useMemo(() => resolveCategory(slug), [slug]);
  const Icon = category.icon;

  const [query, setQuery] = React.useState('');
  const [activeSub, setActiveSub] = React.useState('all');
  const [sort, setSort] = React.useState<SortOption>('urgent');

  // A different slug means a different hub; reset the filter state with it.
  React.useEffect(() => {
    setQuery('');
    setActiveSub('all');
    setSort('urgent');
  }, [slug]);

  const { data, isLoading, isError } = useCampaigns(1, PAGE_SIZE);

  const inCategory = React.useMemo(() => {
    const owned = new Set(categoryMatchSlugs(category));
    return (data?.data ?? []).filter((campaign) => owned.has(campaign.category?.slug ?? ''));
  }, [data, category]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = inCategory.filter((campaign) => {
      const matchesSub = activeSub === 'all' || campaign.category?.slug === activeSub;
      const matchesQuery =
        !needle ||
        campaign.title.toLowerCase().includes(needle) ||
        campaign.story.toLowerCase().includes(needle) ||
        `${campaign.creator?.firstName ?? ''} ${campaign.creator?.lastName ?? ''}`
          .toLowerCase()
          .includes(needle);
      return matchesSub && matchesQuery;
    });
    return sortCampaigns(filtered, sort);
  }, [inCategory, activeSub, query, sort]);

  const hasFilters = query.trim().length > 0 || activeSub !== 'all';
  const createHref = `/create?category=${encodeURIComponent(category.slug)}`;
  const related = React.useMemo(() => relatedCategories(category.slug), [category.slug]);

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* ------------------------------------------------------ hero */}
        <PageHero
          variant={CATEGORY_VARIANTS[category.slug] ?? 'aurora'}
          tone={CATEGORY_TONES[category.slug] ?? 'emerald'}
          image={CATEGORY_HERO_IMAGES[category.slug] ?? CATEGORY_HERO_IMAGES.community}
          eyebrow={category.badge}
          eyebrowIcon={Icon}
          icon={Icon}
          title={category.title}
          accent="Fundraising"
          lead={category.tagline}
          crumbs={[
            { label: 'Discover', href: '/discover' },
            { label: category.title },
          ]}
          primaryCta={{
            label: `Start a ${category.shortName} Campaign`,
            href: createHref,
            icon: Plus,
          }}
          secondaryCta={{ label: 'How it works', href: '/how-it-works', icon: ShieldCheck }}
          highlights={[
            { value: category.stats.raised, label: 'Total raised', icon: TrendingUp, tone: 'success' },
            { value: category.stats.donors, label: 'Global donors', icon: Users, tone: 'accent' },
            { value: category.stats.active, label: 'Active campaigns', icon: HeartHandshake, tone: 'warm' },
          ]}
        />

        {/* -------------------------------------------- filters + grid */}
        <section className="container py-12 sm:py-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${category.shortName.toLowerCase()} campaigns…`}
                aria-label={`Search within ${category.title}`}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="shrink-0 text-sm font-semibold text-muted-foreground">
                Sort by
              </label>
              <Select
                id="sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="w-48"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div
            className="mt-5 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label={`${category.title} sub-categories`}
          >
            {category.subCategories.map((sub) => {
              const isActive = activeSub === sub.slug;
              return (
                <button
                  key={sub.slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveSub(sub.slug)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-secondary',
                  )}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {activeSub === 'all'
                ? `${category.shortName} campaigns`
                : category.subCategories.find((sub) => sub.slug === activeSub)?.label}
            </h2>
            {!isLoading && !isError ? (
              <p className="text-sm text-muted-foreground">
                {formatNumber(visible.length)} {visible.length === 1 ? 'campaign' : 'campaigns'}
                {hasFilters ? ' match your filters' : ' live now'}
              </p>
            ) : null}
          </div>

          {isError && !isLoading ? (
            <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              <strong className="font-semibold">Campaigns are unavailable.</strong> We could not
              reach the HopeNest API. Please try again shortly.
            </p>
          ) : null}

          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }, (_, index) => <CampaignCardSkeleton key={index} />)
              : visible.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
          </div>

          {!isLoading && !isError && visible.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed py-16 text-center">
              {hasFilters ? (
                <>
                  <p className="font-semibold">No campaigns match your filters.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a broader sub-category, or clear the search.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => {
                      setQuery('');
                      setActiveSub('all');
                    }}
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-semibold">
                    No live {category.shortName.toLowerCase()} campaigns yet.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Approved campaigns appear here as soon as they go live.
                  </p>
                  <Button variant="success" className="mt-5" asChild>
                    <Link href={createHref}>Start the first one</Link>
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </section>

        {/* ------------------------------------------------- faq + trust */}
        <section className="border-y bg-secondary/40 py-16 sm:py-20">
          <div className="container grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Before you start
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {category.shortName} fundraising, answered
              </h2>
              <p className="mt-3 text-muted-foreground">
                The questions organisers and donors ask most about {category.shortName.toLowerCase()}{' '}
                causes on HopeNest.
              </p>

              <Card className="mt-7 p-5">
                <p className="text-sm font-bold">Still deciding?</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Starting a campaign costs nothing and commits you to nothing. You can save the
                  story and publish it once verification clears.
                </p>
                <Button variant="success" className="mt-4 w-full" asChild>
                  <Link href={createHref}>
                    Start a {category.shortName} Campaign
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </div>

            <FaqAccordion items={category.faqs} idPrefix={`faq-${category.slug}`} />
          </div>
        </section>

        {/* ------------------------------------------ related categories */}
        <section className="container py-16 sm:py-20">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Browse other categories
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((other) => {
              const OtherIcon = other.icon;
              return (
                <Link
                  key={other.slug}
                  href={`/discover/${other.slug}`}
                  className="group rounded-xl border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl',
                      other.accent,
                    )}
                  >
                    <OtherIcon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-bold transition-colors group-hover:text-accent">
                    {other.shortName}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {other.tagline}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
