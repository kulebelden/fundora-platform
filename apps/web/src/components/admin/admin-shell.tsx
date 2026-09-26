'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  ClipboardCheck,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  RefreshCw,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/admin/notification-bell';
import { Logo } from '@/components/brand/logo';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { initials } from '@/components/ui/avatar';
import { useAdminOverview, useLogout, useMe } from '@/lib/queries';
import { isAdminRole } from '@/lib/types';
import type { AdminOverview, UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Roles the API will actually accept for this section. SUPER_ADMIN passes all. */
  roles: UserRole[];
  /** Pending-work count shown as a badge, read from the overview. */
  badge?: (overview: AdminOverview) => number;
}

/** Mirrors the @Roles decorators on the API. */
const NAV: AdminNavItem[] = [
  {
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MODERATOR', 'FINANCE_OFFICER'],
  },
  {
    label: 'Campaigns',
    href: '/admin/campaigns',
    icon: Megaphone,
    roles: ['ADMIN', 'MODERATOR'],
    badge: (o) => o.queues.campaignsAwaitingReview,
  },
  {
    label: 'Fundraisers & donors',
    href: '/admin/people',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Identity checks',
    href: '/admin/kyc',
    icon: BadgeCheck,
    roles: ['ADMIN'],
    badge: (o) => o.queues.kycAwaitingReview,
  },
  {
    label: 'Manage audits',
    href: '/admin/audits',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'FINANCE_OFFICER'],
    badge: (o) => o.queues.withdrawalsAwaitingReview,
  },
  {
    label: 'Messages',
    href: '/admin/messages',
    icon: Mail,
    roles: ['ADMIN', 'MODERATOR'],
    badge: (o) => o.queues.unreadMessages,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: FolderTree,
    roles: ['ADMIN'],
  },
];

export function canUse(item: AdminNavItem, role: UserRole | undefined): boolean {
  if (!role) return false;
  return role === 'SUPER_ADMIN' || item.roles.includes(role);
}

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function Denied({ role }: { role: UserRole | undefined }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container py-20">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Staff area</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {role
              ? `Your account has the ${role.replace('_', ' ')} role, which cannot open the admin console. The API enforces this too.`
              : 'Sign in with a staff account to continue.'}
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/">Back to site</Link>
            </Button>
            {!role ? (
              <Button asChild>
                <Link href="/login?next=/admin">Log in</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}

/** "Updated 12s ago", ticking so the console visibly stays live. */
function useSecondsSince(timestamp: number): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);
  return timestamp ? Math.max(0, Math.round((now - timestamp) / 1000)) : 0;
}

function Sidebar({
  items,
  overview,
  pathname,
  name,
  email,
  role,
  onNavigate,
  onSignOut,
}: {
  items: AdminNavItem[];
  overview: AdminOverview | undefined;
  pathname: string;
  name: string;
  email: string;
  role: UserRole;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#001a40] text-white">
      <div className="px-5 pb-5 pt-6">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="inline-flex rounded-xl bg-white px-3 py-2 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Logo />
        </Link>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
          Admin console
        </p>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const count = overview && item.badge ? item.badge(overview) : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                    active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {active ? (
                    <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-success" />
                  ) : null}
                  <Icon className={cn('h-[1.1rem] w-[1.1rem] shrink-0', active ? 'text-success' : '')} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {count > 0 ? (
                    <span
                      className="tabular rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white"
                      aria-label={`${count} waiting`}
                    >
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20 text-sm font-bold text-success">
            {initials(name.split(' ')[0], name.split(' ').slice(1).join(' '))}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="truncate text-xs text-white/50">{email}</p>
          </div>
        </div>
        <p className="mt-3 inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
          {role.replace('_', ' ')}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View site
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useMe();
  const logout = useLogout();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const allowedOverview = Boolean(me && canUse(NAV[0], me.role));
  const overview = useAdminOverview(allowedOverview);
  const overviewData = allowedOverview ? overview.data : undefined;
  const secondsAgo = useSecondsSince(overview.dataUpdatedAt);

  React.useEffect(() => setDrawerOpen(false), [pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Convenience only: every admin endpoint is guarded server-side.
  if (!me || !isAdminRole(me.role)) {
    return <Denied role={me?.role} />;
  }

  const visible = NAV.filter((item) => canUse(item, me.role));
  const current = visible.find((item) => isActive(pathname, item.href));
  const name = `${me.firstName} ${me.lastName}`.trim() || me.email;
  const signOut = () => logout.mutate(undefined, { onSettled: () => router.push('/') });

  const sidebarProps = {
    items: visible,
    overview: overviewData,
    pathname,
    name,
    email: me.email,
    role: me.role,
    onSignOut: signOut,
  };

  return (
    <div className="min-h-dvh bg-secondary/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <Sidebar {...sidebarProps} onNavigate={() => setDrawerOpen(false)} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-6 flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <p className="min-w-0 truncate text-sm font-bold">{current?.label ?? 'Admin console'}</p>

            <div className="ml-auto flex items-center gap-2">
              {allowedOverview ? (
                <span className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Live · updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
                </span>
              ) : null}
              {canUse(NAV.find((item) => item.href === '/admin/messages')!, me.role) ? (
                <NotificationBell />
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void queryClient.invalidateQueries({ queryKey: ['admin'] })}
                aria-label="Refresh data"
              >
                <RefreshCw className={cn('h-4 w-4', overview.isFetching && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </header>

        <main id="main" className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export { NAV as ADMIN_NAV };
