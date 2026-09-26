import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Mental Health Support',
  description: 'Fund therapy programs, PTSD support, and long-term mental health care. Help is one click away.',
};

export default function MentalHealthPage() {
  return <MedicalHubClient categorySlug="mental-health" />;
}