'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { CampaignCardSkeleton } from '@/components/campaign-card';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsTicker } from '@/components/stats-ticker';

export function HeroSection() {
  return (
    <section className="hero-backdrop hero-glow relative overflow-hidden">
      <div className="container relative z-10 grid pb-10 pt-6 sm:pb-16 sm:pt-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-20 lg:pt-10">
        {/* ----------------------- brand + badge + headline + CTAs */}
        <div className="lg:col-span-6 lg:pt-2">
          <Badge className="mb-4 border-white/20 bg-white/10 text-white backdrop-blur sm:mb-5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified causes · Auditable funds
          </Badge>

          <h1 className="max-w-xl text-[2.25rem] font-extrabold leading-[1.06] tracking-tight text-white min-[400px]:text-[2.5rem] sm:text-5xl sm:leading-[1.05] md:text-6xl">
            Real People.
            <br />
            Real Causes.
            <br />
            <span className="text-success">Greater Impact.</span>
          </h1>

          <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
            HopeNest turns everyday generosity into verified, traceable help. Give to a cause today,
            or raise for one of your own and withdraw straight to your bank.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
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

      </div>

      {/* ----------------------- trust bar */}
      <div className="relative z-10 border-t border-white/15 bg-black/20 backdrop-blur-sm">
        <div className="container py-6 sm:py-9">
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

        <div className="hidden h-64 w-full animate-pulse rounded-xl bg-white/5 lg:col-span-6 lg:block" />
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
