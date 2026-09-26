import type * as React from 'react';
import Link from 'next/link';
import { BadgeCheck, Quote, ScrollText, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

const PROOF = [
  { Icon: ShieldCheck, text: 'Bank-grade payment security on every transaction' },
  { Icon: BadgeCheck, text: 'Identity-verified fundraisers before any payout' },
  { Icon: ScrollText, text: 'Double-entry ledger you can audit line by line' },
];

/** Split-screen shell shared by the login and register pages. */
export function AuthSplitLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ------------------------------------------------- brand panel */}
      <aside className="brand-gradient hero-glow relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="relative z-10">
          {/* The official logo is drawn for light backgrounds, so it sits on a white chip. */}
          <Link href="/" className="inline-flex rounded-xl bg-white px-3.5 py-2.5 shadow-lg">
            <Logo />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
            Real People.
            <br />
            Real Causes.
            <br />
            <span className="text-success">Greater Impact.</span>
          </h2>

          <ul className="mt-10 space-y-4">
            {PROOF.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/80">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative z-10 max-w-md border-l-2 border-success/50 pl-5">
          <Quote className="h-5 w-5 text-success" />
          <blockquote className="mt-2 text-sm leading-relaxed text-white/75">
            We raised enough for Amina&apos;s surgery in eleven days, and every donor could see
            exactly where the money sat.
          </blockquote>
          <figcaption className="mt-3 text-xs font-semibold text-white/50">
            A HopeNest fundraiser
          </figcaption>
        </figure>
      </aside>

      {/* -------------------------------------------------- form panel */}
      <main id="main" className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}
