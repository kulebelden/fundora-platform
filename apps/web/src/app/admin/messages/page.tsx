'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCheck,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Phone,
  Reply,
  UserCircle2,
} from 'lucide-react';
import { EmptyState, PageHeading } from '@/components/admin/admin-ui';
import { TOPIC_LABELS } from '@/components/admin/topic-labels';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/currency';
import { useAdminMessages, useMarkAllMessagesRead, useMarkMessage } from '@/lib/queries';
import type { ContactMessageView } from '@/lib/types';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'unread' | 'read';

function fullDate(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MessageDetail({
  message,
  onBack,
}: {
  message: ContactMessageView;
  onBack: () => void;
}) {
  const mark = useMarkMessage();
  const replyHref = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`;

  return (
    <article className="flex h-full flex-col">
      <header className="border-b p-5 sm:p-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          All messages
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {TOPIC_LABELS[message.topic] ?? message.topic}
            </span>
            <h2 className="mt-2 text-xl font-extrabold leading-snug tracking-tight">{message.subject}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{fullDate(message.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={mark.isPending}
              onClick={() => mark.mutate({ id: message.id, read: !message.isRead })}
            >
              {mark.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : message.isRead ? (
                <Mail className="h-3.5 w-3.5" />
              ) : (
                <MailOpen className="h-3.5 w-3.5" />
              )}
              {message.isRead ? 'Mark unread' : 'Mark read'}
            </Button>
            <Button size="sm" variant="success" asChild>
              <a href={replyHref}>
                <Reply className="h-3.5 w-3.5" />
                Reply by email
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
        <dl className="grid gap-4 rounded-2xl border bg-secondary/30 p-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <UserCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">From</dt>
              <dd className="font-semibold">{message.name}</dd>
              <dd className="text-xs text-muted-foreground">
                {message.userId
                  ? `Signed-in ${message.accountRole?.replace('_', ' ').toLowerCase() ?? 'member'}`
                  : 'Guest (not signed in)'}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="truncate font-semibold">
                <a href={`mailto:${message.email}`} className="hover:underline">
                  {message.email}
                </a>
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="font-semibold">
                {message.phone ? (
                  <a href={`tel:${message.phone.replace(/[^+\d]/g, '')}`} className="hover:underline">
                    {message.phone}
                  </a>
                ) : (
                  <span className="font-normal text-muted-foreground">Not given</span>
                )}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Campaign link</dt>
              <dd className="truncate font-semibold">
                {message.campaignLink ? (
                  <a href={message.campaignLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {message.campaignLink}
                  </a>
                ) : (
                  <span className="font-normal text-muted-foreground">None</span>
                )}
              </dd>
            </div>
          </div>
        </dl>

        <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.message}</div>

        {message.isRead && message.readAt ? (
          <p className="text-xs text-muted-foreground">Read {timeAgo(message.readAt)}</p>
        ) : null}
      </div>
    </article>
  );
}

function MessagesInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [filter, setFilter] = React.useState<Filter>('all');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error } = useAdminMessages(filter, page, 25, { poll: true });
  const mark = useMarkMessage();
  const markAll = useMarkAllMessagesRead();

  // Keep the opened message even if the current filter no longer lists it.
  const [opened, setOpened] = React.useState<ContactMessageView | null>(null);
  React.useEffect(() => {
    if (!selectedId) {
      setOpened(null);
      return;
    }
    const found = data?.data.find((m) => m.id === selectedId);
    if (found) setOpened(found);
  }, [selectedId, data]);

  // Opening an unread message marks it read.
  React.useEffect(() => {
    if (opened && !opened.isRead && !mark.isPending) {
      mark.mutate({ id: opened.id, read: true });
      setOpened({ ...opened, isRead: true, readAt: new Date().toISOString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened?.id]);

  const select = (id: string | null) => router.replace(id ? `/admin/messages?id=${id}` : '/admin/messages', { scroll: false });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Messages"
        description="Everything sent through the contact form on the website. Newest first."
        actions={
          data?.unread ? (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              {markAll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="grid min-h-[34rem] overflow-hidden rounded-2xl border bg-card shadow-card lg:grid-cols-[22rem_1fr]">
        {/* List */}
        <div className={cn('flex min-w-0 flex-col border-r', opened && 'hidden lg:flex')}>
          <div className="flex gap-1 border-b p-2" role="tablist" aria-label="Filter messages">
            {(['all', 'unread', 'read'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                  filter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary',
                )}
              >
                {key}
                {key === 'unread' && data?.unread ? ` (${data.unread})` : ''}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <EmptyState icon={Inbox} title="Messages could not be loaded" body={apiErrorMessage(error)} />
            ) : !data?.data.length ? (
              <EmptyState
                icon={Inbox}
                title={filter === 'unread' ? 'No unread messages' : 'No messages yet'}
                body="Messages from the contact page appear here."
              />
            ) : (
              <ul className="divide-y">
                {data.data.map((message) => {
                  const active = message.id === (opened?.id ?? selectedId);
                  return (
                    <li key={message.id}>
                      <button
                        type="button"
                        onClick={() => select(message.id)}
                        className={cn(
                          'flex w-full gap-3 px-4 py-3.5 text-left transition-colors focus-visible:outline-none',
                          active ? 'bg-primary/5' : 'hover:bg-secondary/60 focus-visible:bg-secondary/60',
                        )}
                      >
                        <span
                          aria-label={message.isRead ? undefined : 'Unread'}
                          className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', message.isRead ? 'bg-transparent' : 'bg-accent')}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={cn('truncate text-sm', message.isRead ? 'font-medium' : 'font-bold')}>
                              {message.name}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(message.createdAt)}</span>
                          </span>
                          <span className={cn('block truncate text-sm', !message.isRead && 'font-semibold')}>
                            {message.subject}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">{message.message}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {data && totalPages > 1 ? (
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Newer
              </Button>
              <span className="text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Older
              </Button>
            </div>
          ) : null}
        </div>

        {/* Detail */}
        <div className={cn('min-w-0', !opened && 'hidden lg:block')}>
          {opened ? (
            <MessageDetail message={opened} onBack={() => select(null)} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState icon={MailOpen} title="Select a message" body="Choose a message on the left to read it." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-[34rem] rounded-2xl" />}>
      <MessagesInbox />
    </React.Suspense>
  );
}
