'use client';

import * as React from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, MailCheck } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth-split-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api';
import { useForgotPassword } from '@/lib/queries';

/**
 * Asks for the account's email and sends a reset link. The answer is the same
 * whether or not the address has an account, so this page cannot be used to
 * find out who is registered.
 */
export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [email, setEmail] = React.useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  const footer = (
    <>
      Remembered it?{' '}
      <Link href="/login" className="font-semibold text-accent hover:underline">
        Back to log in
      </Link>
    </>
  );

  if (forgot.isSuccess) {
    return (
      <AuthSplitLayout title="Check your inbox" subtitle="The link works for 30 minutes." footer={footer}>
        <div className="flex flex-col items-center rounded-2xl border bg-secondary/40 px-6 py-10 text-center">
          <MailCheck className="h-12 w-12 text-success" />
          <p className="mt-4 font-bold">If {email.trim()} has a HopeNest account, a reset link is on its way.</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Nothing after a few minutes? Check your spam folder, or try again with the address you signed up with.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => forgot.reset()}>
            Use a different email
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to choose a new one."
      footer={footer}
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) forgot.mutate(email.trim());
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={!valid || forgot.isPending}>
          {forgot.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Send reset link
        </Button>
        {forgot.isError ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {apiErrorMessage(forgot.error)}
          </p>
        ) : null}
      </form>
    </AuthSplitLayout>
  );
}
