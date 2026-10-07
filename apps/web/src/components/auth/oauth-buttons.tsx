'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useOAuthProviders, type OAuthProvider } from '@/lib/queries';
import { cn } from '@/lib/utils';

/** Google's four-colour "G", per its sign-in branding guidelines. */
function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.08-.9.95-1.98 1.5-3.15 1.4a3.2 3.2 0 0 1-.02-.39c0-1.1.48-2.27 1.33-3.14.42-.44.96-.8 1.6-1.09.65-.28 1.26-.44 1.83-.47.02.2.03.41.03.61zM20.6 17.3c-.38.88-.83 1.69-1.36 2.43-.72 1.01-1.31 1.71-1.76 2.1-.7.65-1.46.98-2.27 1-.58 0-1.28-.17-2.1-.5-.82-.33-1.57-.5-2.26-.5-.72 0-1.5.17-2.33.5-.83.33-1.5.5-2.02.52-.78.03-1.55-.31-2.32-1.02-.49-.42-1.1-1.15-1.83-2.18-.79-1.1-1.43-2.39-1.94-3.85C.37 14.22.1 12.69.1 11.2c0-1.7.37-3.17 1.1-4.4A6.47 6.47 0 0 1 3.5 4.47a6.2 6.2 0 0 1 3.12-.88c.61 0 1.42.19 2.42.56 1 .37 1.64.56 1.92.56.21 0 .92-.22 2.13-.66 1.14-.41 2.1-.58 2.89-.51 2.14.17 3.74 1.01 4.81 2.53-1.91 1.16-2.86 2.78-2.84 4.86.02 1.62.6 2.97 1.76 4.04.52.5 1.1.88 1.75 1.15-.14.41-.29.8-.45 1.18z" />
    </svg>
  );
}

const PROVIDERS: Record<OAuthProvider, { label: string; Icon: () => React.JSX.Element; className: string }> = {
  google: {
    label: 'Continue with Google',
    Icon: GoogleIcon,
    className: 'border border-input bg-background text-foreground hover:bg-secondary',
  },
  apple: {
    label: 'Continue with Apple',
    Icon: AppleIcon,
    className: 'border border-black bg-black text-white hover:bg-black/85',
  },
};

/**
 * "Continue with Google / Apple". Each button is a plain link to the API's
 * start route: the whole page goes to the provider and comes back signed in,
 * so there is no client-side token handling at all.
 *
 * A provider the API has no credentials for is shown disabled rather than
 * hidden, so the layout does not shift once it is switched on.
 */
export function OAuthButtons({ next }: { next?: string | null }) {
  const { data: enabled, isLoading } = useOAuthProviders();
  const [pending, setPending] = React.useState<OAuthProvider | null>(null);
  const query = next ? `?next=${encodeURIComponent(next)}` : '';

  // Coming Back from the provider restores this page from the bfcache, spinner and all.
  React.useEffect(() => {
    const reset = () => setPending(null);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  return (
    <div className="grid gap-3">
      {(Object.keys(PROVIDERS) as OAuthProvider[]).map((provider) => {
        const { label, Icon, className } = PROVIDERS[provider];
        const available = Boolean(enabled?.[provider]);
        const base = cn(
          'relative flex h-12 w-full items-center justify-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        );

        if (!available) {
          return (
            <button
              key={provider}
              type="button"
              disabled
              title={isLoading ? undefined : `${label.replace('Continue with ', '')} sign-in is not available yet`}
              className={cn(base, 'cursor-not-allowed opacity-50')}
            >
              <Icon />
              {label}
            </button>
          );
        }

        return (
          <a
            key={provider}
            href={`/api/v1/auth/oauth/${provider}/start${query}`}
            onClick={() => setPending(provider)}
            aria-busy={pending === provider}
            className={cn(base, pending && pending !== provider && 'pointer-events-none opacity-60')}
          >
            {pending === provider ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon />}
            {label}
          </a>
        );
      })}
    </div>
  );
}

/** "or" rule between the social buttons and the email form. */
export function AuthDivider({ label = 'or continue with email' }: { label?: string }) {
  return (
    <div className="relative my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Reasons the API sends back in `?oauth_error=`, in words a person can act on. */
export const OAUTH_ERRORS: Record<string, string> = {
  cancelled: 'Sign-in was cancelled. You can try again or use your email.',
  expired: 'That sign-in took too long or was opened in another tab. Please try again.',
  unverified: 'We could not confirm a verified email address from that account.',
  unavailable: 'That sign-in option is not available right now.',
  failed: 'Something went wrong signing you in. Please try again.',
};
