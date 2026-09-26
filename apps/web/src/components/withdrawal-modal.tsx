'use client';

import * as React from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertTriangle, ArrowRight, Banknote, Landmark, Loader2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { toast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { fractionDigits, formatMoney } from '@/lib/currency';
import { WITHDRAWAL_FEE_LABEL, previewWithdrawal } from '@/lib/fees';
import { useKycStatus, useRequestWithdrawal } from '@/lib/queries';
import type { KycStatus } from '@/lib/types';

/** ISO 9362: 6 letters, 2 alphanumerics, and an optional 3-character branch code. */
const SWIFT_BIC = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
const IBAN = /^[A-Za-z]{2}\d{2}[A-Za-z0-9]{11,30}$/;

/**
 * Amount stays a string through validation. Coercing inside zod makes the schema's input
 * type `unknown`, which then fights useForm's generics for no benefit.
 */
function buildSchema(maxAmount: number) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, 'Enter an amount')
      .refine((value) => Number.isFinite(Number(value)), 'Enter a valid amount')
      .refine((value) => Number(value) > 0, 'Amount must be greater than zero')
      .refine((value) => Number(value) <= maxAmount, 'Amount exceeds your cleared balance'),
    bankName: z.string().trim().min(2, 'Bank name is required').max(200),
    accountName: z.string().trim().min(2, 'Account holder name is required').max(200),
    accountNumber: z.string().trim().min(4, 'Account number is required').max(64),
    swiftBic: z
      .string()
      .trim()
      .regex(SWIFT_BIC, 'Enter a valid 8 or 11 character SWIFT/BIC'),
    iban: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || IBAN.test(value.replace(/\s/g, '')), 'Enter a valid IBAN'),
    country: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^[A-Za-z]{2}$/.test(value), 'Use a 2-letter country code'),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function WithdrawalModal({
  campaignId,
  currency,
  clearedBalance,
  open,
  onOpenChange,
}: {
  campaignId: string;
  currency: string;
  clearedBalance: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const available = Number(clearedBalance) || 0;
  const zeroDecimal = fractionDigits(currency) === 0;

  const { data: kyc, isLoading: kycLoading } = useKycStatus();
  const requestWithdrawal = useRequestWithdrawal();

  const schema = React.useMemo(() => buildSchema(available), [available]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
      swiftBic: '',
      iban: '',
      country: '',
    },
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (open) {
      reset();
      requestWithdrawal.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amountValue = Number(watch('amount'));
  const preview = previewWithdrawal(amountValue, zeroDecimal);

  const kycStatus: KycStatus = kyc?.status ?? 'NOT_STARTED';
  const kycBlocked = !kycLoading && kycStatus !== 'VERIFIED';

  const onSubmit = (values: FormValues) => {
    requestWithdrawal.mutate(
      {
        campaignId,
        amount: Number(values.amount),
        currency,
        bankDetails: {
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          swiftBic: values.swiftBic.toUpperCase(),
          iban: values.iban ? values.iban.replace(/\s/g, '').toUpperCase() : undefined,
          accountName: values.accountName,
          country: values.country ? values.country.toUpperCase() : undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast({
            variant: 'success',
            title: 'Withdrawal submitted for review',
            description: `${formatMoney(data.netAmount, data.currency)} will reach your bank once a finance officer approves it.`,
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Withdrawal request failed',
            description: apiErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request a withdrawal</DialogTitle>
          <DialogDescription>
            Funds are paid to your bank after a finance officer approves the request.
          </DialogDescription>
        </DialogHeader>

        {kycBlocked ? (
          <KycGate status={kycStatus} onClose={() => onOpenChange(false)} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ------------------------------------------------ amount */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="wd-amount">Amount to withdraw</Label>
                <span className="tabular text-xs text-muted-foreground">
                  Available {formatMoney(available, currency)}
                </span>
              </div>
              <Input
                id="wd-amount"
                inputMode="decimal"
                placeholder="0.00"
                className="tabular text-base font-semibold"
                aria-invalid={Boolean(errors.amount)}
                {...register('amount')}
              />
              {errors.amount ? (
                <p className="text-xs font-medium text-destructive">{errors.amount.message}</p>
              ) : null}
            </div>

            {/* ------------------------------------------- fee breakdown */}
            <div className="rounded-xl border bg-secondary/40 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Banknote className="h-4 w-4" />
                Payout breakdown
              </p>

              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Gross amount</dt>
                  <dd className="tabular font-semibold">
                    {formatMoney(preview.gross, currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    Platform service fee
                    <Badge variant="warm">{WITHDRAWAL_FEE_LABEL}</Badge>
                  </dt>
                  <dd className="tabular font-semibold text-destructive">
                    −{formatMoney(preview.fee, currency)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t pt-2.5">
                  <dt className="font-bold">Net to your bank</dt>
                  <dd className="tabular text-lg font-extrabold text-success">
                    {formatMoney(preview.net, currency)}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                This is an estimate. The server recalculates the fee when the request is
                created, and its figures are the ones that apply.
              </p>
            </div>

            {/* ------------------------------------------- bank details */}
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                Bank account details
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="wd-bankName"
                  label="Bank name"
                  placeholder="Stanbic Bank Uganda"
                  error={errors.bankName?.message}
                  {...register('bankName')}
                />
                <Field
                  id="wd-accountName"
                  label="Account holder name"
                  placeholder="As it appears on the account"
                  error={errors.accountName?.message}
                  {...register('accountName')}
                />
                <Field
                  id="wd-accountNumber"
                  label="Account number"
                  placeholder="9030001234567"
                  error={errors.accountNumber?.message}
                  {...register('accountNumber')}
                />
                <Field
                  id="wd-swiftBic"
                  label="SWIFT / BIC"
                  placeholder="SBICUGKX"
                  error={errors.swiftBic?.message}
                  className="uppercase"
                  {...register('swiftBic')}
                />
                <Field
                  id="wd-iban"
                  label="IBAN"
                  hint="Optional"
                  placeholder="GB29NWBK60161331926819"
                  error={errors.iban?.message}
                  className="uppercase"
                  {...register('iban')}
                />
                <Field
                  id="wd-country"
                  label="Bank country"
                  hint="Optional · ISO code"
                  placeholder="UG"
                  maxLength={2}
                  error={errors.country?.message}
                  className="uppercase"
                  {...register('country')}
                />
              </div>
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warm" />
              Check these details carefully. Transfers sent to an incorrect account are
              difficult to recall.
            </p>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="lg"
                disabled={requestWithdrawal.isPending || preview.net <= 0}
              >
                {requestWithdrawal.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Request {formatMoney(preview.net, currency)}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ id, label, hint, error, ...props }, ref) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-baseline gap-2">
        {label}
        {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
      </Label>
      <Input id={id} ref={ref} aria-invalid={Boolean(error)} {...props} />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  ),
);
Field.displayName = 'Field';

function KycGate({ status, onClose }: { status: KycStatus; onClose: () => void }) {
  const copy: Record<KycStatus, { title: string; body: string }> = {
    NOT_STARTED: {
      title: 'Verify your identity first',
      body: 'Withdrawals are released only to verified fundraisers. Submit a national ID or passport to unlock payouts.',
    },
    SUBMITTED: {
      title: 'Verification in progress',
      body: 'Your documents are with our compliance team. You can request a withdrawal as soon as they are approved.',
    },
    REJECTED: {
      title: 'Verification was rejected',
      body: 'Your last submission could not be verified. Submit a clearer document to try again.',
    },
    VERIFIED: { title: '', body: '' },
  };

  const { title, body } = copy[status];

  return (
    <div className="py-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warm/15">
        <ShieldAlert className="h-7 w-7 text-warm" />
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        {status !== 'SUBMITTED' ? (
          <Button asChild>
            <Link href="/dashboard/verification">Start verification</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
