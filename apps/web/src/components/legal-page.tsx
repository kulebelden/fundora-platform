import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

/**
 * Details the legal pages quote. Fill these in once the company is registered;
 * have a lawyer in that jurisdiction review /terms and /privacy before launch.
 */
export const LEGAL = {
  /** The registered legal entity that operates HopeNest. */
  entity: 'HopeNest',
  privacyEmail: 'privacy@hopenest.org',
  supportEmail: 'support@hopenest.org',
  effectiveDate: '24 October 2026',
  governingLaw: 'the laws of the country in which HopeNest is registered',
};

export interface LegalSection {
  id: string;
  heading: string;
  body: ReactNode;
}

/** Plain, readable document layout shared by the Terms of Service and Privacy Policy. */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-background">
        <div className="container max-w-4xl py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Legal</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective {LEGAL.effectiveDate}</p>
          <div className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">{intro}</div>

          <nav aria-label="On this page" className="mt-8 rounded-2xl border bg-secondary/40 p-5">
            <p className="text-sm font-bold">On this page</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-accent hover:underline">
                    {index + 1}. {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold">
                  {index + 1}. {section.heading}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/85">
                  {section.body}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">
            Questions about this document? Email{' '}
            <a href={`mailto:${LEGAL.supportEmail}`} className="font-semibold text-accent hover:underline">
              {LEGAL.supportEmail}
            </a>{' '}
            or use the{' '}
            <Link href="/contact" className="font-semibold text-accent hover:underline">
              contact form
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-accent">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
