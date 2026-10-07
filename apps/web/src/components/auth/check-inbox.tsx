'use client';

import * as React from 'react';
import { Loader2, MailCheck, MailWarning, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { useResendVerification } from '@/lib/queries';

/** Mirrors RESEND_COOLDOWN_MS in the API; a resend inside it is silently skipped there. */
const COOLDOWN_SECONDS = 60;

/** Resend button with a visible countdown, so a second click is never wasted. */
function useResend(email: string, startCooling: boolean) {
  const resend = useResendVerification();
  const { toast } = useToast();
  const [secondsLeft, setSecondsLeft] = React.useState(startCooling ? COOLDOWN_SECONDS : 0);

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((left) => left - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const send = () =>
    resend.mutate(email, {
      onSuccess: () => {
        setSecondsLeft(COOLDOWN_SECONDS);
        toast({ variant: 'success', title: 'Link sent', description: `Check ${email}, including spam.` });
      },
      onError: (error) =>
        toast({ variant: 'destructive', title: 'Could not send the link', description: apiErrorMessage(error) }),
    });

  return { send, secondsLeft, pending: resend.isPending };
}

/** Shown right after sign-up: the account exists, the link is in the inbox. */
export function CheckInbox({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const { send, secondsLeft, pending } = useResend(email, true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center rounded-2xl border bg-secondary/40 px-6 py-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/12 text-success">
          <MailCheck className="h-7 w-7" />
        </span>
        <p className="mt-4 text-sm text-muted-foreground">We sent a confirmation link to</p>
        <p className="mt-1 break-all text-base font-bold">{email}</p>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          Open it on this device to confirm your address and sign in. It works for 24 hours.
        </p>
      </div>

      <div className="grid gap-2.5">
        <Button variant="outline" size="lg" onClick={send} disabled={pending || secondsLeft > 0}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {secondsLeft > 0 ? `Resend link in ${secondsLeft}s` : 'Resend link'}
        </Button>
        <Button variant="ghost" onClick={onChangeEmail}>
          Used the wrong email? Start again
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Nothing after a few minutes? Check your spam or promotions folder.
      </p>
    </div>
  );
}

/** Login answer for an account whose email has not been confirmed yet. */
export function UnverifiedNotice({ email }: { email: string }) {
  const { send, secondsLeft, pending } = useResend(email, false);

  return (
    <div role="alert" className="mb-5 rounded-lg border border-warm/40 bg-warm/10 p-4 text-sm">
      <p className="flex items-start gap-2.5 font-semibold">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-[#8a5200]" />
        Confirm your email to sign in
      </p>
      <p className="mt-1 pl-[1.625rem] text-muted-foreground">
        We sent a link to <span className="break-all font-semibold text-foreground">{email}</span> when you signed up.
      </p>
      <div className="mt-3 pl-[1.625rem]">
        <Button size="sm" variant="outline" onClick={send} disabled={pending || secondsLeft > 0}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
          {secondsLeft > 0 ? `Sent. Resend in ${secondsLeft}s` : 'Send a new link'}
        </Button>
      </div>
    </div>
  );
}
