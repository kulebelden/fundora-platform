import type { Metadata } from 'next';
import { Building2, Handshake, HeartHandshake, Landmark, ScrollText, Users } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Partnerships & NGOs',
  description:
    'Tools for nonprofits, hospitals and schools running fundraising at scale on HopeNest — verified organisers, ledger-backed reporting and structured payouts.',
  alternates: { canonical: '/partnerships' },
};

const AUDIENCES = [
  {
    Icon: HeartHandshake,
    title: 'Nonprofits',
    body: 'Run many campaigns under one verified organisation, with reporting that reconciles to the ledger rather than to a spreadsheet someone maintains by hand.',
  },
  {
    Icon: Building2,
    title: 'Hospitals & clinics',
    body: 'Point patients at a fundraising route that pays out to a verified account and produces a record the finance office can actually audit.',
  },
  {
    Icon: Users,
    title: 'Schools & universities',
    body: 'Tuition and bursary appeals where the institution can see what was raised against what was invoiced.',
  },
  {
    Icon: ScrollText,
    title: 'Companies',
    body: 'Employee matching and disaster-response pools, administered through the Impact Fund rather than assembled ad hoc each time.',
  },
];

export default function PartnershipsPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.partnerships}
      eyebrow="For organisations"
      eyebrowIcon={Handshake}
      variant="editorial"
      tone="emerald"
      title="Fundraising infrastructure,"
      accent="not a donate button."
      lead="Organisations running dozens of campaigns have a different problem from an individual running one: not how to collect, but how to account for it afterwards. That is the part HopeNest was built around."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'NGO Partnerships' }]}
      primaryCta={{ label: 'Talk to partnerships', href: '/contact' }}
      secondaryCta={{ label: 'Charity fundraising', href: '/fundraise/charity', icon: HeartHandshake }}
      spotlight={{
        title: 'What a partnership includes',
        note: 'The four things that make fundraising at scale auditable.',
        items: [
          {
            icon: Building2,
            title: 'Organisation-level verification',
            body: 'Your staff inherit it, rather than each clearing separately.',
          },
          {
            icon: ScrollText,
            title: 'Ledger-backed statements',
            body: 'Per campaign, per programme and per period.',
          },
          {
            icon: Landmark,
            title: 'Structured payouts',
            body: 'To the organisation’s account, with fee and net shown first.',
          },
          {
            icon: Users,
            title: 'A named contact',
            body: 'For review escalations, not the general support queue.',
          },
        ],
      }}
      sections={[
        {
          heading: 'What a partnership includes',
          bullets: [
            'Organisation-level verification, so campaigns run by your staff inherit it rather than each clearing separately.',
            'Ledger-backed statements per campaign, per programme and per period.',
            'Structured payouts to the organisation’s account, with the fee and net shown before each request.',
            'A named contact at HopeNest for review escalations, rather than the general support queue.',
          ],
        },
        {
          heading: 'What we ask in return',
          bullets: [
            'The person who verifies must be authorised to receive funds on the organisation’s behalf.',
            'Payout accounts belong to the organisation, not to an individual staff member.',
            'Campaigns name their beneficiary plainly, including when funds are pooled across a programme.',
            'Registration details appear on the campaigns, because donors look for them.',
          ],
        },
        {
          heading: 'Where it does not fit',
          body: 'HopeNest is not a grant-management system, a CRM or a donor database, and it does not issue tax receipts on an organisation’s behalf. It handles collection, verification, accounting and payout — the rest stays in whatever you already use.',
        },
      ]}
      cta={{
        label: 'Contact Support',
        href: '/contact',
        note: 'Partnerships will scope it with you before anything is signed.',
      }}
    >
      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Who this is for</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {AUDIENCES.map(({ Icon, title, body }) => (
              <Card key={title} className="p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
