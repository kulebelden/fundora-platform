import { QueryClient, dehydrate, type DehydratedState, type QueryKey } from '@tanstack/react-query';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3000';

/** Server fetches give up after this; the page then loads the data in the browser as before. */
const TIMEOUT_MS = 2500;

export interface Prefetch {
  key: QueryKey;
  /** API path under /api/v1, e.g. "/campaigns?page=1&limit=12". */
  path: string;
}

/**
 * Fetches a page's first-screen data on the server and returns it as React
 * Query state for <HydrationBoundary>, so the content is in the HTML instead
 * of waiting for the JavaScript to load and then call the API. A failed or
 * slow request is simply left out: the client hook fetches it as usual.
 *
 * Only for public data: these requests carry no cookies.
 */
export async function prefetchState(prefetches: Prefetch[], revalidate: number): Promise<DehydratedState> {
  const client = new QueryClient();
  await Promise.all(
    prefetches.map(async ({ key, path }) => {
      try {
        const response = await fetch(`${API_ORIGIN}/api/v1${path}`, {
          next: { revalidate },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (response.ok) client.setQueryData(key, await response.json());
      } catch {
        // Left for the client to fetch.
      }
    }),
  );
  return dehydrate(client);
}
