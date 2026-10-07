import type { Metadata } from 'next';
import { HydrationBoundary } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { prefetchState } from '@/lib/server-prefetch';
import type { CampaignDetail } from '@/lib/types';
import { CampaignDetailClient } from './campaign-detail-client';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3000';
/** Campaign pages reuse the API's answer this long; totals then refresh in the browser. */
const REVALIDATE_SECONDS = 30;

/** Real title and description for the browser tab and for link previews when shared. */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const response = await fetch(`${API_ORIGIN}/api/v1/campaigns/${encodeURIComponent(params.slug)}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return { title: 'Campaign' };
    const campaign = (await response.json()) as CampaignDetail;
    const description = campaign.story.replace(/\s+/g, ' ').trim().slice(0, 155);
    const images = campaign.coverImageUrl ? [campaign.coverImageUrl] : undefined;
    return {
      title: campaign.title,
      description,
      openGraph: { title: campaign.title, description, images },
    };
  } catch {
    return { title: 'Campaign' };
  }
}

export default async function CampaignPage({ params }: { params: { slug: string } }) {
  // Same URL and cache lifetime as generateMetadata, so the second read comes from Next's data cache.
  const state = await prefetchState(
    [{ key: queryKeys.campaign(params.slug), path: `/campaigns/${encodeURIComponent(params.slug)}` }],
    REVALIDATE_SECONDS,
  );

  return (
    <HydrationBoundary state={state}>
      <CampaignDetailClient slug={params.slug} />
    </HydrationBoundary>
  );
}
