import type { Metadata } from 'next';
import { Building2, Globe, Landmark, LifeBuoy, Receipt, Smartphone } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { COUNTRIES, CURRENCIES, currencyMeta } from '@/lib/currency';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Supported Countries & Currencies',
  description:
    'Campaigns raise in US dollars or euros, with payouts to the US-dollar and euro markets only.',
  alternates: { canonical: '/countries' },
};

/** Payout markets, grouped by the currency their banks settle in. */
const REGIONS = [
  {
    name: 'United States and US-dollar markets',
    detail:
      'US-dollar campaigns pay out to bank accounts in the United States and the other dollarised markets, with SWIFT/BIC details for international transfers.',
  },
  {
    name: 'Eurozone',
    detail:
      'Euro campaigns pay out to bank accounts across the euro area. IBAN is the fastest route for these, and SWIFT/BIC is kept as a fallback.',
  },
  {
    name: 'Currency conversion',
    detail:
      'A campaign keeps its goal in the currency it was created in. Donors give in that same currency, so no conversion is applied to a gift.',
  },
  {
    name: 'International donors',
    detail:
      'Donors can give from other card markets. Available payout banks depend on the destination country and the transfer provider.',
  },
];

export default function CountriesPage() {
  const usdCountries = COUNTRIES.filter((country) => country.currency === 'USD');
  const eurCountries = COUNTRIES.filter((country) => country.currency === 'EUR');

  return (
    <MarketingPage
      image={HERO_IMAGES.countries}
      eyebrow="US dollar & euro"
      eyebrowIcon={Globe}
      variant="aurora"
      tone="sky"
      title="Raise in dollars"
      accent="or euros."
      lead="Set a campaign goal in USD or EUR. Those are the only two currencies HopeNest raises in, and payouts go to bank accounts in the markets that settle in them."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Supported Countries' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'Ask about your bank', href: '/contact', icon: LifeBuoy }}
      spotlight={{
        title: 'Supported currencies and banks',
        note: `Payouts are available to ${COUNTRIES.length} countries — every market whose official currency is the US dollar or the euro.`,
        items: [
          {
            icon: Landmark,
            title: 'USD bank directory',
            body: 'US-dollar bank entries include SWIFT/BIC details for international transfers.',
          },
          {
            icon: Building2,
            title: 'EUR bank directory',
            body: 'Euro-area entries include IBAN and SWIFT/BIC details for local and cross-border transfers.',
          },
          {
            icon: Smartphone,
            title: 'Two currencies only',
            body: 'Every campaign is denominated in USD or EUR, so totals are never mixed across currencies.',
          },
        ],
      }}
      highlights={[
        { value: `${CURRENCIES.length}`, label: 'Currencies a campaign can raise in', icon: Globe, tone: 'accent' },
        { value: `${COUNTRIES.length}`, label: 'Supported payout countries', icon: Landmark, tone: 'success' },
        { value: '0', label: 'Exchange margin added by us', icon: Receipt, tone: 'warm' },
      ]}
      sections={[
        {
          heading: 'How cross-border giving works',
          body: 'A campaign keeps its goal in USD or EUR. Donors give in that same currency, so a gift is never converted on its way in, and the campaign page always reports progress in its goal currency.',
        },
        {
          heading: 'Payout rails',
          bullets: [
            `A bank directory covering ${usdCountries.length} US-dollar markets and ${eurCountries.length} euro-area markets.`,
            'SWIFT/BIC details are stored for every listed bank; IBAN is supported across the euro area.',
            'Payout details are collected privately at withdrawal and never appear on a campaign page.',
            'Actual bank transfers require a live payout provider; the current payout adapter is simulated.',
          ],
        },
        {
          heading: 'A note on totals',
          body: 'Platform-wide totals are reported in a single currency and never silently fold in amounts raised in another one. The campaign currency remains visible anywhere a total is shown.',
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
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

      <section className="container py-16 sm:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Supported countries
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Every country below settles in {currencyMeta('USD').label} ({currencyMeta('USD').symbol}) or{' '}
          {currencyMeta('EUR').label} ({currencyMeta('EUR').symbol}).
        </p>

        {[
          { title: 'United States dollar', currency: 'USD', list: usdCountries },
          { title: 'Euro', currency: 'EUR', list: eurCountries },
        ].map((group) => (
          <div key={group.currency} className="mt-10">
            <h3 className="flex items-baseline gap-2 text-lg font-bold">
              {group.title}
              <span className="text-sm font-semibold text-muted-foreground">
                {group.list.length} countries
              </span>
            </h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.list.map((country) => (
                <li
                  key={country.code}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
                >
                  <span className="text-sm font-medium">{country.name}</span>
                  <span className="tabular shrink-0 text-xs font-bold text-muted-foreground">
                    {country.code}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </MarketingPage>
  );
}
