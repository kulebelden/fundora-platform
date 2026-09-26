import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import {
  PageHero,
  type PageHeroAction,
  type PageHeroDepthFont,
  type PageHeroCrumb,
  type PageHeroHighlight,
  type PageHeroProps,
  type PageHeroSpotlight,
  type PageHeroTone,
  type PageHeroVariant,
} from '@/components/page-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import type { HeroImage } from '@/lib/hero-images';

export interface MarketingSection {
  heading: string;
  body?: string;
  bullets?: string[];
}

/**
 * Shell for the static pages behind the About and Fundraise menus: hero, an
 * editorial two-column section list, free-form children, then a closing call to
 * action. Keeping them on one shell is what stops eleven marketing routes
 * drifting into eleven layouts — the hero itself is shared with every other
 * route through <PageHero>.
 */
export function MarketingPage({
  eyebrow,
  eyebrowIcon,
  title,
  accent,
  lead,
  variant = 'editorial',
  tone = 'emerald',
  crumbs,
  primaryCta,
  secondaryCta,
  highlights,
  spotlight,
  image,
  depthFont,
  sections = [],
  children,
  cta,
}: {
  eyebrow: string;
  eyebrowIcon?: PageHeroProps['eyebrowIcon'];
  title: string;
  /** Trailing words of the headline, picked out in the brand green. */
  accent?: string;
  lead: string;
  /** Which layout suits this page's content. */
  variant?: PageHeroVariant;
  /** Accent colour for the headline, glow and chips. */
  tone?: PageHeroTone;
  /** Parent menu, used for the breadcrumb when no explicit trail is given. */
  crumbs?: PageHeroCrumb[];
  primaryCta?: PageHeroAction;
  secondaryCta?: PageHeroAction;
  highlights?: PageHeroHighlight[];
  spotlight?: PageHeroSpotlight;
  /** Hero photograph for this page. */
  image?: HeroImage;
  /** Headline face for the `depth` layout. */
  depthFont?: PageHeroDepthFont;
  sections?: MarketingSection[];
  children?: ReactNode;
  cta?: { label: string; href: string; note?: string };
}) {
  return (
    <>
      <SiteHeader />

      <main id="main">
        <PageHero
          variant={variant}
          tone={tone}
          eyebrow={eyebrow}
          eyebrowIcon={eyebrowIcon}
          title={title}
          accent={accent}
          lead={lead}
          crumbs={crumbs}
          primaryCta={primaryCta}
          secondaryCta={secondaryCta}
          highlights={highlights}
          spotlight={spotlight}
          image={image}
          depthFont={depthFont}
        />

        {sections.length ? (
          <div className="container divide-y py-4">
            {sections.map((section_) => (
              <section
                key={section_.heading}
                className="grid gap-4 py-10 md:grid-cols-[1fr_1.6fr] md:gap-10"
              >
                <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {section_.heading}
                </h2>
                <div>
                  {section_.body ? (
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {section_.body}
                    </p>
                  ) : null}
                  {section_.bullets?.length ? (
                    <ul className={section_.body ? 'mt-4 space-y-2.5' : 'space-y-2.5'}>
                      {section_.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2.5 text-sm leading-relaxed">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span className="text-muted-foreground">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {children}

        {cta ? (
          <section className="container py-16 sm:py-20">
            <div className="brand-gradient hero-glow relative overflow-hidden rounded-2xl px-8 py-14 text-center">
              <div className="relative z-10 mx-auto max-w-xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {cta.label}
                </h2>
                {cta.note ? <p className="mt-3 text-white/75">{cta.note}</p> : null}
                <Button size="lg" variant="success" className="mt-8" asChild>
                  <Link href={cta.href}>
                    {cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </>
  );
}
