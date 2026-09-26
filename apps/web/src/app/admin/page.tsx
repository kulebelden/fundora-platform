'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  HandCoins,
  Megaphone,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { ActivityChart } from '@/components/admin/activity-chart';
import {
  ActivityFeed,
  BarList,
  EmptyState,
  MoneyList,
  PageHeading,
  Panel,
  PanelLink,
  StatTile,
} from '@/components/admin/admin-ui';
import { CampaignStatusBadge } from '@/components/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatNumber, fundedPercent } from '@/lib/currency';
import { apiErrorMessage } from '@/lib/api';
import { useAdminOverview, useMe } from '@/lib/queries';
import type { AdminOverview, CampaignStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_ORDER: CampaignStatus[] = [
  'LIVE',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'DRAFT',
  'COMPLETED',
  'SUSPENDED',
  'REJECTED',
];

const ROLE_LABELS: Record<string, string> = {
  FUNDRAISER: 'Fundraisers',
  DONOR: 'Donors',
  MODERATOR: 'Moderators',
  FINANCE_OFFICER: 'Finance officers',
  ADMIN: 'Admins',
  SUPER_ADMIN: 'Super admins',
};

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

/* -------------------------------------------------------- attention strip */

function QueueCard({
  label,
  count,
  href,
  icon: Icon,
  clearText,
}: {
  label: string;
  count: number;
  href: string;
  icon: LucideIcon;
  clearText: string;
}) {
  const waiting = count > 0;
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border p-4 transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        waiting ? 'border-warm/50 bg-warm/10' : 'bg-card',
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          waiting ? 'bg-warm text-[#1a1000]' : 'bg-success/12 text-success',
        )}
      >
        {waiting ? <Icon className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className={cn('text-xs', waiting ? 'font-semibold text-[#8a5200]' : 'text-muted-foreground')}>
          {waiting ? `${count} waiting for you` : clearText}
        </p>
      </div>
      <span className="tabular text-2xl font-extrabold">{count}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ---------------------------------------------------------- top campaigns */

function TopCampaigns({ campaigns }: { campaigns: AdminOverview['topCampaigns'] }) {
  if (!campaigns.length) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No campaigns yet"
        body="When fundraisers create campaigns, the best performing ones show here."
      />
    );
  }
  return (
    <ul className="divide-y">
      {campaigns.map((campaign) => {
        const percent = fundedPercent(campaign.raised, campaign.targetAmount);
        return (
          <li key={campaign.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {campaign.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded / remote cover
                <img src={campaign.coverImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="brand-gradient h-full w-full" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/campaigns/${campaign.slug}`}
                  className="truncate text-sm font-bold hover:underline"
                >
                  {campaign.title}
                </Link>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                by {campaign.creatorName} · {formatNumber(campaign.donors)} donor
                {campaign.donors === 1 ? '' : 's'}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="viz-bar h-full rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="tabular shrink-0 text-xs font-semibold">
                  {formatMoney(campaign.raised, campaign.currency, { compact: true })}
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    / {formatMoney(campaign.targetAmount, campaign.currency, { compact: true })}
                  </span>
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------- page */

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data: me } = useMe();
  const { data, isLoading, error } = useAdminOverview();

  if (isLoading) return <OverviewSkeleton />;
  if (error || !data) {
    return (
      <Panel>
        <EmptyState
          icon={AlertTriangle}
          title="The overview could not be loaded"
          body={apiErrorMessage(error, 'Try refreshing in a moment.')}
        />
      </Panel>
    );
  }

  const statusItems = STATUS_ORDER.filter((status) => (data.campaigns.byStatus[status] ?? 0) > 0).map(
    (status) => ({
      key: status,
      label: <CampaignStatusBadge status={status} />,
      value: data.campaigns.byStatus[status] ?? 0,
    }),
  );

  const roleItems = Object.entries(data.users.byRole)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([role, count]) => ({ key: role, label: ROLE_LABELS[role] ?? titleCase(role), value: count ?? 0 }));

  const categoryItems = data.categories
    .filter((category) => category.campaigns > 0)
    .map((category) => ({
      key: category.slug,
      label: category.name,
      value: category.campaigns,
      note: category.live ? `${category.live} live` : undefined,
    }));

  const live = data.campaigns.byStatus.LIVE ?? 0;
  const fundraisers = data.users.byRole.FUNDRAISER ?? 0;

  return (
    <div className="space-y-6">
      <PageHeading
        title={`${greeting()}${me?.firstName ? `, ${me.firstName}` : ''}`}
        description="Everything happening across HopeNest: people joining, campaigns being created and reviewed, donations arriving and money going out."
      />

      {/* Needs your attention */}
      <div className="grid gap-4 md:grid-cols-3">
        <QueueCard
          label="Campaigns to review"
          count={data.queues.campaignsAwaitingReview}
          href="/admin/campaigns"
          icon={Megaphone}
          clearText="Review queue is clear"
        />
        <QueueCard
          label="Identity checks"
          count={data.queues.kycAwaitingReview}
          href="/admin/kyc"
          icon={BadgeCheck}
          clearText="No documents waiting"
        />
        <QueueCard
          label="Payout requests"
          count={data.queues.withdrawalsAwaitingReview}
          href="/admin/audits"
          icon={Wallet}
          clearText="No payouts waiting"
        />
      </div>

      {/* Headline numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="People"
          icon={Users}
          tint="bg-accent/10 text-accent"
          href="/admin/people"
          value={formatNumber(data.users.total)}
          context={
            <>
              <span className="font-semibold text-success">+{formatNumber(data.users.newLast7Days)}</span> this
              week · {formatNumber(fundraisers)} fundraiser{fundraisers === 1 ? '' : 's'}
            </>
          }
        />
        <StatTile
          label="Campaigns"
          icon={Megaphone}
          tint="bg-success/12 text-success"
          href="/admin/campaigns"
          value={formatNumber(data.campaigns.total)}
          context={
            <>
              <span className="font-semibold text-foreground">{formatNumber(live)} live</span> ·{' '}
              +{formatNumber(data.campaigns.newLast7Days)} this week
            </>
          }
        />
        <StatTile
          label="Donations"
          icon={HandCoins}
          tint="bg-warm/15 text-[#8a5200]"
          value={formatNumber(data.donations.settled)}
          context={
            <>
              {formatNumber(data.donations.donors)} donor{data.donations.donors === 1 ? '' : 's'}
              {data.donations.pending ? ` · ${formatNumber(data.donations.pending)} pending` : ''}
              {data.donations.failed ? ` · ${formatNumber(data.donations.failed)} failed` : ''}
            </>
          }
        />
        <StatTile
          label="Money raised"
          icon={TrendingUp}
          tint="bg-primary/10 text-primary"
          value={<MoneyList amounts={data.donations.raisedByCurrency} emptyLabel="—" size="lg" />}
          context={
            data.donations.raisedByCurrency.length
              ? 'Settled donations, per currency'
              : 'No donations have settled yet'
          }
        />
      </div>

      {/* Trend + live feed */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Activity"
          description="Daily counts, last 30 days (UTC)"
          className="xl:col-span-2"
        >
          <ActivityChart timeline={data.timeline} />
        </Panel>
        <Panel
          title="Live activity"
          description="The latest events, newest first"
          bodyClassName="max-h-[25rem] overflow-y-auto"
        >
          <ActivityFeed items={data.activity} />
        </Panel>
      </div>

      {/* Campaigns */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Top campaigns"
          description="By money raised"
          action={<PanelLink href="/admin/campaigns">All campaigns</PanelLink>}
          className="xl:col-span-2"
        >
          <TopCampaigns campaigns={data.topCampaigns} />
        </Panel>
        <Panel title="Campaigns by status" description={`${formatNumber(data.campaigns.total)} in total`}>
          <BarList items={statusItems} emptyLabel="No campaigns yet." />
        </Panel>
      </div>

      {/* People, categories, money out */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="People by role"
          action={<PanelLink href="/admin/people">Fundraisers & donors</PanelLink>}
        >
          <BarList items={roleItems} emptyLabel="No accounts yet." />
        </Panel>
        <Panel title="Campaigns by category" description="Categories with at least one campaign">
          <BarList items={categoryItems} emptyLabel="No campaigns filed yet." />
        </Panel>
        <Panel
          title="Payouts"
          action={<PanelLink href="/admin/audits">Manage audits</PanelLink>}
          className="lg:col-span-2 xl:col-span-1"
        >
          <dl className="space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Requested, not yet paid
              </dt>
              <dd className="mt-1.5">
                <MoneyList amounts={data.withdrawals.pendingByCurrency} emptyLabel="Nothing outstanding" />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Paid out to organisers
              </dt>
              <dd className="mt-1.5">
                <MoneyList amounts={data.withdrawals.paidOutByCurrency} emptyLabel="No payouts completed yet" />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Identity checks
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-2 text-xs">
                {Object.keys(data.kyc.byStatus).length ? (
                  Object.entries(data.kyc.byStatus).map(([status, count]) => (
                    <span key={status} className="rounded-full bg-secondary px-2.5 py-1 font-semibold">
                      {titleCase(status)} · <span className="tabular">{count}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">No documents submitted yet</span>
                )}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
