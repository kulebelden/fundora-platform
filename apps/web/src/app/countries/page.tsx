import type { Metadata } from 'next';
import { Building2, Globe, Landmark, LifeBuoy, Receipt, Smartphone } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { CURRENCIES } from '@/lib/currency';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Supported Countries & Currencies',
  description:
    'Where HopeNest pays out and which currencies a campaign can raise in — SWIFT and IBAN transfers across East Africa, the US, UK, EU and beyond.',
  alternates: { canonical: '/countries' },
};

/** Regions are payout rails, not a closed list of donor countries — donors can give from anywhere. */
const REGIONS = [
  {
    name: 'East Africa',
    detail:
      'Uganda, Kenya, Tanzania and Rwanda. Mobile money (MTN MoMo and Airtel Money) alongside bank transfer, with payouts to local bank accounts.',
  },
  {
    name: 'United States & Canada',
    detail: 'Card and ACH-backed bank transfer in, payouts to domestic bank accounts by SWIFT.',
  },
  {
    name: 'United Kingdom & European Union',
    detail: 'Card and bank transfer in, payouts to any IBAN account across the SEPA area.',
  },
  {
    name: 'Australia & New Zealand',
    detail: 'Card and bank transfer in, SWIFT payouts to domestic accounts.',
  },
  {
    name: 'Everywhere else',
    detail:
      'Donors can give from any country a card or bank works in. Payouts need a SWIFT or IBAN account we can reach — if yours is not covered, support will tell you before you start rather than after you raise.',
  },
];

export default function CountriesPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.countries}
      eyebrow="Global reach"
      eyebrowIcon={Globe}
      variant="aurora"
      tone="sky"
      title="Raise locally,"
      accent="funded globally."
      lead="A campaign raises in one currency; donors give in theirs. What determines whether you can run a campaign is not where your donors are, but whether we can pay out to your bank."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Supported Countries' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'Ask about your bank', href: '/contact', icon: LifeBuoy }}
      spotlight={{
        title: 'The payout rails',
        note: 'Donors can give from anywhere a card or bank works. These are the rails that get the money out.',
        items: [
          {
            icon: Landmark,
            title: 'SWIFT — 40+ countries',
            body: 'Payouts to domestic bank accounts across the regions below.',
          },
          {
            icon: Building2,
            title: 'IBAN across the SEPA area',
            body: 'Transfers to any IBAN account in the UK and European Union.',
          },
          {
            icon: Smartphone,
            title: 'Mobile money in East Africa',
            body: 'MTN MoMo and Airtel Money collection, with local bank payouts.',
          },
        ],
      }}
      highlights={[
        { value: `${CURRENCIES.length}`, label: 'Currencies a campaign can raise in', icon: Globe, tone: 'accent' },
        { value: '40+', label: 'Countries reachable by SWIFT', icon: Landmark, tone: 'success' },
        { value: '0', label: 'Exchange margin added by us', icon: Receipt, tone: 'warm' },
      ]}
      sections={[
        {
          heading: 'How cross-border giving works',
          body: 'A goal set in Ugandan shillings can be funded by a donor paying in euros. The payment processor handles conversion at its prevailing rate; HopeNest holds no FX rates and adds no exchange margin. The campaign page always shows the currency the goal is set in, so the progress bar means one thing to everybody.',
        },
        {
          heading: 'Payout rails',
          bullets: [
            'SWIFT transfers to bank accounts in 40+ countries.',
            'IBAN transfers across the SEPA area.',
            'Mobile money collection in East Africa via MTN MoMo and Airtel Money.',
            'Payout details are collected privately at withdrawal and never appear on a campaign page.',
          ],
        },
        {
          heading: 'A note on totals',
          body: 'Platform-wide totals are reported in a single currency and never silently fold in amounts raised in another one — the API holds no exchange rates, so a figure in shillings is never quietly presented as dollars.',
        },
      ]}
      cta={{
        label: 'Contact Support',
        href: '/contact',
        note: 'Not sure whether we reach your bank? Ask before you start.',
      }}
    >
      <section className="container pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Currencies a campaign can raise in
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CURRENCIES.map((currency) => (
            <Card key={currency.code} className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="tabular text-2xl font-extrabold text-success">
                  {currency.symbol}
                </span>
                <span className="text-sm font-black tracking-wide">{currency.code}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{currency.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Payout coverage</h2>
          <div className="mt-8 divide-y rounded-xl border bg-card shadow-card">
            {REGIONS.map((region) => (
              <div key={region.name} className="grid gap-2 p-6 md:grid-cols-[1fr_2fr] md:gap-8">
                <h3 className="font-bold">{region.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{region.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
