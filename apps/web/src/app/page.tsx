import { Suspense } from 'react';
import { HomeClient } from './home-client';

/**
 * HomeClient reads the `?category=` search param, which Next requires to sit behind a
 * Suspense boundary so the rest of the shell can still be prerendered.
 */
export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh brand-gradient" />}>
      <HomeClient />
    </Suspense>
  );
}
