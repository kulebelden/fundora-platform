import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Home,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { HeroImage } from '@/lib/hero-images';
import { cn } from '@/lib/utils';

export interface PageHeroCrumb {
  label: string;
  href?: string;
}

export interface PageHeroAction {
  label: string;
  href: string;
  icon?: LucideIcon;
}

/** Colour of the accent words, glow and chips — picked to suit the page. */
export type PageHeroTone = 'emerald' | 'sky' | 'amber';

export type PageHeroToneKey = 'success' | 'warm' | 'accent' | 'plain';

export interface PageHeroHighlight {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: PageHeroToneKey;
}

export interface PageHeroSpotlightItem {
  title: string;
  body?: string;
  icon: LucideIcon;
}

export interface PageHeroSpotlight {
  title: string;
  note?: string;
  items: PageHeroSpotlightItem[];
}

/**
 * Six layouts that deliberately share nothing but the breadcrumb. Each sets its
 * headline in its own typeface, arranges its copy differently, presents its call
 * to action differently and shows its key figures somewhere different — so no
 * two page types open the same way.
 *
 * - `aurora`    — Plus Jakarta. Full-bleed photo, copy left, one button plus a
 *                 text link, figures as a ruled column on the right.
 * - `centered`  — Playfair Display. Ceremonial, centred, italic accent, a white
 *                 pill button, figures as a single line of text.
 * - `editorial` — Fraunces. A magazine opening: masthead rule, drop cap, framed
 *                 print, figures as a fact line, square ink button.
 * - `signal`    — Space Grotesk. Uppercase and urgent, a live ticker carrying
 *                 the figures across the top, a status board beside the copy.
 * - `split`     — Sora. Warm and light, photo cut on a diagonal, figures on a
 *                 card floating over the photo.
 * - `depth`     — Syne. A 3D stage: extruded headline, tilted card stack over a
 *                 perspective floor, a pressable button.
 */
export type PageHeroVariant = 'aurora' | 'editorial' | 'centered' | 'signal' | 'split' | 'depth';

/**
 * Display face for the `depth` layout, so two 3D pages can still differ:
 * `syne` is very wide and set in capitals; `bricolage` is condensed and set in
 * sentence case.
 */
export type PageHeroDepthFont = 'syne' | 'bricolage';

export interface PageHeroProps {
  variant?: PageHeroVariant;
  tone?: PageHeroTone;
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  /** Trailing words of the headline, picked out in the accent colour. */
  accent?: string;
  lead: string;
  /** Trail shown above the copy. The last item is treated as the current page. */
  crumbs?: PageHeroCrumb[];
  primaryCta?: PageHeroAction;
  secondaryCta?: PageHeroAction;
  /** Key facts. Each layout places them differently. */
  highlights?: PageHeroHighlight[];
  /** Side panel: the short version of what this page holds. */
  spotlight?: PageHeroSpotlight;
  /** Optional large icon chip, used by the category hubs. */
  icon?: LucideIcon;
  /** Page photograph. Every route should pass its own (see lib/hero-images). */
  image?: HeroImage;
  /** Only read by the `depth` layout. */
  depthFont?: PageHeroDepthFont;
  className?: string;
}

/* ------------------------------------------------------------------ tones */

interface TonePalette {
  /** Accent colour for the trailing headline words. */
  accent: string;
  /** Background colour matching the accent, for rules, dots and edges. */
  accentBg: string;
  /** Border colour matching the accent. */
  accentBorder: string;
  /** Hover fill for a round outlined button inside a `group`. */
  accentHoverFill: string;
  /** The accent as it reads on a white chip or card. */
  accentOnWhite: string;
  /** Utility class carrying the page's glow layer (see globals.css). */
  glow: string;
}

