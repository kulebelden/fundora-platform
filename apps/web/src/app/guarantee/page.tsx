import type { Metadata } from 'next';
import { BadgeCheck, BookOpenCheck, Receipt, ScrollText, ShieldCheck, Wallet } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { FaqAccordion } from '@/components/faq-accordion';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'HopeNest Giving Guarantee',
  description:
    'If a campaign you gave to turns out to be fraudulent, or funds are misused, the HopeNest Giving Guarantee refunds eligible donations. Here is what is covered and how to claim.',
  alternates: { canonical: '/guarantee' },
};

/**
 * NOTE FOR THE TEAM: this page states a refund commitment. The eligibility window and
 * the claim process below need finance and legal sign-off before launch, and must
 * match whatever the refund runbook actually implements.
 */
const GUARANTEE_FAQS = [
  {
    question: 'What counts as a fraudulent campaign?',
    answer:
      'A campaign where the organiser misrepresented who they are, invented the situation they described, or took funds raised for a named beneficiary and kept them. A campaign that simply did not achieve what it set out to do is not fraud — outcomes are not guaranteed, honesty about them is.',
  },
  {
    question: 'How long do I have to report it?',
    answer:
      'Report as soon as you have a concern. Claims are accepted for one year from the date of your donation, and the sooner one arrives the more likely the funds are still recoverable from the campaign wallet.',
  },
  {
    question: 'What do you need from me?',
    answer:
      'The campaign link, the email address you donated with, and what you believe happened. If you have messages or public posts that contradict the campaign story, include them. You do not need to prove the case — investigating is our job.',
  },
  {
    question: 'How long does a claim take?',
    answer:
      'You will hear from a person within one business day of filing. Investigations that involve freezing a payout usually resolve within a week; ones that need documents from third parties can take longer, and you are told where it stands as it moves.',
  },
  {
    question: 'Does the guarantee cover organisers too?',
    answer:
      'It protects donors against fraud. Organisers are protected differently: funds cannot be withdrawn by anyone who has not passed identity verification, and payout requests are reviewed before release.',
  },
];

export default function GuaranteePage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.guarantee}
      eyebrow="Donor protection"
      eyebrowIcon={BadgeCheck}
      variant="signal"
      tone="amber"
      title="Give with"
      accent="a backstop."
      lead="The overwhelming majority of campaigns are exactly what they say they are. For the rare one that is not, the HopeNest Giving Guarantee refunds eligible donations so that a bad actor costs you nothing but the disappointment."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Giving Guarantee' }]}
      primaryCta={{ label: 'Contact support', href: '/contact' }}
      secondaryCta={{ label: 'Read the fees', href: '/pricing', icon: Receipt }}
      spotlight={{
        title: 'What backs the guarantee',
        note: 'The guarantee is the last line, not the first. These four are what usually stop the money ever leaving.',
        items: [
          {
            icon: ScrollText,
            title: 'Reviewed before publication',
            body: 'A person reads every campaign and can suspend it at any point afterwards.',
          },
          {
            icon: ShieldCheck,
            title: 'Identity verified before payout',
            body: 'No withdrawal is possible until the organiser has cleared ID verification.',
          },
          {
            icon: Wallet,
            title: 'Payouts reviewed individually',
            body: 'Each payout request is checked before funds leave the platform.',
          },
          {
            icon: BookOpenCheck,
            title: 'An append-only ledger',
            body: 'Every movement is recorded permanently, so a claim can be traced line by line.',
          },
        ],
      }}
      sections={[
        {
          heading: 'What is covered',
          bullets: [
            'Donations to a campaign shown to have misrepresented the organiser’s identity.',
            'Donations to a campaign where the described situation was fabricated.',
            'Donations to a campaign raising for a named beneficiary where the funds never reached them.',
            'Unauthorised charges from a payment method that was not yours to use.',
          ],
        },
        {
          heading: 'What is not covered',
          bullets: [
            'A campaign that raised honestly and did not reach its goal, or whose outcome was not what anyone hoped.',
            'Disagreement with how an organiser spent funds within the purpose they described.',
            'Donations made outside HopeNest — a transfer sent directly to an organiser is outside the ledger and outside the guarantee.',
            'A change of mind after giving. Ask before you give; refunds for regret are at the organiser’s discretion.',
          ],
        },
        {
          heading: 'What backs it up',
          body: 'The guarantee is the last line, not the first. Campaigns are reviewed before publication, every organiser clears identity verification before a payout is released, payout requests are reviewed individually, and every movement of money sits in an append-only ledger. Most fraud is caught before funds leave — the guarantee covers what gets through.',
        },
      ]}
      cta={{
        label: 'Contact Support',
        href: '/contact',
        note: 'Concerned about a campaign you gave to? Tell a person, not a form.',
      }}
    >
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Claiming, answered</h2>
          <FaqAccordion items={GUARANTEE_FAQS} idPrefix="guarantee" className="mt-8" />
        </div>
      </section>
    </MarketingPage>
  );
}
