import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, LifeBuoy, Mail, MessageCircle, Newspaper, Send, ShieldCheck, Zap } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { SUPPORT_POINTS } from '@/lib/site-nav';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Contact Support',
  description:
    'Reach a real person at HopeNest. Support for donors and organisers, plus press, partnership and trust & safety contacts.',
  alternates: { canonical: '/contact' },
};

/**
 * PLACEHOLDER ADDRESSES — these mailboxes are not provisioned. Replace them with the
 * real ones (or a helpdesk form) before this page ships to anybody.
 */
const CHANNELS = [
  {
    Icon: MessageCircle,
    title: 'General support',
    body: 'Donors and organisers, any question at all. This is the fastest route and the one staffed around the clock.',
    action: 'support@hopenest.org',
    href: 'mailto:support@hopenest.org',
  },
  {
    Icon: LifeBuoy,
    title: 'Trust & safety',
    body: 'Report a campaign you believe is fraudulent, or file a claim under the Giving Guarantee. Include the campaign link and the email you donated with.',
    action: 'safety@hopenest.org',
    href: 'mailto:safety@hopenest.org',
  },
  {
    Icon: Newspaper,
    title: 'Press enquiries',
    body: 'Journalists and media requests, including interview and data requests. Brand assets are on the newsroom page.',
    action: 'press@hopenest.org',
    href: 'mailto:press@hopenest.org',
  },
  {
    Icon: Mail,
    title: 'Partnerships',
    body: 'Nonprofits, hospitals, schools and companies looking at matching programmes or bulk onboarding.',
    action: 'partners@hopenest.org',
    href: 'mailto:partners@hopenest.org',
  },
];

export default function ContactPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.contact}
      eyebrow="Need help?"
      eyebrowIcon={LifeBuoy}
      variant="centered"
      tone="sky"
      title="Talk to"
      accent="a real person."
      lead="No ticket deflection, no chatbot loop. The people who answer support are the same people who review campaigns, which means they can usually just fix it."
      crumbs={[{ label: 'About', href: '/about' }, { label: 'Contact Support' }]}
      primaryCta={{ label: 'Send us a message', href: '#contact-form', icon: Send }}
      secondaryCta={{ label: 'Read the FAQs first', href: '/help', icon: LifeBuoy }}
      highlights={[
        { value: '24/7', label: 'Support coverage', icon: Clock, tone: 'success' },
        { value: '<2 min', label: 'Median first reply', icon: Zap, tone: 'warm' },
        { value: '4', label: 'Specialist inboxes', icon: Mail },
        { value: 'People', label: 'Never a chatbot loop', icon: MessageCircle },
      ]}
      sections={[
        {
          heading: 'Before you write',
          bullets: [
            'Include the campaign link — it is the fastest way for us to see what you are seeing.',
            'Tell us the email address you used to donate or to register, so we can find the record.',
            'If a payout is involved, say the amount and the date you requested it.',
            'Never send bank details, ID documents or passwords by email. We will never ask for them that way.',
          ],
        },
      ]}
    >
      <section id="contact-form" className="container scroll-mt-24 pb-14 pt-4">
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:gap-8">
          <div className="relative overflow-hidden rounded-3xl border bg-card shadow-lift">
            <div className="brand-gradient hero-glow relative px-6 py-6 sm:px-8">
              <div className="relative z-10 flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                  <Send className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Send us a message</h2>
                  <p className="text-sm text-white/75">A real person reads every one, usually within a few hours.</p>
                </div>
              </div>
            </div>
            <ContactForm />
          </div>

          <aside className="space-y-5">
            <Card className="p-6">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Response times</p>
              <dl className="mt-4 space-y-4">
                {[
                  { label: 'General questions', value: 'Within a few hours' },
                  { label: 'Payout & donation issues', value: 'Same business day' },
                  { label: 'Reports of fraud or misuse', value: 'Prioritised, around the clock' },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-right text-sm font-bold">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="p-6">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Help us help you faster</p>
              <ul className="mt-4 space-y-3">
                {[
                  'The link to the campaign you are asking about',
                  'The email address you donated or registered with',
                  'For payouts: the amount and the date you requested it',
                ].map((tip) => (
                  <li key={tip} className="flex gap-2.5 text-sm leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="flex gap-3 rounded-2xl border border-success/25 bg-success/10 p-5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
              <p className="text-sm leading-relaxed">
                <span className="font-bold">We will never ask</span> for your card number, password or PIN,
                by form, email or phone.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="container pb-4">
        <h2 className="mb-5 text-xl font-extrabold tracking-tight sm:text-2xl">Or write to a specialist team</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {CHANNELS.map(({ Icon, title, body, action, href }) => (
            <Card key={title} className="flex flex-col p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              <Link
                href={href}
                className="mt-4 inline-block text-sm font-bold text-accent underline-offset-4 hover:underline"
              >
                {action}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="container py-14">
        <div className="rounded-2xl bg-gradient-to-br from-success via-success to-primary p-8 text-white shadow-lift sm:p-10">
          <h2 className="text-2xl font-extrabold sm:text-3xl">What you can expect</h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {SUPPORT_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.label} className="flex items-center gap-3 text-sm font-semibold">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  {point.label}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </MarketingPage>
  );
}
