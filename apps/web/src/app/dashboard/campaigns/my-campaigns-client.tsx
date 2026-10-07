'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronRight, Clock, Plus, ShieldAlert, Target, Users } from 'lucide-react';
import { BrandLoader } from '@/components/brand/brand-loader';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { CampaignStatusBadge, KycStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorMessage } from '@/lib/api';
import { daysRemaining, formatMoney, formatNumber, fundedPercent } from '@/lib/currency';
import { useKycStatus, useMe, useMyCampaigns } from '@/lib/queries';
import type { CampaignSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Gross raised per currency: USD and EUR are never added together. */
function raisedByCurrency(campaigns: CampaignSummary[]): Array<{ currency: string; amount: number }> {
  const totals = new Map<string, number>();
  for (const campaign of campaigns) {
    totals.set(campaign.currency, (totals.get(campaign.currency) ?? 0) + (Number(campaign.raisedAmount) || 0));
  }
  return [...totals].map(([currency, amount]) => ({ currency, amount }));
}

export function MyCampaignsClient() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: campaigns, isLoading, error } = useMyCampaigns();
  const { data: kyc } = useKycStatus();

  const list = campaigns ?? [];
  const live = list.filter((campaign) => campaign.status === 'LIVE').length;
  const supporters = list.reduce((sum, campaign) => sum + campaign.donorCount, 0);
  const raised = raisedByCurrency(list);
  const kycStatus = kyc?.status ?? 'NOT_STARTED';
  const verified = kycStatus === 'VERIFIED';

  return (
    <>
      <SiteHeader />

      <main id="main" className="container pb-10 pt-5 sm:pt-8">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {me ? (
              <p className="text-sm font-semibold text-muted-foreground">Hi, {me.firstName}</p>
            ) : null}
            <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-3xl">Your campaigns</h1>
            <p className="mt-1 hidden text-muted-foreground sm:block">
              Track funds, post updates and withdraw to your bank.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <PwaInstallButton className="hidden sm:inline-flex" />
            <Button variant="success" asChild>
              <Link href="/dashboard/campaigns/create">
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">New campaign</span>
              </Link>
            </Button>
          </div>
        </div>

        {meLoading || isLoading ? (
          <BrandLoader label="Loading your campaigns" className="py-24" />
        ) : !me ? (
          <Card className="mt-8 px-6 py-14 text-center">
            <h2 className="text-xl font-bold">Sign in to see your campaigns</h2>
            <Button className="mt-6" asChild>
              <Link href="/login?next=/dashboard/campaigns">Log in</Link>
            </Button>
          </Card>
        ) : error ? (
          <Card className="mt-8 px-6 py-14 text-center">
            <h2 className="text-xl font-bold">Could not load your campaigns</h2>
            <p className="mt-2 text-sm text-muted-foreground">{apiErrorMessage(error)}</p>
          </Card>
        ) : (
          <>
            {/* ------------------------------------------------ overview */}
            {list.length ? (
              <section
                aria-label="Overview"
                className="brand-gradient hero-glow relative mt-5 overflow-hidden rounded-3xl p-5 text-white shadow-lift sm:p-6"
              >
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Raised so far</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    {raised.map(({ currency, amount }) => (
                      <p key={currency} className="tabular text-3xl font-extrabold tracking-tight sm:text-4xl">
                        {formatMoney(amount, currency, { hideFraction: true })}
                      </p>
                    ))}
                  </div>
                  <dl className="mt-5 grid grid-cols-3 divide-x divide-white/15 rounded-2xl bg-white/10 py-3 backdrop-blur">
                    {[
                      { label: 'Campaigns', value: formatNumber(list.length) },
                      { label: 'Live now', value: formatNumber(live) },
                      { label: 'Supporters', value: formatNumber(supporters) },
                    ].map(({ label, value }) => (
                      <div key={label} className="px-3 text-center">
                        <dd className="tabular text-lg font-extrabold">{value}</dd>
                        <dt className="text-[11px] text-white/65">{label}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            ) : null}

            {/* --------------------------------------------- verification */}
            {verified ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-success" />
                Identity verified: withdrawals are unlocked.
              </p>
            ) : (
              <Link
                href="/dashboard/verification"
                className="group mt-4 flex items-center gap-3 rounded-2xl border border-warm/40 bg-warm/10 p-4 transition-colors hover:bg-warm/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warm/20 text-[#8a5200]">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {kycStatus === 'SUBMITTED' ? 'Verification in review' : 'Verify your identity'}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {kycStatus === 'SUBMITTED'
                      ? 'We will let you know once it is checked.'
                      : 'Needed before any withdrawal is released.'}
                  </span>
                </span>
                {kycStatus === 'SUBMITTED' ? (
                  <KycStatusBadge status={kycStatus} />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                )}
              </Link>
            )}

            {/* ------------------------------------------------ campaigns */}
            {!list.length ? (
              <Card className="mt-6 px-6 py-14 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <Target className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-xl font-bold">No campaigns yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Start a campaign to begin raising funds for your cause. It takes a few minutes.
                </p>
                <Button variant="success" className="mt-6" asChild>
                  <Link href="/dashboard/campaigns/create">
                    Start a campaign
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ) : (
              <ul className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-2">
                {list.map((campaign) => (
                  <li key={campaign.id}>
                    <CampaignRow campaign={campaign} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <SiteFooter cta={false} />
    </>
  );
}

/** The whole card opens the campaign's dashboard: one large tap target on a phone. */
function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const percent = fundedPercent(campaign.raisedAmount, campaign.targetAmount);
  const days = daysRemaining(campaign.endDate);

  return (
    <Link
      href={`/dashboard/campaigns/${campaign.id}`}
      className="group flex h-full gap-4 rounded-2xl border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4"
    >
      <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-24">
        {campaign.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded / remote cover
          <img src={campaign.coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="brand-gradient h-full w-full" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 text-[0.95rem] font-bold leading-snug sm:text-base">{campaign.title}</h2>
          <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <CampaignStatusBadge status={campaign.status} />
          <span className="truncate text-xs text-muted-foreground">{campaign.category?.name}</span>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="tabular truncate">
              <span className="text-sm font-extrabold">
                {formatMoney(campaign.raisedAmount, campaign.currency, { hideFraction: true })}
              </span>
              <span className="text-muted-foreground">
                {' '}
                of {formatMoney(campaign.targetAmount, campaign.currency, { hideFraction: true })}
              </span>
            </span>
            <span className="tabular shrink-0 font-bold text-success">{Math.round(percent)}%</span>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(percent)} percent funded`}
          >
            <div className="viz-bar h-full rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(campaign.donorCount)} {campaign.donorCount === 1 ? 'supporter' : 'supporters'}
            </span>
            {days !== null && campaign.status === 'LIVE' ? (
              <span className={cn('inline-flex items-center gap-1', days <= 7 && 'font-semibold text-[#8a5200]')}>
                <Clock className="h-3.5 w-3.5" />
                {days === 0 ? 'Ends today' : `${days} ${days === 1 ? 'day' : 'days'} left`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
