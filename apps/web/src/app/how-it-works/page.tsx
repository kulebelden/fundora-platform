import type { Metadata } from 'next';
import { Compass, HeartHandshake, Megaphone, Receipt, ShieldCheck, Wallet } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'How HopeNest Works',
  description:
    'Draft a campaign, verify your identity once, collect donations in any supported currency and withdraw to your bank — with the fee and net amount shown before you confirm.',
  alternates: { canonical: '/how-it-works' },
};

const STEPS = [
  {
    Icon: HeartHandshake,
    title: 'Draft your campaign',
    body: 'Write the story, set a goal in your own currency and pick a category. It takes a few minutes and costs nothing. A reviewer reads every campaign before it goes live; emergency causes are queued ahead of the line.',
  },
  {
    Icon: ShieldCheck,
    title: 'Verify once',
    body: 'Upload a government ID or passport. Verification is what unlocks withdrawals and what reassures donors — it is enforced in the API, so no payout can slip out ahead of it. Clear it once and it covers every campaign you run.',
  },
  {
    Icon: Megaphone,
    title: 'Collect and keep people posted',
    body: 'Donors give by card, bank transfer or mobile money, in their currency. Post updates as milestones land: campaigns with regular updates raise substantially more than ones that go quiet after launch.',
  },
  {
    Icon: Wallet,
    title: 'Withdraw to your bank',
    body: 'Request a payout to any SWIFT or IBAN account. The screen shows the gross amount, the service fee and the exact net figure before you confirm. Nothing is deducted after the fact.',
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.howItWorks}
      eyebrow="For organisers and donors"
      eyebrowIcon={Compass}
      variant="aurora"
      tone="emerald"
      title="From an empty page to"
      accent="money in the bank."
      lead="Four steps, no hidden stages. Here is exactly what happens between drafting a campaign and withdrawing what it raised."
      crumbs={[{ label: 'Fundraise', href: '/fundraise' }, { label: 'How it works' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'See the fees', href: '/pricing', icon: Receipt }}
      spotlight={{
        title: 'The whole journey',
        note: 'The same four steps whether you raise twenty dollars or twenty thousand.',
        items: STEPS.map(({ Icon, title }) => ({ icon: Icon, title })),
      }}
      highlights={[
        { value: '4', label: 'Steps, start to payout', icon: Compass },
        { value: 'Once', label: 'Identity verification, for every campaign', icon: ShieldCheck },
        { value: 'Any', label: 'Supported currency your donors use', icon: HeartHandshake },
        { value: 'Net', label: 'Amount confirmed before you request it', icon: Wallet },
      ]}
      sections={[
        {
          heading: 'What donors see',
          bullets: [
            'The amount raised so far, the goal, and the currency the campaign is raising in.',
            'How many distinct supporters have given — signed-in donors deduplicated, each guest gift counted once.',
            'Who the organiser is, and that their identity has been verified.',
            'Every update the organiser has posted, in order.',
          ],
        },
        {
          heading: 'What we ask of organisers',
          bullets: [
            'Be specific about what the money pays for. A goal donors can check funds faster than a round number.',
            'Post an update whenever something changes, including when it goes badly.',
            'Never publish private documents — medical records, bank details or someone else’s identifying information.',
            'Say plainly who receives the funds if you are raising on someone else’s behalf.',
          ],
        },
        {
          heading: 'If something goes wrong',
          body: 'Campaigns can be suspended by a moderator at any point, and donors can report one from its page. Where a campaign is found to be fraudulent, the Giving Guarantee covers eligible donations — the /guarantee page sets out what qualifies and how to claim.',
        },
      ]}
      cta={{
        label: 'Start a Campaign',
        href: '/create',
        note: 'Drafting is free and commits you to nothing.',
      }}
    >
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">The four steps</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {STEPS.map(({ Icon, title, body }, index) => (
              <Card key={title} className="p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
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
