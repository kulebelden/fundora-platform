'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, GraduationCap, HeartHandshake, Search, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatMoney, formatNumber, fundedPercent } from '@/lib/currency';
import type { CampaignSummary } from '@/lib/types';
import { HERO_IMAGES } from '@/lib/hero-images';

interface School {
  id: string;
  name: string;
  location: string;
  students: number;
  raised: string;
  target: string;
  gradeLevel: string;
}

const SCHOOLS: School[] = [
  { id: 's1', name: 'Rural Primary School Kitgum', location: 'Northern Uganda', students: 840, raised: '42000', target: '75000', gradeLevel: 'Primary' },
  { id: 's2', name: 'Community High School Bekasi', location: 'West Java', students: 1200, raised: '68000', target: '120000', gradeLevel: 'Secondary' },
  { id: 's3', name: 'Refugee Learning Center Kakuma', location: 'Kenya', students: 560, raised: '31000', target: '90000', gradeLevel: 'All levels' },
  { id: 's4', name: 'Slum Outreach School Manila', location: 'Philippines', students: 430, raised: '28000', target: '65000', gradeLevel: 'Primary' },
  { id: 's5', name: 'Indigenous Community School Manitoba', location: 'Canada', students: 320, raised: '55000', target: '80000', gradeLevel: 'K-12' },
  { id: 's6', name: 'Girls Education Initiative Kabul', location: 'Afghanistan', students: 280, raised: '39000', target: '70000', gradeLevel: 'Secondary' },
];

const NGO_LIST = [
  { name: 'WaterAid East Africa', focus: 'Clean water access', raised: '340000', target: '500000', donors: 2840 },
  { name: 'ShelterBox Global', focus: 'Emergency shelter', raised: '520000', target: '800000', donors: 4120 },
  { name: 'Doctors Without Borders', focus: 'Medical aid', raised: '1200000', target: '1500000', donors: 12400 },
  { name: 'Save the Children', focus: 'Child protection', raised: '780000', target: '1000000', donors: 8900 },
];