const DARK_TONES: Record<PageHeroTone, TonePalette> = {
  emerald: {
    accent: 'text-success',
    accentBg: 'bg-success',
    accentBorder: 'border-success',
    accentHoverFill: 'group-hover:bg-success',
    accentOnWhite: 'text-success',
    glow: 'hero-tone-emerald',
  },
  sky: {
    accent: 'text-sky-300',
    accentBg: 'bg-sky-400',
    accentBorder: 'border-sky-400',
    accentHoverFill: 'group-hover:bg-sky-400',
    accentOnWhite: 'text-accent',
    glow: 'hero-tone-sky',
  },
  amber: {
    accent: 'text-amber-300',
    accentBg: 'bg-warm',
    accentBorder: 'border-warm',
    accentHoverFill: 'group-hover:bg-warm',
    accentOnWhite: 'text-warm',
    glow: 'hero-tone-amber',
  },
};

const LIGHT_TONES: Record<PageHeroTone, TonePalette> = {
  emerald: {
    accent: 'text-success',
    accentBg: 'bg-success',
    accentBorder: 'border-success',
    accentHoverFill: 'group-hover:bg-success',
    accentOnWhite: 'text-success',
    glow: 'hero-tone-emerald-light',
  },
  sky: {
    accent: 'text-accent',
    accentBg: 'bg-accent',
    accentBorder: 'border-accent',
    accentHoverFill: 'group-hover:bg-accent',
    accentOnWhite: 'text-accent',
    glow: 'hero-tone-sky-light',
  },
  amber: {
    accent: 'text-[#8a5200]',
    accentBg: 'bg-warm',
    accentBorder: 'border-warm',
    accentHoverFill: 'group-hover:bg-warm',
    accentOnWhite: 'text-[#8a5200]',
    glow: 'hero-tone-amber-light',
  },
};

/** Everything a variant renderer needs, resolved by the shell. */
interface VariantInput extends Omit<PageHeroProps, 'highlights' | 'crumbs' | 'tone'> {
  tone: PageHeroTone;
  palette: TonePalette;
  highlights: PageHeroHighlight[];
  crumbs: PageHeroCrumb[];
}

/**
 * Top spacing shared by every layout. The header is sticky and already 4rem
 * tall, so the hero only needs a small breath before the breadcrumb.
 */
const TOP = 'pt-5 sm:pt-7 lg:pt-8';

/* ----------------------------------------------------------------- pieces */

function Crumbs({
  items,
  light,
  centered,
  className,
}: {
  items: PageHeroCrumb[];
  light: boolean;
  centered?: boolean;
  className?: string;
}) {
  if (!items.length) return null;

  const focusRing = light ? 'focus-visible:ring-ring' : 'focus-visible:ring-white/60';
  const hoverText = light ? 'hover:text-foreground' : 'hover:text-white';

  return (
    <nav aria-label="Breadcrumb" className={cn('hero-rise mb-5 sm:mb-6', className)}>
      <ol
        className={cn(
          'flex flex-wrap items-center gap-1.5 text-xs font-semibold',
          light ? 'text-muted-foreground' : 'text-white/65',
          centered && 'justify-center',
        )}
      >
        <li className="flex items-center gap-1.5">
          <Link
            href="/"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2',
              hoverText,
              focusRing,
            )}
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={crumb.label} className="flex items-center gap-1.5">
              <ChevronRight
                aria-hidden
                className={cn('h-3.5 w-3.5', light ? 'text-border' : 'text-white/35')}
              />
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className={cn(
                    'rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2',
                    hoverText,
                    focusRing,
                  )}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={light ? 'text-foreground' : 'text-white/90'}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Secondary action as a plain text link, so no hero shows two equal buttons. */
function TextLink({
  action,
  className,
  arrow = 'right',
}: {
  action: PageHeroAction;
  className?: string;
  arrow?: 'right' | 'up' | 'none';
}) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      className={cn(
        'group inline-flex items-center gap-2 rounded-sm text-sm font-bold underline-offset-[6px] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {action.label}
      {arrow === 'right' ? (
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      ) : arrow === 'up' ? (
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      ) : null}
    </Link>
  );
}

