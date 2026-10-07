import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoader } from '@/components/brand/brand-loader';
import { VerifyEmailClient } from './verify-email-client';

export const metadata: Metadata = {
  title: 'Confirm your email',
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader label="Confirming your email" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
