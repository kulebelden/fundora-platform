import type { Metadata } from 'next';
import { CreditCard, Gift, Landmark, Receipt } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/currency';
import {
  CARD_PROCESSING_FEE_LABEL,
  PLATFORM_FEE_LABEL,
  WITHDRAWAL_FEE_LABEL,
  previewDonation,
  previewWithdrawal,
} from '@/lib/fees';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Pricing & Fees',
  description:
    'Every fee HopeNest charges, itemised: the platform fee on donations, payment processing by channel, and the withdrawal service fee — with a worked example.',
  alternates: { canonical: '/pricing' },
};

/**
 * Figures here are computed from the rate constants mirrored off the API, not typed
 * in, so this page cannot quote a fee the ledger does not actually charge.
 */
const DONATION_EXAMPLES = [100, 1000, 10000];

const FEES = [
  {
    name: 'Platform fee',
    rate: PLATFORM_FEE_LABEL,
    when: 'Deducted from each donation as it settles.',
    detail:
      'Covers campaign review, identity verification, moderation and the support team. Charged on the gross donation, in the campaign’s currency.',
  },
  {
    name: 'Payment processing',
    rate: `${CARD_PROCESSING_FEE_LABEL} (card & mobile money)`,
    when: 'Deducted from each donation as it settles.',
    detail:
      'Passed through from the payment processor. Bank transfers are the exception: direct transfers carry no processing fee at all.',
  },
  {
    name: 'Withdrawal service fee',
    rate: WITHDRAWAL_FEE_LABEL,
    when: 'Deducted when an organiser requests a payout.',
    detail:
      'Covers the SWIFT/IBAN payout rails and the manual review each withdrawal request gets. The exact net figure is shown before the request is confirmed.',
  },
  {
    name: 'Starting a campaign',
    rate: 'Free',
    when: 'Never charged.',
    detail:
      'No listing fee, no subscription, no minimum raise. A campaign that raises nothing costs its organiser nothing.',
  },
];

export default function PricingPage() {
  const withdrawalExample = previewWithdrawal(1000);

  return (
    <MarketingPage
      image={HERO_IMAGES.pricing}
      eyebrow="Transparent pricing"
      eyebrowIcon={Receipt}
      variant="editorial"
      tone="sky"
      title="Every fee, before"
      accent="you commit."
      lead="Three charges exist on HopeNest, all of them visible before money moves. Nothing is deducted after the fact, and the figures below are read straight from the rates the ledger applies."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Pricing & fees' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'How payouts work', href: '/how-it-works', icon: Landmark }}
      spotlight={{
        title: 'Everything we charge',
        note: 'Three charges, each deducted at a moment you can see coming.',
        items: [
          {
            icon: Receipt,
            title: `Platform fee — ${PLATFORM_FEE_LABEL}`,
            body: 'Taken from each donation as it settles, in the campaign’s own currency.',
          },
          {
            icon: CreditCard,
            title: 'Payment processing',
            body: 'Passed through from the processor on card and mobile money. Bank transfers carry none.',
          },
          {
            icon: Landmark,
            title: `Withdrawal service fee — ${WITHDRAWAL_FEE_LABEL}`,
            body: 'Charged when an organiser moves the balance to a bank account.',
          },
          {
            icon: Gift,
            title: 'Starting a campaign — free',
            body: 'No listing fee, no subscription and no minimum raise.',
          },
        ],
      }}
      sections={[
        {
          heading: 'How a donation splits',
          body: 'When a donation settles, the platform fee and the processing fee come off the gross, and the remainder is credited to the campaign wallet. Both postings land in the ledger, so an organiser can reconcile any single gift down to the cent.',
        },
        {
          heading: 'How a payout splits',
          body: `A payout request deducts the ${WITHDRAWAL_FEE_LABEL} service fee from the requested gross. On a ${formatMoney(withdrawalExample.gross, 'USD', { hideFraction: true })} request that is ${formatMoney(withdrawalExample.fee, 'USD')} in fee and ${formatMoney(withdrawalExample.net, 'USD')} landing in the bank account. The fee is computed in integer minor units and rounded half-up, so gross always equals fee plus net exactly.`,
        },
        {
          heading: 'Currency and cross-border giving',
          body: 'A campaign raises in one currency and donors give in theirs; conversion is handled by the payment processor at its prevailing rate. HopeNest holds no FX rates of its own and does not add an exchange margin.',
        },
      ]}
      cta={{
        label: 'Start a Campaign',
        href: '/create',
        note: 'Free to start. Fees apply only to money that actually arrives.',
      }}
    >
      {/* ------------------------------------------------------ fee table */}
      <section className="container pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">The full list</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {FEES.map((fee) => (
            <Card key={fee.name} className="p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-bold">{fee.name}</h3>
                <span className="tabular text-lg font-extrabold text-success">
                  {fee.rate}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {fee.when}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{fee.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- worked example */}
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            What a donation actually delivers
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Card and mobile money gifts, in US dollars. A bank transfer of the same size
            carries no processing fee, so the campaign keeps correspondingly more.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <caption className="sr-only">
                Donation fee breakdown for card and mobile money gifts
              </caption>
              <thead>
                <tr className="border-b text-left">
                  <th scope="col" className="py-3 pr-4 font-bold">Donation</th>
                  <th scope="col" className="py-3 pr-4 font-bold">Platform fee</th>
                  <th scope="col" className="py-3 pr-4 font-bold">Processing</th>
                  <th scope="col" className="py-3 pr-4 font-bold">To the campaign</th>
                  <th scope="col" className="py-3 font-bold">Bank transfer instead</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {DONATION_EXAMPLES.map((amount) => {
                  const card = previewDonation(amount, 'card');
                  const bank = previewDonation(amount, 'bank');
                  return (
                    <tr key={amount} className="border-b">
                      <td className="py-3.5 pr-4 font-bold">
                        {formatMoney(amount, 'USD', { hideFraction: true })}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        −{formatMoney(card.platformFee, 'USD')}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        −{formatMoney(card.processingFee, 'USD')}
                      </td>
                      <td className="py-3.5 pr-4 font-bold text-success">
                        {formatMoney(card.net, 'USD')}
                      </td>
                      <td className="py-3.5 font-semibold">{formatMoney(bank.net, 'USD')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            The withdrawal service fee of {WITHDRAWAL_FEE_LABEL} applies separately, when the
            organiser moves the balance to a bank account. Figures on this page are computed
            from the same rate constants the API uses to post to the ledger.
          </p>
        </div>
      </section>
    </MarketingPage>
  );
}
