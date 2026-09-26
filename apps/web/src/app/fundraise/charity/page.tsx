import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Building2, HeartHandshake, Handshake, ShieldCheck } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Charity Fundraising',
  description:
    'Nonprofits, hospitals and schools can raise directly on HopeNest. Same verification, same ledger, and charitable causes pay no platform fee.',
  alternates: { canonical: '/fundraise/charity' },
};

const FEATURES = [
  {
    Icon: Building2,
    title: 'Raise as an institution',
    body: 'Campaigns can sit under a charity, hospital, school or community organisation. Donors give to the cause and see the institution behind it, which is what moves the larger gifts.',
  },
  {
    Icon: ShieldCheck,
    title: 'Same verification, same ledger',
    body: 'Institutional campaigns clear the same identity checks as individual organisers, and every donation and payout posts to the same append-only double-entry ledger. There is no separate track for charities.',
  },
  {
    Icon: HeartHandshake,
    title: 'No platform fee for charitable causes',
    body: 'Medical and charitable causes pay no platform fee on HopeNest. The payment processor still takes its slice — we show you the gross, the processor fee and the net before you confirm anything.',
  },
  {
    Icon: Handshake,
    title: 'Dedicated NGO partnerships team',
    body: 'If you are raising at scale, our partnerships team can walk you through bulk campaigns, recurring giving and corporate matching. Contact them from the partnerships page.',
  },
];

export default function CharityFundraisingPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.charity}
      eyebrow="For institutions"
      eyebrowIcon={Building2}
      variant="editorial"
      tone="emerald"
      title="Fundraise for a"
      accent="charity."
      lead="Nonprofits, hospitals, schools and community organisations can raise directly on HopeNest — with the same verification, the same ledger, and no platform fee for charitable causes."
      crumbs={[{ label: 'Fundraise', href: '/fundraise' }, { label: 'Charity fundraising' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'Partnerships', href: '/partnerships', icon: Handshake }}
      spotlight={{
        title: 'What charities get',
        note: 'The same platform, the same controls, without the platform fee.',
        items: FEATURES.map(({ Icon, title }) => ({ icon: Icon, title })),
      }}
      highlights={[
        { value: '0%', label: 'Platform fee on charitable causes', icon: HeartHandshake, tone: 'success' },
        { value: 'Same', label: 'Verification and ledger as any campaign', icon: ShieldCheck },
        { value: 'Direct', label: 'Reach beyond your own donor list', icon: Building2, tone: 'accent' },
      ]}
      sections={[
        {
          heading: 'Why charities use HopeNest',
          body: 'A charity needs two things from a fundraising platform: proof that the money arrived, and a way to reach donors who are not already on their list. HopeNest gives you the first for free and the second through the same discovery surface that individual campaigns use, which means a well-run charity campaign gets seen by donors who would never have found your website.',
        },
      ]}
      cta={{
        label: 'Start a Campaign',
        href: '/create',
        note: 'Charitable causes pay no platform fee.',
      }}
    >
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">What charities get</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {FEATURES.map(({ Icon, title, body }) => (
              <Card key={title} className="p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}