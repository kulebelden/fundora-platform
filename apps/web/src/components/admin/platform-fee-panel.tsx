'use client';

import * as React from 'react';
import { ArrowRight, History, Loader2, Lock, Percent } from 'lucide-react';
import { EmptyState, Panel } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney, timeAgo } from '@/lib/currency';
import { useAdminPlatformFee, useDonationFees, useMe, useSetPlatformFee } from '@/lib/queries';

/** Mirrors MAX_PLATFORM_FEE_RATE in the API (and its database check). */
const MAX_PERCENT = 25;
const EXAMPLE_GIFT = 100;

function percent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}%`;
}

/**
 * The platform fee, on the Manage audits page. Every admin can see the fee and
 * who changed it when; only the super admin can change it, and every change
 * needs a reason, which is kept in the history below.
 */
export function PlatformFeePanel() {
  const { data: me } = useMe();
  const { data, isLoading, error } = useAdminPlatformFee();
  const { data: fees } = useDonationFees();
  const setFee = useSetPlatformFee();
  const { toast } = useToast();

  const canEdit = me?.role === 'SUPER_ADMIN';
  const current = data?.ratePercent ?? null;

  const [draft, setDraft] = React.useState('');
  const [reason, setReason] = React.useState('');

  // Start the field from the live value once it arrives.
  React.useEffect(() => {
    if (current !== null) setDraft(String(current));
  }, [current]);

  const parsed = draft.trim() === '' ? NaN : Number(draft);
  const validNumber = Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_PERCENT && /^\d+(\.\d{1,2})?$/.test(draft.trim());
  const changed = validNumber && current !== null && parsed !== current;
  const canSave = canEdit && changed && reason.trim().length >= 5 && !setFee.isPending;

  const preview = validNumber ? parsed : (current ?? 0);
  const platformCut = (EXAMPLE_GIFT * preview) / 100;
  const cardCut = (EXAMPLE_GIFT * (fees?.cardProcessingFeePercent ?? 2.9)) / 100;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setFee.mutate(
      { ratePercent: parsed, reason: reason.trim() },
      {
        onSuccess: (change) => {
          setReason('');
          toast({
            title: `Platform fee is now ${percent(change.ratePercent)}`,
            description: 'New donations use it from now on. Donations already in progress keep the rate they were quoted.',
          });
        },
        onError: (err) =>
          toast({ title: 'Could not change the fee', description: apiErrorMessage(err), variant: 'destructive' }),
      },
    );
  };

  if (error) {
    return (
      <Panel>
        <EmptyState icon={Percent} title="The platform fee could not be loaded" body={apiErrorMessage(error)} />
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel
        className="lg:col-span-3"
        title="Platform fee"
        description="HopeNest's share of every donation. A change applies to donations started after it is saved."
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current fee</p>
            {isLoading || current === null ? (
              <Skeleton className="mt-2 h-12 w-28" />
            ) : (
              <p className="tabular mt-1 text-5xl font-extrabold tracking-tight">{percent(current)}</p>
            )}
          </div>
          <div className="w-full min-w-0 rounded-xl bg-secondary/60 p-4 text-sm sm:w-auto sm:flex-1">
            <p className="font-semibold">
              On a {formatMoney(EXAMPLE_GIFT, 'USD', { hideFraction: true })} card donation at {percent(preview)}
            </p>
            <dl className="mt-2 grid grid-cols-3 gap-3 text-xs leading-tight">
              <div>
                <dt className="text-muted-foreground">Platform</dt>
                <dd className="tabular font-bold">{formatMoney(platformCut, 'USD')}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Card processing</dt>
                <dd className="tabular font-bold">{formatMoney(cardCut, 'USD')}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Campaign receives</dt>
                <dd className="tabular font-bold text-success">
                  {formatMoney(EXAMPLE_GIFT - platformCut - cardCut, 'USD')}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {canEdit ? (
          <form onSubmit={submit} className="mt-6 space-y-4 border-t pt-6">
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="fee-percent">New fee</Label>
                <div className="relative">
                  <Input
                    id="fee-percent"
                    inputMode="decimal"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.replace(',', '.'))}
                    aria-invalid={draft !== '' && !validNumber}
                    aria-describedby="fee-percent-help"
                    className="tabular pr-9 text-lg font-bold"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
                <p id="fee-percent-help" className={draft !== '' && !validNumber ? 'text-xs font-medium text-destructive' : 'text-xs text-muted-foreground'}>
                  0 to {MAX_PERCENT}, up to two decimals.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fee-reason">Reason for the change</Label>
                <textarea
                  id="fee-reason"
                  rows={3}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="For example: lowered for the winter giving campaign, as agreed by the board on 1 Oct."
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Kept in the fee history. At least 5 characters.</p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Fundraisers see the new fee on the pricing page and donate form straight away.
              </p>
              <Button type="submit" disabled={!canSave} className="w-full sm:w-auto">
                {setFee.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {changed && current !== null ? (
                  <>
                    Change {percent(current)} <ArrowRight className="h-3.5 w-3.5" /> {percent(parsed)}
                  </>
                ) : (
                  'Save fee'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-6 flex items-center gap-2 border-t pt-5 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            Only the super admin can change the platform fee.
          </p>
        )}
      </Panel>

      <Panel className="lg:col-span-2" title="Fee history" description="Every change, newest first.">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data?.history.length ? (
          <ol className="relative space-y-5 border-l pl-5">
            {data.history.map((change) => (
              <li key={change.id} className="relative">
                <span aria-hidden className="absolute -left-[1.6rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
                  {change.previousRatePercent !== null ? (
                    <>
                      <span className="tabular text-muted-foreground line-through">{percent(change.previousRatePercent)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </>
                  ) : null}
                  <span className="tabular">{percent(change.ratePercent)}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{change.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {change.changedBy ?? 'System'} · {timeAgo(change.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={History} title="No changes yet" />
        )}
      </Panel>
    </div>
  );
}
