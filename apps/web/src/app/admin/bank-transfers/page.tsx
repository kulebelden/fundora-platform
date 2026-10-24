'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Landmark,
  Loader2,
  Lock,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { EmptyState, PageHeading, Panel } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { formatMoney, timeAgo } from '@/lib/currency';
import {
  useBankTransferConfirmations,
  useConfirmBankTransfer,
  usePendingBankTransfers,
} from '@/lib/queries';
import type { BankTransferConfirmation, PendingBankTransfer } from '@/lib/types';

export default function AdminBankTransfersPage() {
  const pending = usePendingBankTransfers();
  const confirmed = useBankTransferConfirmations();
  const [confirming, setConfirming] = React.useState<PendingBankTransfer | null>(null);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Bank transfers"
        description="Match each transfer on the bank statement to its donation reference, then mark it received. That credits the campaign, is recorded permanently against your name, and every super admin is emailed a copy."
      />

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Awaiting confirmation{pending.data ? ` (${pending.data.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Panel bodyClassName="p-0">
            {pending.isLoading ? (
              <LoadingRows />
            ) : pending.error ? (
              <EmptyState icon={Landmark} title="Transfers could not be loaded" body={apiErrorMessage(pending.error)} />
            ) : !pending.data?.length ? (
              <EmptyState
                icon={Landmark}
                title="Nothing waiting"
                body="Pledged bank transfers appear here until someone matches them to the bank statement."
              />
            ) : (
              <ul className="divide-y">
                {pending.data.map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="tabular text-lg font-extrabold">{formatMoney(item.amount, item.currency)}</p>
                      <p className="font-mono text-xs font-semibold">{item.reference}</p>
                      <p className="text-sm">
                        {item.donorName ?? 'Donor'}
                        {item.donorEmail ? <span className="text-muted-foreground"> · {item.donorEmail}</span> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        to{' '}
                        <Link
                          href={`/campaigns/${item.campaign.slug}`}
                          target="_blank"
                          className="font-semibold hover:underline"
                        >
                          {item.campaign.title}
                          <ExternalLink className="ml-0.5 inline h-3 w-3" />
                        </Link>{' '}
                        · pledged {timeAgo(item.createdAt)}
                      </p>
                    </div>
                    <Button variant="success" onClick={() => setConfirming(item)} className="shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                      Mark received
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="confirmed" className="mt-4">
          <ConfirmedPanel
            items={confirmed.data}
            loading={confirmed.isLoading}
            error={confirmed.error ? apiErrorMessage(confirmed.error) : null}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog item={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function ConfirmDialog({ item, onClose }: { item: PendingBankTransfer | null; onClose: () => void }) {
  const { toast } = useToast();
  const confirm = useConfirmBankTransfer();
  const [bankReference, setBankReference] = React.useState('');
  const [amountReceived, setAmountReceived] = React.useState('');
  const [receivedOn, setReceivedOn] = React.useState(todayIso);
  const [note, setNote] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (!item) return;
    setBankReference('');
    setAmountReceived('');
    setReceivedOn(todayIso());
    setNote('');
    setPassword('');
    confirm.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) return null;

  const expected = Number(item.amount);
  const amountMatches = amountReceived !== '' && Number(amountReceived) === expected;
  const ready = bankReference.trim().length >= 4 && amountMatches && receivedOn && password.length > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    confirm.mutate(
      {
        id: item.id,
        bankReference: bankReference.trim(),
        amountReceived: amountReceived.trim(),
        receivedOn,
        note: note.trim() || undefined,
        password,
      },
      {
        onSuccess: (data) => {
          toast({
            variant: 'success',
            title: 'Transfer confirmed',
            description: `${formatMoney(data.amountReceived, data.currency)} credited to ${data.campaign.title}.`,
          });
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Mark transfer received</DialogTitle>
            <DialogDescription>
              Only confirm money you can see on the bank statement. This credits the campaign and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <dl className="mt-5 space-y-2 rounded-xl border bg-secondary/40 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Donation reference</dt>
              <dd className="font-mono text-xs font-semibold">{item.reference}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Pledged</dt>
              <dd className="tabular font-bold">{formatMoney(item.amount, item.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Campaign</dt>
              <dd className="truncate text-right">{item.campaign.title}</dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bt-reference">Bank statement reference</Label>
              <Input
                id="bt-reference"
                value={bankReference}
                maxLength={64}
                placeholder="As printed on the statement"
                className="font-mono uppercase"
                onChange={(event) => setBankReference(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bt-amount">Amount received ({item.currency})</Label>
              <Input
                id="bt-amount"
                inputMode="decimal"
                value={amountReceived}
                placeholder={expected.toFixed(2)}
                className="tabular"
                onChange={(event) => setAmountReceived(event.target.value.replace(/[^\d.]/g, ''))}
                aria-invalid={amountReceived !== '' && !amountMatches}
              />
              {amountReceived !== '' && !amountMatches ? (
                <p className="text-xs font-medium text-destructive">
                  Must equal the pledge. For a different amount, contact the donor first.
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bt-date">Received on</Label>
              <Input
                id="bt-date"
                type="date"
                value={receivedOn}
                max={todayIso()}
                onChange={(event) => setReceivedOn(event.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bt-note" className="flex items-baseline gap-2">
                Note <span className="text-xs font-normal text-muted-foreground">Optional</span>
              </Label>
              <Input
                id="bt-note"
                value={note}
                maxLength={500}
                placeholder="Anything finance should know"
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bt-password" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Your password
              </Label>
              <Input
                id="bt-password"
                type="password"
                autoComplete="current-password"
                value={password}
                maxLength={128}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Required for every action that moves money.</p>
            </div>
          </div>

          {confirm.isError ? (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {apiErrorMessage(confirm.error)}
            </p>
          ) : null}

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={!ready || confirm.isPending}>
              {confirm.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Confirm and credit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** The permanent record. Download and Print give finance and super admins their own copy. */
function ConfirmedPanel({
  items,
  loading,
  error,
}: {
  items: BankTransferConfirmation[] | undefined;
  loading: boolean;
  error: string | null;
}) {
  const download = () => {
    if (!items?.length) return;
    const header = [
      'Confirmed at',
      'Donation reference',
      'Bank reference',
      'Amount received',
      'Currency',
      'Received on',
      'Campaign',
      'Donor',
      'Confirmed by',
      'Note',
    ];
    const rows = items.map((item) => [
      item.confirmedAt,
      item.reference,
      item.bankReference,
      item.amountReceived,
      item.currency,
      item.receivedOn,
      item.campaign.title,
      item.donorName ?? '',
      item.confirmedByEmail,
      item.note ?? '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `hopenest-bank-confirmations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel
      title="Confirmation record"
      description="Every confirmation, newest first. Entries are permanent: the database refuses edits and deletes."
      action={
        items?.length ? (
          <div className="flex gap-2 print:hidden">
            <Button size="sm" variant="outline" onClick={download}>
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        ) : null
      }
      bodyClassName="p-0"
    >
      {loading ? (
        <LoadingRows />
      ) : error ? (
        <EmptyState icon={Landmark} title="Record could not be loaded" body={error} />
      ) : !items?.length ? (
        <EmptyState icon={Landmark} title="No confirmations yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-bold">Confirmed</th>
                <th scope="col" className="px-3 py-3 font-bold">References</th>
                <th scope="col" className="px-3 py-3 text-right font-bold">Amount</th>
                <th scope="col" className="px-3 py-3 font-bold">Campaign</th>
                <th scope="col" className="px-5 py-3 font-bold">By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{new Date(item.confirmedAt).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">received {item.receivedOn}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    <p className="font-semibold">{item.bankReference}</p>
                    <p className="text-muted-foreground">{item.reference}</p>
                  </td>
                  <td className="tabular px-3 py-3 text-right font-bold">
                    {formatMoney(item.amountReceived, item.currency)}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{item.campaign.title}</p>
                    <p className="text-xs text-muted-foreground">{item.donorName ?? 'Donor'}</p>
                    {item.note ? <p className="mt-1 text-xs italic text-muted-foreground">{item.note}</p> : null}
                  </td>
                  <td className="px-5 py-3 text-xs">{item.confirmedByEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/** Quotes a CSV cell, and defuses cells a spreadsheet would run as a formula. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
