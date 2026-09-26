import type { Metadata } from 'next';
import { ArrowRight, BookOpen, Calendar, HeartHandshake, Lightbulb, Megaphone, Sparkles, Users } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { DepthCard } from '@/components/depth-card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Fundraising Tips',
  description:
    'Practical fundraising tips: how to tell your story, pick a goal, keep donors posted and turn one gift into a recurring supporter.',
  alternates: { canonical: '/fundraise/tips' },
};

const TIPS = [
  {
    Icon: BookOpen,
    title: 'Tell a story donors can verify',
    body: 'Open with who the money helps, by name if you can. A goal that a donor can check — "buy 400 bed nets" rather than "fight malaria" — converts far better, because the donor can see the finish line.',
  },
  {
    Icon: Calendar,
    title: 'Set a deadline and say what happens next',
    body: 'A campaign with a date and a clear next step keeps momentum after the goal is met. Announce the payout, post the receipt, then close the loop — donors come back for the second campaign when they saw the first one land.',
  },
  {
    Icon: Megaphone,
    title: 'Post an update at least once a week',
    body: 'Campaigns with regular updates raise substantially more than ones that go quiet after launch. A photo, a number and a sentence is enough. Say plainly when things go badly — donors forgive a setback they are told about.',
  },
  {
    Icon: HeartHandshake,
    title: 'Thank every donor within 48 hours',
    body: 'A personal thank-you is the cheapest retention tool there is. It also signals to the platform that you are an active organiser, which affects how campaigns are surfaced to new visitors.',
  },
  {
    Icon: Users,
    title: 'Invite your community to share',
    body: 'The first 48 hours decide whether a campaign is seen at all. Ask the people who already believe in you to give and share — the algorithm rewards early velocity, and your warm network is where that velocity starts.',
  },
  {
    Icon: Sparkles,
    title: 'Match the goal to the audience',
    body: 'A £50 goal converts cold traffic; a £5,000 goal needs a warm audience that already knows you. Pick a goal you can plausibly hit in the first two weeks, then extend rather than reset.',
  },
];

export default function FundraisingTipsPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.tips}
      eyebrow="Organiser guides"
      eyebrowIcon={Sparkles}
      variant="depth"
      depthFont="bricolage"
      tone="emerald"
      title="Fundraising tips that"
      accent="actually work."
      lead="The mechanics of a campaign are easy. The part that separates a campaign that stalls from one that compounds is how you tell the story and keep people posted. Here is what that looks like in practice."
      crumbs={[{ label: 'Fundraise', href: '/fundraise' }, { label: 'Tips' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'Browse ideas by cause', href: '/fundraise/ideas', icon: Lightbulb }}
      highlights={[
        { value: '6', label: 'Habits of campaigns that compound', icon: Sparkles, tone: 'accent' },
        { value: 'Weekly', label: 'Minimum update cadence', icon: Megaphone, tone: 'success' },
        { value: '48h', label: 'To thank every donor', icon: HeartHandshake, tone: 'warm' },
        { value: '48h', label: 'That decides whether you are seen', icon: Users },
      ]}
      sections={[
        {
          heading: 'What separates the campaigns that land from the ones that stall',
          body: 'Most campaigns fail for the same three reasons: the story is vague, the goal is unreachable, and the organiser goes quiet after launch. None of those is fixed by a better payment rail — they are fixed by doing the basics well, and the basics are not hard.',
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
          <p className="text-xs font-black uppercase tracking-[0.25em] text-success">Organiser playbook</p>
          <h2 className="mt-3 max-w-3xl font-bricolage text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl">
            The six habits of campaigns that compound
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {TIPS.map(({ Icon, title, body }, index) => (
              <DepthCard
                key={title}
                index={index}
                icon={Icon}
                iconClassName={index % 2 ? 'bg-accent' : 'bg-success'}
                title={title}
                fontClassName="font-bricolage"
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