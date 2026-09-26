import type { Metadata } from 'next';
import { MyCampaignsClient } from './my-campaigns-client';

export const metadata: Metadata = {
  title: 'Your campaigns',
};

export default function MyCampaignsPage() {
  return <MyCampaignsClient />;
}
