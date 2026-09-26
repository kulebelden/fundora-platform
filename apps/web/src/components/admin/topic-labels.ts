import type { ContactTopic } from '@/lib/types';

/** Display names for contact-form topics, shared by the bell and the inbox. */
export const TOPIC_LABELS: Record<ContactTopic, string> = {
  general: 'General question',
  donation: 'Donation',
  campaign: 'Campaign',
  payout: 'Payouts',
  trust_safety: 'Trust & safety',
  press: 'Press',
  partnership: 'Partnership',
};
