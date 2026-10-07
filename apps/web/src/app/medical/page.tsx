import type { Metadata } from 'next';
import { MedicalHubClient } from './medical-client';

export const metadata: Metadata = {
  title: 'Medical & Healthcare',
  description:
    'Fund cancer treatment, surgeries, dental care, mental health programs, fertility treatments, chronic care, and clinical trials, with every fee shown up front.',
};

export default function MedicalPage() {
  return <MedicalHubClient />;
}
