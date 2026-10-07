import { HydrationBoundary } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { prefetchState } from '@/lib/server-prefetch';
import { HomeClient } from './home-client';

/**
 * The first screen's campaigns and stats are fetched on the server and sent
 * with the HTML, so they show without waiting for the page's JavaScript.
 * The API answers are reused for 30 seconds.
 */
export default async function HomePage({ searchParams }: { searchParams: { category?: string | string[] } }) {
  const category = typeof searchParams.category === 'string' ? searchParams.category : null;
  const state = await prefetchState(
    [
      { key: queryKeys.campaigns(1, 12), path: '/campaigns?page=1&limit=12' },
      { key: [...queryKeys.stats, 'USD'], path: '/stats/platform?currency=USD' },
      { key: queryKeys.categories, path: '/categories' },
    ],
    30,
  );

  return (
    <HydrationBoundary state={state}>
      <HomeClient categoryParam={category} />
    </HydrationBoundary>
  );
}
