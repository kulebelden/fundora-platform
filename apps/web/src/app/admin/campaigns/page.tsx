'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  Loader2,
  type LucideIcon,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Rocket,
  XCircle,
} from 'lucide-react';
import { EmptyState, PageHeading, Panel } from '@/components/admin/admin-ui';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { CampaignStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { formatDate, formatMoney, fundedPercent } from '@/lib/currency';
import {
  useAdminCampaignCounts,
  useAdminCampaigns,
  useUpdateCampaignStatus,
} from '@/lib/queries';
import type { CampaignStatus, CampaignSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

type Tab = CampaignStatus | 'ALL';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'SUBMITTED', label: 'To review' },
  { key: 'UNDER_REVIEW', label: 'Under review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'LIVE', label: 'Live' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'ALL', label: 'All' },
];

interface Action {
  label: string;
  icon: LucideIcon;
  /** Statuses to apply in order (approve-and-publish is two API steps). */
  steps: CampaignStatus[];
  tone: 'primary' | 'neutral' | 'danger';
  needsReason?: boolean;
}

/** Mirrors ALLOWED_STATUS_TRANSITIONS in the API; the API re-checks every step. */
function actionsFor(status: CampaignStatus): Action[] {
  const approvePublish: Action = { label: 'Approve & publish', icon: Rocket, steps: ['APPROVED', 'LIVE'], tone: 'primary' };
  const reject: Action = { label: 'Reject', icon: XCircle, steps: ['REJECTED'], tone: 'danger', needsReason: true };
  const suspend: Action = { label: 'Suspend', icon: PauseCircle, steps: ['SUSPENDED'], tone: 'danger', needsReason: true };
  switch (status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return [approvePublish, reject];
    case 'APPROVED':
      return [{ label: 'Publish', icon: Rocket, steps: ['LIVE'], tone: 'primary' }, reject, suspend];
    case 'LIVE':
      return [{ label: 'Mark completed', icon: CheckCircle2, steps: ['COMPLETED'], tone: 'neutral' }, suspend];
    case 'COMPLETED':
      return [{ label: 'Reopen', icon: PlayCircle, steps: ['LIVE'], tone: 'neutral' }, suspend];
    case 'SUSPENDED':
      return [{ label: 'Reinstate', icon: PlayCircle, steps: ['LIVE'], tone: 'primary' }, reject];
    case 'REJECTED':
      return [{ label: 'Approve', icon: CheckCircle2, steps: ['APPROVED'], tone: 'neutral' }];
    default:
      return [];
  }
}

function ActionButton({
  action,
  busy,
  onClick,
}: {
  action: Action;
  busy: boolean;
  onClick: () => void;
}) {
  const Icon = action.icon;
  return (
    <Button
      size="sm"
      variant={action.tone === 'primary' ? 'success' : 'outline'}
      className={cn(action.tone === 'danger' && 'text-destructive hover:text-destructive')}
      disabled={busy}
      onClick={onClick}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {action.label}
    </Button>
  );
}

export default function AdminCampaignsPage() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<Tab>('SUBMITTED');
  const [page, setPage] = React.useState(1);
  const [pending, setPending] = React.useState<string | null>(null);
  const [reasonFor, setReasonFor] = React.useState<{ campaign: CampaignSummary; action: Action } | null>(null);

  const counts = useAdminCampaignCounts();
  const list = useAdminCampaigns(tab, page);
  const updateStatus = useUpdateCampaignStatus();

  const total = Object.values(counts.data ?? {}).reduce((sum, n) => sum + (n ?? 0), 0);

  const run = async (campaign: CampaignSummary, action: Action, reason?: string) => {
    setPending(`${campaign.id}:${action.label}`);
    try {
      for (const status of action.steps) {
        await updateStatus.mutateAsync({ campaignId: campaign.id, status, reason });
      }
      toast({ title: `${action.label}: done`, description: campaign.title });
      setReasonFor(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Could not ${action.label.toLowerCase()}`,
        description: apiErrorMessage(error),
      });
    } finally {
      setPending(null);
    }
  };

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Campaigns"
        description="Review new campaigns before they go live, and keep an eye on everything already running."
      />

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Campaign status" className="flex w-max gap-1.5">
          {TABS.map(({ key, label }) => {
            const count = key === 'ALL' ? total : (counts.data?.[key] ?? 0);
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary',
                )}
              >
                {label}
                <span
                  className={cn(
                    'tabular rounded-full px-1.5 text-xs',
                    active ? 'bg-white/20' : key === 'SUBMITTED' && count > 0 ? 'bg-destructive text-white' : 'bg-secondary',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Panel bodyClassName="p-0">
        {list.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : list.error ? (
          <EmptyState icon={Inbox} title="Campaigns could not be loaded" body={apiErrorMessage(list.error)} />
        ) : !rows.length ? (
          <EmptyState
            icon={Inbox}
            title={tab === 'SUBMITTED' ? 'Nothing waiting for review' : 'No campaigns here'}
            body={tab === 'SUBMITTED' ? 'New campaigns land here as soon as a fundraiser submits them.' : undefined}
          />
        ) : (
          <ul className="divide-y">
            {rows.map((campaign) => {
              const percent = fundedPercent(campaign.raisedAmount, campaign.targetAmount);
              return (
                <li key={campaign.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {campaign.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- uploaded / remote cover
                        <img src={campaign.coverImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="brand-gradient flex h-full w-full items-center justify-center text-[10px] font-semibold text-white/80">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold leading-snug">{campaign.title}</p>
                        <CampaignStatusBadge status={campaign.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {campaign.creator.firstName} {campaign.creator.lastName} · {campaign.category.name} ·
                        created {formatDate(campaign.createdAt)}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{campaign.story}</p>
                      <div className="mt-2 flex max-w-sm items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div className="viz-bar h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="tabular shrink-0 text-xs font-semibold">
                          {formatMoney(campaign.raisedAmount, campaign.currency, { compact: true })}
                          <span className="font-normal text-muted-foreground">
                            {' '}
                            of {formatMoney(campaign.targetAmount, campaign.currency, { compact: true })}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/campaigns/${campaign.id}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </Link>
                    </Button>
                    {actionsFor(campaign.status).map((action) => (
                      <ActionButton
                        key={action.label}
                        action={action}
                        busy={pending === `${campaign.id}:${action.label}`}
                        onClick={() =>
                          action.needsReason ? setReasonFor({ campaign, action }) : void run(campaign, action)
                        }
                      />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {meta.page} of {meta.totalPages} · {meta.total} campaigns
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>

      <ReasonDialog
        open={Boolean(reasonFor)}
        title={reasonFor ? `${reasonFor.action.label} “${reasonFor.campaign.title}”?` : ''}
        description="The organiser will see this reason, so be specific about what needs to change."
        confirmLabel={reasonFor?.action.label ?? 'Confirm'}
        busy={Boolean(pending)}
        onCancel={() => setReasonFor(null)}
        onConfirm={(reason) => reasonFor && void run(reasonFor.campaign, reasonFor.action, reason)}
      />
    </div>
  );
}
