'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Clock,
  ExternalLink,
  Hourglass,
  Loader2,
  Megaphone,
  Receipt,
  Share2,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { DonationTrendChart } from '@/components/donation-trend-chart';
import { PostUpdateModal } from '@/components/post-update-modal';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StatCard } from '@/components/stat-card';
import { CampaignStatusBadge, WithdrawalStatusBadge } from '@/components/status-badge';
import { WithdrawalModal } from '@/components/withdrawal-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { daysRemaining, formatDate, formatMoney, formatNumber, fundedPercent, timeAgo } from '@/lib/currency';
import { WITHDRAWAL_FEE_LABEL } from '@/lib/fees';
import {
  useCampaignById,
  useCampaignUpdates,
  useDonationFeed,
  useMe,
  useMyWithdrawals,
} from '@/lib/queries';
import { isNotFound, isUnauthorized } from '@/lib/api';
import type { DonationFeedItem, WithdrawalRequestView } from '@/lib/types';
import { cn } from '@/lib/utils';

const CHANNEL_LABEL: Record<string, string> = {
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  MTN_MOMO: 'MTN MoMo',
  AIRTEL_MONEY: 'Airtel Money',
};

export function CampaignDashboardClient({ campaignId }: { campaignId: string }) {
  const { data: me, isLoading: meLoading } = useMe();

  // One authenticated call by UUID; it returns the wallet balances too.
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaignById(campaignId);

  const { data: donations } = useDonationFeed(campaignId);
  const { data: updates } = useCampaignUpdates(campaignId);
  const { data: withdrawals } = useMyWithdrawals();

  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [updateOpen, setUpdateOpen] = React.useState(false);

  // Phones: once the banner and its actions scroll away, a bottom bar takes over.
  // Re-attached every render because the banner only mounts after loading.
  const bannerRef = React.useRef<HTMLDivElement | null>(null);
  const [bannerVisible, setBannerVisible] = React.useState(true);
  React.useEffect(() => {
    const node = bannerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setBannerVisible(entry.isIntersecting), {
      rootMargin: '-64px 0px 0px 0px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  });

  const isLoading = meLoading || campaignLoading;

  if (isLoading) return <DashboardSkeleton />;

  if (!me) {
    return (
      <Shell>
        <EmptyState
          title="Sign in to view this dashboard"
          body="Campaign finances are private to the campaign owner."
          action={
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
          }
        />
      </Shell>
    );
  }

  if (campaignError || !campaign) {
    // The API answers 404 for a campaign that is not yours, so ids cannot be probed.
    const notYours = isNotFound(campaignError) || isUnauthorized(campaignError);
    return (
      <Shell>
        <EmptyState
          title={notYours ? 'Campaign not found' : 'Could not load this campaign'}
          body={
            notYours
              ? 'This campaign does not exist, or it is not one of yours.'
              : apiErrorMessage(campaignError)
          }
          action={
            <Button variant="outline" asChild>
              <Link href="/dashboard/campaigns">
                <ArrowLeft className="h-4 w-4" />
                Your campaigns
              </Link>
            </Button>
          }
        />
      </Shell>
    );
  }

  const currency = campaign.currency;
  const cleared = campaign.wallet?.clearedBalance ?? '0';
  const pending = campaign.wallet?.pendingBalance ?? '0';

  // Gross raised and supporter count are computed server-side; the wallet holds the
  // post-fee net, which is a different number and must not be conflated with it.
  const settled = donations ?? [];
  const grossRaised = Number(campaign.raisedAmount) || 0;
  const donorCount = campaign.donorCount;
  const averageDonation = donorCount > 0 ? grossRaised / donorCount : 0;
  const percent = fundedPercent(campaign.raisedAmount, campaign.targetAmount);
  const days = daysRemaining(campaign.endDate);

  const campaignWithdrawals = (withdrawals ?? []).filter(
    (withdrawal) => withdrawal.campaignId === campaignId,
  );

  const share = async () => {
    const url = `${window.location.origin}/campaigns/${campaign.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: campaign.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ variant: 'success', title: 'Link copied', description: url });
    } catch {
      // Share sheet dismissed; nothing to report.
    }
  };

  return (
    <>
      <SiteHeader />

      <main id="main" className="container pb-28 pt-4 sm:pb-10 sm:pt-8">
        <Link
          href="/dashboard/campaigns"
          className="-ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Your campaigns
        </Link>

        {/* -------------------------------------------------- top banner */}
        <div ref={bannerRef}>
          <Card className="brand-gradient hero-glow relative mt-2 overflow-hidden rounded-3xl border-0 p-5 shadow-lift sm:mt-4 sm:p-7">
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CampaignStatusBadge status={campaign.status} />
                  <Badge variant="outline" className="border-white/25 text-white">
                    {campaign.category?.name ?? 'Cause'}
                  </Badge>
                  <Badge variant="outline" className="border-white/25 text-white">
                    {currency}
                  </Badge>
                </div>

                <h1 className="mt-3 line-clamp-3 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                  {campaign.title}
                </h1>
                <p className="mt-1.5 text-xs text-white/60 sm:text-sm">
                  Created {formatDate(campaign.createdAt)} · Updated {timeAgo(campaign.updatedAt)}
                </p>

                <div className="mt-5 max-w-lg sm:mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Raised</p>
                  <div className="flex items-baseline justify-between gap-3 text-white">
                    <span className="tabular text-[2rem] font-extrabold leading-tight tracking-tight sm:text-4xl">
                      {formatMoney(grossRaised, currency, { hideFraction: true })}
                    </span>
                    <span className="tabular shrink-0 text-sm text-white/60">
                      of {formatMoney(campaign.targetAmount, currency, { hideFraction: true })}
                    </span>
                  </div>
                  <Progress
                    value={percent}
                    className="mt-2.5 h-2.5 bg-white/15"
                    aria-label={`${Math.round(percent)} percent funded`}
                  />
                  <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75">
                    <span className="font-bold text-white">{Math.round(percent)}% funded</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {formatNumber(donorCount)} {donorCount === 1 ? 'supporter' : 'supporters'}
                    </span>
                    {days !== null && campaign.status === 'LIVE' ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {days === 0 ? 'Ends today' : `${days} ${days === 1 ? 'day' : 'days'} left`}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <PwaInstallButton size="lg" className="hidden shrink-0 sm:inline-flex" />
            </div>

            {/* Quick actions: equal tiles on a phone, a button row from `sm` up. */}
            <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 sm:mt-7 sm:flex sm:flex-wrap sm:gap-2.5 sm:pt-6">
              <QuickAction
                icon={Megaphone}
                label="Post update"
                badge={updates?.length ? String(updates.length) : undefined}
                onClick={() => setUpdateOpen(true)}
              />
              <QuickAction icon={Share2} label="Share" onClick={share} />
              <QuickAction icon={Banknote} label="Withdraw" primary onClick={() => setWithdrawOpen(true)} />

              <Button
                variant="ghost"
                className="col-span-3 mt-1 text-white/80 hover:bg-white/10 hover:text-white sm:col-span-1 sm:ml-auto sm:mt-0"
                asChild
              >
                <Link href={`/campaigns/${campaign.slug}`}>
                  View public page
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* ------------------------------------------- financial overview */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-4">
          <StatCard
            Icon={TrendingUp}
            label="Raised (gross)"
            value={formatMoney(grossRaised, currency)}
            sub="Before fees"
            accent="bg-success/12 text-success"
            valueClassName="text-success"
          />
          <StatCard
            Icon={Wallet}
            label="Cleared balance"
            value={formatMoney(cleared, currency)}
            sub="Ready to withdraw"
            accent="bg-accent/12 text-accent"
          />
          <StatCard
            Icon={Hourglass}
            label="In review"
            value={formatMoney(pending, currency)}
            sub="Held for payouts being checked"
            accent="bg-warm/15 text-[#8a5200]"
          />
          <StatCard
            Icon={Users}
            label="Donors"
            value={formatNumber(donorCount)}
            sub={`${formatMoney(averageDonation, currency, { hideFraction: true })} average`}
            accent="bg-primary/10 text-primary"
          />
        </div>

        {/* -------------------------------------------- chart + payouts */}
        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="min-w-0 p-4 sm:p-6">
            <DonationTrendChart donations={donations} currency={currency} />
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">Payouts</h3>
              <Badge variant="warm">{WITHDRAWAL_FEE_LABEL} fee</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              A {WITHDRAWAL_FEE_LABEL} platform service fee is deducted from each withdrawal.
            </p>

            {campaignWithdrawals.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed py-10 text-center">
                <Banknote className="mx-auto h-7 w-7 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-semibold">No withdrawals yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setWithdrawOpen(true)}
                >
                  Request one
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {campaignWithdrawals.slice(0, 5).map((withdrawal) => (
                  <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ------------------------------------------------ transactions */}
        <Card className="mt-4 p-4 sm:mt-6 sm:p-6">
          <Tabs defaultValue="donors">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold">Recent activity</h3>
              <TabsList>
                <TabsTrigger value="donors">Donors</TabsTrigger>
                <TabsTrigger value="payouts">Withdrawals</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="donors">
              <TransactionsTable donations={settled} currency={currency} />
            </TabsContent>

            <TabsContent value="payouts">
              <WithdrawalsTable withdrawals={campaignWithdrawals} />
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <SiteFooter cta={false} />

      {/* Phones: the two actions a fundraiser reaches for most, kept in reach while scrolling. */}
      <div
        aria-hidden={bannerVisible}
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 sm:hidden',
          bannerVisible ? 'pointer-events-none translate-y-full' : 'translate-y-0',
        )}
      >
        <div className="flex gap-2.5">
          <Button variant="outline" className="h-12 flex-1" onClick={share} tabIndex={bannerVisible ? -1 : 0}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="success"
            className="h-12 flex-[1.6]"
            onClick={() => setWithdrawOpen(true)}
            tabIndex={bannerVisible ? -1 : 0}
          >
            <Banknote className="h-4 w-4" />
            {Number(cleared) > 0 ? `Withdraw · ${formatMoney(cleared, currency, { hideFraction: true })}` : 'Withdraw'}
          </Button>
        </div>
      </div>

      <WithdrawalModal
        campaignId={campaignId}
        currency={currency}
        clearedBalance={cleared}
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />

      <PostUpdateModal
        campaignId={campaignId}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />
    </>
  );
}

/** Banner action: an icon tile on a phone, a regular button from `sm` up. */
function QuickAction({
  icon: Icon,
  label,
  badge,
  primary,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  badge?: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
        'sm:min-h-10 sm:flex-row sm:gap-2 sm:rounded-lg sm:px-4 sm:text-sm',
        primary
          ? 'bg-success text-white shadow-lg shadow-success/25 hover:bg-success/90'
          : 'border border-white/20 bg-white/10 text-white hover:bg-white/20',
      )}
    >
      <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
      {label}
      {badge ? (
        <span className="tabular absolute right-2 top-2 rounded-full bg-white/20 px-1.5 text-[10px] sm:static sm:bg-transparent sm:px-0 sm:text-xs sm:text-white/60">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function WithdrawalRow({ withdrawal }: { withdrawal: WithdrawalRequestView }) {
  return (
    <li className="rounded-lg border p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="tabular text-sm font-bold">
          {formatMoney(withdrawal.netAmount, withdrawal.currency)}
        </span>
        <WithdrawalStatusBadge status={withdrawal.status} />
      </div>
      <p className="tabular mt-1.5 text-xs text-muted-foreground">
        {formatMoney(withdrawal.grossAmount, withdrawal.currency)} gross · −
        {formatMoney(withdrawal.serviceFee, withdrawal.currency)} fee
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{timeAgo(withdrawal.createdAt)}</p>
      {withdrawal.rejectionReason ? (
        <p className="mt-2 rounded bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {withdrawal.rejectionReason}
        </p>
      ) : null}
    </li>
  );
}

function TransactionsTable({
  donations,
  currency,
}: {
  donations: DonationFeedItem[];
  currency: string;
}) {
  if (donations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-14 text-center">
        <Receipt className="mx-auto h-7 w-7 text-muted-foreground/50" />
        <p className="mt-3 font-semibold">No settled donations yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Donations appear once the processor confirms them.
        </p>
      </div>
    );
  }

  const rows = donations.slice(0, 25);

  return (
    <>
      {/* Phones: one line per gift instead of a table that scrolls sideways. */}
      <ul className="divide-y sm:hidden">
        {rows.map((donation, index) => (
          <li key={donation.providerReference ?? `${donation.createdAt}-${index}`} className="flex items-center gap-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
              {donation.donorName.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{donation.donorName}</span>
              <span className="block text-xs text-muted-foreground">
                {CHANNEL_LABEL[donation.channel] ?? donation.channel} · {timeAgo(donation.createdAt)}
              </span>
            </span>
            <span className="tabular shrink-0 text-sm font-bold text-success">
              +{formatMoney(donation.amount, donation.currency || currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="-mx-6 hidden overflow-x-auto px-6 sm:block">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="pb-3 font-bold">Donor</th>
            <th scope="col" className="pb-3 font-bold">Reference</th>
            <th scope="col" className="pb-3 font-bold">Method</th>
            <th scope="col" className="pb-3 font-bold">Date</th>
            <th scope="col" className="pb-3 text-right font-bold">Amount</th>
            <th scope="col" className="pb-3 text-right font-bold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((donation, index) => (
            <tr key={donation.providerReference ?? `${donation.createdAt}-${index}`}>
              <td className="py-3 font-medium">{donation.donorName}</td>
              <td className="py-3 font-mono text-xs text-muted-foreground">
                {donation.providerReference ?? '—'}
              </td>
              <td className="py-3 text-muted-foreground">
                {CHANNEL_LABEL[donation.channel] ?? donation.channel}
              </td>
              <td className="py-3 text-muted-foreground">{formatDate(donation.createdAt)}</td>
              <td className="tabular py-3 text-right font-bold">
                {formatMoney(donation.amount, donation.currency || currency)}
              </td>
              <td className="py-3 text-right">
                <Badge variant="success">Settled</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function WithdrawalsTable({ withdrawals }: { withdrawals: WithdrawalRequestView[] }) {
  if (withdrawals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-14 text-center">
        <Banknote className="mx-auto h-7 w-7 text-muted-foreground/50" />
        <p className="mt-3 font-semibold">No withdrawal requests yet</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3 sm:hidden">
        {withdrawals.map((withdrawal) => (
          <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />
        ))}
      </ul>

      <div className="-mx-6 hidden overflow-x-auto px-6 sm:block">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="pb-3 font-bold">Requested</th>
            <th scope="col" className="pb-3 font-bold">Bank</th>
            <th scope="col" className="pb-3 text-right font-bold">Gross</th>
            <th scope="col" className="pb-3 text-right font-bold">Fee</th>
            <th scope="col" className="pb-3 text-right font-bold">Net paid</th>
            <th scope="col" className="pb-3 text-right font-bold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {withdrawals.map((withdrawal) => (
            <tr key={withdrawal.id}>
              <td className="py-3 text-muted-foreground">{formatDate(withdrawal.createdAt)}</td>
              <td className="py-3">
                <span className="font-medium">{withdrawal.bankAccountDetails?.bankName ?? '—'}</span>
                <span className="block font-mono text-xs text-muted-foreground">
                  {withdrawal.bankAccountDetails?.method === 'us_bank'
                    ? `ACH ${withdrawal.bankAccountDetails.achRouting ?? ''}`
                    : (withdrawal.bankAccountDetails?.swiftBic ?? '')}
                </span>
              </td>
              <td className="tabular py-3 text-right">
                {formatMoney(withdrawal.grossAmount, withdrawal.currency)}
              </td>
              <td className="tabular py-3 text-right text-destructive">
                −{formatMoney(withdrawal.serviceFee, withdrawal.currency)}
              </td>
              <td className="tabular py-3 text-right font-bold text-success">
                {formatMoney(withdrawal.netAmount, withdrawal.currency)}
              </td>
              <td className="py-3 text-right">
                <WithdrawalStatusBadge status={withdrawal.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container py-20">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container space-y-6 py-8">
        <Skeleton className="h-72 w-full rounded-3xl sm:h-56" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading campaign finances…
        </div>
      </main>
    </>
  );
}
