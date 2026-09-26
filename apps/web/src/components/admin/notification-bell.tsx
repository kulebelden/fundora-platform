'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Inbox, Loader2 } from 'lucide-react';
import { timeAgo } from '@/lib/currency';
import { useAdminMessages, useMarkAllMessagesRead } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { TOPIC_LABELS } from './topic-labels';

/**
 * Contact-form notifications for the console top bar. Polls every 30 seconds,
 * so a message sent from the public contact page shows up without a reload.
 */
export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const { data, isLoading } = useAdminMessages('unread', 1, 6, { poll: true });
  const markAll = useMarkAllMessagesRead();
  const unread = data?.unread ?? 0;

  // Close on outside click and Escape.
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread ? `Notifications: ${unread} unread messages` : 'Notifications'}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors',
          'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'text-foreground',
        )}
      >
        <Bell className={cn('h-[1.1rem] w-[1.1rem]', unread > 0 && 'text-foreground')} />
        {unread > 0 ? (
          <span className="tabular absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-popover shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <p className="text-sm font-bold">Messages</p>
              <p className="text-xs text-muted-foreground">
                {unread ? `${unread} unread from the contact form` : 'From the contact form'}
              </p>
            </div>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1 rounded-md text-xs font-bold text-accent hover:underline disabled:opacity-60"
              >
                {markAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.data.length ? (
              <div className="flex flex-col items-center px-6 py-9 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/12 text-success">
                  <CheckCheck className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-bold">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-muted-foreground">New contact messages will appear here.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {data.data.map((message) => (
                  <li key={message.id}>
                    <Link
                      href={`/admin/messages?id=${message.id}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-bold">{message.name}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(message.createdAt)}</span>
                        </span>
                        <span className="block truncate text-sm">{message.subject}</span>
                        <span className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {TOPIC_LABELS[message.topic] ?? message.topic}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/admin/messages"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 border-t px-4 py-3 text-sm font-bold text-accent hover:bg-secondary/60"
          >
            <Inbox className="h-4 w-4" />
            Open inbox
          </Link>
        </div>
      ) : null}
    </div>
  );
}
