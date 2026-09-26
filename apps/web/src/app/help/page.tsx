import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, HeartHandshake, LifeBuoy, MessageCircle, Wallet, Zap } from 'lucide-react';
import { FaqAccordion } from '@/components/faq-accordion';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { WITHDRAWAL_FEE_LABEL } from '@/lib/fees';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Help Center',
  description:
    'Answers for donors and organisers: verification, payouts, refunds, campaign review and how to reach a person when the answer is not here.',
  alternates: { canonical: '/help' },
};

const DONOR_FAQS = [
  {
    question: 'Is my donation tax deductible?',
    answer:
      'Usually not. Most HopeNest campaigns are personal fundraisers rather than registered charities, and a gift to an individual is not deductible in most jurisdictions. Where a registered nonprofit runs the campaign, they will say so and can issue their own receipt — ask them before you give if it matters to you.',
  },
  {
    question: 'Can I give without creating an account?',
    answer:
      'Yes. Guest donations are supported and each one is counted once towards the campaign’s supporter total. Creating an account simply means your giving history is in one place.',
  },
  {
    question: 'Can I give anonymously?',
    answer:
      'Yes — choose the anonymous option when you donate and your name is replaced with "Anonymous" everywhere it would otherwise appear, including the public donation feed. The organiser cannot see past it.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'If you believe a campaign is fraudulent, the Giving Guarantee covers eligible donations — file it through support and a person will look at it. Refunds for a change of heart are at the organiser’s discretion, since the money may already be committed.',
  },
];

const ORGANISER_FAQS = [
  {
    question: 'How long does review take before my campaign goes live?',
    answer:
      'Most campaigns are reviewed within a day. Emergency causes are queued ahead of the general line. If a reviewer needs something clarified they will contact you rather than silently reject it.',
  },
  {
    question: 'Why can I not withdraw yet?',
    answer:
      'Withdrawals unlock once identity verification is complete. This is enforced in the API, not just in the interface, so there is no way around it — and no way for anyone else to move your funds either. Start verification while your campaign is still collecting and it will not hold you up later.',
  },
  {
    question: 'What will actually land in my bank account?',
    answer: `A payout deducts the ${WITHDRAWAL_FEE_LABEL} service fee from the gross you request, and the withdrawal screen shows the exact net figure before you confirm. Nothing is deducted afterwards. The full fee schedule is on the pricing page.`,
  },
  {
    question: 'Can I edit my campaign after it goes live?',
    answer:
      'You can post updates at any time, and updates are the right way to record changes — donors get to see what changed and when. Substantial rewrites of the story or goal may send the campaign back for review.',
  },
  {
    question: 'What if I raise more than I need?',
    answer:
      'Nothing is forfeited, but say what the surplus will do in an update. Donors respond well to being told; they respond badly to finding out later.',
  },
];

const ROUTES = [
  {
    Icon: HeartHandshake,
    title: 'How HopeNest works',
    body: 'The whole flow, from draft to payout.',
    href: '/how-it-works',
  },
  {
    Icon: Wallet,
    title: 'Pricing & fees',
    body: 'Every charge, itemised, with a worked example.',
    href: '/pricing',
  },
  {
    Icon: LifeBuoy,
    title: 'Giving Guarantee',
    body: 'What is covered if a campaign turns out to be fraudulent.',
    href: '/guarantee',
  },
];

export default function HelpPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.help}
      eyebrow="Help center"
      eyebrowIcon={LifeBuoy}
      variant="split"
      tone="sky"
      title="Answers first,"
      accent="a person right after."
      lead="The questions below cover most of what donors and organisers ask. If yours is not here, support is staffed by people who can actually look at your campaign."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Help Center' }]}
      primaryCta={{ label: 'Contact support', href: '/contact' }}
      secondaryCta={{ label: 'Start a Campaign', href: '/create' }}
      highlights={[
        { value: '24/7', label: 'Priority support, every day', icon: Clock },
        { value: '<2 min', label: 'Median time to a first reply', icon: Zap },
        { value: 'People', label: 'Not bots, not a ticket queue', icon: MessageCircle },
      ]}
    >
      <section className="container pb-4">
        <div className="grid gap-5 sm:grid-cols-3">
          {ROUTES.map(({ Icon, title, body, href }) => (
            <Link key={href} href={href} className="focus-visible:outline-none">
              <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:shadow-lift">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold transition-colors group-hover:text-accent">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
                  Read more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="container py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">For donors</h2>
            <FaqAccordion items={DONOR_FAQS} idPrefix="help-donor" className="mt-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">For organisers</h2>
            <FaqAccordion items={ORGANISER_FAQS} idPrefix="help-organiser" className="mt-6" />
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
