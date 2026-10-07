import {
  CircleHelp,
  Compass,
  HandHeart,
  Home,
  LayoutDashboard,
  LogIn,
  Mail,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import { DISCOVER_CATEGORIES } from '@/lib/category-data';
import { ABOUT_LINKS, FUNDRAISE_LINKS } from '@/lib/site-nav';

export interface SearchablePage {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  /** Shown as a small label on the result, e.g. "Category" or "Help". */
  section: string;
  /** Extra words people type for this page that are not in its title. */
  keywords?: string;
}

/** Pages that are not in a menu but people still look for by name. */
const CORE_PAGES: SearchablePage[] = [
  { title: 'Home', href: '/', description: 'Featured campaigns and how HopeNest works.', icon: Home, section: 'Page' },
  {
    title: 'Discover campaigns',
    href: '/discover',
    description: 'Browse every live campaign by category.',
    icon: Compass,
    section: 'Page',
    keywords: 'browse explore causes all donate give',
  },
  {
    title: 'Start a campaign',
    href: '/dashboard/campaigns/create',
    description: 'Create a fundraiser in a few minutes.',
    icon: Rocket,
    section: 'Fundraise',
    keywords: 'create new raise money fundraiser launch',
  },
  {
    title: 'My campaigns',
    href: '/dashboard/campaigns',
    description: 'Track funds, post updates and withdraw.',
    icon: LayoutDashboard,
    section: 'Account',
    keywords: 'dashboard withdraw payout balance my account',
  },
  {
    title: 'Contact support',
    href: '/contact',
    description: 'Talk to a person about your campaign or donation.',
    icon: Mail,
    section: 'Help',
    keywords: 'help support phone email message team',
  },
  { title: 'Log in', href: '/login', description: 'Sign in to your account.', icon: LogIn, section: 'Account', keywords: 'sign in signin' },
  {
    title: 'Create an account',
    href: '/register',
    description: 'Sign up to give or raise.',
    icon: HandHeart,
    section: 'Account',
    keywords: 'sign up signup register join',
  },
  {
    title: 'Help center',
    href: '/help',
    description: 'Answers to the questions donors and organisers ask most.',
    icon: CircleHelp,
    section: 'Help',
    keywords: 'faq questions refund how',
  },
];

/**
 * Every page the search box can jump to, built from the same lists as the
 * menus, so a page added to a menu is searchable without another edit.
 */
export const SEARCHABLE_PAGES: SearchablePage[] = (() => {
  const pages: SearchablePage[] = [
    ...CORE_PAGES,
    ...DISCOVER_CATEGORIES.map((category) => ({
      title: category.title,
      href: `/discover/${category.slug}`,
      description: category.description,
      icon: category.icon,
      section: 'Category',
      keywords: [category.shortName, category.tagline, ...category.subCategories.map((sub) => sub.label)].join(' '),
    })),
    ...ABOUT_LINKS.map((link) => ({ ...link, title: link.label, section: 'About' })),
    ...FUNDRAISE_LINKS.map((link) => ({ ...link, title: link.label, section: 'Fundraise' })),
  ];
  // Menus share some links; keep the first of each.
  const seen = new Set<string>();
  return pages.filter((page) => (seen.has(page.href) ? false : (seen.add(page.href), true)));
})();

/**
 * Pages matching every word of the query, best first: a title that starts
 * with the query, then a title containing it, then any other match.
 */
export function searchPages(query: string, limit = 6): SearchablePage[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const scored = SEARCHABLE_PAGES.map((page) => {
    const title = page.title.toLowerCase();
    const haystack = `${title} ${page.description} ${page.keywords ?? ''} ${page.section}`.toLowerCase();
    if (!words.every((word) => haystack.includes(word))) return null;
    const phrase = words.join(' ');
    const score = title.startsWith(phrase) ? 0 : title.includes(phrase) ? 1 : words.every((w) => title.includes(w)) ? 2 : 3;
    return { page, score };
  }).filter((entry): entry is { page: SearchablePage; score: number } => entry !== null);

  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map(({ page }) => page);
}
