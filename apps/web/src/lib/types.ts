/**
 * Mirrors the response contracts exposed by `apps/api`. Money always crosses the
 * wire as a decimal string; it is only converted to a number for display.
 */

export type CampaignStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'LIVE'
  | 'SUSPENDED'
  | 'COMPLETED'
  | 'REJECTED';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'FINANCE_OFFICER'
  | 'MODERATOR'
  | 'FUNDRAISER'
  | 'DONOR';

export type WithdrawalStatus =
  | 'REQUESTED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED';

export type KycStatus = 'NOT_STARTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export type PaymentChannel = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'BANK_TRANSFER';

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REVERSED';

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface CreatorSummary {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface CampaignSummary {
  id: string;
  title: string;
  slug: string;
  story: string;
  targetAmount: string;
  currency: string;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  category: CategorySummary;
  creator: CreatorSummary;
  coverImageUrl: string | null;
  /**
   * Gross total of settled donations, as a decimal string. This is what donors mean
   * by "raised"; it is NOT the wallet balance, which is net of platform fees.
   */
  raisedAmount: string;
  /** Distinct supporters: signed-in donors deduplicated, each guest gift counted once. */
  donorCount: number;
}

export interface CampaignWalletView {
  campaignId: string;
  clearedBalance: string;
  pendingBalance: string;
  updatedAt: string;
}

export interface CampaignDetail extends CampaignSummary {
  wallet: CampaignWalletView;
}

export interface PaginatedCampaigns {
  data: CampaignSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface DonationFeedItem {
  amount: number;
  currency: string;
  channel: PaymentChannel;
  providerReference: string | null;
  isAnonymous: boolean;
  /** Server-side display name; already 'Anonymous' when the donor asked to be hidden. */
  donorName: string;
  createdAt: string;
}

export interface CampaignUpdateView {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface DonationResponse {
  paymentIntentId: string;
  providerReference: string;
  clientSecret?: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  platformFee: number;
  processingFee: number;
  netAmount: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  nationalIdNumber: string | null;
  countryCode: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountNumber: string;
  swiftBic: string;
  iban?: string;
  accountName: string;
  country?: string;
}

export interface WithdrawalRequestView {
  id: string;
  campaignId: string;
  userId: string;
  grossAmount: string;
  serviceFee: string;
  netAmount: string;
  currency: string;
  bankAccountDetails: BankAccountDetails;
  status: WithdrawalStatus;
  rejectionReason: string | null;
  payoutReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KycStatusView {
  id: string | null;
  status: KycStatus;
  nationalIdOrPassport: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
}

/**
 * A KYC submission as a reviewer sees it (`GET /kyc/pending`). Carries the applicant
 * and the document; the ID number stays masked, exactly as the self-service response.
 */
export interface PendingKycReview extends KycStatusView {
  userId: string;
  documentUrl: string;
  submittedAt: string;
  applicantName: string | null;
  applicantEmail: string | null;
}

/** Campaign totals per status, for the moderation queue badges. */
export type CampaignStatusCounts = Partial<Record<CampaignStatus, number>>;

/** Roles that may open the admin area at all. Enforced server-side too. */
export const ADMIN_ROLES: readonly UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'FINANCE_OFFICER',
];

export function isAdminRole(role: UserRole | undefined): boolean {
  return Boolean(role && ADMIN_ROLES.includes(role));
}

export interface PlatformStats {
  /**
   * Gross raised in `reportingCurrency` only. The API holds no FX rates, so amounts
   * in other currencies are never folded in — see `totalRaisedByCurrency`.
   */
  totalRaised: string;
  reportingCurrency: string;
  totalRaisedByCurrency: Record<string, string>;
  totalDonors: number;
  successfulCauses: number;
  activeCountries: number;
}

/* ------------------------------------------------------------ admin console */

/** Money per currency. Amounts are decimal strings and never summed across currencies. */
export interface CurrencyAmount {
  currency: string;
  amount: string;
  count: number;
}

export interface AdminTimelinePoint {
  /** UTC day, YYYY-MM-DD. */
  date: string;
  signups: number;
  campaigns: number;
  donations: number;
}

export interface AdminTopCampaign {
  id: string;
  title: string;
  slug: string;
  status: CampaignStatus;
  currency: string;
  targetAmount: string;
  raised: string;
  donors: number;
  creatorName: string;
  coverImageUrl: string | null;
}

export interface AdminCategoryBreakdown {
  name: string;
  slug: string;
  campaigns: number;
  live: number;
}

export type AdminActivityKind =
  | 'signup'
  | 'campaign_created'
  | 'donation'
  | 'withdrawal_requested'
  | 'kyc_submitted';

export interface AdminActivityItem {
  kind: AdminActivityKind;
  at: string;
  actor: string;
  subject: string | null;
  amount: string | null;
  currency: string | null;
  status: string | null;
  slug: string | null;
}

export interface AdminOverview {
  generatedAt: string;
  users: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
    byRole: Partial<Record<UserRole, number>>;
  };
  campaigns: {
    total: number;
    newLast7Days: number;
    byStatus: CampaignStatusCounts;
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
  kyc: { byStatus: Record<string, number> };
  queues: {
    campaignsAwaitingReview: number;
    kycAwaitingReview: number;
    withdrawalsAwaitingReview: number;
    unreadMessages: number;
  };
  timeline: AdminTimelinePoint[];
  topCampaigns: AdminTopCampaign[];
  categories: AdminCategoryBreakdown[];
  activity: AdminActivityItem[];
}

export interface AdminUserRow {
  id: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
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
  roleCounts: Partial<Record<UserRole, number>>;
}

export interface CreateCampaignInput {
  title: string;
  categoryId: string;
  story: string;
  targetAmount: number;
  currency: string;
  coverImageUrl?: string;
}

/* ------------------------------------------------------------ contact inbox */

export type ContactTopic =
  | 'general'
  | 'donation'
  | 'campaign'
  | 'payout'
  | 'trust_safety'
  | 'press'
  | 'partnership';

export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  topic: ContactTopic;
  subject: string;
  message: string;
  campaignLink?: string;
  /** Honeypot; always empty for people. */
  website?: string;
}

export interface ContactMessageView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: ContactTopic;
  subject: string;
  message: string;
  campaignLink: string | null;
  userId: string | null;
  accountRole: UserRole | null;
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

/* ------------------------------------------------------------------ audits */

export interface DonationAuditRow {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: TransactionStatus;
  channel: PaymentChannel;
  amount: string;
  currency: string;
  providerReference: string | null;
  isAnonymous: boolean;
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  donorMessage: string | null;
  account: { id: string; name: string; email: string; phoneNumber: string | null } | null;
  campaign: { id: string; title: string; slug: string; currency: string };
}

export interface PaginatedDonationAudit {
  data: DonationAuditRow[];
  total: number;
  page: number;
  limit: number;
  byStatus: Partial<Record<TransactionStatus, number>>;
  settledByCurrency: CurrencyAmount[];
}

export interface WithdrawalAuditRow {
  id: string;
  status: WithdrawalStatus;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  payoutReference: string | null;
  grossAmount: string;
  serviceFee: string;
  netAmount: string;
  currency: string;
  bankAccountDetails: Partial<BankAccountDetails> & Record<string, unknown>;
  campaign: { id: string; title: string; slug: string };
  organiser: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    kycStatus: KycStatus | null;
  };
}

export interface PaginatedWithdrawalAudit {
  data: WithdrawalAuditRow[];
  total: number;
  page: number;
  limit: number;
  byStatus: Partial<Record<WithdrawalStatus, number>>;
}
