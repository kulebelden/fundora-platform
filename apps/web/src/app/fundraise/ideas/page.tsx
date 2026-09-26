import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Calendar, Globe, HeartHandshake, Lightbulb, Megaphone, ShieldCheck, Wallet } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { DepthCard } from '@/components/depth-card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Fundraising Ideas',
  description:
    'Fundraising ideas by cause and goal size: medical, emergency, education, community and memorial campaigns that have worked on HopeNest.',
  alternates: { canonical: '/fundraise/ideas' },
};

const IDEAS = [
  {
    Icon: ShieldCheck,
    title: 'Emergency and disaster relief',
    body: 'A clear, time-bound ask with a line-by-line budget converts best in a crisis. Publish the exact items the money buys — tents, medication, fuel — and update the list as you fill it.',
    goal: '£500 – £25,000',
  },
  {
    Icon: HeartHandshake,
    title: 'Medical and surgery',
    body: 'Name the procedure, the facility and the timeline. Attach the clinician\'s letter if you have one; it is the single most persuasive document a medical campaign can carry.',
    goal: '£1,000 – £50,000',
  },
  {
    Icon: Megaphone,
    title: 'Education and skills',
    body: 'Fund a classroom, a lab or a scholarship. Learners make great update subjects — a photo of the first lesson is a donor\'s proof that the money moved.',
    goal: '£500 – £10,000',
  },
  {
    Icon: Globe,
    title: 'Community and environment',
    body: 'Water, sanitation, tree-planting and local infrastructure. These campaigns win on transparency: show the before, show the after, and the community does the rest.',
    goal: '£300 – £15,000',
  },
  {
    Icon: Wallet,
    title: 'Memorial giving',
    body: 'Raise in someone\'s name for a cause they cared about. Say plainly who receives the funds if you are raising on someone else\'s behalf — that honesty is what makes memorial campaigns trusted.',
    goal: '£200 – £10,000',
  },
  {
    Icon: BadgeCheck,
    title: 'Charity and institutional fundraising',
    body: 'Nonprofits, hospitals and schools can raise directly. Verification is the same, and charitable and medical causes pay no platform fee.',
    goal: 'Any',
  },
];

export default function FundraisingIdeasPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.ideas}
      eyebrow="Campaign inspiration"
      eyebrowIcon={Lightbulb}
      variant="depth"
      tone="amber"
      title="Fundraising ideas that"
      accent="get funded."
      lead="The shape of a campaign that works: a named beneficiary, a budget you can read, and a timeline you can see. Pick a cause, then make the goal specific enough that a donor can picture the finish line."
      crumbs={[{ label: 'Fundraise', href: '/fundraise' }, { label: 'Ideas' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'Fundraising tips', href: '/fundraise/tips', icon: Megaphone }}
      spotlight={{
        title: 'What makes an idea fundable',
        note: 'Three checks before you publish anything.',
        items: [
          { icon: BadgeCheck, title: 'Name the person or the place' },
          { icon: Wallet, title: 'Publish a budget donors can read' },
          { icon: Calendar, title: 'Set a date and say what happens next' },
        ],
      }}
      highlights={[
        { value: '£200–£50k', label: 'Typical working goal range', icon: Wallet, tone: 'accent' },
        { value: '6', label: 'Cause types with worked examples', icon: Lightbulb },
        { value: '0%', label: 'Platform fee on medical and charity', icon: BadgeCheck, tone: 'success' },
      ]}
      sections={[
        {
          heading: 'What makes an idea fundable',
          body: 'A good fundraising idea is not a big one — it is a small one that a donor can check off. Name the person or place, publish the line-by-line budget, and set a date. Anything beyond that is marketing, and marketing is easy once the core ask is clear.',
        },
      ]}
      cta={{
        label: 'Start a Campaign',
        href: '/create',
        note: 'Drafting is free and commits you to nothing.',
      }}
    >
      <section className="depth-section border-y py-16 sm:py-24">
        <div className="container relative">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#8a5200]">Six starting points</p>
          <h2 className="mt-3 font-syne text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Ideas by cause
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {IDEAS.map(({ Icon, title, body, goal }, index) => (
              <DepthCard
                key={title}
                index={index}
                icon={Icon}
                iconClassName={index % 2 ? 'bg-accent' : 'bg-warm'}
                title={title}
                footer={
                  <span className="inline-flex items-center gap-1.5 rounded-lg border-b-4 border-warm/60 bg-warm/15 px-3 py-1.5 text-xs font-bold text-[#8a5200]">
                    Typical goal: {goal}
                  </span>
                }
              >
                {body}
              </DepthCard>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}