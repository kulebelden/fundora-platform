/** What a contact message is about; drives the label and the inbox filter. */
export const CONTACT_TOPICS = [
  'general',
  'donation',
  'campaign',
  'payout',
  'trust_safety',
  'press',
  'partnership',
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];
