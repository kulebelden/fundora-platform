import Link from 'next/link';
import { ArrowRight, BadgeCheck, ChevronDown, LockKeyhole, Scale, Search } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

const COLUMNS = [
  {
    heading: 'Fundraise',
    links: [
      { label: 'Start a campaign', href: '/create' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Pricing & fees', href: '/pricing' },
      { label: 'Supported countries', href: '/countries' },
    ],
  },
  {
    heading: 'Discover',
    links: [
      { label: 'All categories', href: '/discover' },
      { label: 'Medical', href: '/discover/medical' },
      { label: 'Emergency', href: '/discover/emergency' },
      { label: 'Memorial', href: '/discover/memorial' },
      { label: 'Education', href: '/discover/education' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About HopeNest', href: '/about' },
      { label: 'Giving Guarantee', href: '/guarantee' },
      { label: 'Help center', href: '/help' },
      { label: 'Newsroom', href: '/press' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact support', href: '/contact' },
    ],
  },
];

const TRUST = [
  { icon: BadgeCheck, label: 'Identity-verified organisers' },
  { icon: Scale, label: 'Double-entry ledger' },
  { icon: LockKeyhole, label: 'PCI-DSS payments' },
];

const LINK_CLASS =
  'rounded-sm text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-[#001a40] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_0%_0%,rgb(0_168_107/0.16),transparent_70%),radial-gradient(40%_50%_at_100%_0%,rgb(0_102_255/0.2),transparent_70%)]"
      />

      <div className="container relative">
        {/* ------------------------------------------------ call to action */}
        <div className="flex flex-col items-center gap-6 border-b border-white/10 py-10 text-center sm:py-12 md:flex-row md:justify-between md:text-left">
          <div className="max-w-lg">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Ready to make a difference?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65 sm:text-base">
              Start a verified campaign in minutes, or find a cause worth backing today.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button variant="success" size="lg" asChild>
              <Link href="/create">
                Start a campaign
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              asChild
            >
              <Link href="/discover">
                <Search className="h-4 w-4" />
                Discover causes
              </Link>
            </Button>
          </div>
        </div>

        {/* ------------------------------------------------ brand + links */}
        <div className="grid gap-10 py-10 sm:py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-8">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            {/* The official logo is drawn for light backgrounds, so it sits on a white card. */}
            <Link
              href="/"
              aria-label="HopeNest home"
              className="inline-flex rounded-2xl bg-white px-5 py-4 shadow-xl shadow-black/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Logo variant="stacked" className="w-40 sm:w-44" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
              Every shilling, dollar and euro is tracked on a double-entry ledger, so donors
              and fundraisers see the same numbers.
            </p>
            <ul className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
              {TRUST.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80"
                >
                  <Icon className="h-3.5 w-3.5 text-success" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Phones: one collapsible group per column, so the footer stays short. */}
          <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] md:hidden">
            {COLUMNS.map((column) => (
              <details key={column.heading} className="group">
                <summary className="flex min-h-[3.25rem] cursor-pointer list-none items-center justify-between px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 [&::-webkit-details-marker]:hidden">
                  {column.heading}
                  <ChevronDown className="h-4 w-4 text-white/60 transition-transform group-open:rotate-180" />
                </summary>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 px-5 pb-4">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={`${LINK_CLASS} block py-2`}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {/* Tablet and up: the familiar column grid. */}
          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="hidden md:block">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ legal bar */}
      <div className="relative border-t border-white/10 bg-black/20">
        <div className="container flex flex-col items-center gap-2 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center text-xs text-white/55 sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} HopeNest. Real People. Real Causes. Greater Impact.</p>
          <p className="inline-flex items-center gap-1.5">
            <LockKeyhole className="hidden h-3.5 w-3.5 sm:block" />
            Payments processed over PCI-DSS compliant infrastructure.
          </p>
        </div>
      </div>
    </footer>
  );
}
