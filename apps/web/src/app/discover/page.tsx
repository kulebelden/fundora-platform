import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass, Plus, ShieldCheck, Wallet } from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TrustBanner } from '@/components/trust-banner';
import { Button } from '@/components/ui/button';
import { DISCOVER_CATEGORIES } from '@/lib/category-data';
import { cn } from '@/lib/utils';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Discover Causes',
  description:
    'Browse verified HopeNest campaigns by category — medical, emergency, memorial, education, community and more. Every cause is reviewed before it goes live.',
  alternates: { canonical: '/discover' },
};

export default function DiscoverPage() {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          image={HERO_IMAGES.discover}
          variant="centered"
          tone="sky"
          eyebrow="Every cause reviewed before it goes live"
          eyebrowIcon={ShieldCheck}
          title="Find a cause"
          accent="worth backing."
          lead="Pick a category to see live campaigns, what they have raised so far, and who is behind them — or start one of your own in a few minutes."
          crumbs={[{ label: 'Discover' }]}
          primaryCta={{ label: 'Start a Campaign', href: '/create', icon: Plus }}
          secondaryCta={{ label: 'How causes are reviewed', href: '/how-it-works', icon: Compass }}
          highlights={[
            {
              value: `${DISCOVER_CATEGORIES.length}`,
              label: 'Categories, each with its own campaigns',
              icon: Compass,
              tone: 'accent',
            },
            {
              value: '100%',
              label: 'Identity-verified before payout',
              icon: ShieldCheck,
              tone: 'success',
            },
            {
              value: 'Any',
              label: 'Currency — donors give in theirs',
              icon: Wallet,
              tone: 'warm',
            },
          ]}
        />

        <section className="container py-16 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Browse by category
              </h2>
              <p className="mt-2 text-muted-foreground">
                {DISCOVER_CATEGORIES.length} categories, each with its own campaigns, filters and
                fundraising guidance.
              </p>
            </div>
            <Button variant="success" asChild>
              <Link href="/create">
                Start a Campaign
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DISCOVER_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.slug}
                  href={`/discover/${category.slug}`}
                  className="group flex flex-col rounded-xl border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        category.accent,
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="tabular text-xs font-bold text-muted-foreground">
                      {category.stats.active} active
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold transition-colors group-hover:text-accent">
                    {category.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {category.tagline}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {category.subCategories
                      .filter((sub) => sub.slug !== 'all')
                      .slice(0, 3)
                      .map((sub) => (
                        <span
                          key={sub.slug}
                          className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
                        >
                          {sub.label}
                        </span>
                      ))}
                  </div>

                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
                    Explore {category.shortName}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <TrustBanner />
      </main>

      <SiteFooter />
    </>
  );
}
