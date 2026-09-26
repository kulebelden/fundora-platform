'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, Mail, Phone, Search, ShieldCheck, Sprout, Umbrella } from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatMoney, fundedPercent } from '@/lib/currency';
import type { CampaignSummary } from '@/lib/types';
import { HERO_IMAGES } from '@/lib/hero-images';

interface PersonalCampaign {
  id: string;
  title: string;
  category: string;
  creator: string;
  raised: string;
  target: string;
  status: 'active' | 'completed' | 'pending';
}

const PERSONAL_CAMPAIGNS: PersonalCampaign[] = [
  { id: 'p1', title: 'Help Sarah Recover from Surgery', category: 'Medical Hardship', creator: 'James M.', raised: '4200', target: '8000', status: 'active' },
  { id: 'p2', title: 'Memorial for Grandma Rose', category: 'Memorial', creator: 'The Family', raised: '6800', target: '5000', status: 'completed' },
  { id: 'p3', title: 'Emergency Vet Fund for Max', category: 'Pet Care', creator: 'Lisa T.', raised: '1900', target: '3000', status: 'active' },
  { id: 'p4', title: 'Funeral Expenses for Uncle John', category: 'Funeral', creator: 'Michael R.', raised: '5200', target: '6000', status: 'active' },
  { id: 'p5', title: 'Family Hardship After Fire', category: 'Family Hardship', creator: 'The Nguyens', raised: '11200', target: '15000', status: 'active' },
  { id: 'p6', title: 'Wedding Fund for Daughter', category: 'Life Event', creator: 'Patricia K.', raised: '3400', target: '10000', status: 'active' },
];

const GENTLE_COLORS = [
  'from-emerald-900/30 to-slate-900',
  'from-teal-900/30 to-slate-900',
  'from-amber-900/20 to-slate-900',
  'from-slate-800/40 to-slate-900',
  'from-emerald-800/20 to-slate-900',
  'from-teal-800/20 to-slate-900',
];

function GentleCard({ campaign, color }: { campaign: PersonalCampaign; color: string }) {
  const percent = fundedPercent(campaign.raised, campaign.target);

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="relative block aspect-[8/5] overflow-hidden bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className={cn('absolute inset-0 bg-gradient-to-br', color)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="h-16 w-16 text-white/10" />
        </div>
        <div className="absolute left-3 top-3">
          <Badge className="bg-background/95 text-foreground shadow-sm">{campaign.category}</Badge>
        </div>
        {campaign.status === 'completed' && (
          <Badge className="absolute right-3 top-3 bg-success/20 text-success border-success/30">
            <ShieldCheck className="h-3 w-3" />
            Completed
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/campaigns/${campaign.id}`} className="focus-visible:outline-none">
          <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-accent">
            {campaign.title}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">by {campaign.creator}</p>

        <div className="mt-auto pt-4">
          <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} />
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="tabular text-sm">
              <span className="font-bold text-success">{formatMoney(campaign.raised, 'USD', { hideFraction: true })}</span>
              {' '}
              <span className="text-muted-foreground">
                of {formatMoney(campaign.target, 'USD', { hideFraction: true })}
              </span>
            </p>
            <span className="tabular shrink-0 text-xs font-bold text-success">{Math.round(percent)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PersonalPageClient({ campaigns }: { campaigns?: CampaignSummary[] }) {
  const [category, setCategory] = React.useState<string>('all');

  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    PERSONAL_CAMPAIGNS.forEach((c) => seen.add(c.category));
    return Array.from(seen);
  }, []);

  const filtered = React.useMemo(() => {
    if (category === 'all') return PERSONAL_CAMPAIGNS;
    return PERSONAL_CAMPAIGNS.filter((c) => c.category === category);
  }, [category]);

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          image={HERO_IMAGES.personal}
          variant="split"
          tone="amber"
          eyebrow="Compassion in Action"
          eyebrowIcon={Heart}
          title="Real people, real support,"
          accent="real love."
          lead="Fund funeral expenses, pet care, family hardship, and life's milestone moments. A gentle space to give and be given to."
          crumbs={[
            { label: 'Discover', href: '/discover' },
            { label: 'Personal causes' },
          ]}
          primaryCta={{ label: 'Start a Personal Campaign', href: '/dashboard/campaigns' }}
          secondaryCta={{ label: 'Browse causes', href: '#causes', icon: Search }}
          highlights={[
            { value: '9,420', label: 'Campaigns', icon: Heart, tone: 'success' },
            { value: '$4.2M', label: 'Raised', icon: Sprout, tone: 'warm' },
            { value: '100%', label: 'Verified organisers', icon: ShieldCheck },
            { value: '24/7', label: 'Support', icon: Umbrella, tone: 'accent' },
          ]}
        />

        <section id="causes" className="container scroll-mt-20 py-12">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                category === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-secondary',
              )}
            >
              All causes
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  category === cat
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section className="container scroll-mt-20 pb-16 sm:pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((campaign, index) => (
              <GentleCard key={campaign.id} campaign={campaign} color={GENTLE_COLORS[index % GENTLE_COLORS.length]} />
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-10 rounded-xl border border-dashed py-16 text-center">
              <p className="font-semibold">No campaigns in this category yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to start one.</p>
              <Button variant="success" className="mt-5" asChild>
                <Link href="/dashboard/campaigns">Start a campaign</Link>
              </Button>
            </div>
          ) : null}
        </section>

        <section className="border-y bg-secondary/40 py-16">
          <div className="container">
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Need support? We're here for you.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { Icon: Mail, title: 'Email Support', body: 'support@hopenest.org — We respond within 24 hours.' },
                { Icon: Phone, title: 'Hotline', body: '+1-800-HOPENEST — Available Mon–Sat, 8am–8pm EST.' },
                { Icon: Heart, title: 'Condolence Messages', body: 'Share words of comfort with families in our memorial community.' },
              ].map(({ Icon, title, body }) => (
                <Card key={title} className="p-6 text-center">
                  <Icon className="mx-auto h-8 w-8 text-emerald-500" />
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
