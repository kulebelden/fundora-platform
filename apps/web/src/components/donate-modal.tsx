'use client';

import * as React from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { CURRENCIES, currencyMeta, formatMoney } from '@/lib/currency';
import { useDonate, useMe } from '@/lib/queries';
import type { CampaignSummary, DonationResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

type Method = 'stripe' | 'bank_wire';

export function DonateModal({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Pick<CampaignSummary, 'id' | 'title' | 'currency'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currency, setCurrency] = React.useState(campaign.currency);
  const [amount, setAmount] = React.useState<string>('');
  const [method, setMethod] = React.useState<Method>('stripe');
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [receipt, setReceipt] = React.useState<DonationResponse | null>(null);
  const [donorName, setDonorName] = React.useState('');
  const [donorEmail, setDonorEmail] = React.useState('');
  const [donorPhone, setDonorPhone] = React.useState('');
  const [donorMessage, setDonorMessage] = React.useState('');
  const [touched, setTouched] = React.useState(false);

  const { data: me } = useMe();
  const donate = useDonate();
  const meta = currencyMeta(currency);
  const numericAmount = Number(amount);
  const amountValid = Number.isFinite(numericAmount) && numericAmount >= 1;
  const nameValid = donorName.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim());
  const phoneValid = donorPhone.trim() === '' || /^\+?[0-9 ()-]{7,20}$/.test(donorPhone.trim());
  const isValid = amountValid && nameValid && emailValid && phoneValid;

  // Reset to a clean slate each time the modal opens.
  React.useEffect(() => {
    if (open) {
      setCurrency(campaign.currency);
      setAmount('');
      setMethod('stripe');
      setIsAnonymous(false);
      setReceipt(null);
      setDonorName(me ? `${me.firstName} ${me.lastName}`.trim() : '');
      setDonorEmail(me?.email ?? '');
      setDonorPhone('');
      setDonorMessage('');
      setTouched(false);
      donate.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaign.currency, me]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;

    donate.mutate(
      {
        campaignId: campaign.id,
        amount: numericAmount,
        currency,
        isAnonymous,
        provider: method,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        ...(donorPhone.trim() ? { donorPhone: donorPhone.trim() } : {}),
        ...(donorMessage.trim() ? { donorMessage: donorMessage.trim() } : {}),
      },
      {
        onSuccess: (data) => {
          setReceipt(data);
          toast({
            variant: 'success',
            title: 'Donation started',
            description: `Reference ${data.providerReference}`,
          });
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Could not start the donation',
            description: apiErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
        {receipt ? (
          <DonationHandoff receipt={receipt} method={method} onClose={() => onOpenChange(false)} />
        ) : (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Support this cause</DialogTitle>
              <DialogDescription className="line-clamp-2">{campaign.title}</DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="donate-currency">Currency</Label>
                <Select
                  id="donate-currency"
                  value={currency}
                  onChange={(event) => {
                    setCurrency(event.target.value);
                    setAmount('');
                  }}
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code} — {option.label}
                    </option>
                  ))}
                </Select>
                {currency !== campaign.currency ? (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    This campaign raises in {campaign.currency}. Your bank sets the conversion
                    rate at settlement.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Choose an amount</Label>
                <div className="grid grid-cols-4 gap-2">
                  {meta.presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={cn(
                        'tabular rounded-lg border py-2.5 text-sm font-bold transition-colors',
                        amount === String(preset)
                          ? 'border-success bg-success/10 text-success'
                          : 'hover:border-success/50 hover:bg-secondary',
                      )}
                    >
                      {meta.symbol}
                      {preset.toLocaleString('en-US')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donate-amount">Or enter a custom amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    {meta.symbol}
                  </span>
                  <Input
                    id="donate-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="0.00"
                    className="tabular pl-9 text-base font-semibold"
                    aria-invalid={amount !== '' && !amountValid}
                  />
                </div>
                {amount !== '' && !amountValid ? (
                  <p className="text-xs font-medium text-destructive">
                    Enter an amount of at least {meta.symbol}1.
                  </p>
                ) : null}
              </div>

              <fieldset className="space-y-3 rounded-lg border p-4">
                <legend className="px-1 text-sm font-semibold">Your details</legend>
                <p className="-mt-1 text-xs text-muted-foreground">
                  For your receipt. Only the HopeNest finance team sees these.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-name">Full name</Label>
                    <Input
                      id="donor-name"
                      autoComplete="name"
                      value={donorName}
                      maxLength={160}
                      onChange={(event) => setDonorName(event.target.value)}
                      aria-invalid={touched && !nameValid}
                    />
                    {touched && !nameValid ? (
                      <p className="text-xs font-medium text-destructive">Enter your name.</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-email">Email</Label>
                    <Input
                      id="donor-email"
                      type="email"
                      autoComplete="email"
                      value={donorEmail}
                      maxLength={255}
                      onChange={(event) => setDonorEmail(event.target.value)}
                      aria-invalid={touched && !emailValid}
                    />
                    {touched && !emailValid ? (
                      <p className="text-xs font-medium text-destructive">Enter a valid email for your receipt.</p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="donor-phone">
                    Phone <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="donor-phone"
                    type="tel"
                    autoComplete="tel"
                    value={donorPhone}
                    maxLength={20}
                    placeholder="+256 700 000000"
                    onChange={(event) => setDonorPhone(event.target.value)}
                    aria-invalid={touched && !phoneValid}
                  />
                  {touched && !phoneValid ? (
                    <p className="text-xs font-medium text-destructive">Enter a valid phone number.</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="donor-message">
                    Message of support <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <textarea
                    id="donor-message"
                    rows={2}
                    maxLength={500}
                    value={donorMessage}
                    onChange={(event) => setDonorMessage(event.target.value)}
                    placeholder="A few kind words for the organiser"
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label>Payment method</Label>
                <Tabs value={method} onValueChange={(value) => setMethod(value as Method)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stripe">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger value="bank_wire">
                      <Building2 className="h-4 w-4" />
                      Bank transfer
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stripe">
                    <div className="rounded-lg border bg-secondary/40 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">VISA</Badge>
                        <Badge variant="secondary">Mastercard</Badge>
                        <Badge variant="secondary">AMEX</Badge>
                      </div>
                      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Card details are entered on the processor&apos;s own secure page.
                        HopeNest never sees or stores your card number.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="bank_wire">
                    <div className="rounded-lg border bg-secondary/40 p-4">
                      <p className="text-xs text-muted-foreground">
                        We will generate a wire reference and the beneficiary account details
                        for you to pay from your bank. Funds credit the campaign once the
                        transfer clears, usually within 1–3 business days.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="donate-anonymous" className="cursor-pointer">
                    Donate anonymously
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Your name is hidden from the public donor feed.
                  </p>
                </div>
                <Switch
                  id="donate-anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="lg" disabled={!amountValid || donate.isPending}>
                {donate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    Donate {amountValid ? formatMoney(numericAmount, currency) : ''}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Secured with 256-bit TLS · Every donation is ledger-recorded
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The API returns a payment intent, not a completed charge. Card capture happens on the
 * processor's hosted page (that is what `clientSecret` is for) — this screen is the
 * handoff, and is intentionally NOT a card-number form.
 */
function DonationHandoff({
  receipt,
  method,
  onClose,
}: {
  receipt: DonationResponse;
  method: Method;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/12">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <DialogTitle className="mt-4 text-center">Almost there</DialogTitle>
        <DialogDescription className="text-center">
          {method === 'bank_wire'
            ? 'Use the reference below when you make the transfer from your bank.'
            : 'Complete the payment on the processor’s secure checkout to finish your donation.'}
        </DialogDescription>
      </DialogHeader>

      <dl className="mt-4 space-y-2.5 rounded-lg border bg-secondary/40 p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="tabular font-bold">{formatMoney(receipt.amount, receipt.currency)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="truncate font-mono text-xs font-semibold">{receipt.providerReference}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <Badge variant="warm">{receipt.status}</Badge>
          </dd>
        </div>
      </dl>

      <p className="rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground">
        The campaign balance updates once the processor confirms the payment by webhook and
        the ledger entry is posted.
      </p>

      <DialogFooter>
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogFooter>
    </>
  );
}
