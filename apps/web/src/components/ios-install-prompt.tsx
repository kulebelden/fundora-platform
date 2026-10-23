'use client';

import * as React from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Compass, Copy, Share, SquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'hopenest-ios-install-dismissed-at';
/** After "Not now", stay quiet this long before asking again. */
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
/** Let the splash screen finish before the sheet slides in. */
const SHOW_DELAY_MS = 3500;

function readDismissedAt(): number {
  try {
    return Number(localStorage.getItem(DISMISS_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeDismissedAt(value: number) {
  try {
    localStorage.setItem(DISMISS_KEY, String(value));
  } catch {
    // Private mode: the sheet simply comes back on the next visit.
  }
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
      {n}
    </span>
  );
}

/** Share -> Add to Home Screen walkthrough, shared by the auto sheet and the install button. */
export function IosInstallSteps() {
  return (
    <ol className="space-y-4 text-sm">
      <li className="flex gap-3">
        <StepNumber n={1} />
        <span className="pt-1">
          Tap the <Share className="inline h-4 w-4 align-text-bottom" /> <strong>Share</strong> button in
          your browser&apos;s toolbar.
        </span>
      </li>
      <li className="flex gap-3">
        <StepNumber n={2} />
        <span className="pt-1">
          Scroll down and choose <SquarePlus className="inline h-4 w-4 align-text-bottom" />{' '}
          <strong>Add to Home Screen</strong>.
        </span>
      </li>
      <li className="flex gap-3">
        <StepNumber n={3} />
        <span className="pt-1">
          Tap <strong>Add</strong>. HopeNest appears on your home screen like a native app.
        </span>
      </li>
    </ol>
  );
}

/** In-app browsers cannot add to the home screen, so get the user into Safari first. */
export function IosOpenInSafariSteps() {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ variant: 'success', title: 'Link copied', description: 'Paste it into Safari to install HopeNest.' });
    } catch {
      toast({ variant: 'destructive', title: 'Could not copy', description: window.location.href });
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <ol className="space-y-4">
        <li className="flex gap-3">
          <StepNumber n={1} />
          <span className="pt-1">
            Tap the <strong>•••</strong> menu and choose <Compass className="inline h-4 w-4 align-text-bottom" />{' '}
            <strong>Open in Safari</strong> (or copy the link below and paste it into Safari).
          </span>
        </li>
        <li className="flex gap-3">
          <StepNumber n={2} />
          <span className="pt-1">
            In Safari, tap <Share className="inline h-4 w-4 align-text-bottom" /> <strong>Share</strong> then{' '}
            <strong>Add to Home Screen</strong>.
          </span>
        </li>
      </ol>
      <Button variant="outline" className="w-full" onClick={copyLink}>
        <Copy className="h-4 w-4" />
        Copy link
      </Button>
    </div>
  );
}

/**
 * iOS gives websites no install API, so the closest thing to forcing an install is to
 * walk every iOS visitor through Add to Home Screen without waiting for them to find a
 * button. The sheet sits next to the Share button: the bottom toolbar on iPhone, the top
 * on iPad.
 */
export function IosInstallPrompt() {
  const { mode, isStandalone } = usePwaInstall();
  const [open, setOpen] = React.useState(false);
  const [isIpad, setIsIpad] = React.useState(false);

  React.useEffect(() => {
    if (isStandalone || (mode !== 'ios-manual' && mode !== 'ios-open-in-safari')) return;
    if (Date.now() - readDismissedAt() < SNOOZE_MS) return;

    setIsIpad(/iPad/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
    const id = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [mode, isStandalone]);

  if (!open) return null;

  const dismiss = () => {
    writeDismissedAt(Date.now());
    setOpen(false);
  };

  const inApp = mode === 'ios-open-in-safari';
  const Arrow = isIpad ? ArrowUp : ArrowDown;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="ios-install-title"
      className={cn(
        'fixed inset-x-0 z-[150] px-3 animate-in fade-in duration-300',
        isIpad
          ? 'top-0 pt-[max(0.75rem,env(safe-area-inset-top))] slide-in-from-top-6'
          : 'bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] slide-in-from-bottom-6',
      )}
    >
      <div className="relative mx-auto max-w-md rounded-2xl border bg-background p-5 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3 pr-8">
          <Image
            src="/icons/apple-touch-icon.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl shadow-sm"
          />
          <div>
            <p id="ios-install-title" className="font-bold leading-tight">
              Install the HopeNest app
            </p>
            <p className="text-xs text-muted-foreground">Full screen, one tap away, free.</p>
          </div>
        </div>

        {inApp ? <IosOpenInSafariSteps /> : <IosInstallSteps />}

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Not now
          </Button>
          {!inApp && (
            <span className="flex items-center gap-1 text-xs font-semibold text-accent">
              Share button is {isIpad ? 'up here' : 'down here'}
              <Arrow className="h-4 w-4 motion-safe:animate-bounce" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
