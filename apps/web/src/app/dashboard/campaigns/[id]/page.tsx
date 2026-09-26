import type { Metadata } from 'next';
import { CampaignDashboardClient } from './campaign-dashboard-client';

export const metadata: Metadata = {
  title: 'Campaign dashboard',
};

export default function CampaignDashboardPage({ params }: { params: { id: string } }) {
  return <CampaignDashboardClient campaignId={params.id} />;
}
