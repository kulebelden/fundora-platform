import type { Metadata } from 'next';
import { ImpactPageClient } from './impact-client';

export const metadata: Metadata = {
  title: 'Education & Social Impact',
  description: 'Fund schools, scholarships, community development, and NGO programs with recurring pledges and corporate matching grants.',
};

export default function ImpactPage() {
  return <ImpactPageClient />;
}
