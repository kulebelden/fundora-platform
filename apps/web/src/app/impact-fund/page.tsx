import type { Metadata } from 'next';
import { FileCheck, Handshake, Receipt, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'HopeNest.org Impact',
  description:
    'The HopeNest.org Impact Fund channels corporate matching and grant funding to verified campaigns, with the same ledger and the same disclosure as every other gift.',
  alternates: { canonical: '/impact-fund' },
};

/**
 * No grant totals or partner names appear on this page on purpose: the programme has
 * not published any, and inventing them on a page about financial transparency would
 * be the wrong first impression. Add real figures when there are real figures.
 */
const PROGRAMMES = [
  {
    title: 'Corporate matching',
    body: 'A company commits a matching pool and picks the categories it applies to. Matched funds post to the campaign like any other donation, so donors see the match land and the ledger records both sides separately.',
  },
  {
    title: 'Emergency response grants',
    body: 'When a disaster produces a cluster of campaigns at once, the fund can top up verified campaigns in the affected area rather than starting a competing appeal of its own.',
  },
  {
    title: 'Fee relief',
    body: 'Grant funding can absorb the fees on a campaign so that the full donated amount reaches the beneficiary. Relief is applied at the campaign level and disclosed on the campaign page.',
  },
];

export default function ImpactFundPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.impactFund}
      eyebrow="HopeNest.org"
      eyebrowIcon={Sparkles}
      variant="aurora"
      tone="amber"
      title="Institutional money,"
      accent="same ledger."
      lead="The Impact Fund is how companies, foundations and donor networks put larger sums behind verified campaigns without building their own grant infrastructure. It runs on exactly the same accounting as a twenty-dollar gift."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'HopeNest.org Impact' }]}
      primaryCta={{ label: 'Contact support', href: '/contact' }}
      secondaryCta={{ label: 'How money is tracked', href: '/how-it-works', icon: Wallet }}
      spotlight={{
        title: 'How the fund works',
        note: 'Grant money that moves through the platform, not beside it.',
        items: [
          {
            icon: Handshake,
            title: 'A pool, a timeframe, a scope',
            body: 'A funder agrees what the money covers and which campaigns qualify.',
          },
          {
            icon: Sparkles,
            title: 'Matching never bypasses review',
            body: 'Eligible campaigns clear verification exactly like any other campaign.',
          },
          {
            icon: TrendingUp,
            title: 'Matched funds post as they trigger',
            body: 'Visibly, campaign by campaign, rather than in a lump at the end.',
          },
          {
            icon: FileCheck,
            title: 'Itemised statements',
            body: 'Drawn from the ledger, so a funder’s report and a campaign’s total are one set of books.',
          },
        ],
      }}
      highlights={[
        { value: 'Same books', label: 'Grant money and donations reconciled together', icon: Receipt, tone: 'accent' },
        { value: '0', label: 'Separate spreadsheets in the middle', icon: FileCheck, tone: 'success' },
      ]}
      sections={[
        {
          heading: 'Why it runs on the platform, not beside it',
          body: 'Grant programmes usually sit in a spreadsheet next to the platform they fund, which is where reconciliation goes to die. Matching and grant money here moves through the same double-entry ledger as every other donation, so a funder’s report and a campaign’s public total are generated from one set of books.',
        },
        {
          heading: 'How a matching programme is set up',
          bullets: [
            'A funder agrees a pool, a timeframe and the categories or regions it applies to.',
            'Eligible campaigns are verified as normal — a match never bypasses review.',
            'Matched funds post as they are triggered, visibly, rather than in a lump at the end.',
            'The funder gets a statement drawn from the ledger, itemised per campaign.',
          ],
        },
        {
          heading: 'Eligibility for campaigns',
          body: 'Organisers do not apply to the fund directly. Campaigns are eligible once they are live and the organiser is identity-verified; matching then applies automatically to those that fall inside a live programme’s scope, and the campaign page shows when it does.',
        },
      ]}
      cta={{
        label: 'Contact Support',
        href: '/contact',
        note: 'Considering a matching programme? Partnerships will walk you through the structure.',
      }}
    >
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            What the fund does
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PROGRAMMES.map((programme) => (
              <Card key={programme.title} className="p-7">
                <h3 className="text-lg font-bold">{programme.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {programme.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
