import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoader } from '@/components/brand/brand-loader';
import { SearchResultsClient } from './search-results-client';

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<PageLoader label="Searching" />}>
      <SearchResultsClient />
    </Suspense>
  );
}
