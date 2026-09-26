import {
  Activity,
  BookOpen,
  Flame,
  Heart,
  HeartHandshake,
  Home,
  Leaf,
  type LucideIcon,
  Palette,
  PawPrint,
  Stethoscope,
  Users,
} from 'lucide-react';

/**
 * Catalogue behind `/discover` and `/discover/[category]`.
 *
 * The headline `stats` are editorial copy, not live figures: the API exposes
 * platform-wide totals (`/stats/platform`) but no per-category aggregate yet, and the
 * hub pages must render before any campaign is seeded. Everything a donor acts on —
 * the campaign grid, progress bars, donor counts — comes from the API at runtime.
 * Swap `stats` for a real aggregate endpoint when one lands.
 */
export interface CategoryStats {
  /** Pre-formatted for display; these never feed a calculation. */
  raised: string;
  donors: string;
  active: string;
}

export interface CategorySubFilter {
  label: string;
  /** Matches `campaign.category.slug`; `all` is the unfiltered pseudo-filter. */
  slug: string;
}

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface DiscoverCategory {
  slug: string;
  /** Full name used in the hero and metadata, e.g. "Medical & Healthcare". */
  title: string;
  /** Short name for buttons and chips, e.g. "Medical". */
  shortName: string;
  badge: string;
  tagline: string;
  /** Sentence used for the tile blurb and the page meta description. */
  description: string;
  icon: LucideIcon;
  /** Icon chip colours, drawn from the brand tokens in globals.css. */
  accent: string;
  stats: CategoryStats;
  subCategories: CategorySubFilter[];
  faqs: CategoryFaq[];
}

const TRUST_FAQ: CategoryFaq = {
  question: 'How do I know the money reaches the right person?',
  answer:
    'Every fundraiser clears government-ID or passport verification before a single payout is released, and the API — not just the interface — refuses withdrawals without it. Each donation and payout is posted to an append-only double-entry ledger, so the balance a donor sees and the balance the organiser sees come from the same books.',
};

const PAYOUT_FAQ: CategoryFaq = {
  question: 'How fast can an organiser access the funds?',
  answer:
    'Once identity verification is complete, an organiser can request a payout to any SWIFT or IBAN account at any time. The withdrawal screen shows the gross amount, the service fee and the exact net amount before the request is confirmed — there are no charges revealed after the fact.',
};

