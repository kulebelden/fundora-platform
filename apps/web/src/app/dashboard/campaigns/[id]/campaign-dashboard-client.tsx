'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  ExternalLink,
  Hourglass,
  Loader2,
  Megaphone,
  Receipt,
  Share2,
  TrendingUp,
  Users,
  Wallet,
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
import { formatDate, formatMoney, formatNumber, fundedPercent, timeAgo } from '@/lib/currency';
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

      <main id="main" className="container py-8">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Your campaigns
        </Link>

        {/* -------------------------------------------------- top banner */}
        <Card className="brand-gradient hero-glow relative mt-4 overflow-hidden border-0 p-7">
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

              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                {campaign.title}
              </h1>
              <p className="mt-1.5 text-sm text-white/60">
                Created {formatDate(campaign.createdAt)} · Updated {timeAgo(campaign.updatedAt)}
              </p>

              <div className="mt-6 max-w-lg">
                <div className="flex items-baseline justify-between text-white">
                  <span className="tabular text-2xl font-extrabold">
                    {formatMoney(grossRaised, currency, { hideFraction: true })}
                  </span>
                  <span className="tabular text-sm text-white/60">
                    of {formatMoney(campaign.targetAmount, currency, { hideFraction: true })}
                  </span>
                </div>
                <Progress
                  value={percent}
                  className="mt-2.5 h-2.5 bg-white/15"
                  aria-label={`${Math.round(percent)} percent funded`}
                />
              </div>
            </div>

            <PwaInstallButton size="lg" className="shrink-0" />
          </div>

          {/* quick actions */}
          <div className="relative z-10 mt-7 flex flex-wrap gap-2.5 border-t border-white/15 pt-6">
            <Button
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setUpdateOpen(true)}
            >
              <Megaphone className="h-4 w-4" />
              Post Update
              {updates?.length ? (
                <span className="tabular ml-0.5 text-xs text-white/60">
                  ({updates.length})
                </span>
              ) : null}
            </Button>

            <Button
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              onClick={share}
            >
              <Share2 className="h-4 w-4" />
              Share Campaign
            </Button>

            <Button variant="success" onClick={() => setWithdrawOpen(true)}>
              <Banknote className="h-4 w-4" />
              Request Withdrawal
            </Button>

            <Button
              variant="ghost"
              className="ml-auto text-white/80 hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href={`/campaigns/${campaign.slug}`}>
                View public page
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* ------------------------------------------- financial overview */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            Icon={TrendingUp}
            label="Total raised (gross)"
            value={formatMoney(grossRaised, currency)}
            sub={`${Math.round(percent)}% of goal · before fees`}
            accent="bg-success/12 text-success"
            valueClassName="text-success"
          />
          <StatCard
            Icon={Wallet}
            label="Cleared balance"
            value={formatMoney(cleared, currency)}
            sub="Available to withdraw now"
            accent="bg-accent/12 text-accent"
          />
          <StatCard
            Icon={Hourglass}
            label="Pending settlement"
            value={formatMoney(pending, currency)}
            sub="Reserved against withdrawals in review"
            accent="bg-warm/15 text-[#8a5200]"
          />
          <StatCard
            Icon={Users}
            label="Donors"
            value={formatNumber(donorCount)}
            sub={`${formatMoney(averageDonation, currency)} average donation`}
            accent="bg-primary/10 text-primary"
          />
        </div>

        {/* -------------------------------------------- chart + payouts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="p-6">
            <DonationTrendChart donations={donations} currency={currency} />
          </Card>

          <Card className="p-6">
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
        <Card className="mt-6 p-6">
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

      <SiteFooter />

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

  return (
    <div className="-mx-6 overflow-x-auto px-6">
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
          {donations.slice(0, 25).map((donation, index) => (
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
    <div className="-mx-6 overflow-x-auto px-6">
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
                  {withdrawal.bankAccountDetails?.swiftBic ?? ''}
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
        <Skeleton className="h-56 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
