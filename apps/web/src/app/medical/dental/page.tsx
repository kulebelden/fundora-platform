import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Dental & Reconstructive Care',
  description: 'Fund dental implants, reconstructive care, and orthodontics. Restoring smiles, restoring lives.',
};

export default function DentalPage() {
  return <MedicalHubClient categorySlug="dental" />;
}