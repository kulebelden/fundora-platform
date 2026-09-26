'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { AboutMegaMenu } from '@/components/about-mega-menu';
import { FundraisingMegaMenu } from '@/components/fundraising-mega-menu';
import { Logo } from '@/components/brand/logo';
import { Avatar, AvatarFallback, AvatarImage, initials } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useLogout, useMe } from '@/lib/queries';
import { ABOUT_MENU, FUNDRAISE_MENU, isNavPathActive, navSectionState } from '@/lib/site-nav';
import { isAdminRole } from '@/lib/types';
import { cn } from '@/lib/utils';

const FALLBACK_CATEGORIES = [
  { id: 'medical', name: 'Medical', slug: 'medical', description: null },
  { id: 'emergency', name: 'Emergency', slug: 'emergency', description: null },
  { id: 'education', name: 'Education', slug: 'education', description: null },
  { id: 'community', name: 'Community', slug: 'community', description: null },
  { id: 'memorial', name: 'Memorial', slug: 'memorial', description: null },
];

/**
 * Nav label with an emerald rule underneath while its section is the one being
 * viewed. Colour alone would not survive a greyscale check, so the bar carries
 * the state on its own.
 */
function NavTriggerLabel({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <span className="relative">
      {label}
      {isActive ? (
        <span
          aria-hidden
          className="nav-active-bar absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-success"
        />
      ) : null}
    </span>
  );
}

/** Shared treatment for any nav link pointing at the current page. */
function activeLinkClass(isActive: boolean, base: string): string {
  return cn(base, isActive && 'bg-success/10 text-success');
}

