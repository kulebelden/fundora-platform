import type { Metadata } from 'next';
import { CampaignSuccessView } from './success-client';

export const metadata: Metadata = {
  title: 'Campaign Published',
};

export default function SuccessPage({ searchParams }: { searchParams: { campaign_id?: string } }) {
  return <CampaignSuccessView campaignId={searchParams.campaign_id ?? 'unknown'} />;
}