export function ImpactPageClient({ campaigns }: { campaigns?: CampaignSummary[] }) {
  const [activeTab, setActiveTab] = React.useState<'schools' | 'ngos' | 'teams'>('schools');

  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          image={HERO_IMAGES.impact}
          variant="centered"
          tone="emerald"
          eyebrow="Education & Social Impact"
          eyebrowIcon={GraduationCap}
          title="Change the world through"
          accent="education"
          lead="Fund schools, scholarships, community development, and NGO programs. Set up recurring monthly pledges or rally your team for corporate matching grants."
          crumbs={[
            { label: 'Discover', href: '/discover' },
            { label: 'Education & impact' },
          ]}
          primaryCta={{ label: 'Start a Campaign', href: '/dashboard/campaigns' }}
          secondaryCta={{ label: 'Explore programs', href: '#programs', icon: Search }}
          highlights={[
            { value: '487', label: 'Schools funded', icon: GraduationCap, tone: 'success' },
            { value: '$18M', label: 'Impact funded', icon: TrendingUp, tone: 'warm' },
            { value: '12K', label: 'Monthly pledgers', icon: HeartHandshake },
            { value: '340', label: 'Corporate matches', icon: Target, tone: 'accent' },
          ]}
        />

        <section id="programs" className="container scroll-mt-20 py-12">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'schools', label: 'School Funding' },
              { key: 'ngos', label: 'NGO Programs' },
              { key: 'teams', label: 'Team Fundraising' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as typeof activeTab)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  activeTab === t.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'schools' && (
          <section className="container scroll-mt-20 pb-16 sm:pb-20">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Schools needing funding</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SCHOOLS.map((school) => {
                const percent = fundedPercent(school.raised, school.target);
                return (
                  <Card key={school.id} className="flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                    <div className="relative aspect-[8/5] overflow-hidden bg-slate-900">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-white/10" />
                      </div>
                      <div className="absolute left-3 top-3">
                        <Badge className="bg-background/95 text-foreground shadow-sm">{school.gradeLevel}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-base font-bold leading-snug">{school.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Search className="h-3 w-3" />
                        {school.location} · {school.students.toLocaleString()} students
                      </p>
                      <div className="mt-auto pt-4">
                        <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} />
                        <div className="mt-2 flex items-baseline justify-between">
                          <p className="tabular text-sm">
                            <span className="font-bold text-success">{formatMoney(school.raised, 'USD', { hideFraction: true })}</span>
                            {' '}
                            <span className="text-muted-foreground">
                              of {formatMoney(school.target, 'USD', { hideFraction: true })}
                            </span>
                          </p>
                          <span className="tabular shrink-0 text-xs font-bold text-success">{Math.round(percent)}%</span>
                        </div>
                      </div>
                      <Button size="sm" variant="success" className="mt-4 w-full" asChild>
                        <Link href="/dashboard/campaigns">Support this school</Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'ngos' && (
          <section className="container scroll-mt-20 pb-16 sm:pb-20">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Verified NGO programs</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {NGO_LIST.map((ngo) => {
                const percent = fundedPercent(ngo.raised, ngo.target);
                return (
                  <Card key={ngo.name} className="flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                        <ShieldCheck className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="font-bold">{ngo.name}</h3>
                        <p className="text-xs text-muted-foreground">{ngo.focus}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} />
                      <div className="mt-2 flex items-baseline justify-between">
                        <p className="tabular text-sm">
                          <span className="font-bold text-success">{formatMoney(ngo.raised, 'USD', { hideFraction: true })}</span>
                          {' '}
                          <span className="text-muted-foreground">
                            of {formatMoney(ngo.target, 'USD', { hideFraction: true })}
                          </span>
                        </p>
                        <span className="tabular shrink-0 text-xs font-bold text-success">{Math.round(percent)}%</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{formatNumber(ngo.donors)} donors</p>
                      <Button size="sm" variant="success" asChild>
                        <Link href="/dashboard/campaigns">Donate</Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'teams' && (
          <section className="container scroll-mt-20 pb-16 sm:pb-20">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Team fundraising</h2>
            <p className="mt-2 text-muted-foreground">
              Rally your colleagues, friends, or corporate team. Every contribution is tracked and matched.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { team: 'Tech for Good', goal: '25000', raised: '18700', members: 24, match: '2x corporate' },
                { team: 'Run for Water', goal: '50000', raised: '42300', members: 56, match: '1x corporate' },
                { team: 'Doctors Without Borders', goal: '100000', raised: '87500', members: 120, match: '3x corporate' },
                { team: 'Green Future Squad', goal: '30000', raised: '12400', members: 18, match: '1.5x corporate' },
                { team: 'Women in Tech', goal: '40000', raised: '35600', members: 42, match: '2x corporate' },
                { team: 'Open Source Edu', goal: '20000', raised: '9800', members: 31, match: '1x corporate' },
              ].map((team) => {
                const percent = fundedPercent(team.raised, team.goal);
                return (
                  <Card key={team.team} className="flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">{team.team}</h3>
                      <Badge className="bg-success/10 text-success">{team.match}</Badge>
                    </div>
                    <div className="mt-4">
                      <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} />
                      <div className="mt-2 flex items-baseline justify-between">
                        <p className="tabular text-sm">
                          <span className="font-bold text-success">{formatMoney(team.raised, 'USD', { hideFraction: true })}</span>
                          {' '}
                          <span className="text-muted-foreground">
                            of {formatMoney(team.goal, 'USD', { hideFraction: true })}
                          </span>
                        </p>
                        <span className="tabular shrink-0 text-xs font-bold text-success">{Math.round(percent)}%</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{team.members} members</p>
                      <Button size="sm" variant="success" asChild>
                        <Link href="/dashboard/campaigns">Join team</Link>
                      </Button>
                    </div>
                  </Card>
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
