import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Chronic Care & Rare Diseases',
  description: 'Fund long-term disability support, physiotherapy, and rare disease management. Care that lasts.',
};

export default function ChronicCarePage() {
  return <MedicalHubClient categorySlug="chronic-care" />;
}