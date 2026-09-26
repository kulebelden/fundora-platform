import type { Metadata } from 'next';
import { PersonalPageClient } from './personal-client';

export const metadata: Metadata = {
  title: 'Personal & Memorial',
  description: 'Funeral expenses, pet care, family hardship, and life event campaigns. A gentle space to give and be given to.',
};

export default function PersonalPage() {
  return <PersonalPageClient />;
}
