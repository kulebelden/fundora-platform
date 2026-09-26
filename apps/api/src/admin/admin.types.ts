/**
 * Response shapes for the admin console. Money is a decimal string in its own
 * currency and is never summed across currencies, matching the rest of the API.
 */

export interface CurrencyAmount {
  currency: string;
  amount: string;
  count: number;
}

export interface TimelinePoint {
  /** UTC calendar day, YYYY-MM-DD. */
  date: string;
  signups: number;
  campaigns: number;
  donations: number;
}

export interface TopCampaign {
  id: string;
  title: string;
  slug: string;
  status: string;
  currency: string;
  targetAmount: string;
  raised: string;
  donors: number;
  creatorName: string;
  coverImageUrl: string | null;
}

export interface CategoryBreakdown {
  name: string;
  slug: string;
  campaigns: number;
  live: number;
}

export type ActivityKind =
  | 'signup'
  | 'campaign_created'
  | 'donation'
  | 'withdrawal_requested'
  | 'kyc_submitted';

export interface ActivityItem {
  kind: ActivityKind;
  at: string;
  /** Who did it, as a display name. */
  actor: string;
  /** What it concerned: a campaign title, a role, etc. */
  subject: string | null;
  amount: string | null;
  currency: string | null;
  status: string | null;
  /** Campaign slug when the event links to one. */
  slug: string | null;
}

export interface AdminOverview {
  generatedAt: string;
  users: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
    byRole: Record<string, number>;
  };
  campaigns: {
    total: number;
    newLast7Days: number;
    byStatus: Record<string, number>;
  };
  donations: {
    settled: number;
    pending: number;
    failed: number;
    donors: number;
    raisedByCurrency: CurrencyAmount[];
  };
  withdrawals: {
    byStatus: Record<string, number>;
    pendingByCurrency: CurrencyAmount[];
    paidOutByCurrency: CurrencyAmount[];
  };
  kyc: {
    byStatus: Record<string, number>;
  };
  queues: {
    campaignsAwaitingReview: number;
    kycAwaitingReview: number;
    withdrawalsAwaitingReview: number;
    unreadMessages: number;
  };
  timeline: TimelinePoint[];
  topCampaigns: TopCampaign[];
  categories: CategoryBreakdown[];
  activity: ActivityItem[];
}

export interface AdminUserRow {
  id: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  firstName: string | null;
  lastName: string | null;
  countryCode: string | null;
  createdAt: string;
  kycStatus: string | null;
  campaigns: number;
  liveCampaigns: number;
  raisedByCurrency: CurrencyAmount[];
  donationsGiven: number;
}

export interface PaginatedAdminUsers {
  data: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  /** Totals per role across the whole platform, for the filter chips. */
  roleCounts: Record<string, number>;
}

/* ------------------------------------------------------------------ inbox */

export interface ContactMessageView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  subject: string;
  message: string;
  campaignLink: string | null;
  /** The sender's account, when they were signed in. */
  userId: string | null;
  accountRole: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedContactMessages {
  data: ContactMessageView[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

/* ----------------------------------------------------------------- audits */

export interface DonationAuditRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  channel: string;
  amount: string;
  currency: string;
  providerReference: string | null;
  isAnonymous: boolean;
  /** As typed in the donation form. */
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  donorMessage: string | null;
  /** The signed-in account that donated, if any. */
  account: { id: string; name: string; email: string; phoneNumber: string | null } | null;
  campaign: { id: string; title: string; slug: string; currency: string };
}

export interface PaginatedDonationAudit {
  data: DonationAuditRow[];
  total: number;
  page: number;
  limit: number;
  byStatus: Record<string, number>;
  settledByCurrency: CurrencyAmount[];
}

export interface WithdrawalAuditRow {
  id: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  payoutReference: string | null;
  grossAmount: string;
  serviceFee: string;
  netAmount: string;
  currency: string;
  bankAccountDetails: Record<string, unknown>;
  campaign: { id: string; title: string; slug: string };
  organiser: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    kycStatus: string | null;
  };
}