/**
 * The hero photograph. Always the LCP element on the page, so it loads with
 * priority; `sizes` tells next/image which width each layout actually shows.
 */
function HeroPhoto({
  image,
  sizes = '100vw',
  className,
}: {
  image: HeroImage;
  sizes?: string;
  className?: string;
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      priority
      sizes={sizes}
      className={cn('object-cover', className)}
      style={{ objectPosition: image.position ?? 'center' }}
    />
  );
}

/* ================================================================ aurora */

function AuroraHero({
  palette,
  eyebrow,
  eyebrowIcon: EyebrowIcon = ShieldCheck,
  title,
  accent,
  lead,
  crumbs,
  icon: LeadIcon,
  image,
  primaryCta,
  secondaryCta,
  highlights,
  spotlight,
}: VariantInput) {
  return (
    <>
      {image ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <HeroPhoto image={image} />
          <div className="hero-veil-aurora absolute inset-0" />
        </div>
      ) : null}

      <div className={cn('container relative z-10 pb-14 sm:pb-20 lg:pb-24', TOP)}>
        <Crumbs items={crumbs} light={false} />

        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
          <div className="hero-rise hero-rise-1 min-w-0 lg:col-span-7">
            <div className="flex items-center gap-3">
              {LeadIcon ? (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur">
                  <LeadIcon className="h-5 w-5" />
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <EyebrowIcon className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
            </div>

            <h1 className="[overflow-wrap:anywhere] mt-5 text-[2.25rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
              {title}
              {accent ? <span className={cn('block', palette.accent)}>{accent}</span> : null}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {lead}
            </p>

            <div className="hero-rise hero-rise-3 mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className="group inline-flex items-center gap-3 rounded-xl bg-success py-2 pl-5 pr-2 text-sm font-bold text-white shadow-lg shadow-success/30 transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  {primaryCta.label}
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ) : null}
              {secondaryCta ? (
                <TextLink action={secondaryCta} className="text-white/90 hover:text-white" />
              ) : null}
            </div>
          </div>

          <div className="hero-rise hero-rise-2 min-w-0 lg:col-span-5">
            {spotlight ? (
              <GlassPanel spotlight={spotlight} highlights={highlights} palette={palette} />
            ) : highlights.length ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-1 lg:gap-y-0 lg:divide-y lg:divide-white/15 lg:border-l lg:border-white/15 lg:pl-10">
                {highlights.map(({ label, value }) => (
                  <div key={label} className={cn('border-l-2 pl-4 lg:border-l-0 lg:py-5 lg:pl-0', palette.accentBorder)}>
                    <dd className="tabular text-3xl font-extrabold text-white lg:text-4xl">{value}</dd>
                    <dt className="mt-1 text-sm text-white/70">{label}</dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

/** Aurora's frosted side panel; the figures sit in its footer, not under the hero. */
function GlassPanel({
  spotlight,
  highlights,
  palette,
}: {
  spotlight: PageHeroSpotlight;
  highlights: PageHeroHighlight[];
  palette: TonePalette;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] shadow-2xl backdrop-blur-xl">
      <div className="p-6 sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
          {spotlight.title}
        </p>
        {spotlight.note ? (
          <p className="mt-2 text-sm leading-relaxed text-white/75">{spotlight.note}</p>
        ) : null}
        <ul className="mt-5 space-y-3.5">
          {spotlight.items.map(({ title, body, icon: Icon }) => (
            <li key={title} className="flex gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Icon className="h-[1.125rem] w-[1.125rem]" />
              </span>
              <span className="min-w-0 self-center">
                <span className="block text-sm font-bold text-white">{title}</span>
                {body ? (
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/65">{body}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {highlights.length ? (
        <dl className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/15">
          {highlights.slice(0, 3).map(({ label, value }) => (
            <div key={label} className="px-3 py-4 text-center sm:px-4">
              <dd className={cn('tabular text-base font-extrabold sm:text-lg', palette.accent)}>{value}</dd>
              <dt className="mt-0.5 text-[11px] leading-snug text-white/60">{label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/* ============================================================== centered */

function CenteredHero({
  palette,
  eyebrow,
  title,
  accent,
  lead,
  crumbs,
  icon: LeadIcon,
  image,
  primaryCta,
  secondaryCta,
  highlights,
}: VariantInput) {
  return (
    <>
      {image ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <HeroPhoto image={image} />
          <div className="hero-veil-centered absolute inset-0" />
        </div>
      ) : null}

      <div className={cn('container relative z-10 pb-16 text-center sm:pb-24 lg:pb-28', TOP)}>
        <Crumbs items={crumbs} light={false} centered className="mb-8 sm:mb-12" />

        <div className="hero-rise hero-rise-1 mx-auto flex max-w-4xl flex-col items-center">
          {LeadIcon ? (
            <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 text-white">
              <LeadIcon className="h-6 w-6" />
            </span>
          ) : null}

          <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-white/75">
            <span aria-hidden className={cn('h-px w-8 sm:w-12', palette.accentBg)} />
            {eyebrow}
            <span aria-hidden className={cn('h-px w-8 sm:w-12', palette.accentBg)} />
          </p>

          <h1 className="[overflow-wrap:anywhere] mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {title}
            {accent ? (
              <em className={cn('block font-medium italic', palette.accent)}>{accent}</em>
            ) : null}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {lead}
          </p>

          {highlights.length ? (
            <p className="mt-7 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-2 text-sm text-white/70">
              {highlights.slice(0, 3).map(({ label, value }, index) => (
                <span key={label} className="inline-flex items-baseline gap-2">
                  {index > 0 ? <span aria-hidden className="mx-2 text-white/30">◆</span> : null}
                  <span className="font-display text-xl font-semibold italic text-white">{value}</span>
                  {label}
                </span>
              ))}
            </p>
          ) : null}
        </div>

        <div className="hero-rise hero-rise-3 mt-9 flex flex-col items-center gap-4">
          {primaryCta ? (
            <Link
              href={primaryCta.href}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          {secondaryCta ? (
            <TextLink
              action={secondaryCta}
              arrow="none"
              className="font-medium text-white/75 underline hover:text-white"
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ============================================================= editorial */

/** Offset block behind the editorial print frame, in the page's tone. */
const FRAME_TINT: Record<PageHeroTone, string> = {
  emerald: 'bg-success/20',
  sky: 'bg-accent/15',
  amber: 'bg-warm/30',
};

function EditorialHero({
  tone,
  palette,
  eyebrow,
  eyebrowIcon: EyebrowIcon = ShieldCheck,
  title,
  accent,
  lead,
  crumbs,
  image,
  primaryCta,
  secondaryCta,
  highlights,
  spotlight,
}: VariantInput) {
  const hasAside = Boolean(spotlight || image);

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 hero-paper" />
      <div className={cn('container relative z-10 pb-14 sm:pb-20', TOP)}>
        <Crumbs items={crumbs} light />

        {/* Masthead rule. */}
        <div className="hero-rise flex items-center gap-3 border-b-2 border-foreground pb-2.5">
          <EyebrowIcon className={cn('h-4 w-4', palette.accent)} />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground">
            {eyebrow}
          </span>
          <span className="ml-auto hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
            HopeNest · Reference
          </span>
        </div>

        <div className={cn('mt-8 grid gap-10 sm:mt-10', hasAside && 'lg:grid-cols-12 lg:gap-14')}>
          <div className={cn('hero-rise hero-rise-1 min-w-0', hasAside ? 'lg:col-span-7' : 'max-w-3xl')}>
            <h1 className="[overflow-wrap:anywhere] font-serif text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem]">
              {title}
              {accent ? (
                <em className={cn('font-normal italic', palette.accent)}> {accent}</em>
              ) : null}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-serif first-letter:text-[3.6rem] first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-foreground sm:text-lg">
              {lead}
            </p>

            {highlights.length ? (
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-dashed pt-5 sm:flex sm:flex-wrap sm:gap-x-10">
                {highlights.map(({ label, value }) => (
                  <div key={label}>
                    <dd className="tabular font-serif text-2xl font-semibold text-foreground">
                      {value}
                    </dd>
                    <dt className="mt-0.5 max-w-[12rem] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="hero-rise hero-rise-3 mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center gap-2 bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {secondaryCta ? (
                <TextLink action={secondaryCta} arrow="up" className="text-foreground underline" />
              ) : null}
            </div>
          </div>

          {hasAside ? (
            <aside className="hero-rise hero-rise-2 min-w-0 lg:col-span-5">
              {image ? (
                <figure className="mr-3 sm:mr-4">
                  <div className="relative">
                    {/* Offset block in the page tone: a print laid on the desk. */}
                    <div
                      aria-hidden
                      className={cn(
                        'absolute -bottom-3 -right-3 left-6 top-6 sm:-bottom-4 sm:-right-4',
                        FRAME_TINT[tone],
                      )}
                    />
                    <div
                      className={cn(
                        'relative overflow-hidden border-[6px] border-card bg-muted shadow-lift',
                        spotlight ? 'aspect-[16/9]' : 'aspect-[4/3] lg:aspect-[4/5]',
                      )}
                    >
                      <HeroPhoto image={image} sizes="(min-width: 1024px) 480px, 100vw" />
                    </div>
                  </div>
                  <figcaption className="mt-6 font-serif text-xs italic text-muted-foreground">
                    {image.alt}
                  </figcaption>
                </figure>
              ) : null}

              {spotlight ? (
                <div className={cn('border-l-2 pl-5', palette.accentBorder, image && 'mt-7')}>
                  <p className="font-serif text-lg font-semibold italic text-foreground">
                    {spotlight.title}
                  </p>
                  {spotlight.note ? (
                    <p className="mt-1 text-sm text-muted-foreground">{spotlight.note}</p>
                  ) : null}
                  <ol className="mt-4 space-y-3">
                    {spotlight.items.map(({ title: itemTitle, body }, index) => (
                      <li key={itemTitle} className="flex gap-3">
                        <span className="tabular font-serif text-sm font-semibold text-muted-foreground">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-foreground">{itemTitle}</span>
                          {body ? (
                            <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                              {body}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ================================================================ signal */

function SignalHero({
  palette,
  eyebrow,
  title,
  accent,
  lead,
  crumbs,
  image,
  primaryCta,
  secondaryCta,
  highlights,
  spotlight,
}: VariantInput) {
  // Doubled so the ticker can loop seamlessly by sliding exactly one copy's width.
  const ticker = [...highlights, ...highlights];

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {image ? (
          <div className="hero-signal-photo absolute inset-0 lg:left-auto lg:w-[62%]">
            <HeroPhoto
              image={image}
              sizes="(min-width: 1024px) 62vw, 100vw"
              className="grayscale-[65%] contrast-125"
            />
            <div className="absolute inset-0 bg-destructive/20 mix-blend-multiply" />
          </div>
        ) : null}
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10 sm:h-96 sm:w-96" />
        <div className="absolute bottom-0 left-0 h-64 w-3/4 max-w-[28rem] rounded-full bg-destructive/15 blur-3xl" />
      </div>

      {/* Live ticker: the page's figures run across the top edge. */}
      {highlights.length ? (
        <div className="relative z-10 overflow-hidden border-b border-white/10 bg-black/35">
          <div className="hero-ticker flex w-max items-center gap-10 py-2.5 pr-10 font-grotesk text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">
            {ticker.map(({ label, value }, index) => (
              <span key={`${label}-${index}`} aria-hidden={index >= highlights.length} className="inline-flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                <span className="font-bold text-warm">{value}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div aria-hidden className="relative z-10 h-1 bg-gradient-to-r from-destructive via-warm to-transparent" />
      )}

      <div className={cn('container relative z-10 pb-14 sm:pb-20 lg:pb-24', TOP)}>
        <Crumbs items={crumbs} light={false} />

        <div className={cn('grid gap-10', spotlight && 'lg:grid-cols-12 lg:gap-14')}>
          <div className={cn('hero-rise hero-rise-1 min-w-0', spotlight ? 'lg:col-span-7' : 'max-w-3xl')}>
            <span className="inline-flex items-center gap-2 border border-destructive/50 bg-destructive/15 px-2.5 py-1 font-grotesk text-[10px] font-bold uppercase tracking-[0.22em] text-red-200">
              <span className="h-2 w-2 rounded-full bg-destructive motion-safe:animate-pulse" />
              {eyebrow}
            </span>

            <h1 className="[overflow-wrap:anywhere] mt-5 font-grotesk text-[2.4rem] font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[4.5rem]">
              {title}
              {accent ? <span className={cn('block', palette.accent)}>{accent}</span> : null}
            </h1>

            <p className="mt-6 max-w-xl border-l-2 border-destructive pl-4 text-base leading-relaxed text-white/75 sm:text-lg">
              {lead}
            </p>

            <div className="hero-rise hero-rise-3 mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center gap-3 bg-warm px-6 py-4 font-grotesk text-sm font-bold uppercase tracking-wider text-[#1a1000] transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className="rounded-sm font-grotesk text-xs font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  [ {secondaryCta.label} ]
                </Link>
              ) : null}
            </div>
          </div>

          {spotlight ? (
            <div className="hero-rise hero-rise-2 lg:col-span-5 lg:self-center">
              <div className="border border-white/15 bg-black/45 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-grotesk text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                  <span>{spotlight.title}</span>
                  <span className="inline-flex items-center gap-1.5 text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Active
                  </span>
                </div>
                <ul className="divide-y divide-white/10">
                  {spotlight.items.map(({ title: itemTitle, body }, index) => (
                    <li key={itemTitle} className="flex gap-4 px-5 py-4">
                      <span className="font-grotesk text-sm font-bold text-warm">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-white">{itemTitle}</span>
                        {body ? (
                          <span className="mt-1 block text-sm leading-relaxed text-white/60">{body}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ================================================================= split */

function SplitHero({
  palette,
  eyebrow,
  title,
  accent,
  lead,
  crumbs,
  image,
  primaryCta,
  secondaryCta,
  highlights,
  spotlight,
}: VariantInput) {
  const SecondaryIcon = secondaryCta?.icon ?? ArrowRight;

  return (
    <div className="relative lg:min-h-[34rem]">
      <div className={cn('container relative z-10 pb-10 sm:pb-14 lg:pb-20', TOP)}>
        <div className={cn(image && 'lg:w-1/2 lg:pr-14')}>
          <Crumbs items={crumbs} light />

          <div className="hero-rise hero-rise-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-foreground">
              <span className={cn('h-2 w-2 rounded-full', palette.accentBg)} />
              {eyebrow}
            </span>

            <h1 className="[overflow-wrap:anywhere] mt-5 font-sora text-[2.1rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-5xl lg:text-[3.3rem]">
              {title}{' '}
              {accent ? (
                <span className="relative inline-block">
                  <span className={palette.accent}>{accent}</span>
                  <svg
                    aria-hidden
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    className={cn('absolute -bottom-1.5 left-0 h-2.5 w-full', palette.accent)}
                  >
                    <path d="M2 9C40 3 90 2 198 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              ) : null}
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {lead}
            </p>
          </div>

          <div className="hero-rise hero-rise-3 mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="group inline-flex items-center gap-3 rounded-full text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors group-hover:text-white',
                    palette.accentBorder,
                    palette.accent,
                    palette.accentHoverFill,
                  )}
                >
                  <SecondaryIcon className="h-4 w-4" />
                </span>
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>

          {/* Phones: figures as a swipeable chip row (the floating card needs the desktop photo). */}
          {highlights.length ? (
            <div className="-mx-4 mt-8 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:hidden">
              {highlights.map(({ label, value }) => (
                <div key={label} className="min-w-[9.5rem] snap-start rounded-2xl bg-secondary px-4 py-3">
                  <p className="tabular font-sora text-lg font-semibold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          ) : null}

          {spotlight ? (
            <ul className="mt-8 space-y-2">
              {spotlight.items.map(({ title: itemTitle, icon: Icon }) => (
                <li key={itemTitle} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Icon className={cn('h-4 w-4', palette.accent)} />
                  {itemTitle}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {image ? (
        <div className="hero-split-photo relative mx-4 mb-10 h-60 overflow-hidden rounded-3xl sm:mx-6 sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:m-0 lg:h-auto lg:w-1/2 lg:rounded-none">
          <HeroPhoto image={image} sizes="(min-width: 1024px) 50vw, 100vw" />

          {highlights.length ? (
            <dl
              className={cn(
                'absolute bottom-8 left-[20%] right-8 hidden gap-px overflow-hidden rounded-2xl bg-border/60 shadow-2xl lg:grid',
                highlights.length === 3 ? 'grid-cols-3' : highlights.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
              )}
            >
              {highlights.slice(0, 4).map(({ label, value }) => (
                <div key={label} className="bg-card/95 px-5 py-4 backdrop-blur">
                  <dd className="tabular font-sora text-xl font-semibold text-foreground">{value}</dd>
                  <dt className="mt-0.5 text-xs text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ================================================================= depth */

interface StageCard {
  title: string;
  body?: string;
  icon?: LucideIcon;
  /** A figure (e.g. "48h") rather than a sentence: set large. */
  figure?: boolean;
}

const DEPTH_FONTS: Record<PageHeroDepthFont, { family: string; headline: string }> = {
  syne: {
    family: 'font-syne',
    headline:
      'uppercase text-[1.8rem] leading-[1] min-[400px]:text-[2.1rem] sm:text-[3.4rem] lg:text-[3.6rem]',
  },
  bricolage: {
    family: 'font-bricolage',
    headline:
      'text-[2.6rem] leading-[0.95] tracking-[-0.03em] min-[400px]:text-[2.9rem] sm:text-[4rem] lg:text-[4.6rem]',
  },
};

function DepthHero({
  depthFont = 'syne',
  palette,
  eyebrow,
  eyebrowIcon: EyebrowIcon = ShieldCheck,
  title,
  accent,
  lead,
  crumbs,
  image,
  primaryCta,
  secondaryCta,
  highlights,
  spotlight,
}: VariantInput) {
  // The stage shows the spotlight checklist when there is one, else the figures.
  const font = DEPTH_FONTS[depthFont];
  const cards: StageCard[] = spotlight
    ? spotlight.items.slice(0, 3)
    : highlights.slice(0, 3).map(({ label, value, icon }) => ({ title: value, body: label, icon, figure: true }));

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hero-depth-floor" />
        <div className={cn('absolute -left-24 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl', palette.accentBg)} />
        <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className={cn('container relative z-10 pb-14 sm:pb-20 lg:pb-24', TOP)}>
        <Crumbs items={crumbs} light={false} />

        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="hero-rise hero-rise-1 min-w-0 lg:col-span-6">
            <span className="depth-chip inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-primary">
              <EyebrowIcon className={cn('h-3.5 w-3.5', palette.accentOnWhite)} />
              {eyebrow}
            </span>

            <h1
              className={cn(
                'hero-3d-text mt-6 font-extrabold tracking-tight text-white [overflow-wrap:anywhere]',
                font.family,
                font.headline,
              )}
            >
              {title}
              {accent ? <span className={cn('block', palette.accent)}>{accent}</span> : null}
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">{lead}</p>

            <div className="hero-rise hero-rise-3 mt-9 flex flex-wrap items-center gap-x-7 gap-y-5">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className={cn(
                    'btn-3d inline-flex items-center gap-2 rounded-2xl bg-success px-7 py-4 text-sm font-bold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                    font.family,
                  )}
                >
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {secondaryCta ? (
                <TextLink action={secondaryCta} className="text-white/85 hover:text-white" />
              ) : null}
            </div>
          </div>

          {/* The 3D stage. */}
          <div className="hero-rise hero-rise-2 min-w-0 lg:col-span-6">
            <div className="hero-stage relative mx-auto h-[21rem] w-full max-w-[26rem] sm:h-[25rem]">
              <div className="hero-stage-inner absolute inset-0">
                {image ? (
                  <div className="stage-photo absolute right-0 top-0 h-44 w-[78%] overflow-hidden rounded-3xl border-4 border-white/80 sm:h-52">
                    <HeroPhoto image={image} sizes="(min-width: 1024px) 400px, 80vw" />
                  </div>
                ) : null}

                {cards.map(({ title: cardTitle, body, icon: Icon, figure }, index) => (
                  <div
                    key={cardTitle}
                    className="stage-card absolute flex w-[74%] items-center gap-3.5 rounded-2xl bg-white p-4 text-foreground"
                    style={
                      {
                        '--z': `${50 + index * 45}px`,
                        '--delay': `${index * -1.6}s`,
                        left: `${index * 9}%`,
                        top: `${38 + index * 19}%`,
                      } as CSSProperties
                    }
                  >
                    {Icon ? (
                      <span className={cn('icon-3d flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white', palette.accentBg)}>
                        <Icon className="h-5 w-5" />
                      </span>
                    ) : null}
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block font-bold leading-tight',
                          font.family,
                          figure ? 'text-2xl sm:text-3xl' : 'text-sm',
                        )}
                      >
                        {cardTitle}
                      </span>
                      {body ? (
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{body}</span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ shell */

const SECTION_CLASS: Record<PageHeroVariant, string> = {
  aurora: 'brand-gradient hero-grid',
  centered: 'brand-gradient hero-grid',
  signal: 'hero-signal-bg',
  editorial: 'border-b bg-secondary/40',
  split: 'border-b bg-background',
  depth: 'hero-depth-bg',
};

const LIGHT_VARIANTS = new Set<PageHeroVariant>(['editorial', 'split']);

/**
 * Inner-page hero. Six layouts, each with its own typeface, copy arrangement,
 * call-to-action style and place for the page's figures — so pages read as
 * one family without any two opening the same way.
 */
export function PageHero({ variant = 'aurora', tone = 'emerald', ...props }: PageHeroProps) {
  const light = LIGHT_VARIANTS.has(variant);
  const palette = light ? LIGHT_TONES[tone] : DARK_TONES[tone];
  const input: VariantInput = {
    ...props,
    variant,
    tone,
    palette,
    highlights: props.highlights ?? [],
    crumbs: props.crumbs ?? [],
  };

  const renderers: Record<PageHeroVariant, (input: VariantInput) => ReactNode> = {
    aurora: AuroraHero,
    centered: CenteredHero,
    editorial: EditorialHero,
    signal: SignalHero,
    split: SplitHero,
    depth: DepthHero,
  };

  return (
    <section
      data-hero-variant={variant}
      className={cn('relative overflow-hidden', SECTION_CLASS[variant], palette.glow, props.className)}
    >
      {renderers[variant](input)}
    </section>
  );
}
