import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Check, HeartHandshake, ListChecks, MessageSquare, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Team Fundraising',
  description:
    'Run a campaign with co-organisers on HopeNest. Share stewardship, split visibility and let a whole community carry the campaign forward.',
  alternates: { canonical: '/fundraise/team' },
};

const STEPS = [
  {
    title: 'Invite your co-organisers',
    body: 'Add teammates from your dashboard. Each organiser gets their own stewardship view, and every one of them must clear identity verification before the campaign can receive payouts.',
  },
  {
    title: 'Divide the work',
    body: 'One person tells the story, another keeps the updates coming, a third handles the payout. Team campaigns stay alive longer because the load is shared — and donors can see the whole team behind the ask.',
  },
  {
    title: 'Keep one voice',
    body: 'The campaign page has one story and one goal. Updates come from the team, but the narrative stays consistent. That is what makes a multi-person campaign feel like a single, trustworthy ask rather than a committee.',
  },
];

const STEP_ICONS = [UserPlus, ListChecks, MessageSquare];

const RULES = [
  'Every organiser must be verified before any payout can be released.',
  'Only verified organisers can request a payout.',
  'The campaign page shows every organiser by name.',
  'Donors see one story, one goal and one set of updates.',
];

export default function TeamFundraisingPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.team}
      eyebrow="Organiser guides"
      eyebrowIcon={Users}
      variant="aurora"
      tone="sky"
      title="Fundraising as a"
      accent="team."
      lead="Most campaigns are started by one person and carried by a few. Team fundraising turns that into a shared job — co-organisers, shared stewardship and a single trustworthy story."
      crumbs={[{ label: 'Fundraise', href: '/fundraise' }, { label: 'Team fundraising' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'How it works', href: '/how-it-works', icon: ShieldCheck }}
      spotlight={{
        title: 'Three ways it works',
        note: 'Set the campaign up once, then let the team carry it.',
        items: STEPS.map(({ title }, index) => ({
          icon: STEP_ICONS[index] ?? Users,
          title,
        })),
      }}
      highlights={[
        { value: 'One', label: 'Campaign, one shared story', icon: Users, tone: 'accent' },
        { value: 'Many', label: 'Co-organisers, one ledger', icon: HeartHandshake, tone: 'success' },
        { value: 'Verified', label: 'Every organiser before payout', icon: ShieldCheck, tone: 'warm' },
      ]}
      sections={[
        {
          heading: 'Why teams raise more',
          body: 'A team brings more reach, more skills and more staying power. The campaigns that keep updating for six weeks are rarely one-person campaigns, because life gets in the way for one person. A team absorbs that and keeps the campaign alive.',
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
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How team campaigns work</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Card key={step.title} className="p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Users className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border bg-card p-8 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold">The rules, stated plainly</h3>
            </div>
            <ul className="mt-5 space-y-3">
              {RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}