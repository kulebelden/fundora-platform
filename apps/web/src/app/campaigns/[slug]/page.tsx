import type { Metadata } from 'next';
import { CampaignDetailClient } from './campaign-detail-client';

export const metadata: Metadata = {
  title: 'Campaign',
};

export default function CampaignPage({ params }: { params: { slug: string } }) {
  return <CampaignDetailClient slug={params.slug} />;
}
