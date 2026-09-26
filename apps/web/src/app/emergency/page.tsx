import type { Metadata } from 'next';
import { EmergencyPageClient } from './emergency-client';

export const metadata: Metadata = {
  title: 'Emergencies & Disaster Relief',
  description: 'Rapid-response crisis relief funding with verified NGO partners. Live crisis zone tracking and urgent goal counters.',
};

export default function EmergencyPage() {
  return <EmergencyPageClient />;
}
