import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Cancer Funding',
  description: 'Fund chemotherapy, cancer surgery, and life-saving research. 0% platform fee on cancer causes.',
};

export default function CancerPage() {
  return <MedicalHubClient categorySlug="cancer" />;
}