'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, MapPin, ShieldCheck, Siren, Users } from 'lucide-react';
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

interface EmergencyZone {
  id: string;
  name: string;
  region: string;
  severity: 'HIGH' | 'CRITICAL' | 'EXTREME';
  affected: number;
  raised: string;
  target: string;
  ngoVerified: boolean;
  campaignId: string;
}

const ZONES: EmergencyZone[] = [
  { id: '1', name: 'East Africa Drought', region: 'Horn of Africa', severity: 'CRITICAL', affected: 4200000, raised: '890000', target: '2000000', ngoVerified: true, campaignId: 'c1' },
  { id: '2', name: 'Southeast Asia Typhoon', region: 'Philippines', severity: 'HIGH', affected: 1800000, raised: '540000', target: '1500000', ngoVerified: true, campaignId: 'c2' },
  { id: '3', name: 'Earthquake Response', region: 'Anatolian Belt', severity: 'EXTREME', affected: 6700000, raised: '1240000', target: '3500000', ngoVerified: true, campaignId: 'c3' },
  { id: '4', name: 'Refugee Crisis Support', region: 'Sahel Region', severity: 'HIGH', affected: 3100000, raised: '420000', target: '1800000', ngoVerified: false, campaignId: 'c4' },
  { id: '5', name: 'Flood Relief', region: 'South Asia', severity: 'CRITICAL', affected: 2500000, raised: '670000', target: '1200000', ngoVerified: true, campaignId: 'c5' },
  { id: '6', name: 'Wildfire Displacement', region: 'Pacific Coast', severity: 'HIGH', affected: 450000, raised: '310000', target: '800000', ngoVerified: false, campaignId: 'c6' },
];

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
  EXTREME: 'bg-red-600/15 text-red-500 border-red-600/30',
};

function ZoneCard({ zone }: { zone: EmergencyZone }) {
  const percent = fundedPercent(zone.raised, zone.target);

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
        <div
          className={cn(
            'absolute inset-0 opacity-30',
            zone.severity === 'EXTREME' && 'bg-gradient-to-br from-red-900 to-slate-900',
            zone.severity === 'CRITICAL' && 'bg-gradient-to-br from-red-800 to-slate-900',
            zone.severity === 'HIGH' && 'bg-gradient-to-br from-amber-900 to-slate-900',
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Siren className="h-16 w-16 text-white/10" />
        </div>
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className={cn('border backdrop-blur', SEVERITY_COLOR[zone.severity])}>
            {zone.severity === 'EXTREME' && <span className="animate-pulse">● </span>}
            {zone.severity}
          </Badge>
          {zone.ngoVerified && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <ShieldCheck className="h-3 w-3" />
              NGO Verified
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <Badge variant="outline" className="border-white/30 bg-[#001330]/70 font-semibold text-white">
            LIVE
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug">{zone.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {zone.region}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{zone.affected.toLocaleString()} affected</p>

        <div className="mt-4">
          <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} className="h-2" />
          <div className="mt-2 flex items-baseline justify-between">
            <p className="tabular text-sm">
              <span className="font-bold text-success">{formatMoney(zone.raised, 'USD', { hideFraction: true })}</span>
              {' '}
              <span className="text-muted-foreground">
                of {formatMoney(zone.target, 'USD', { hideFraction: true })}
              </span>
            </p>
            <span className="tabular shrink-0 text-xs font-bold text-success">{Math.round(percent)}%</span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          <Button size="sm" variant="success" className="flex-1" asChild>
            <Link href={`/campaigns/${zone.campaignId}`}>Donate now</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/emergency/${zone.id}`}>Details</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function EmergencyPageClient({ campaigns }: { campaigns?: CampaignSummary[] }) {
  const [filter, setFilter] = React.useState<string>('all');

  const filtered = React.useMemo(() => {
    if (filter === 'all') return ZONES;
    if (filter === 'verified') return ZONES.filter((z) => z.ngoVerified);
    if (filter === 'critical') return ZONES.filter((z) => z.severity === 'CRITICAL' || z.severity === 'EXTREME');
    return ZONES;
  }, [filter]);

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          image={HERO_IMAGES.emergency}
          variant="signal"
          tone="amber"
          eyebrow="Rapid Response · Live Crisis Zones"
          eyebrowIcon={Siren}
          title="When disaster strikes,"
          accent="hope responds."
          lead="Real-time crisis relief funding with verified NGO partners. Every dollar is tracked on an auditable ledger from donor to disaster zone."
          crumbs={[
            { label: 'Discover', href: '/discover' },
            { label: 'Emergency' },
          ]}
          primaryCta={{ label: 'Start a Relief Campaign', href: '/dashboard/campaigns' }}
          secondaryCta={{ label: 'View crisis zones', href: '#zones', icon: MapPin }}
          highlights={[
            { value: '42M+', label: 'People aided', icon: Users },
            { value: '$24M', label: 'Relief funded', icon: ShieldCheck, tone: 'success' },
            { value: '6', label: 'Active zones', icon: AlertTriangle, tone: 'warm' },
            { value: '12', label: 'Countries', icon: MapPin, tone: 'accent' },
          ]}
        />

        <section id="zones" className="container scroll-mt-20 py-12">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All zones' },
              { key: 'critical', label: 'Critical & Extreme' },
              { key: 'verified', label: 'NGO Verified' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  filter === f.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        <section className="container scroll-mt-20 pb-16 sm:pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} />
            ))}
          </div>
        </section>

        <section className="border-y bg-slate-900 py-8">
          <div className="container">
            <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
              Live Relief Updates
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { zone: 'East Africa Drought', update: '320 tonnes of food aid delivered to Mogadishu', time: '12 min ago' },
                { zone: 'Anatolian Earthquake', update: 'Field hospital operational in Hatay province', time: '34 min ago' },
                { zone: 'Philippines Typhoon', update: '15,000 emergency shelters distributed', time: '1 hr ago' },
              ].map((item, i) => (
                <Card key={i} className="p-5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    {item.zone} · {item.time}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{item.update}</p>
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
