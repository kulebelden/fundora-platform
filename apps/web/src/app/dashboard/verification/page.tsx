import type { Metadata } from 'next';
import { VerificationClient } from './verification-client';

export const metadata: Metadata = {
  title: 'Identity verification',
};

export default function VerificationPage() {
  return <VerificationClient />;
}
