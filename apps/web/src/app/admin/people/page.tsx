'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { EmptyState, PageHeading, Panel } from '@/components/admin/admin-ui';
import { KycStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorMessage } from '@/lib/api';
import { formatDate, formatMoney, formatNumber } from '@/lib/currency';
import { useAdminUsers } from '@/lib/queries';
import type { KycStatus, UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

type RoleFilter = UserRole | 'ALL';

const FILTERS: Array<{ key: RoleFilter; label: string }> = [
  { key: 'ALL', label: 'Everyone' },
  { key: 'FUNDRAISER', label: 'Fundraisers' },
  { key: 'DONOR', label: 'Donors' },
  { key: 'MODERATOR', label: 'Moderators' },
  { key: 'FINANCE_OFFICER', label: 'Finance' },
  { key: 'ADMIN', label: 'Admins' },
  { key: 'SUPER_ADMIN', label: 'Super admins' },
];

const ROLE_TINT: Partial<Record<UserRole, string>> = {
  FUNDRAISER: 'bg-success/12 text-success',
  DONOR: 'bg-accent/10 text-accent',
  SUPER_ADMIN: 'bg-primary text-primary-foreground',
  ADMIN: 'bg-primary/10 text-primary',
};

/** Debounce typing so every keystroke doesn't become a request. */
function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function initialsOf(first: string | null, last: string | null, email: string): string {
  const text = `${first?.[0] ?? ''}${last?.[0] ?? ''}`.trim();
  return (text || email[0] || '?').toUpperCase();
}

export default function AdminPeoplePage() {
  const [role, setRole] = React.useState<RoleFilter>('ALL');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const search = useDebounced(query.trim());

  React.useEffect(() => setPage(1), [role, search]);

  const { data, isLoading, isFetching, error } = useAdminUsers(role, search, page);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const everyone = Object.values(data?.roleCounts ?? {}).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Fundraisers & donors"
        description="Everyone with an account: who they are, whether their identity is verified, what they are raising and what they have given."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-1.5">
            {FILTERS.map(({ key, label }) => {
              const count = key === 'ALL' ? everyone : (data?.roleCounts[key] ?? 0);
              if (key !== 'ALL' && key !== 'FUNDRAISER' && key !== 'DONOR' && !count) return null;
              const active = role === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary',
                  )}
                >
                  {label}
                  <span className={cn('tabular rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-secondary')}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search people"
            className="pl-9"
          />
        </div>
      </div>

      <Panel bodyClassName="p-0" className={cn(isFetching && !isLoading && 'opacity-80 transition-opacity')}>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={Users} title="People could not be loaded" body={apiErrorMessage(error)} />
        ) : !data?.data.length ? (
          <EmptyState
            icon={Users}
            title={search ? `Nobody matches “${search}”` : 'No accounts here yet'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <caption className="sr-only">Accounts</caption>
              <thead className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Person</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Identity</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Campaigns</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Raised</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Gifts given</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((person) => {
                  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || person.email;
                  return (
                    <tr key={person.id} className="hover:bg-secondary/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                            {initialsOf(person.firstName, person.lastName, person.email)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {name}
                              {person.countryCode ? (
                                <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                                  {person.countryCode}
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {person.email}
                              {person.phoneNumber ? ` · ${person.phoneNumber}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            ROLE_TINT[person.role] ?? 'bg-secondary text-foreground',
                          )}
                        >
                          {person.role.replace('_', ' ').toLowerCase()}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        {person.kycStatus ? (
                          <KycStatusBadge status={person.kycStatus as KycStatus} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Not started</span>
                        )}
                      </td>
                      <td className="tabular px-3 py-3.5 text-right">
                        <span className="font-semibold">{formatNumber(person.campaigns)}</span>
                        {person.liveCampaigns ? (
                          <span className="ml-1 text-xs text-success">({person.liveCampaigns} live)</span>
                        ) : null}
                      </td>
                      <td className="tabular px-3 py-3.5 text-right font-semibold">
                        {person.raisedByCurrency.length ? (
                          person.raisedByCurrency.map((row) => (
                            <span key={row.currency} className="block">
                              {formatMoney(row.amount, row.currency, { compact: true })}
                            </span>
                          ))
                        ) : (
                          <span className="font-normal text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="tabular px-3 py-3.5 text-right">{formatNumber(person.donationsGiven)}</td>
                      <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">
                        {formatDate(person.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > data.limit ? (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages} · {formatNumber(data.total)} people
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
