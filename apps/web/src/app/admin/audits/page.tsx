'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  HandCoins,
  Loader2,
  Lock,
  Search,
  Smartphone,
  UserCircle2,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { EmptyState, MoneyList, PageHeading, Panel, StatTile } from '@/components/admin/admin-ui';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { KycStatusBadge, WithdrawalStatusBadge } from '@/components/status-badge';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney, formatNumber, timeAgo } from '@/lib/currency';
import {
  useAdminDonations,
  useAdminOverview,
  useAdminWithdrawalAudit,
  useReviewWithdrawal,
} from '@/lib/queries';
import type {
  DonationAuditRow,
  PaymentChannel,
  TransactionStatus,
  WithdrawalAuditRow,
  WithdrawalStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------- labels */

const DONATION_STATUS: Record<TransactionStatus, { label: string; variant: BadgeProps['variant']; Icon: LucideIcon }> = {
  PENDING: { label: 'Pending', variant: 'warm', Icon: Clock },
  PROCESSING: { label: 'Processing', variant: 'accent', Icon: CircleDashed },
  SUCCESS: { label: 'Settled', variant: 'success', Icon: CheckCircle2 },
  FAILED: { label: 'Failed', variant: 'destructive', Icon: XCircle },
  REVERSED: { label: 'Reversed', variant: 'destructive', Icon: XCircle },
};

const CHANNELS: Record<PaymentChannel, { label: string; Icon: LucideIcon }> = {
  CARD: { label: 'Card', Icon: CreditCard },
  BANK_TRANSFER: { label: 'Bank transfer', Icon: Building2 },
  MTN_MOMO: { label: 'MTN Mobile Money', Icon: Smartphone },
  AIRTEL_MONEY: { label: 'Airtel Money', Icon: Smartphone },
};

function DonationStatusBadge({ status }: { status: TransactionStatus }) {
  const look = DONATION_STATUS[status] ?? { label: status, variant: 'secondary' as const, Icon: CircleDashed };
  return (
    <Badge variant={look.variant}>
      <look.Icon className="h-3 w-3" />
      {look.label}
    </Badge>
  );
}

function ChannelLabel({ channel }: { channel: PaymentChannel }) {
  const look = CHANNELS[channel] ?? { label: channel, Icon: Wallet };
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <look.Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {look.label}
    </span>
  );
}

function dateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function mask(value: unknown): string {
  const text = typeof value === 'string' ? value : '';
  if (!text) return '—';
  return text.length <= 4 ? text : `•••• ${text.slice(-4)}`;
}

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function Pager({
  page,
  total,
  limit,
  noun,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  noun: string;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pages} · {formatNumber(total)} {noun}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- withdrawals */

const WITHDRAWAL_FILTERS: Array<{ key: WithdrawalStatus | 'ALL'; label: string }> = [
  { key: 'PENDING_REVIEW', label: 'Awaiting approval' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'COMPLETED', label: 'Paid out' },
  { key: 'REJECTED', label: 'Refused' },
  { key: 'ALL', label: 'All' },
];

function WithdrawalCard({
  item,
  busy,
  onApprove,
  onRefuse,
}: {
  item: WithdrawalAuditRow;
  busy: boolean;
  onApprove: () => void;
  onRefuse: () => void;
}) {
  const [reveal, setReveal] = React.useState(false);
  const bank = item.bankAccountDetails;
  const verified = item.organiser.kycStatus === 'VERIFIED';
  const awaiting = item.status === 'PENDING_REVIEW';

  return (
    <li className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="tabular text-2xl font-extrabold">{formatMoney(item.netAmount, item.currency)}</p>
            <WithdrawalStatusBadge status={item.status} />
            <span className="text-xs text-muted-foreground">requested {timeAgo(item.createdAt)}</span>
          </div>

          <p className="text-sm">
            from{' '}
            <Link href={`/campaigns/${item.campaign.slug}`} target="_blank" className="font-semibold hover:underline">
              {item.campaign.title}
            </Link>
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-secondary/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organiser</p>
              <p className="mt-1 font-semibold">{item.organiser.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.organiser.email}</p>
              {item.organiser.phoneNumber ? (
                <p className="text-xs text-muted-foreground">{item.organiser.phoneNumber}</p>
              ) : null}
              <div className="mt-2">
                {item.organiser.kycStatus ? (
                  <KycStatusBadge status={item.organiser.kycStatus} />
                ) : (
                  <Badge variant="secondary">Identity not submitted</Badge>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-secondary/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amounts</p>
              <dl className="mt-1 space-y-0.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Gross</dt>
                  <dd className="tabular font-semibold">{formatMoney(item.grossAmount, item.currency)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Service fee</dt>
                  <dd className="tabular font-semibold">− {formatMoney(item.serviceFee, item.currency)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t pt-0.5">
                  <dt className="font-semibold">Net payout</dt>
                  <dd className="tabular font-extrabold">{formatMoney(item.netAmount, item.currency)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border bg-secondary/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pay to</p>
                <button
                  type="button"
                  onClick={() => setReveal((value) => !value)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                >
                  {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {reveal ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <p className="mt-1 font-semibold">{String(bank.accountName ?? '—')}</p>
              <p className="text-xs text-muted-foreground">{String(bank.bankName ?? '—')}</p>
              <p className="tabular text-xs">
                Account {reveal ? String(bank.accountNumber ?? '—') : mask(bank.accountNumber)}
              </p>
              <p className="tabular text-xs text-muted-foreground">
                SWIFT {String(bank.swiftBic ?? '—')}
                {bank.iban ? ` · IBAN ${reveal ? String(bank.iban) : mask(bank.iban)}` : ''}
              </p>
            </div>
          </div>

          {item.rejectionReason ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Refused: {item.rejectionReason}
            </p>
          ) : null}
          {item.reviewedAt ? (
            <p className="text-xs text-muted-foreground">
              Reviewed {dateTime(item.reviewedAt)}
              {item.payoutReference ? ` · payout ref ${item.payoutReference}` : ''}
            </p>
          ) : null}
        </div>

        {awaiting ? (
          <div className="flex shrink-0 flex-col gap-2 xl:w-48">
            {!verified ? (
              <p className="flex items-start gap-1.5 rounded-lg bg-warm/15 px-3 py-2 text-xs font-medium text-[#8a5200]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Organiser&apos;s identity is not verified yet.
              </p>
            ) : null}
            <Button variant="success" disabled={busy} onClick={onApprove}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve payout
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" disabled={busy} onClick={onRefuse}>
              <XCircle className="h-4 w-4" />
              Refuse
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function WithdrawalsTab() {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<WithdrawalStatus | 'ALL'>('PENDING_REVIEW');
  const [page, setPage] = React.useState(1);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [refusing, setRefusing] = React.useState<WithdrawalAuditRow | null>(null);
  const { data, isLoading, error } = useAdminWithdrawalAudit(status, page);
  const review = useReviewWithdrawal();

  const decide = (item: WithdrawalAuditRow, decision: 'APPROVED' | 'REJECTED', reason?: string) => {
    setBusy(item.id);
    review.mutate(
      { withdrawalId: item.id, status: decision, reason },
      {
        onSuccess: () => {
          toast({
            title: decision === 'APPROVED' ? 'Payout approved' : 'Payout refused',
            description: `${formatMoney(item.netAmount, item.currency)} · ${item.organiser.name}`,
          });
          setRefusing(null);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Decision not saved', description: apiErrorMessage(err) }),
        onSettled: () => setBusy(null),
      },
    );
  };

  const counts = data?.byStatus ?? {};
  const all = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1.5">
          {WITHDRAWAL_FILTERS.map(({ key, label }) => {
            const count = key === 'ALL' ? all : (counts[key] ?? 0);
            const active = status === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setStatus(key);
                  setPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary',
                )}
              >
                {label}
                <span
                  className={cn(
                    'tabular rounded-full px-1.5 text-xs',
                    active ? 'bg-white/20' : key === 'PENDING_REVIEW' && count > 0 ? 'bg-destructive text-white' : 'bg-secondary',
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
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Wallet} title="Withdrawals could not be loaded" body={apiErrorMessage(error)} />
        ) : !data?.data.length ? (
          <EmptyState
            icon={Wallet}
            title={status === 'PENDING_REVIEW' ? 'No payouts waiting for approval' : 'Nothing here'}
            body={status === 'PENDING_REVIEW' ? 'When an organiser asks to withdraw, the request lands here.' : undefined}
          />
        ) : (
          <ul className="divide-y">
            {data.data.map((item) => (
              <WithdrawalCard
                key={item.id}
                item={item}
                busy={busy === item.id}
                onApprove={() => decide(item, 'APPROVED')}
                onRefuse={() => setRefusing(item)}
              />
            ))}
          </ul>
        )}
        {data ? <Pager page={page} total={data.total} limit={data.limit} noun="requests" onPage={setPage} /> : null}
      </Panel>

      <ReasonDialog
        open={Boolean(refusing)}
        title="Refuse this payout?"
        description="The funds stay in the campaign wallet and the organiser sees your reason."
        confirmLabel="Refuse payout"
        busy={Boolean(busy)}
        onCancel={() => setRefusing(null)}
        onConfirm={(reason) => refusing && decide(refusing, 'REJECTED', reason)}
      />
    </div>
  );
}

/* ------------------------------------------------------------- donations */

function DonationDetail({ donation, onClose }: { donation: DonationAuditRow | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(donation)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
        {donation ? (
          <>
            <DialogHeader>
              <DialogTitle className="tabular text-2xl">{formatMoney(donation.amount, donation.currency)}</DialogTitle>
              <DialogDescription>
                to{' '}
                <Link href={`/campaigns/${donation.campaign.slug}`} target="_blank" className="font-semibold text-foreground hover:underline">
                  {donation.campaign.title}
                </Link>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <DonationStatusBadge status={donation.status} />
                <Badge variant="secondary">
                  <ChannelLabel channel={donation.channel} />
                </Badge>
                {donation.isAnonymous ? <Badge variant="outline">Anonymous to the public</Badge> : null}
              </div>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What the donor entered
                </h3>
                <dl className="mt-2 divide-y rounded-xl border">
                  {[
                    ['Full name', donation.donorName],
                    ['Email', donation.donorEmail],
                    ['Phone', donation.donorPhone],
                    ['Payment method', CHANNELS[donation.channel]?.label ?? donation.channel],
                    ['Show name publicly', donation.isAnonymous ? 'No (anonymous)' : 'Yes'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-semibold">
                        {value || <span className="font-normal text-muted-foreground">Not given</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
                {donation.donorMessage ? (
                  <blockquote className="mt-3 rounded-xl border-l-4 border-success bg-success/5 px-4 py-3 text-sm italic">
                    “{donation.donorMessage}”
                  </blockquote>
                ) : null}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h3>
                {donation.account ? (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border px-4 py-3">
                    <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">{donation.account.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {donation.account.email}
                        {donation.account.phoneNumber ? ` · ${donation.account.phoneNumber}` : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Guest donation (not signed in).</p>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Record</h3>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Payment reference</dt>
                    <dd className="break-all text-right font-mono text-xs">{donation.providerReference ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Started</dt>
                    <dd>{dateTime(donation.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Last updated</dt>
                    <dd>{dateTime(donation.updatedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Internal ID</dt>
                    <dd className="font-mono text-xs">{donation.id}</dd>
                  </div>
                </dl>
              </section>

              <p className="flex items-start gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Card numbers are typed on the payment processor&apos;s secure page and never reach HopeNest, so
                they are not part of this record.
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  // Neutralise spreadsheet formulas and quote every field.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportCsv(rows: DonationAuditRow[]) {
  const header = [
    'Date', 'Status', 'Method', 'Amount', 'Currency', 'Donor name', 'Donor email', 'Donor phone',
    'Message', 'Anonymous', 'Account email', 'Campaign', 'Payment reference',
  ];
  const lines = rows.map((r) =>
    [
      r.createdAt, r.status, r.channel, r.amount, r.currency, r.donorName, r.donorEmail, r.donorPhone,
      r.donorMessage, r.isAnonymous ? 'yes' : 'no', r.account?.email, r.campaign.title, r.providerReference,
    ]
      .map(csvEscape)
      .join(','),
  );
  const blob = new Blob([[header.map(csvEscape).join(','), ...lines].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hopenest-donations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function DonationsTab() {
  const [status, setStatus] = React.useState<TransactionStatus | 'ALL'>('ALL');
  const [channel, setChannel] = React.useState<PaymentChannel | 'ALL'>('ALL');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<DonationAuditRow | null>(null);
  const search = useDebounced(query.trim());

  React.useEffect(() => setPage(1), [status, channel, search]);

  const { data, isLoading, isFetching, error } = useAdminDonations({ status, channel, search, page });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search donor name, email, phone, campaign or reference"
            aria-label="Search donations"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select value={status} onChange={(e) => setStatus(e.target.value as TransactionStatus | 'ALL')} aria-label="Status" className="sm:w-40">
            <option value="ALL">All statuses</option>
            {(Object.keys(DONATION_STATUS) as TransactionStatus[]).map((key) => (
              <option key={key} value={key}>
                {DONATION_STATUS[key].label} ({data?.byStatus[key] ?? 0})
              </option>
            ))}
          </Select>
          <Select value={channel} onChange={(e) => setChannel(e.target.value as PaymentChannel | 'ALL')} aria-label="Payment method" className="sm:w-48">
            <option value="ALL">All payment methods</option>
            {(Object.keys(CHANNELS) as PaymentChannel[]).map((key) => (
              <option key={key} value={key}>
                {CHANNELS[key].label}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            className="col-span-2 sm:col-auto"
            disabled={!data?.data.length}
            onClick={() => data && exportCsv(data.data)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Panel bodyClassName="p-0" className={cn(isFetching && !isLoading && 'opacity-80 transition-opacity')}>
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={HandCoins} title="Donations could not be loaded" body={apiErrorMessage(error)} />
        ) : !data?.data.length ? (
          <EmptyState
            icon={HandCoins}
            title={search ? `No donations match “${search}”` : 'No donations yet'}
            body="Every donation started on the site is recorded here, including ones that did not complete."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <caption className="sr-only">Donations</caption>
              <thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Donor</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Campaign</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Method</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Amount</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((donation) => (
                  <tr
                    key={donation.id}
                    tabIndex={0}
                    onClick={() => setSelected(donation)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(donation);
                      }
                    }}
                    className="cursor-pointer hover:bg-secondary/40 focus-visible:bg-secondary/60 focus-visible:outline-none"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">{dateTime(donation.createdAt)}</td>
                    <td className="px-3 py-3">
                      <p className="flex items-center gap-1.5 font-semibold">
                        {donation.donorName ?? donation.account?.name ?? 'Not given'}
                        {donation.isAnonymous ? (
                          <span className="rounded bg-secondary px-1.5 py-px text-[10px] font-semibold text-muted-foreground">anon</span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {donation.donorEmail ?? donation.account?.email ?? '—'}
                        {donation.donorPhone ? ` · ${donation.donorPhone}` : ''}
                      </p>
                    </td>
                    <td className="max-w-[16rem] px-3 py-3">
                      <p className="truncate">{donation.campaign.title}</p>
                    </td>
                    <td className="px-3 py-3">
                      <ChannelLabel channel={donation.channel} />
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-3 text-right font-bold">
                      {formatMoney(donation.amount, donation.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <DonationStatusBadge status={donation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data ? <Pager page={page} total={data.total} limit={data.limit} noun="donations" onPage={setPage} /> : null}
      </Panel>

      <DonationDetail donation={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function AdminAuditsPage() {
  const [tab, setTab] = React.useState<'withdrawals' | 'donations'>('withdrawals');
  const { data: overview } = useAdminOverview();
  const settled = overview?.donations.settled ?? 0;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Manage audits"
        description="Approve payouts to organisers, and trace every donation back to the person who made it."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Payouts to approve"
          icon={Wallet}
          tint={overview?.queues.withdrawalsAwaitingReview ? 'bg-warm text-[#1a1000]' : 'bg-success/12 text-success'}
          value={formatNumber(overview?.queues.withdrawalsAwaitingReview ?? 0)}
          context={
            <MoneyList
              amounts={overview?.withdrawals.pendingByCurrency ?? []}
              emptyLabel="Nothing outstanding"
            />
          }
        />
        <StatTile
          label="Paid out"
          icon={CheckCircle2}
          tint="bg-primary/10 text-primary"
          value={<MoneyList amounts={overview?.withdrawals.paidOutByCurrency ?? []} emptyLabel="—" size="lg" />}
          context="Net amounts sent to organisers"
        />
        <StatTile
          label="Settled donations"
          icon={HandCoins}
          tint="bg-success/12 text-success"
          value={formatNumber(settled)}
          context={<MoneyList amounts={overview?.donations.raisedByCurrency ?? []} emptyLabel="No money settled yet" />}
        />
        <StatTile
          label="Not yet settled"
          icon={Clock}
          tint="bg-secondary text-foreground"
          value={formatNumber(overview?.donations.pending ?? 0)}
          context={`${formatNumber(overview?.donations.failed ?? 0)} failed or reversed`}
        />
      </div>

      <div role="tablist" aria-label="Audit area" className="inline-flex rounded-xl border bg-card p-1 shadow-sm">
        {(
          [
            { key: 'withdrawals', label: 'Withdrawals', icon: Wallet, count: overview?.queues.withdrawalsAwaitingReview ?? 0 },
            { key: 'donations', label: 'Donations & donors', icon: HandCoins, count: 0 },
          ] as const
        ).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 ? (
              <span className="tabular rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">{count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'withdrawals' ? <WithdrawalsTab /> : <DonationsTab />}
    </div>
  );
}
