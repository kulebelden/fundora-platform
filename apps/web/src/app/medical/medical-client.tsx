'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Baby,
  Brain,
  HeartPulse,
  Loader2,
  Megaphone,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PageHero } from '@/components/page-hero';
import { HERO_IMAGES, MEDICAL_HERO_IMAGES } from '@/lib/hero-images';
import { CampaignCard, CampaignCardSkeleton } from '@/components/campaign-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatMoney, formatNumber, fundedPercent } from '@/lib/currency';
import type { CampaignSummary } from '@/lib/types';

export interface MedicalSubCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  campaignCount: number;
  totalRaised: string;
  totalTarget: string;
}

export interface MedicalCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  subCategories: MedicalSubCategory[];
  totalRaised: string;
  totalTarget: string;
  campaignCount: number;
}

const MEDICAL_CATEGORIES: MedicalCategory[] = [
  {
    id: 'cancer',
    name: 'Cancer',
    slug: 'cancer',
    description: 'Chemotherapy, surgery, and research funding',
    icon: 'Activity',
    campaignCount: 142,
    totalRaised: '2845000',
    totalTarget: '5200000',
    subCategories: [
      { id: '1', name: 'Chemotherapy', slug: 'chemotherapy', description: 'Chemotherapy treatment costs', icon: 'Pill', campaignCount: 48, totalRaised: '980000', totalTarget: '1800000' },
      { id: '2', name: 'Surgery', slug: 'surgery', description: 'Cancer surgery funding', icon: 'Stethoscope', campaignCount: 35, totalRaised: '720000', totalTarget: '1400000' },
      { id: '3', name: 'Research', slug: 'research', description: 'Cancer research initiatives', icon: 'Search', campaignCount: 59, totalRaised: '1145000', totalTarget: '2000000' },
    ],
  },
  {
    id: 'surgeries',
    name: 'Surgeries',
    slug: 'surgeries',
    description: 'Emergency procedures, organ transplants, robotic surgeries',
    icon: 'Stethoscope',
    campaignCount: 98,
    totalRaised: '1920000',
    totalTarget: '3800000',
    subCategories: [
      { id: '4', name: 'Emergency', slug: 'emergency', description: 'Emergency surgical procedures', icon: 'Activity', campaignCount: 32, totalRaised: '680000', totalTarget: '1400000' },
      { id: '5', name: 'Transplants', slug: 'transplants', description: 'Organ transplant funding', icon: 'HeartPulse', campaignCount: 18, totalRaised: '540000', totalTarget: '1200000' },
      { id: '6', name: 'Robotic', slug: 'robotic', description: 'Robotic surgery programs', icon: 'Search', campaignCount: 48, totalRaised: '700000', totalTarget: '1200000' },
    ],
  },
  {
    id: 'dental',
    name: 'Dental',
    slug: 'dental',
    description: 'Reconstructive care, implants, and orthopedics',
    icon: 'HeartPulse',
    campaignCount: 67,
    totalRaised: '890000',
    totalTarget: '1600000',
    subCategories: [
      { id: '7', name: 'Implants', slug: 'implants', description: 'Dental implant costs', icon: 'Pill', campaignCount: 28, totalRaised: '380000', totalTarget: '720000' },
      { id: '8', name: 'Reconstructive', slug: 'reconstructive', description: 'Reconstructive dental surgery', icon: 'Stethoscope', campaignCount: 22, totalRaised: '290000', totalTarget: '540000' },
      { id: '9', name: 'Orthodontics', slug: 'orthodontics', description: 'Braces and orthodontics', icon: 'Search', campaignCount: 17, totalRaised: '220000', totalTarget: '340000' },
    ],
  },
  {
    id: 'mental-health',
    name: 'Mental Health',
    slug: 'mental-health',
    description: 'Therapy programs, long-term care, PTSD support',
    icon: 'Brain',
    campaignCount: 113,
    totalRaised: '1560000',
    totalTarget: '3100000',
    subCategories: [
      { id: '10', name: 'Therapy', slug: 'therapy', description: 'Therapy program funding', icon: 'Users', campaignCount: 41, totalRaised: '520000', totalTarget: '1100000' },
      { id: '11', name: 'PTSD', slug: 'ptsd', description: 'PTSD support programs', icon: 'Activity', campaignCount: 29, totalRaised: '380000', totalTarget: '800000' },
      { id: '12', name: 'Long-term', slug: 'long-term', description: 'Long-term mental health care', icon: 'HeartPulse', campaignCount: 43, totalRaised: '660000', totalTarget: '1200000' },
    ],
  },
  {
    id: 'fertility',
    name: 'Fertility',
    slug: 'fertility',
    description: 'IVF, surrogacy, and maternal healthcare',
    icon: 'Baby',
    campaignCount: 56,
    totalRaised: '1120000',
    totalTarget: '2400000',
    subCategories: [
      { id: '13', name: 'IVF', slug: 'ivf', description: 'IVF treatment costs', icon: 'Pill', campaignCount: 24, totalRaised: '480000', totalTarget: '1200000' },
      { id: '14', name: 'Surrogacy', slug: 'surrogacy', description: 'Surrogacy arrangement costs', icon: 'Baby', campaignCount: 14, totalRaised: '320000', totalTarget: '700000' },
      { id: '15', name: 'Maternal', slug: 'maternal', description: 'Maternal healthcare programs', icon: 'HeartPulse', campaignCount: 18, totalRaised: '320000', totalTarget: '500000' },
    ],
  },
  {
    id: 'chronic-care',
    name: 'Chronic Care',
    slug: 'chronic-care',
    description: 'Long-term disability, physiotherapy, rare disease management',
    icon: 'Activity',
    campaignCount: 89,
    totalRaised: '1340000',
    totalTarget: '2900000',
    subCategories: [
      { id: '16', name: 'Physiotherapy', slug: 'physiotherapy', description: 'Physiotherapy programs', icon: 'Stethoscope', campaignCount: 33, totalRaised: '420000', totalTarget: '980000' },
      { id: '17', name: 'Rare Disease', slug: 'rare-disease', description: 'Rare disease management', icon: 'Search', campaignCount: 26, totalRaised: '360000', totalTarget: '820000' },
      { id: '18', name: 'Disability', slug: 'disability', description: 'Long-term disability support', icon: 'Users', campaignCount: 30, totalRaised: '560000', totalTarget: '1100000' },
    ],
  },
  {
    id: 'clinical-trials',
    name: 'Clinical Trials',
    slug: 'clinical-trials',
    description: 'Experimental treatments and specialized medical travel',
    icon: 'Search',
    campaignCount: 41,
    totalRaised: '670000',
    totalTarget: '1500000',
    subCategories: [
      { id: '19', name: 'Experimental', slug: 'experimental', description: 'Experimental treatment access', icon: 'Pill', campaignCount: 19, totalRaised: '280000', totalTarget: '720000' },
      { id: '20', name: 'Travel', slug: 'travel', description: 'Medical travel assistance', icon: 'HeartPulse', campaignCount: 22, totalRaised: '390000', totalTarget: '780000' },
    ],
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Activity,
  ArrowRight,
  Baby,
  Brain,
  HeartPulse,
  Loader2,
  Megaphone,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet,
};

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accent)}>
        <ShieldCheck className="h-5 w-5" />
      </span>
      <div>
        <p className="tabular text-lg font-extrabold">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function CategoryHero({ category }: { category: MedicalCategory }) {
  const percent = fundedPercent(category.totalRaised, category.totalTarget);
  const Icon = ICON_MAP[category.icon] ?? Activity;

  return (
    <section className="brand-gradient hero-glow relative overflow-hidden rounded-2xl border-0">
      <div className="relative z-10 p-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 text-white backdrop-blur">
                <Icon className="h-3.5 w-3.5" />
                {category.name}
              </Badge>
              <Badge variant="outline" className="border-white/25 text-white">
                0% Platform Fee
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                <Megaphone className="h-3 w-3" />
                Urgent Needs
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {category.description}
            </p>

            <div className="mt-6 max-w-xl">
              <div className="flex items-baseline justify-between text-white">
                <span className="tabular text-2xl font-extrabold">
                  {formatMoney(category.totalRaised, 'USD', { hideFraction: true })}
                </span>
                <span className="tabular text-sm text-white/60">
                  of {formatMoney(category.totalTarget, 'USD', { hideFraction: true })}
                </span>
              </div>
              <Progress value={percent} className="mt-2.5 h-2.5 bg-white/15" />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="tabular font-bold text-success">{Math.round(percent)}% funded</span>
                <span className="text-white/60">{category.campaignCount} active campaigns</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <div className="flex items-center gap-3">
              <StatTile label="Campaigns" value={String(category.campaignCount)} accent="bg-white/15 text-white" />
              <StatTile label="Raised" value={formatMoney(category.totalRaised, 'USD', { compact: true })} accent="bg-success/20 text-success" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubCategoryCard({ sub }: { sub: MedicalSubCategory }) {
  const percent = fundedPercent(sub.totalRaised, sub.totalTarget);
  const Icon = ICON_MAP[sub.icon] ?? Activity;

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <Link
        href={`/medical/${sub.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="brand-gradient flex h-full w-full items-center justify-center">
          <Icon className="h-12 w-12 text-white/30" />
        </div>
        <div className="absolute left-3 top-3">
          <Badge className="bg-background/95 text-foreground shadow-sm">{sub.name}</Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/medical/${sub.slug}`} className="focus-visible:outline-none">
          <h3 className="line-clamp-1 text-base font-bold leading-snug transition-colors group-hover:text-accent">
            {sub.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{sub.description}</p>

        <div className="mt-auto pt-4">
          <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} />
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="tabular text-sm">
              <span className="font-bold text-success">
                {formatMoney(sub.totalRaised, 'USD', { hideFraction: true })}
              </span>{' '}
              <span className="text-muted-foreground">
                of {formatMoney(sub.totalTarget, 'USD', { hideFraction: true })}
              </span>
            </p>
            <span className="tabular shrink-0 text-xs font-bold text-success">{Math.round(percent)}%</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{sub.campaignCount} campaigns</p>
        </div>
      </div>
    </Card>
  );
}

function CampaignGrid({ campaigns }: { campaigns: CampaignSummary[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <p className="font-semibold">No campaigns in this category yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Check back soon for new causes.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

export function MedicalHubClient({
  categorySlug,
  subCategorySlug,
  initialCampaigns,
}: {
  categorySlug?: string;
  subCategorySlug?: string;
  initialCampaigns?: CampaignSummary[];
}) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(categorySlug ?? null);
  const [activeSub, setActiveSub] = React.useState<string | null>(subCategorySlug ?? null);
  const [query, setQuery] = React.useState('');

  const selectedCategory = React.useMemo(
    () => MEDICAL_CATEGORIES.find((c) => c.slug === activeCategory) ?? null,
    [activeCategory],
  );

  const selectedSub = React.useMemo(() => {
    if (!selectedCategory) return null;
    return selectedCategory.subCategories.find((s) => s.slug === activeSub) ?? null;
  }, [selectedCategory, activeSub]);

  const displayCampaigns = initialCampaigns ?? [];

  return (
    <>
      <SiteHeader query={query} onQueryChange={setQuery} />

      <main id="main">
        {/* -------------------------------------------------- hero */}
        <PageHero
          variant="aurora"
          tone="emerald"
          image={(categorySlug && MEDICAL_HERO_IMAGES[categorySlug]) || HERO_IMAGES.medical}
          eyebrow="Medical causes · 0% platform fee"
          eyebrowIcon={HeartPulse}
          title="Health. Healing."
          accent="Hope."
          lead="Fund critical medical care, research, and support for people who need it most. Every campaign is identity-verified before it goes live."
          crumbs={[
            { label: 'Discover', href: '/discover' },
            { label: 'Medical' },
          ]}
          primaryCta={{ label: 'Start a Medical Campaign', href: '/dashboard/campaigns' }}
          secondaryCta={{ label: 'Browse causes', href: '#categories', icon: Search }}
          highlights={[
            { value: '606', label: 'Medical campaigns', icon: HeartPulse, tone: 'success' },
            { value: '$8.5M', label: 'Total raised', icon: Wallet, tone: 'warm' },
            { value: '100%', label: 'Verified causes', icon: ShieldCheck },
            { value: '0%', label: 'Platform fee', icon: Megaphone, tone: 'accent' },
          ]}
        />

        {/* ------------------------------------------- category nav */}
        <section id="categories" className="container scroll-mt-20 py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Medical categories
              </h2>
              <p className="mt-2 text-muted-foreground">
                Select a category to see active campaigns and sub-categories.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setActiveCategory(null); setActiveSub(null); }}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                !activeCategory
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-secondary',
              )}
            >
              All medical
            </button>
            {MEDICAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setActiveCategory(cat.slug); setActiveSub(null); }}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  activeCategory === cat.slug
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* ------------------------------------- category hero + subs */}
        {selectedCategory ? (
          <section className="container scroll-mt-20 pb-12">
            <CategoryHero category={selectedCategory} />

            <div className="mt-10">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">Sub-categories</h3>
                {selectedCategory.subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveSub(sub.slug)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      activeSub === sub.slug
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-secondary',
                    )}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>

              {selectedSub ? (
                <div className="mt-6">
                  <div className="rounded-xl border p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold">{selectedSub.name}</h4>
                        <p className="text-sm text-muted-foreground">{selectedSub.description}</p>
                      </div>
                      <div className="tabular text-right">
                        <p className="text-sm font-bold text-success">
                          {formatMoney(selectedSub.totalRaised, 'USD', { hideFraction: true })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of {formatMoney(selectedSub.totalTarget, 'USD', { hideFraction: true })}
                        </p>
                      </div>
                    </div>
                    <Progress value={fundedPercent(selectedSub.totalRaised, selectedSub.totalTarget)} className="mt-3" />
                    <p className="mt-2 text-xs text-muted-foreground">{selectedSub.campaignCount} campaigns</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ----------------------------------------- campaigns grid */}
        <section className="container scroll-mt-20 pb-16 sm:pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {selectedSub ? selectedSub.name : selectedCategory ? `${selectedCategory.name} campaigns` : 'Active campaigns'}
            </h2>
            <span className="text-sm text-muted-foreground">{displayCampaigns.length} found</span>
          </div>

          <div className="mt-8">
            <CampaignGrid campaigns={displayCampaigns} />
          </div>

          {displayCampaigns.length === 0 ? (
            <div className="mt-10 rounded-xl border border-dashed py-16 text-center">
              <p className="font-semibold">No campaigns match your filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different category or check back later.</p>
            </div>
          ) : null}
        </section>

        {/* -------------------------------------- all categories grid */}
        {!selectedCategory && (
          <section className="container scroll-mt-20 pb-16 sm:pb-20">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">All medical categories</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {MEDICAL_CATEGORIES.map((cat) => {
                const percent = fundedPercent(cat.totalRaised, cat.totalTarget);
                const Icon = ICON_MAP[cat.icon] ?? Activity;
                return (
                  <Link
                    key={cat.id}
                    href={`/medical/${cat.slug}`}
                    className="group flex flex-col rounded-xl border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-bold">{cat.name}</h3>
                          <p className="text-xs text-muted-foreground">{cat.campaignCount} campaigns</p>
                        </div>
                      </div>
                      <span className="tabular text-sm font-bold text-success">{Math.round(percent)}%</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p>
                    <div className="mt-4">
                      <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} />
                      <div className="mt-2 flex items-baseline justify-between">
                        <p className="tabular text-xs text-muted-foreground">
                          {formatMoney(cat.totalRaised, 'USD', { hideFraction: true })} raised
                        </p>
                        <p className="tabular text-xs text-muted-foreground">
                          goal {formatMoney(cat.totalTarget, 'USD', { hideFraction: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
