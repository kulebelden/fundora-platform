import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Compass, Globe, ShieldCheck, Users } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Open engineering and operations roles at HopeNest, and how to apply when nothing listed matches what you do.',
  alternates: { canonical: '/careers' },
};

/**
 * Deliberately empty rather than seeded with plausible-looking roles: a fake job ad
 * wastes real people's time. Add entries as roles actually open.
 */
const OPEN_ROLES: Array<{ title: string; team: string; location: string; href: string }> = [];

export default function CareersPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.careers}
      eyebrow="Careers"
      eyebrowIcon={Briefcase}
      variant="editorial"
      tone="sky"
      title="Build the part people"
      accent="have to trust."
      lead="HopeNest is a small team working on the least glamorous and most consequential part of online giving: making sure the money is where the numbers say it is."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Careers' }]}
      primaryCta={{ label: 'Email us', href: 'mailto:careers@hopenest.org' }}
      secondaryCta={{ label: 'Read the mission', href: '/about', icon: Compass }}
      spotlight={{
        title: 'How we work',
        note: 'Four habits, none of them negotiable.',
        items: [
          {
            icon: Users,
            title: 'Engineers talk to support',
            body: 'Nobody ships financial logic they have never had to explain to a user.',
          },
          {
            icon: ShieldCheck,
            title: 'The ledger balances or we do not ship',
            body: 'Correctness over velocity, every time money is involved.',
          },
          {
            icon: Globe,
            title: 'Two regions, real overlap',
            body: 'East Africa and Europe, distributed with hours that actually overlap.',
          },
        ],
      }}
      highlights={[
        { value: `${OPEN_ROLES.length}`, label: 'Open roles right now', icon: Briefcase, tone: 'warm' },
        { value: 'Small', label: 'Team, no layers', icon: Users },
        { value: '2', label: 'Regions, one team', icon: Globe, tone: 'accent' },
      ]}
      sections={[
        {
          heading: 'How we work',
          bullets: [
            'Small team, distributed across East Africa and Europe, with real overlap hours rather than pure async.',
            'Engineers talk to support and to organisers. Nobody ships financial logic they have never had to explain to a user.',
            'Correctness over velocity where money is concerned — the ledger balances or the deploy does not go out.',
            'Reviews are thorough and unhurried; nothing in a fundraising ledger benefits from being rushed through.',
          ],
        },
        {
          heading: 'What we look for',
          bullets: [
            'Comfort with the boring rigour of financial software: idempotency, reconciliation, audit trails.',
            'Willingness to work in an unfamiliar regulatory context and ask before assuming.',
            'Clear writing. A great deal of this job is explaining a number to somebody who is having a bad week.',
          ],
        },
      ]}
      cta={{
        label: 'Contact Support',
        href: '/contact',
        note: 'No suitable role listed? Send us what you have built and what you want to work on.',
      }}
    >
      <section className="container py-4 pb-14">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Open roles</h2>
        {OPEN_ROLES.length ? (
          <ul className="mt-8 divide-y rounded-xl border bg-card shadow-card">
            {OPEN_ROLES.map((role) => (
              <li key={role.href} className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <Link
                    href={role.href}
                    className="font-bold text-accent underline-offset-4 hover:underline"
                  >
                    {role.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {role.team} · {role.location}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="mt-8 p-10 text-center">
            <p className="font-semibold">No roles are open right now.</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              We would still rather hear from you early than not at all — open applications are
              read, and we keep them on file for when something opens up.
            </p>
          </Card>
        )}
      </section>
    </MarketingPage>
  );
}
