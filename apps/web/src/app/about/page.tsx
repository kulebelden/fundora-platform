import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  MessageCircle,
  Scale,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { TrustBanner } from '@/components/trust-banner';
import { Card } from '@/components/ui/card';
import { ABOUT_MENU, SUPPORT_POINTS } from '@/lib/site-nav';
import { cn } from '@/lib/utils';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'About HopeNest',
  description:
    'Why HopeNest exists: verified organisers, double-entry accounting and payouts you can follow line by line. Read our mission, how the platform works and where to find help.',
  alternates: { canonical: '/about' },
};

const PRINCIPLES = [
  {
    Icon: ScrollText,
    title: 'The books are the product',
    body: 'Donations and payouts post to an append-only double-entry ledger that database triggers force to balance. Nobody at HopeNest can quietly edit a total — not support, not engineering.',
    accent: 'bg-accent/10 text-accent',
  },
  {
    Icon: Users,
    title: 'A real person behind every campaign',
    body: 'Government-ID or passport verification is enforced in the API before any payout is released. A campaign with no verified organiser can collect nothing.',
    accent: 'bg-success/10 text-success',
  },
  {
    Icon: Scale,
    title: 'No surprises at the end',
    body: 'Fees are shown before a payout is confirmed, not deducted afterwards. Medical and charitable causes pay no platform fee at all.',
    accent: 'bg-warm/15 text-[#8a5200]',
  },
];

export default function AboutPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.about}
      eyebrow="Our mission"
      eyebrowIcon={Building2}
      variant="centered"
      tone="emerald"
      title="Generosity deserves"
      accent="proof, not promises."
      lead="HopeNest exists because the hardest part of giving is not deciding to give — it is knowing the money arrived. We built a fundraising platform on the financial controls auditors expect from a bank, and then made those controls visible to everyone who gives."
      crumbs={[{ label: 'About' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'Talk to our team', href: '/contact', icon: MessageCircle }}
      highlights={[
        { value: 'Ledger', label: 'Every movement double-entry', icon: ScrollText, tone: 'accent' },
        { value: 'ID', label: 'Verified before any payout', icon: ShieldCheck, tone: 'success' },
        { value: '0', label: 'Fees hidden until the end', icon: Scale, tone: 'warm' },
      ]}
      sections={[
        {
          heading: 'Why we built it',
          body: 'Across East Africa and beyond, the fastest way to fund an emergency is still a group chat and a mobile money number. It works, and it is also where trust breaks down: no receipts, no record, no way for a donor a continent away to see what happened next. HopeNest keeps the speed and adds the paper trail.',
        },
        {
          heading: 'How it works in practice',
          bullets: [
            'An organiser drafts a campaign, sets a goal in their own currency and submits it for review.',
            'Identity verification runs once and unlocks withdrawals for every campaign that person runs.',
            'Donors give in their own currency, by card, bank transfer or mobile money.',
            'The organiser requests a payout to a SWIFT or IBAN account, seeing the fee and net amount before confirming.',
            'Every one of those movements lands in the ledger, where both sides read the same numbers.',
          ],
        },
        {
          heading: 'Who runs HopeNest',
          body: 'HopeNest is run by a small team of engineers, finance operators and community moderators across East Africa and Europe. Campaign review and support are staffed by people, not queues — the same people who answer the support line decide whether a campaign goes live.',
        },
      ]}
      cta={{
        label: 'Start a Campaign',
        href: '/create',
        note: 'Free to start, verified before payout, and yours to withdraw at any time.',
      }}
    >
      {/* ------------------------------------------------------ principles */}
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three commitments we can be held to
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRINCIPLES.map(({ Icon, title, body, accent }) => (
              <Card key={title} className="p-7">
                <span
                  className={cn('flex h-12 w-12 items-center justify-center rounded-xl', accent)}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <TrustBanner />

      {/* ------------------------------------------------- link directory */}
      <section className="container pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything else you might be looking for
        </h2>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr_0.9fr]">
          {ABOUT_MENU.map((column) => (
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
