import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Clinical Trials & Experimental Treatments',
  description: 'Fund experimental treatments and specialized medical travel. Access to cutting-edge medicine.',
};

export default function ClinicalTrialsPage() {
  return <MedicalHubClient categorySlug="clinical-trials" />;
}