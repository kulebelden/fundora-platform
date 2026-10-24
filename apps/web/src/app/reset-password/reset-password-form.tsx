'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, MailX } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth-split-layout';
import { PasswordChecklist, passwordSchema } from '@/components/auth/password-rules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api';
import { useResetPassword } from '@/lib/queries';

/** Landing page for the emailed reset link. */
export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const reset = useResetPassword();
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  // Drop the token from the address bar once read, so it is not left in history or screenshots.
  React.useEffect(() => {
    if (token) window.history.replaceState(null, '', '/reset-password');
  }, [token]);
  const tokenRef = React.useRef(token);
  if (token) tokenRef.current = token;

  const strength = passwordSchema.safeParse(password);
  const matches = password === confirm;
  const valid = strength.success && matches;

  const footer = (
    <>
      Need help?{' '}
      <Link href="/contact" className="font-semibold text-accent hover:underline">
        Contact support
      </Link>
    </>
  );

  if (reset.isSuccess) {
    return (
      <AuthSplitLayout title="Password changed" subtitle="Every device has been signed out." footer={footer}>
        <div className="flex flex-col items-center rounded-2xl border bg-success/5 px-6 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
          <p className="mt-4 font-bold">Your new password is set.</p>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with it to continue.</p>
          <Button className="mt-6" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  if (!tokenRef.current) {
    return (
      <AuthSplitLayout
        title="This link is incomplete"
        subtitle="Open the newest reset email we sent you, or request a new link."
        footer={footer}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-sm">
            <MailX className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>This link is missing its code.</span>
          </div>
          <Button size="lg" className="w-full" asChild>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  const expired = reset.isError && /invalid or has expired/i.test(apiErrorMessage(reset.error));

  return (
    <AuthSplitLayout
      title="Choose a new password"
      subtitle="Use one you do not use anywhere else."
      footer={footer}
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setTouched(true);
          if (valid) reset.mutate({ token: tokenRef.current, password });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              className="pr-10"
              value={password}
              maxLength={128}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={touched && !strength.success}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordChecklist password={password} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            maxLength={128}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={touched && !matches}
          />
          {touched && !matches ? (
            <p className="text-xs font-medium text-destructive">The passwords do not match.</p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={reset.isPending}>
          {reset.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Set new password
        </Button>

        {reset.isError ? (
          <div role="alert" className="space-y-2 text-sm">
            <p className="font-medium text-destructive">{apiErrorMessage(reset.error)}</p>
            {expired ? (
              <Link href="/forgot-password" className="font-semibold text-accent hover:underline">
                Request a new link
              </Link>
            ) : null}
          </div>
        ) : null}
      </form>
    </AuthSplitLayout>
  );
}
