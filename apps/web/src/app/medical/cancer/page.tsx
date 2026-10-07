import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Cancer Funding',
  description: 'Fund chemotherapy, cancer surgery, and life-saving research, with every fee shown up front.',
};

export default function CancerPage() {
  return <MedicalHubClient categorySlug="cancer" />;
}