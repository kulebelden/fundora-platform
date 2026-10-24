import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoader } from '@/components/brand/brand-loader';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
  // The reset token is in the URL: never leak it to other sites in the Referer header.
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
