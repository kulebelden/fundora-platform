import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Fertility & Maternal Health',
  description: 'Fund IVF, surrogacy, and maternal healthcare. Supporting families through every step of their journey.',
};

export default function FertilityPage() {
  return <MedicalHubClient categorySlug="fertility" />;
}