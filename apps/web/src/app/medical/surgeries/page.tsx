import type { Metadata } from 'next';
import { MedicalHubClient } from '../medical-client';

export const metadata: Metadata = {
  title: 'Emergency Surgeries',
  description: 'Fund emergency procedures, organ transplants, and robotic surgeries. Fast-track verified medical causes.',
};

export default function SurgeriesPage() {
  return <MedicalHubClient categorySlug="surgeries" />;
}