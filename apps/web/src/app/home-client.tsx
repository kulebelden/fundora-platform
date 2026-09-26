'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, HeartHandshake, ShieldCheck, Wallet } from 'lucide-react';
import { CampaignCard, CampaignCardSkeleton } from '@/components/campaign-card';
import { HeroSection } from '@/components/hero-section';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TrustBanner } from '@/components/trust-banner';
import { Button } from '@/components/ui/button';
import { CURRENCIES } from '@/lib/currency';
import { DISCOVER_CATEGORIES, type DiscoverCategory } from '@/lib/category-data';
import { useCampaigns } from '@/lib/queries';
import { cn } from '@/lib/utils';

const HOW_IT_WORKS = [
  {
    Icon: HeartHandshake,
    title: 'Tell your story',
    body: 'Describe the cause, set a goal and pick your currency. Submit it for review in minutes.',
  },
  {
    Icon: ShieldCheck,
    title: 'Get verified',
    body: 'Clear identity checks once. Verification is what unlocks withdrawals and reassures donors.',
  },
  {
    Icon: Wallet,
    title: 'Withdraw to your bank',
    body: 'Request a payout to any SWIFT or IBAN account. You see the fee and the net amount before you confirm.',
  },
];

export function HomeClient() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(categoryParam);

  React.useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  const { data, isLoading, isError } = useCampaigns(1, 12);
  const campaigns = React.useMemo(() => data?.data ?? [], [data]);

  const categoryOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    campaigns.forEach((campaign) => {
      if (campaign.category?.slug) seen.set(campaign.category.slug, campaign.category.name);
    });
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [campaigns]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const matchesCategory = !activeCategory || campaign.category?.slug === activeCategory;
      const matchesQuery =
        !needle ||
        campaign.title.toLowerCase().includes(needle) ||
        campaign.story.toLowerCase().includes(needle) ||
        `${campaign.creator?.firstName} ${campaign.creator?.lastName}`
          .toLowerCase()
          .includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [campaigns, activeCategory, query]);

  return (
    <>
      <SiteHeader query={query} onQueryChange={setQuery} />

      <main id="main">
        {/* ------------------------------------------------------------ hero */}
        <HeroSection campaigns={campaigns} />

        {/* -------------------------------------------------- featured grid */}
        <section id="featured" className="container scroll-mt-20 py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Causes that need you now
              </h2>
              <p className="mt-2 text-muted-foreground">
                Every campaign here is reviewed before it goes live.
              </p>
            </div>

            <div
              className="flex items-center gap-2 text-xs text-muted-foreground"
              title="Campaigns raise in their own currency; donors can give in theirs."
            >
              <span className="font-semibold uppercase tracking-wide">Currencies</span>
              <div className="flex flex-wrap gap-1">
                {CURRENCIES.slice(0, 5).map((currency) => (
                  <span key={currency.code} className="rounded border px-1.5 py-0.5 font-semibold">
                    {currency.code}
                  </span>
                ))}
                <span className="rounded border px-1.5 py-0.5 font-semibold">+{CURRENCIES.length - 5}</span>
              </div>
            </div>
          </div>

          {categoryOptions.length ? (
            <div className="mt-7 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  !activeCategory
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                All causes
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => setActiveCategory(category.slug)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    activeCategory === category.slug
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-secondary',
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          ) : null}

          {isError && !isLoading ? (
            <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              <strong className="font-semibold">Campaigns are unavailable.</strong> We could
              not reach the HopeNest API. Please try again shortly.
            </p>
          ) : null}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }, (_, index) => <CampaignCardSkeleton key={index} />)
              : visible.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
          </div>

          {!isLoading && !isError && visible.length === 0 ? (
            <div className="mt-10 rounded-xl border border-dashed py-16 text-center">
              {campaigns.length === 0 ? (
                <>
                  <p className="font-semibold">No live campaigns yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Approved campaigns appear here as soon as they go live.
                  </p>
                  <Button variant="success" className="mt-5" asChild>
                    <Link href="/dashboard/campaigns">Start the first one</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-semibold">No campaigns match that search.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different term or clear the category filter.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => {
                      setQuery('');
                      setActiveCategory(null);
                    }}
                  >
                    Clear filters
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </section>

        {/* ----------------------------------------------------- how it works */}
        <section id="how-it-works" className="border-y bg-secondary/40 py-16 scroll-mt-20 sm:py-20">
          <div className="container">
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Raising funds, without the guesswork
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS.map(({ Icon, title, body }, index) => (
                <div key={title} className="relative pl-16">
                  <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-1 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TrustBanner />

        {/* ------------------------------------------------------------- cta */}
        <section className="container pb-8">
          <div className="brand-gradient hero-glow relative overflow-hidden rounded-2xl px-8 py-14 text-center">
            <div className="relative z-10 mx-auto max-w-xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Carry HopeNest in your pocket
              </h2>
              <p className="mt-3 text-white/75">
                Install the app to follow the causes you back and get a push the moment a
                campaign you support reaches its goal.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <PwaInstallButton size="lg" keepWhenUnavailable />
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                  asChild
                >
                  <Link href="/register">Create a free account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
