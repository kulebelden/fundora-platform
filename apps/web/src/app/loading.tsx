import { PageLoader } from '@/components/brand/brand-loader';

/** Shown by Next while any route below the root is still rendering. */
export default function Loading() {
  return (
    <main id="main" className="min-h-dvh bg-background">
      <PageLoader />
    </main>
  );
}
