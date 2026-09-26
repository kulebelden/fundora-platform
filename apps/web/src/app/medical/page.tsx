import type { Metadata } from 'next';
import { MedicalHubClient } from './medical-client';

export const metadata: Metadata = {
  title: 'Medical & Healthcare',
  description:
    'Fund cancer treatment, surgeries, dental care, mental health programs, fertility treatments, chronic care, and clinical trials. 0% platform fee on medical causes.',
};

export default function MedicalPage() {
  return <MedicalHubClient />;
}
