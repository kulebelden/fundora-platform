'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { CampaignCardSkeleton } from '@/components/campaign-card';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatsTicker } from '@/components/stats-ticker';
import type { CampaignSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

function MiniCampaignCard({ campaign }: { campaign: CampaignSummary }) {
  return (
    <Card className="relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
      <Link
        href={`/campaigns/${campaign.slug}`}
        className="group block aspect-[8/5] overflow-hidden"
      >
        {campaign.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- decorative mini card image
          <img
            src={campaign.coverImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="brand-gradient flex h-full w-full items-center justify-center">
            <span className="px-3 text-center text-[9px] font-semibold text-white/85">
              {campaign.title}
            </span>
          </div>
        )}
      </Link>
      <div className="p-2.5">
        <Link href={`/campaigns/${campaign.slug}`} className="block">
          <h3 className="line-clamp-1 text-[10px] font-bold leading-tight text-white group-hover:text-accent">
            {campaign.title}
          </h3>
        </Link>
        <div className="mt-1 line-clamp-1 text-[8px] leading-tight text-white/50">
          {campaign.creator?.firstName} {campaign.creator?.lastName} •{' '}
          {campaign.currency}
        </div>
      </div>
    </Card>
  );
}

export function HeroSection({ campaigns }: { campaigns: CampaignSummary[] }) {
  const orbitCards = campaigns.slice(0, 4);

  return (
    <section className="hero-backdrop hero-glow relative overflow-hidden">
      <div className="container relative z-10 grid pb-12 pt-6 sm:pb-16 sm:pt-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-20 lg:pt-10">
        {/* ----------------------- brand + badge + headline + CTAs */}
        <div className="lg:col-span-6 lg:pt-2">
          <Badge className="mb-5 border-white/20 bg-white/10 text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified causes · Auditable funds
          </Badge>

          <h1 className="max-w-xl text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Real People.
            <br />
            Real Causes.
            <br />
            <span className="text-success">Greater Impact.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
            HopeNest turns everyday generosity into verified, traceable help. Give to a cause today,
            or raise for one of your own and withdraw straight to your bank.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
            <Button size="lg" variant="success" asChild>
              <Link href="/dashboard/campaigns">
                Start a Campaign
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              asChild
            >
              <Link href="/discover">
                <Search className="h-4 w-4" />
                Discover causes
              </Link>
            </Button>
            <PwaInstallButton size="lg" className="sm:ml-auto" />
          </div>
        </div>

        {/* ----------------------- orbiting campaign cards */}
        {/* The ring is absolutely positioned, so the column needs its own height. */}
        {orbitCards.length ? (
        <div className="relative mt-12 h-[21rem] sm:h-[24rem] lg:col-span-6 lg:mt-0 lg:h-[28rem]">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-64 w-64 flex-shrink-0 scale-[0.82] items-center justify-center min-[380px]:scale-90 sm:h-72 sm:w-72 sm:scale-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-full rounded-full border border-white/10" />
              </div>

              {orbitCards.map((campaign, index) => {
                const angle = (index * 360) / Math.max(orbitCards.length, 1);
                const radius = 120;
                const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
                const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;

                return (
                  <div
                    key={campaign.id}
                    className={cn(
                      'hero-orbit absolute w-28 sm:w-32',
                      index === 0 ? 'delay-1' : index === 1 ? 'delay-2' : 'delay-3',
                    )}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    <MiniCampaignCard campaign={campaign} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        ) : null}
      </div>

      {/* ----------------------- trust bar */}
      <div className="relative z-10 border-t border-white/15 bg-black/20 backdrop-blur-sm">
        <div className="container py-7 sm:py-9">
          <StatsTicker />
        </div>
      </div>

    </section>
  );
}

export function HeroSectionSkeleton() {
  return (
    <section className="hero-backdrop relative overflow-hidden">
      <div className="container relative z-10 grid pb-12 pt-6 sm:pb-16 sm:pt-8 lg:grid-cols-12 lg:gap-12 lg:pb-20 lg:pt-10">
        <div className="lg:col-span-6 lg:pt-2">
          <Badge className="mb-5 border-white/20 bg-white/10 text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified causes · Auditable funds
          </Badge>
          <div className="mt-6 h-10 w-4/5 animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-10 w-4/5 animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-10 w-3/5 animate-pulse rounded bg-white/15" />
          <div className="mt-6 h-5 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <div className="h-12 w-full animate-pulse rounded-xl bg-success/30 sm:w-48" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-white/15 sm:ml-3 sm:w-40" />
          </div>
        </div>

        <div className="mt-16 h-64 w-full animate-pulse rounded-xl bg-white/5 lg:col-span-6 lg:mt-0" />
      </div>

      <div className="container relative z-10 border-t border-white/15 py-9">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