export function SiteHeader({ query, onQueryChange }: {
  query?: string;
  onQueryChange?: (value: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMe();
  const { data: categories } = useCategories();
  const logout = useLogout();

  const active = navSectionState(pathname);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [fundraiseOpen, setFundraiseOpen] = React.useState(false);
  const [localQuery, setLocalQuery] = React.useState('');

  // Both menus open on hover, so Escape is the only way out for keyboard users.
  React.useEffect(() => {
    if (!categoriesOpen && !aboutOpen && !fundraiseOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setCategoriesOpen(false);
      setAboutOpen(false);
      setFundraiseOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [categoriesOpen, aboutOpen, fundraiseOpen]);

  // Controlled by the page when it owns the filter; self-managed otherwise.
  const value = query ?? localQuery;
  const setValue = onQueryChange ?? setLocalQuery;

  const menu = categories?.length ? categories : FALLBACK_CATEGORIES;

  // Every route change closes whatever menu was open, so the header never shows
  // a panel belonging to the page the user just left.
  React.useEffect(() => {
    setCategoriesOpen(false);
    setAboutOpen(false);
    setFundraiseOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // The mobile menu scrolls on its own; stop the page behind it scrolling too.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-3 overflow-visible">
        <Link href="/" className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo priority />
        </Link>

        <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search causes, people, places…"
            aria-label="Search campaigns"
            className="h-10 pl-9"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          <div
            className="relative"
            data-nav-menu="categories"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
            onPointerEnter={() => setCategoriesOpen(true)}
            onPointerLeave={() => setCategoriesOpen(false)}
            onFocus={() => setCategoriesOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setCategoriesOpen(false);
              }
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={categoriesOpen}
              aria-haspopup="true"
              aria-controls="categories-menu"
              aria-current={active.categories ? 'true' : undefined}
              onClick={() => setCategoriesOpen(true)}
              className={cn(active.categories && 'text-success hover:text-success')}
            >
              <NavTriggerLabel label="Categories" isActive={active.categories} />
              <ChevronDown className={cn('h-4 w-4 transition-transform', categoriesOpen && 'rotate-180')} />
            </Button>
            {categoriesOpen ? (
              <div id="categories-menu" className="absolute left-0 top-full z-50 w-64 pt-2">
                <div className="overflow-hidden rounded-xl border border-white/15 bg-popover/95 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Browse by category
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {menu.length}
                    </span>
                  </div>
                  <ul className="py-1">
                    {menu.map((category) => {
                      const href = `/discover/${encodeURIComponent(category.slug)}`;
                      const isCurrent = isNavPathActive(pathname, href);
                      return (
                        <li key={category.id}>
                          <Link
                            href={href}
                            aria-current={isCurrent ? 'page' : undefined}
                            className={cn(
                              'group flex items-center justify-between border-l-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-success/10 hover:text-success',
                              isCurrent
                                ? 'border-success bg-success/10 font-bold text-success'
                                : 'border-transparent',
                            )}
                            onClick={() => setCategoriesOpen(false)}
                          >
                            <span className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full bg-success/50 transition-colors group-hover:bg-success',
                                  isCurrent && 'bg-success',
                                )}
                              />
                              {category.name}
                            </span>
                            {isCurrent ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-success">
                                Current
                              </span>
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted-foreground/50 transition-colors group-hover:text-success" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-border/60 p-1.5">
                    <Link
                      href="/discover"
                      aria-current={pathname === '/discover' ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold text-success transition-colors hover:bg-success/10',
                        pathname === '/discover' && 'bg-success/10',
                      )}
                      onClick={() => setCategoriesOpen(false)}
                    >
                      <span>All categories</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setFundraiseOpen(true)}
            onMouseLeave={() => setFundraiseOpen(false)}
            onFocus={() => setFundraiseOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setFundraiseOpen(false);
              }
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={fundraiseOpen}
              aria-haspopup="true"
              aria-current={active.fundraise ? 'true' : undefined}
              onClick={() => setFundraiseOpen(true)}
              className={cn(active.fundraise && 'text-success hover:text-success')}
            >
              <NavTriggerLabel label="Fundraise" isActive={active.fundraise} />
              <ChevronDown className={cn('h-4 w-4 transition-transform', fundraiseOpen && 'rotate-180')} />
            </Button>
            {fundraiseOpen ? (
              <div className="absolute left-1/2 top-full z-50 w-[42rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-2">
                <FundraisingMegaMenu onNavigate={() => setFundraiseOpen(false)} />
              </div>
            ) : null}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
            onFocus={() => setAboutOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setAboutOpen(false);
              }
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={aboutOpen}
              aria-haspopup="true"
              aria-current={active.about ? 'true' : undefined}
              // Opens rather than toggles — see the note on the categories trigger.
              onClick={() => setAboutOpen(true)}
              className={cn(active.about && 'text-success hover:text-success')}
            >
              <NavTriggerLabel label="About" isActive={active.about} />
              <ChevronDown className={cn('h-4 w-4 transition-transform', aboutOpen && 'rotate-180')} />
            </Button>
            {aboutOpen ? (
              <div className="absolute right-0 top-full z-50 w-[min(56rem,calc(100vw-2rem))] pt-2">
                <AboutMegaMenu onNavigate={() => setAboutOpen(false)} />
              </div>
            ) : null}
          </div>

          <Button variant="success" size="sm" className="ml-1" asChild>
            <Link href="/dashboard/campaigns">Start a Campaign</Link>
          </Button>

          {me ? (
            <div className="ml-2 flex items-center gap-2">
              {isAdminRole(me.role) ? (
                <Button variant="default" size="sm" asChild>
                  <Link href="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(active.dashboard && 'text-success hover:text-success')}
              >
                <Link
                  href="/dashboard/campaigns"
                  aria-current={active.dashboard ? 'page' : undefined}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <NavTriggerLabel label="Dashboard" isActive={active.dashboard} />
                </Link>
              </Button>
              <Avatar className="h-9 w-9">
                {me.avatarUrl ? <AvatarImage src={me.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials(me.firstName, me.lastName)}</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={() =>
                  logout.mutate(undefined, { onSettled: () => router.push('/') })
                }
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t bg-background lg:hidden">
          <div className="container space-y-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="relative md:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Search causes…"
                aria-label="Search campaigns"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {menu.map((category) => {
                const href = `/discover/${encodeURIComponent(category.slug)}`;
                const isCurrent = isNavPathActive(pathname, href);
                return (
                  <Link
                    key={category.id}
                    href={href}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-secondary',
                      isCurrent
                        ? 'border-success bg-success/10 font-bold text-success'
                        : '',
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {category.name}
                  </Link>
                );
              })}
              <Link
                href="/discover"
                aria-current={pathname === '/discover' ? 'page' : undefined}
                className={cn(
                  'rounded-full border border-accent px-3 py-1.5 text-sm font-bold text-accent hover:bg-secondary',
                  pathname === '/discover' && 'bg-accent/10',
                )}
                onClick={() => setMobileOpen(false)}
              >
                All categories
              </Link>
            </div>

            {ABOUT_MENU.map((column) => (
              <div key={column.heading}>
                <p className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  {column.heading}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {column.links.map((link) => {
                    const Icon = link.icon;
                    const isCurrent = isNavPathActive(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={isCurrent ? 'page' : undefined}
                          className={activeLinkClass(
                            isCurrent,
                            'flex items-center gap-3 rounded-lg border-l-2 border-transparent py-2 pl-3 pr-1 text-sm font-medium hover:bg-secondary',
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 text-muted-foreground',
                              isCurrent && 'text-success',
                            )}
                          />
                          {link.label}
                          {isCurrent ? (
                            <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-success">
                              Current
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-2">
              <p className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
                Fundraising
              </p>
              <ul className="mt-2 space-y-0.5">
                {FUNDRAISE_MENU.map((column) =>
                  column.links.map((link) => {
                    const Icon = link.icon;
                    const isCurrent = isNavPathActive(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={isCurrent ? 'page' : undefined}
                          className={activeLinkClass(
                            isCurrent,
                            'flex items-center gap-3 rounded-lg border-l-2 border-transparent py-2 pl-3 pr-1 text-sm font-medium hover:bg-secondary',
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 text-muted-foreground',
                              isCurrent && 'text-success',
                            )}
                          />
                          {link.label}
                          {isCurrent ? (
                            <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-success">
                              Current
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  }),
                )}
              </ul>
            </div>

            <div className="grid gap-2">
              <Button variant="outline" asChild>
                <Link
                  href="/contact"
                  aria-current={isNavPathActive(pathname, '/contact') ? 'page' : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  Contact Support
                </Link>
              </Button>
            </div>

            <div className="grid gap-2">
              <Button variant="success" asChild>
                <Link href="/dashboard/campaigns">Start a Campaign</Link>
              </Button>
              {me ? (
                <>
                  {isAdminRole(me.role) ? (
                    <Button asChild>
                      <Link href="/admin">
                        <ShieldCheck className="h-4 w-4" />
                        Admin console
                      </Link>
                    </Button>
                  ) : null}
                  <Button variant="outline" asChild>
                    <Link
                      href="/dashboard/campaigns"
                      aria-current={active.dashboard ? 'page' : undefined}
                      className={cn(active.dashboard && 'border-success text-success')}
                    >
                      Dashboard
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => logout.mutate(undefined, { onSettled: () => router.push('/') })}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
