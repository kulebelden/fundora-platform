import {
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  Compass,
  Globe,
  Handshake,
  HeartHandshake,
  Languages,
  LifeBuoy,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  Newspaper,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
  /** One line of context, shown in the mega-menu and on the /about hub. */
  description: string;
  icon: LucideIcon;
}

export interface NavColumn {
  heading: string;
  links: NavLink[];
}

/**
 * Single source of truth for the "About" mega-menu, its mobile equivalent and the
 * directory on /about, so a route can never appear in one and be missing from
 * another.
 */
export const ABOUT_MENU: NavColumn[] = [
  {
    heading: 'How it works & pricing',
    links: [
      {
        label: 'How HopeNest Works',
        href: '/how-it-works',
        description: 'From draft to payout, step by step.',
        icon: Compass,
      },
      {
        label: 'HopeNest Giving Guarantee',
        href: '/guarantee',
        description: 'What we refund, and when.',
        icon: BadgeCheck,
      },
      {
        label: 'Pricing & Fees',
        href: '/pricing',
        description: 'Every charge, itemised, with a worked example.',
        icon: Receipt,
      },
      {
        label: 'Supported Countries',
        href: '/countries',
        description: 'Where we pay out, and in which currencies.',
        icon: Globe,
      },
      {
        label: 'Help Center',
        href: '/help',
        description: 'Answers for donors and organisers.',
        icon: LifeBuoy,
      },
    ],
  },
  {
    heading: 'Company & community',
    links: [
      {
        label: 'About HopeNest',
        href: '/about',
        description: 'Why we built a ledger-backed platform.',
        icon: Building2,
      },
      {
        label: 'HopeNest.org Impact',
        href: '/impact-fund',
        description: 'Corporate matching and grant distribution.',
        icon: Sparkles,
      },
      {
        label: 'Newsroom',
        href: '/press',
        description: 'Announcements and press resources.',
        icon: Newspaper,
      },
      {
        label: 'NGO Partnerships',
        href: '/partnerships',
        description: 'Tools for nonprofits, hospitals and schools.',
        icon: Handshake,
      },
      {
        label: 'Careers',
        href: '/careers',
        description: 'Engineering and operations roles.',
        icon: Briefcase,
      },
    ],
  },
];

export interface SupportPoint {
  label: string;
  icon: LucideIcon;
}

/**
 * Claims on the support card. These are service commitments, not facts the codebase
 * can verify — keep them in step with what the support rota actually offers.
 */
export const SUPPORT_POINTS: SupportPoint[] = [
  { label: '24/7 priority support', icon: Clock },
  { label: 'Real people, never bots', icon: MessageCircle },
  { label: 'Replies in under 2 minutes', icon: Zap },
  { label: 'Multi-currency, regional languages', icon: Languages },
];

/**
 * Single source of truth for the "Fundraise" mega-menu and its directory on
 * /fundraise, mirroring how ABOUT_MENU powers /about.
 */
export const FUNDRAISE_MENU: NavColumn[] = [
  {
    heading: 'Start raising',
    links: [
      {
        label: 'Start a Campaign',
        href: '/create',
        description: 'Draft your cause, set a goal and submit for review.',
        icon: HeartHandshake,
      },
      {
        label: 'How HopeNest Works',
        href: '/how-it-works',
        description: 'From draft to payout, step by step.',
        icon: Compass,
      },
      {
        label: 'Fundraising Categories',
        href: '/discover',
        description: 'Medical, emergency, education and more.',
        icon: Megaphone,
      },
      {
        label: 'Pricing & Fees',
        href: '/pricing',
        description: 'Every charge, itemised, with a worked example.',
        icon: Receipt,
      },
      {
        label: 'Supported Countries',
        href: '/countries',
        description: 'Where we pay out, and in which currencies.',
        icon: Globe,
      },
    ],
  },
  {
    heading: 'Organiser tools & guides',
    links: [
      {
        label: 'Fundraising Tips',
        href: '/fundraise/tips',
        description: 'How to tell your story and keep momentum after launch.',
        icon: Sparkles,
      },
      {
        label: 'Fundraising Ideas',
        href: '/fundraise/ideas',
        description: 'Campaigns that work, by cause and goal size.',
        icon: Megaphone,
      },
      {
        label: 'Team Fundraising',
        href: '/fundraise/team',
        description: 'Invite co-organisers and split stewardship.',
        icon: Users,
      },
      {
        label: 'Charity Fundraising',
        href: '/fundraise/charity',
        description: 'Tools for nonprofits, hospitals and schools.',
        icon: Handshake,
      },
      {
        label: 'Fundraising Blog',
        href: '/fundraise/blog',
        description: 'Resources, tips, and case studies.',
        icon: Newspaper,
      },
    ],
  },
];

export const FUNDRAISE_LINKS: NavLink[] = FUNDRAISE_MENU.flatMap((column) => column.links);

export const ABOUT_LINKS: NavLink[] = ABOUT_MENU.flatMap((column) => column.links);

/**
 * True when `href` is the page currently being viewed, or an ancestor of it.
 * Segment-aware, so /fundraise does not light up on /fundraising-for-mum and
 * /discover does not light up on /discoverability.
 */
export function isNavPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Routes that behave like the "Categories" surface, even though they sit
 * outside /discover because they have their own curated hubs.
 */
export const CATEGORY_ROUTES = [
  '/discover',
  '/medical',
  '/emergency',
  '/personal',
  '/impact',
] as const;

/** Header trigger states, derived from the pathname in one place. */
export function navSectionState(pathname: string | null) {
  return {
    categories: CATEGORY_ROUTES.some((route) => isNavPathActive(pathname, route)),
    // Scoped to /fundraise itself: /how-it-works and /pricing sit in the About
    // menu, so counting them here would light up two triggers at once.
    fundraise: isNavPathActive(pathname, '/fundraise'),
    about:
      ABOUT_LINKS.some((link) => isNavPathActive(pathname, link.href)) &&
      !isNavPathActive(pathname, '/fundraise'),
    dashboard: isNavPathActive(pathname, '/dashboard'),
  };
}
