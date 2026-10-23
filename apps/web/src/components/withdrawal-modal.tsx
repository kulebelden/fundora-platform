'use client';

import * as React from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertTriangle, ArrowRight, Banknote, Globe2, Landmark, Loader2, ShieldAlert } from 'lucide-react';
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
import { Select } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { COUNTRIES, fractionDigits, formatMoney } from '@/lib/currency';
import { WITHDRAWAL_FEE_LABEL, previewWithdrawal } from '@/lib/fees';
import { useKycStatus, useRequestWithdrawal } from '@/lib/queries';
import type { BankAccountDetails, KycStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

/** ISO 9362: 6 letters, 2 alphanumerics, and an optional 3-character branch code. */
const SWIFT_BIC = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;
const IBAN = /^[A-Za-z]{2}\d{2}[A-Za-z0-9]{11,30}$/;

/** ABA routing number: 9 digits whose weighted sum (3, 7, 1 repeating) is a multiple of 10. */
function isAbaRoutingNumber(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const d = value.split('').map(Number);
  return (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0;
}

/**
 * Amount stays a string through validation. Coercing inside zod makes the schema's input
 * type `unknown`, which then fights useForm's generics for no benefit. Which bank fields
 * are required depends on the payout method, so those are checked in superRefine. The
 * API applies the same rules.
 */
function buildSchema(maxAmount: number) {
  return z
    .object({
      method: z.enum(['us_bank', 'international']),
      amount: z
        .string()
        .trim()
        .min(1, 'Enter an amount')
        .refine((value) => Number.isFinite(Number(value)), 'Enter a valid amount')
        .refine((value) => Number(value) > 0, 'Amount must be greater than zero')
        .refine((value) => Number(value) <= maxAmount, 'Amount exceeds your cleared balance'),
      bankName: z.string().trim().min(2, 'Bank name is required').max(200),
      accountNumber: z.string().trim().min(4, 'Account number is required').max(64),
      // International (SWIFT)
      accountName: z.string().trim().max(200).optional(),
      swiftBic: z.string().trim().optional(),
      iban: z.string().trim().optional(),
      country: z.string().trim().optional(),
      // US bank (ACH / wire)
      accountHolder: z.string().trim().max(200).optional(),
      accountType: z.enum(['checking', 'savings']).optional(),
      achRouting: z.string().trim().optional(),
      wireRouting: z.string().trim().optional(),
      bankAddress: z.string().trim().max(300).optional(),
    })
    .superRefine((values, ctx) => {
      const fail = (path: string, message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

      if (values.method === 'us_bank') {
        if (!values.accountHolder || values.accountHolder.length < 2) {
          fail('accountHolder', 'Account holder name is required');
        }
        if (!values.accountType) fail('accountType', 'Choose checking or savings');
        if (!values.achRouting || !isAbaRoutingNumber(values.achRouting)) {
          fail('achRouting', 'Enter a valid 9-digit ACH routing number');
        }
        if (!values.wireRouting || !isAbaRoutingNumber(values.wireRouting)) {
          fail('wireRouting', 'Enter a valid 9-digit wire routing number');
        }
        if (!values.bankAddress || values.bankAddress.length < 5) {
          fail('bankAddress', 'Bank address is required');
        }
        return;
      }

      if (!values.accountName || values.accountName.length < 2) {
        fail('accountName', 'Account holder name is required');
      }
      if (!values.swiftBic || !SWIFT_BIC.test(values.swiftBic)) {
        fail('swiftBic', 'Enter a valid 8 or 11 character SWIFT/BIC');
      }
      if (values.iban && !IBAN.test(values.iban.replace(/\s/g, ''))) {
        fail('iban', 'Enter a valid IBAN');
      }
      const country = values.country?.toUpperCase();
      if (country && !COUNTRIES.some((option) => option.code === country)) {
        fail('country', 'Choose a supported payout country');
      }
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
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'us_bank',
      amount: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      swiftBic: '',
      iban: '',
      country: '',
      accountHolder: '',
      accountType: undefined,
      achRouting: '',
      wireRouting: '',
      bankAddress: '',
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

  const method = watch('method');
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
        bankDetails: toBankDetails(values),
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

              <div role="radiogroup" aria-label="Payout method" className="grid grid-cols-2 gap-2">
                <MethodOption
                  active={method === 'us_bank'}
                  onSelect={() => setValue('method', 'us_bank')}
                  icon={<Landmark className="h-4 w-4" />}
                  title="US bank"
                  subtitle="ACH or wire"
                />
                <MethodOption
                  active={method === 'international'}
                  onSelect={() => setValue('method', 'international')}
                  icon={<Globe2 className="h-4 w-4" />}
                  title="International"
                  subtitle="SWIFT / IBAN"
                />
              </div>

              {method === 'us_bank' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="wd-accountHolder"
                    label="Account holder"
                    placeholder="As it appears on the account"
                    autoComplete="name"
                    error={errors.accountHolder?.message}
                    {...register('accountHolder')}
                  />
                  <Field
                    id="wd-accountNumber"
                    label="Account number"
                    placeholder="000123456789"
                    inputMode="numeric"
                    error={errors.accountNumber?.message}
                    {...register('accountNumber')}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="wd-accountType">Account type</Label>
                    <Select
                      id="wd-accountType"
                      value={watch('accountType') ?? ''}
                      onChange={(event) =>
                        setValue(
                          'accountType',
                          (event.target.value || undefined) as FormValues['accountType'],
                          { shouldValidate: true },
                        )
                      }
                      aria-invalid={Boolean(errors.accountType?.message)}
                    >
                      <option value="">Select account type</option>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </Select>
                    {errors.accountType?.message ? (
                      <p className="text-xs font-medium text-destructive">{errors.accountType.message}</p>
                    ) : null}
                  </div>
                  <Field
                    id="wd-achRouting"
                    label="ACH routing number"
                    placeholder="9 digits"
                    inputMode="numeric"
                    maxLength={9}
                    className="tabular"
                    error={errors.achRouting?.message}
                    {...register('achRouting')}
                  />
                  <Field
                    id="wd-bankName"
                    label="Bank name"
                    placeholder="Chase Bank"
                    error={errors.bankName?.message}
                    {...register('bankName')}
                  />
                  <Field
                    id="wd-bankAddress"
                    label="Bank address"
                    placeholder="270 Park Avenue, New York, NY 10017"
                    error={errors.bankAddress?.message}
                    {...register('bankAddress')}
                  />
                  <Field
                    id="wd-wireRouting"
                    label="Wire routing number"
                    hint="Often the same as ACH"
                    placeholder="9 digits"
                    inputMode="numeric"
                    maxLength={9}
                    className="tabular"
                    error={errors.wireRouting?.message}
                    {...register('wireRouting')}
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="wd-bankName"
                    label="Bank name"
                    placeholder="Barclays"
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
                    placeholder="BARCGB22"
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
                  <div className="space-y-1.5">
                    <Label htmlFor="wd-country" className="flex items-baseline gap-2">
                      Bank country
                      <span className="text-xs font-normal text-muted-foreground">
                        Optional · supported markets only
                      </span>
                    </Label>
                    <Select
                      id="wd-country"
                      value={watch('country') ?? ''}
                      onChange={(event) => setValue('country', event.target.value || undefined, {
                        shouldValidate: true,
                      })}
                      aria-invalid={Boolean(errors.country?.message)}
                    >
                      <option value="">Select a country</option>
                      <optgroup label="United States dollar (USD)">
                        {COUNTRIES.filter((country) => country.currency === 'USD').map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Euro (EUR)">
                        {COUNTRIES.filter((country) => country.currency === 'EUR').map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </optgroup>
                    </Select>
                    {errors.country?.message ? (
                      <p className="text-xs font-medium text-destructive">
                        {errors.country.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
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

/** Sends only the chosen rail's fields, matching what the API stores. */
function toBankDetails(values: FormValues): BankAccountDetails {
  if (values.method === 'us_bank') {
    const holder = values.accountHolder ?? '';
    return {
      method: 'us_bank',
      bankName: values.bankName,
      accountNumber: values.accountNumber,
      accountName: holder,
      accountHolder: holder,
      accountType: values.accountType,
      achRouting: values.achRouting,
      wireRouting: values.wireRouting,
      bankAddress: values.bankAddress,
    };
  }

  return {
    method: 'international',
    bankName: values.bankName,
    accountNumber: values.accountNumber,
    accountName: values.accountName ?? '',
    swiftBic: values.swiftBic?.toUpperCase(),
    iban: values.iban ? values.iban.replace(/\s/g, '').toUpperCase() : undefined,
    country: values.country ? values.country.toUpperCase() : undefined,
  };
}

function MethodOption({
  active,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
        active ? 'border-success bg-success/10' : 'hover:border-success/50 hover:bg-secondary',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          active ? 'bg-success text-white' : 'bg-secondary text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
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
