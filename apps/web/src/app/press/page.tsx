import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Globe, Mail, Newspaper, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MarketingPage } from '@/components/marketing-page';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Newsroom & Press',
  description:
    'Press resources for HopeNest: what we are, how the platform handles money, and who to contact for interviews, data requests and brand assets.',
  alternates: { canonical: '/press' },
};

/**
 * The announcements list is intentionally empty rather than seeded with invented
 * coverage. Add real items here — a fabricated press mention on a trust-focused
 * platform is the worst possible thing to be caught with.
 */
const ANNOUNCEMENTS: Array<{ date: string; title: string; href: string }> = [];

const FACTS = [
  {
    label: 'What HopeNest is',
    value:
      'A fundraising platform where every organiser is identity-verified before a payout is released and every movement of money is posted to an append-only double-entry ledger.',
  },
  {
    label: 'Where it operates',
    value:
      'Campaigns raise in eight currencies with payouts over SWIFT and IBAN, and mobile money collection across East Africa.',
  },
  {
    label: 'How it makes money',
    value:
      'A platform fee on donations and a service fee on withdrawals, both published in full on the pricing page. There is no listing fee and no subscription.',
  },
];

export default function PressPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.press}
      eyebrow="Newsroom"
      eyebrowIcon={Newspaper}
      variant="editorial"
      tone="amber"
      title="The facts,"
      accent="on the record."
      lead="Everything a journalist needs to describe HopeNest accurately, plus how to reach someone who can answer follow-up questions the same day."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Newsroom' }]}
      primaryCta={{ label: 'Press enquiries', href: '/contact' }}
      secondaryCta={{ label: 'How we handle money', href: '/how-it-works', icon: Building2 }}
      spotlight={{
        title: 'What we can share',
        note: 'Aggregate figures, on request, from the same ledger the platform runs on.',
        items: [
          {
            icon: Building2,
            title: 'Aggregate data',
            body: 'Amounts raised, donor counts and category breakdowns, on request.',
          },
          {
            icon: Globe,
            title: 'Where we operate',
            body: 'Campaigns raise in eight currencies, paying out over SWIFT and IBAN.',
          },
          {
            icon: Receipt,
            title: 'How we make money',
            body: 'A platform fee on donations and a service fee on withdrawals, both published in full.',
          },
        ],
      }}
      highlights={[
        { value: '8', label: 'Currencies a campaign can raise in', icon: Globe, tone: 'accent' },
        { value: '0', label: 'Listing fees or subscriptions', icon: Receipt, tone: 'success' },
        { value: 'Same day', label: 'Reply to a press enquiry', icon: Mail, tone: 'warm' },
      ]}
      sections={[
        {
          heading: 'Using our name and logo',
          bullets: [
            'HopeNest is one word, capitalised H and N. Never "Hope Nest" or "Hopenest".',
            'The tagline is "Real People. Real Causes. Greater Impact."',
            'Do not alter the logo’s colours, proportions or lockup, and do not place it on a background that compromises contrast.',
            'For a campaign featured in coverage, please ask the organiser directly before publishing their story or images.',
          ],
        },
        {
          heading: 'Data requests',
          body: 'We can provide aggregate figures — amounts raised, donor counts, category breakdowns — on request. We do not provide donor identities, campaign contact details or anything that would identify an individual, including to journalists.',
        },
      ]}
      cta={{
        label: 'Contact Support',
        href: '/contact',
        note: 'Press enquiries reach a person, not a queue.',
      }}
    >
      <section className="container pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Key facts</h2>
        <div className="mt-8 divide-y rounded-xl border bg-card shadow-card">
          {FACTS.map((fact) => (
            <div key={fact.label} className="grid gap-2 p-6 md:grid-cols-[1fr_2fr] md:gap-8">
              <h3 className="font-bold">{fact.label}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{fact.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-14">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Announcements</h2>
        {ANNOUNCEMENTS.length ? (
          <ul className="mt-8 divide-y rounded-xl border bg-card shadow-card">
            {ANNOUNCEMENTS.map((item) => (
              <li key={item.href} className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.date}
                </p>
                <Link
                  href={item.href}
                  className="mt-1 block font-bold text-accent underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="mt-8 p-10 text-center">
            <p className="font-semibold">No announcements published yet.</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Official statements and releases will be listed here as they are issued. For
              anything urgent in the meantime, contact the press desk directly.
            </p>
          </Card>
        )}
      </section>
    </MarketingPage>
  );
}