export const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  {
    slug: 'medical',
    title: 'Medical & Healthcare',
    shortName: 'Medical',
    // NOTE: this deliberately does not claim "0% platform fee". `PLATFORM_FEE_RATE`
    // in apps/api applies 5% to every donation with no medical carve-out; see /pricing.
    badge: 'Verified organisers · auditable payouts',
    tagline:
      'Raise funds for surgeries, chemotherapy, rare treatments and urgent hospital bills.',
    description:
      'Fund surgeries, cancer treatment, mental health care and chronic illness support on HopeNest, with verified organisers and fully auditable fund handling.',
    icon: Stethoscope,
    accent: 'bg-success/12 text-success',
    stats: { raised: '$14.2M', donors: '210K+', active: '3,420' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Cancer Care', slug: 'cancer' },
      { label: 'Surgeries', slug: 'surgeries' },
      { label: 'Dental', slug: 'dental' },
      { label: 'Mental Health', slug: 'mental-health' },
      { label: 'Fertility', slug: 'fertility' },
      { label: 'Chronic Care', slug: 'chronic-care' },
      { label: 'Clinical Trials', slug: 'clinical-trials' },
    ],
    faqs: [
      {
        question: 'How do medical payouts work?',
        answer:
          'Funds clear into the campaign wallet as donations settle. Once the organiser is identity-verified, they request a payout to a SWIFT or IBAN account; many send it straight on to the hospital or treatment centre. Nothing can leave a campaign before verification passes.',
      },
      {
        question: 'What does a medical campaign cost to run?',
        answer:
          'Nothing to start, and nothing if it raises nothing. A platform fee and payment processing come off each donation as it settles, and a service fee is deducted when a payout is requested — the withdrawal screen shows the exact net figure before you confirm. Every rate is itemised on the pricing page.',
      },
      {
        question: 'Do I need to upload medical records?',
        answer:
          'No. Never post diagnoses, scans or hospital paperwork publicly. Identity verification is what unlocks withdrawals; a short, honest story and an update after each milestone does more for donor trust than private documents ever will.',
      },
      TRUST_FAQ,
    ],
  },
  {
    slug: 'emergency',
    title: 'Emergency & Disaster Relief',
    shortName: 'Emergency',
    badge: 'Rapid response funding',
    tagline:
      'Immediate financial support for natural disasters, house fires and sudden crisis relief.',
    description:
      'Raise or give for disaster relief, house fires, displacement and sudden hardship, with verified organisers and priority campaign review.',
    icon: Flame,
    accent: 'bg-destructive/12 text-destructive',
    stats: { raised: '$18.5M', donors: '320K+', active: '2,100' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Disaster Relief', slug: 'disaster-relief' },
      { label: 'House Fire', slug: 'house-fire' },
      { label: 'Immediate Hardship', slug: 'immediate-hardship' },
      { label: 'Community Crisis', slug: 'community-crisis' },
    ],
    faqs: [
      {
        question: 'How quickly does an emergency campaign go live?',
        answer:
          'Emergency causes are queued ahead of the general review line, and most are published the same day they are submitted. Verification still has to pass before money can be withdrawn, so starting it alongside the campaign saves days later.',
      },
      {
        question: 'Can several people raise for the same disaster?',
        answer:
          'Yes. Separate households affected by one event should each run their own campaign so the funds stay attributable. If you are raising on behalf of a wider community, say so plainly in the story and name who receives the money.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'memorial',
    title: 'Memorial & Funeral',
    shortName: 'Memorial',
    badge: 'Honouring loved ones',
    tagline:
      'Support for funeral arrangements, memorial services and family relief during the hardest weeks.',
    description:
      'Raise funds for funeral costs, memorial services, headstones and family relief, with a verified organiser on every campaign.',
    icon: Heart,
    accent: 'bg-primary/10 text-primary',
    stats: { raised: '$8.9M', donors: '140K+', active: '1,850' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Funeral Costs', slug: 'funeral-costs' },
      { label: 'Headstones', slug: 'headstones' },
      { label: 'Family Relief', slug: 'family-relief' },
      { label: 'Honorariums', slug: 'honorariums' },
    ],
    faqs: [
      {
        question: 'Can I raise on behalf of a grieving family?',
        answer:
          'Yes, and it is common — the family is rarely in a position to run a campaign in the first week. Name your relationship to them in the story, and name who the funds go to. You are the verified organiser, so the payout is requested from your account and passed on.',
      },
      {
        question: 'What happens if more is raised than the funeral costs?',
        answer:
          'Nothing is forfeited. Say in an update what the surplus will cover — usually rent, school fees or debts the household is left with — so donors know what their gift became. Being specific about the surplus is what keeps late donations coming.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'education',
    title: 'Education & Tuition',
    shortName: 'Education',
    badge: 'Empowering students',
    tagline:
      'Fund university tuition, school supplies, study-abroad places and classroom projects.',
    description:
      'Fund tuition, school fees, classroom projects and research on HopeNest, with transparent, auditable handling of every gift.',
    icon: BookOpen,
    accent: 'bg-accent/10 text-accent',
    stats: { raised: '$6.1M', donors: '95K+', active: '1,200' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Tuition', slug: 'tuition' },
      { label: 'School Supplies', slug: 'school-supplies' },
      { label: 'Study Abroad', slug: 'study-abroad' },
      { label: 'Research Grants', slug: 'research-grants' },
    ],
    faqs: [
      {
        question: 'Can funds be paid directly to a school or university?',
        answer:
          'A payout goes to the verified organiser’s bank account, which they then settle with the institution. Quoting the invoice or admission-letter figure in your goal — and posting the receipt as an update — is the clearest way to show donors the money did what it was raised for.',
      },
      {
        question: 'Can a parent raise for a child under 18?',
        answer:
          'Yes. The parent or guardian is the verified organiser and holds the campaign. Keep identifying detail about the child to a minimum: a first name and the need is enough, and it is safer for them.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'community',
    title: 'Community & Nonprofit',
    shortName: 'Community',
    badge: 'Neighbours backing neighbours',
    tagline:
      'Fund the projects that hold a neighbourhood together — clinics, boreholes, youth programmes and local nonprofits.',
    description:
      'Fund local nonprofits, community infrastructure, youth programmes and mutual aid, with double-entry accounting on every shilling.',
    icon: Users,
    accent: 'bg-warm/15 text-[#8a5200]',
    stats: { raised: '$5.4M', donors: '88K+', active: '1,640' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Local Nonprofits', slug: 'local-nonprofits' },
      { label: 'Infrastructure', slug: 'infrastructure' },
      { label: 'Youth Programmes', slug: 'youth-programmes' },
      { label: 'Mutual Aid', slug: 'mutual-aid' },
    ],
    faqs: [
      {
        question: 'Does a registered organisation raise differently from an individual?',
        answer:
          'The flow is the same, but the person who verifies must be the one authorised to receive the payout on the organisation’s behalf, and the payout account should be the organisation’s. Put the registration number in the story — donors look for it.',
      },
      {
        question: 'How do we show donors how the budget was spent?',
        answer:
          'Post updates as milestones land, with amounts. Because donations and payouts are both posted to the ledger, the totals in your updates and the totals on the campaign page are the same numbers — which is what makes a second round of funding easy to raise.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'creative',
    title: 'Creative & Cultural',
    shortName: 'Creative',
    badge: 'Backing makers',
    tagline:
      'Fund albums, films, exhibitions, publishing runs and the cultural work that rarely finds a grant.',
    description:
      'Fund music, film, art, publishing and cultural projects on HopeNest, with verified creators and budgets donors can check.',
    icon: Palette,
    accent: 'bg-accent/10 text-accent',
    stats: { raised: '$3.2M', donors: '61K+', active: '940' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Music', slug: 'music' },
      { label: 'Film & Video', slug: 'film' },
      { label: 'Art & Exhibitions', slug: 'art' },
      { label: 'Publishing', slug: 'publishing' },
    ],
    faqs: [
      {
        question: 'Is this a pre-order platform? Do backers get rewards?',
        answer:
          'No. HopeNest gifts are donations, not purchases, and there is no reward-tier or fulfilment system. Offering a credit, a copy or an invitation as a thank-you is fine — promising a product in exchange for a set amount is not, and belongs on a storefront.',
      },
      {
        question: 'What makes a creative campaign fund well?',
        answer:
          'A budget donors can check. Break the goal into the parts it pays for — studio days, a festival submission, a print run — and post work-in-progress updates. Creative causes have no built-in deadline, so visible progress is what carries them.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'animals',
    title: 'Animals & Wildlife',
    shortName: 'Animals',
    badge: 'Rescue & veterinary care',
    tagline:
      'Cover emergency veterinary bills, shelter running costs and wildlife rescue work.',
    description:
      'Fund veterinary emergencies, animal shelters, rescue transport and wildlife protection on HopeNest.',
    icon: PawPrint,
    accent: 'bg-success/12 text-success',
    stats: { raised: '$2.8M', donors: '54K+', active: '720' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Veterinary Bills', slug: 'veterinary' },
      { label: 'Shelters', slug: 'shelters' },
      { label: 'Rescue & Transport', slug: 'rescue' },
      { label: 'Wildlife', slug: 'wildlife' },
    ],
    faqs: [
      {
        question: 'Can a shelter run one campaign for all of its animals?',
        answer:
          'Yes — an operating-costs campaign for a shelter is straightforward, and monthly updates on intake and adoptions keep it funded. Individual emergencies usually do better as their own campaign, because the need has a deadline donors can see.',
      },
      {
        question: 'Do you verify veterinary costs?',
        answer:
          'Verification covers the organiser’s identity, not the invoice. Quoting the clinic’s estimate in the story and posting the receipt afterwards is what donors look for, and it is the fastest route to a second round of support.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'housing',
    title: 'Housing & Basic Needs',
    shortName: 'Housing',
    badge: 'Keeping families housed',
    tagline:
      'Cover rent arrears, relocation, repairs and the essentials that keep a household together.',
    description:
      'Raise for rent, relocation, home repairs and food security, with verified organisers and auditable fund handling.',
    icon: Home,
    accent: 'bg-primary/10 text-primary',
    stats: { raised: '$4.6M', donors: '77K+', active: '1,310' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Rent & Arrears', slug: 'rent' },
      { label: 'Relocation', slug: 'relocation' },
      { label: 'Home Repairs', slug: 'repairs' },
      { label: 'Food Security', slug: 'food' },
    ],
    faqs: [
      {
        question: 'Will donors support a campaign for rent?',
        answer:
          'They do, when the ask is precise. A figure tied to a date — the arrears amount and the day the notice expires — funds far better than a general appeal, because donors can see exactly what their gift prevents.',
      },
      {
        question: 'How much identifying detail should I share?',
        answer:
          'Enough to be credible, no more. Your name, your town and the situation are plenty; never publish a full address, a landlord’s details or bank information in the story. Payout details are collected privately at withdrawal.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'environment',
    title: 'Environment & Climate',
    shortName: 'Environment',
    badge: 'Local climate action',
    tagline:
      'Fund reforestation, clean water, clean energy and the climate resilience work happening where you live.',
    description:
      'Fund reforestation, clean water, renewable energy and climate resilience projects on HopeNest.',
    icon: Leaf,
    accent: 'bg-success/12 text-success',
    stats: { raised: '$2.1M', donors: '39K+', active: '480' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Reforestation', slug: 'reforestation' },
      { label: 'Clean Water', slug: 'clean-water' },
      { label: 'Clean Energy', slug: 'clean-energy' },
      { label: 'Conservation', slug: 'conservation' },
    ],
    faqs: [
      {
        question: 'What kind of environmental projects can raise here?',
        answer:
          'Anything with a named beneficiary and a deliverable a donor can check: a borehole for a specific school, a planting season on a named hillside, solar for a named clinic. Open-ended advocacy funding is a poor fit for this platform.',
      },
      {
        question: 'Can international donors give to a local project?',
        answer:
          'Yes. A campaign raises in its own currency and donors give in theirs, so a project budgeted in shillings can be funded from anywhere. The campaign page always shows the currency the goal is set in.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
  {
    slug: 'personal',
    title: 'Personal & Family',
    shortName: 'Personal',
    badge: 'Life, as it comes',
    tagline:
      'Weddings, new arrivals, travel for care, and the personal moments that need a little help.',
    description:
      'Raise for personal milestones, family needs, travel for treatment and life events, with verified organisers on every campaign.',
    icon: HeartHandshake,
    accent: 'bg-warm/15 text-[#8a5200]',
    stats: { raised: '$3.9M', donors: '66K+', active: '1,090' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Family Support', slug: 'family-support' },
      { label: 'New Arrivals', slug: 'new-arrivals' },
      { label: 'Travel for Care', slug: 'travel' },
      { label: 'Life Events', slug: 'life-events' },
    ],
    faqs: [
      {
        question: 'Is a personal cause treated differently from a charitable one?',
        answer:
          'The rules are identical: the same review before it goes live, the same identity verification before a payout, the same ledger behind the numbers. What changes is the audience — personal campaigns are carried by people who already know you, so share it directly rather than waiting to be discovered.',
      },
      {
        question: 'Can I keep my campaign off the public grid?',
        answer:
          'A campaign is reachable by its link and appears in Discover once it is live. If privacy matters, keep the story general and share the link only with the people you want giving.',
      },
      PAYOUT_FAQ,
      TRUST_FAQ,
    ],
  },
];

const BY_SLUG = new Map(DISCOVER_CATEGORIES.map((category) => [category.slug, category]));

export const CATEGORY_SLUGS = DISCOVER_CATEGORIES.map((category) => category.slug);

/** Title-cases an unknown slug: `youth-sports` becomes `Youth Sports`. */
function titleize(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Never throws: an unlisted slug still gets a usable hub, so a category added on the
 * API side is browsable before this file catches up with it.
 */
export function resolveCategory(slug: string | undefined): DiscoverCategory {
  const key = (slug ?? '').toLowerCase();
  const known = BY_SLUG.get(key);
  if (known) return known;

  const name = titleize(key) || 'Verified Causes';
  return {
    slug: key,
    title: name,
    shortName: name,
    badge: 'Verified community cause',
    tagline: `Support verified ${name.toLowerCase()} campaigns, or launch your own fundraiser today.`,
    description: `Browse verified ${name.toLowerCase()} campaigns on HopeNest, or start one of your own.`,
    icon: Activity,
    accent: 'bg-secondary text-secondary-foreground',
    stats: { raised: '—', donors: '—', active: '—' },
    subCategories: [
      { label: 'All', slug: 'all' },
      { label: 'Urgent', slug: 'urgent' },
      { label: 'Community', slug: 'community' },
    ],
    faqs: [PAYOUT_FAQ, TRUST_FAQ],
  };
}

export function isKnownCategory(slug: string | undefined): boolean {
  return BY_SLUG.has((slug ?? '').toLowerCase());
}

/**
 * Slugs a campaign may carry and still belong on this hub: the category itself plus
 * every sub-category, since the API stores the leaf category on the campaign.
 */
export function categoryMatchSlugs(category: DiscoverCategory): string[] {
  return [
    category.slug,
    ...category.subCategories.map((sub) => sub.slug).filter((slug) => slug !== 'all'),
  ];
}

/** Other categories to surface at the foot of a hub page. */
export function relatedCategories(slug: string, count = 4): DiscoverCategory[] {
  const others = DISCOVER_CATEGORIES.filter((category) => category.slug !== slug);
  const start = Math.max(0, DISCOVER_CATEGORIES.findIndex((category) => category.slug === slug));
  return Array.from({ length: Math.min(count, others.length) }, (_, index) => {
    return others[(start + index) % others.length];
  });
}

export interface CategoryOptionGroup {
  label: string;
  options: Array<{ value: string; label: string }>;
}

/**
 * Category choices for the creation wizard, derived from this catalogue so a hub's
 * `?category=` link always matches a selectable option — a parent slug included.
 */
export function campaignCategoryOptions(): CategoryOptionGroup[] {
  return DISCOVER_CATEGORIES.map((category) => ({
    label: category.title,
    options: [
      { value: category.slug, label: `${category.shortName} — general` },
      ...category.subCategories
        .filter((sub) => sub.slug !== 'all')
        .map((sub) => ({ value: sub.slug, label: sub.label })),
    ],
  }));
}

const SELECTABLE_SLUGS = new Set(
  campaignCategoryOptions().flatMap((group) => group.options.map((option) => option.value)),
);

/** True when a `?category=` value corresponds to an option the wizard can select. */
export function isSelectableCategory(value: string | null | undefined): boolean {
  return SELECTABLE_SLUGS.has((value ?? '').trim().toLowerCase());
}

export const SORT_OPTIONS = [
  { value: 'urgent', label: 'Most Urgent' },
  { value: 'near-goal', label: 'Near Goal' },
  { value: 'recent', label: 'Recently Created' },
  { value: 'top-funded', label: 'Top Funded' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];
