'use client';

import * as React from 'react';
import { BadgeCheck, CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { EmptyState, PageHeading, Panel } from '@/components/admin/admin-ui';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/currency';
import { usePendingKyc, useReviewKyc } from '@/lib/queries';
import type { PendingKycReview } from '@/lib/types';

export default function AdminKycPage() {
  const { toast } = useToast();
  const { data, isLoading, error } = usePendingKyc();
  const review = useReviewKyc();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<PendingKycReview | null>(null);

  const decide = (item: PendingKycReview, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    if (!item.id) return;
    setBusy(item.id);
    review.mutate(
      { kycId: item.id, status, reason },
      {
        onSuccess: () => {
          toast({
            title: status === 'VERIFIED' ? 'Identity verified' : 'Verification rejected',
            description: item.applicantName ?? item.applicantEmail ?? undefined,
          });
          setRejecting(null);
        },
        onError: (err) =>
          toast({ variant: 'destructive', title: 'Decision not saved', description: apiErrorMessage(err) }),
        onSettled: () => setBusy(null),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Identity checks"
        description="Organisers must be verified before any money can be paid out to them. Check the document matches the person, then decide."
      />

      <Panel bodyClassName="p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={BadgeCheck} title="Checks could not be loaded" body={apiErrorMessage(error)} />
        ) : !data?.length ? (
          <EmptyState
            icon={BadgeCheck}
            title="No documents waiting"
            body="When an organiser submits identity documents they will appear here."
          />
        ) : (
          <ul className="divide-y">
            {data.map((item) => (
              <li key={item.id ?? item.userId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.applicantName ?? 'Unnamed applicant'}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.applicantEmail ?? 'No email'} · submitted {timeAgo(item.submittedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <a href={item.documentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View document
                    </a>
                  </Button>
                  <Button size="sm" variant="success" disabled={busy === item.id} onClick={() => decide(item, 'VERIFIED')}>
                    {busy === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={busy === item.id}
                    onClick={() => setRejecting(item)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ReasonDialog
        open={Boolean(rejecting)}
        title="Reject these documents?"
        description="The organiser will be asked to resubmit, so say what was wrong (blurry, expired, name mismatch…)."
        confirmLabel="Reject"
        busy={Boolean(busy)}
        onCancel={() => setRejecting(null)}
        onConfirm={(reason) => rejecting && decide(rejecting, 'REJECTED', reason)}
      />
    </div>
  );
}
