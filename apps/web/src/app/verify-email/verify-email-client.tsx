'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, MailX } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth-split-layout';
import { BrandLoader } from '@/components/brand/brand-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api';
import { useResendVerification, useVerifyEmail } from '@/lib/queries';
import { isAdminRole } from '@/lib/types';

/**
 * Landing page for the emailed link. Spends the token once (React's dev
 * double-mount would otherwise spend it twice and show an error), signs the
 * person in and sends them on to their dashboard.
 */
export function VerifyEmailClient() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const verify = useVerifyEmail();
  const started = React.useRef(false);

  React.useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verify.mutate(token, {
      onSuccess: (data) => {
        // A short pause so the confirmation is seen, not just flashed.
        window.setTimeout(
          () => router.replace(isAdminRole(data.user.role) ? '/admin' : '/dashboard/campaigns'),
          1200,
        );
      },
    });
  }, [token, verify, router]);

  const footer = (
    <>
      Need help?{' '}
      <Link href="/contact" className="font-semibold text-accent hover:underline">
        Contact support
      </Link>
    </>
  );

  if (verify.isSuccess) {
    return (
      <AuthSplitLayout title="Email confirmed" subtitle="Your account is ready." footer={footer}>
        <div className="flex flex-col items-center rounded-2xl border bg-success/5 px-6 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="mt-4 font-bold">Welcome to HopeNest, {verify.data.user.firstName}.</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Taking you to your dashboard…
          </p>
        </div>
      </AuthSplitLayout>
    );
  }

  if (!token || verify.isError) {
    return (
      <AuthSplitLayout
        title="This link has expired"
        subtitle="Links work once, for 24 hours. We can send you a new one."
        footer={footer}
      >
        <ExpiredLink error={verify.isError ? apiErrorMessage(verify.error) : null} />
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout title="Confirming your email" subtitle="This only takes a moment." footer={footer}>
      <BrandLoader size="lg" label="Confirming your email" className="py-10" />
    </AuthSplitLayout>
  );
}

function ExpiredLink({ error }: { error: string | null }) {
  const resend = useResendVerification();
  const [email, setEmail] = React.useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  if (resend.isSuccess) {
    return (
      <div className="rounded-2xl border bg-secondary/40 px-6 py-8 text-center">
        <p className="font-bold">Check your inbox</p>
        <p className="mt-1 text-sm text-muted-foreground">
          If {email.trim()} has an account waiting for confirmation, a new link is on its way.
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) resend.mutate(email.trim());
      }}
    >
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
        <MailX className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <span>{error ?? 'This link is missing its code. Open the newest email we sent you, or request a new one.'}</span>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="resend-email">Email you signed up with</Label>
        <Input
          id="resend-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={!valid || resend.isPending}>
        {resend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send a new link
      </Button>
      {resend.isError ? (
        <p className="text-sm font-medium text-destructive">{apiErrorMessage(resend.error)}</p>
      ) : null}
    </form>
  );
}
