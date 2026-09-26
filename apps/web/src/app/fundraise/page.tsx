import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, HeartHandshake, Megaphone, ShieldCheck, Users, Wallet } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { TrustBanner } from '@/components/trust-banner';
import { Card } from '@/components/ui/card';
import { FUNDRAISE_MENU, SUPPORT_POINTS } from '@/lib/site-nav';
import { cn } from '@/lib/utils';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Fundraise on HopeNest',
  description:
    'Start a campaign, raise for a cause you believe in, or fundraise for a charity. Step-by-step guides, tips, ideas and organiser tools for every kind of fundraiser.',
  alternates: { canonical: '/fundraise' },
};

const HIGHLIGHTS = [
  {
    Icon: HeartHandshake,
    title: 'Start a campaign',
    body: 'Draft your cause, set a goal in your own currency and submit it for review. Drafting is free and commits you to nothing.',
    href: '/create',
    accent: 'bg-success/10 text-success',
  },
  {
    Icon: Megaphone,
    title: 'Fundraising tips',
    body: 'How to tell your story, pick a category, and keep momentum going after launch — the difference between a campaign that stalls and one that compounds.',
    href: '/fundraise/tips',
    accent: 'bg-accent/10 text-accent',
  },
  {
    Icon: ShieldCheck,
    title: 'How it works',
    body: 'From draft to payout, step by step. Every donation and payout posts to an append-only double-entry ledger.',
    href: '/how-it-works',
    accent: 'bg-primary/10 text-primary',
  },
  {
    Icon: Users,
    title: 'Team fundraising',
    body: 'Invite co-organisers, share stewardship and let a whole community carry the campaign forward.',
    href: '/fundraise/team',
    accent: 'bg-warm/15 text-[#8a5200]',
  },
];

export default function FundraiseHubPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.fundraise}
      eyebrow="For organisers"
      eyebrowIcon={HeartHandshake}
      variant="centered"
      tone="emerald"
      title="Raise for what"
      accent="matters."
      lead="Whether you are starting your first campaign or running one for a charity, HopeNest gives you the tools, the guidance and the financial backbone to make it work."
      crumbs={[{ label: 'Fundraise' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'How it works', href: '/how-it-works', icon: ShieldCheck }}
      spotlight={{
        title: 'What every campaign gets',
        note: 'The same three guarantees, whether you are raising twenty dollars or two hundred thousand.',
        items: [
          {
            icon: HeartHandshake,
            title: 'Free to start',
            body: 'Drafting a campaign costs nothing and commits you to nothing.',
          },
          {
            icon: ShieldCheck,
            title: 'Reviewed before it goes live',
            body: 'A person reads every campaign, and emergency causes jump the queue.',
          },
          {
            icon: Wallet,
            title: 'Yours to withdraw',
            body: 'Fees and net amount are shown before you confirm any payout.',
          },
        ],
      }}
      highlights={[
        { value: 'Free', label: 'To start and list a campaign', icon: HeartHandshake, tone: 'success' },
        { value: 'Any', label: 'Currency — donors give in theirs', icon: Wallet, tone: 'accent' },
        { value: 'Once', label: 'Verification, for every campaign', icon: ShieldCheck, tone: 'warm' },
      ]}
      cta={{
        label: 'Start a Campaign',
        href: '/create',
        note: 'Free to start, verified before payout, and yours to withdraw at any time.',
      }}
    >
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Everything on raising</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {HIGHLIGHTS.map(({ Icon, title, body, href, accent }) => (
              <Card key={title} className="p-7">
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl', accent)}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                <Link
                  href={href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
                >
                  Go there
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <TrustBanner />

      <section className="container pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Fundraising directory</h2>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr_0.9fr]">
          {FUNDRAISE_MENU.map((column) => (
            <div key={column.heading}>
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {column.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:bg-success/12 group-hover:text-success">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold transition-colors group-hover:text-accent">
                            {link.label}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                            {link.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-success via-success to-primary p-6 text-white shadow-lift">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                <span className="h-2 w-2 rounded-full bg-white/90 motion-safe:animate-pulse" />
                Need help?
              </span>
              <h3 className="mt-3 text-2xl font-extrabold leading-tight">Talk to a real person</h3>
              <ul className="mt-5 space-y-3">
                {SUPPORT_POINTS.map((point) => {
                  const Icon = point.icon;
                  return (
                    <li key={point.label} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
                      <Icon className="h-4 w-4 shrink-0 text-white/70" />
                      {point.label}
                    </li>
                  );
                })}
              </ul>
            </div>
            <Link
              href="/contact"
              className="mt-7 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 text-sm font-black text-primary shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-success"
            >
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}