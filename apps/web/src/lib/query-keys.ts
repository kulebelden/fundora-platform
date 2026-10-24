/**
 * React Query cache keys. Not a client module, so server components can
 * prefetch under exactly the keys the client hooks read (see server-prefetch).
 */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  campaigns: (page: number, limit: number) => ['campaigns', page, limit] as const,
  campaign: (slug: string) => ['campaign', slug] as const,
  campaignById: (id: string) => ['campaign', 'id', id] as const,
  campaignUpdates: (id: string) => ['campaign', id, 'updates'] as const,
  myCampaigns: ['campaigns', 'me'] as const,
  categories: ['categories'] as const,
  donations: (campaignId: string) => ['donations', campaignId] as const,
  withdrawals: ['withdrawals', 'me'] as const,
  kyc: ['kyc', 'status'] as const,
  stats: ['platform', 'stats'] as const,
  adminCampaigns: (status: string, page: number) =>
    ['admin', 'campaigns', status, page] as const,
  adminCampaignCounts: ['admin', 'campaigns', 'counts'] as const,
  adminKyc: ['admin', 'kyc', 'pending'] as const,
  adminWithdrawals: ['admin', 'withdrawals', 'pending'] as const,
  adminOverview: ['admin', 'overview'] as const,
  adminUsers: (role: string, search: string, page: number) =>
    ['admin', 'users', role, search, page] as const,
  adminMessages: (filter: string, page: number) => ['admin', 'messages', filter, page] as const,
  adminDonations: (status: string, channel: string, search: string, page: number) =>
    ['admin', 'donations', status, channel, search, page] as const,
  adminWithdrawalAudit: (status: string, page: number) =>
    ['admin', 'withdrawal-audit', status, page] as const,
  adminBankTransfers: (status: 'pending' | 'confirmed') => ['admin', 'bank-transfers', status] as const,
};
