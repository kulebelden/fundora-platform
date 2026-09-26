import { BadgeCheck, CreditCard, Landmark, Lock, ScrollText, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

const PILLARS = [
  {
    Icon: Lock,
    title: 'Bank-grade payment security',
    body: 'Card and bank payments run over PCI-DSS compliant processors. Card numbers never touch HopeNest servers, and every webhook is signature-verified before a shilling moves.',
    accent: 'bg-accent/10 text-accent',
  },
  {
    Icon: BadgeCheck,
    title: '100% verified beneficiaries',
    body: 'Every fundraiser clears government-ID or passport KYC before a single payout is released. No verification, no withdrawal — enforced in the API, not just the interface.',
    accent: 'bg-success/10 text-success',
  },
  {
    Icon: ScrollText,
    title: 'Double-entry auditability',
    body: 'Each donation and payout is posted to an append-only double-entry ledger that database triggers force to balance to zero. The books cannot be quietly edited.',
    accent: 'bg-warm/15 text-[#8a5200]',
  },
];

export function TrustBanner() {
  return (
    <section id="trust" className="container scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Trust &amp; security
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Money you can follow, line by line
        </h2>
        <p className="mt-3 text-muted-foreground">
          Generosity deserves proof, not promises. HopeNest is built on the same financial
          controls auditors expect from a bank.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PILLARS.map(({ Icon, title, body, accent }) => (
          <Card key={title} className="p-7">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg font-bold">{title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border bg-secondary/50 px-6 py-5 sm:flex-row">
        <div className="flex items-center gap-3 text-sm font-medium">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <span>Visa · Mastercard · American Express</span>
        </div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex items-center gap-3 text-sm font-medium">
          <Landmark className="h-5 w-5 text-muted-foreground" />
          <span>SWIFT / IBAN bank transfers in 40+ countries</span>
        </div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex items-center gap-3 text-sm font-medium">
          <ShieldCheck className="h-5 w-5 text-success" />
          <span>256-bit TLS everywhere</span>
        </div>
      </div>
    </section>
  );
}
