import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CampaignCreationFlow } from './create-client';

export const metadata: Metadata = {
  title: 'Create a Campaign',
};

/**
 * The flow reads `?category=` to pre-fill step 1, which Next requires to sit behind a
 * Suspense boundary so the rest of the shell can still be prerendered.
 */
export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <CampaignCreationFlow />
    </Suspense>
  );
}
