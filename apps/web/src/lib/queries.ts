'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api, isUnauthorized } from './api';
import { queryKeys } from './query-keys';
import type {
  BankAccountDetails,
  BankTransferConfirmation,
  PendingBankTransfer,
  AdminOverview,
  ContactMessageInput,
  ContactMessageView,
  PaginatedContactMessages,
  PaginatedDonationAudit,
  PaginatedWithdrawalAudit,
  PaymentChannel,
  TransactionStatus,
  WithdrawalStatus,
  AuthResponse,
  AuthenticatedUser,
  CampaignDetail,
  CampaignStatus,
  CampaignStatusCounts,
  CampaignSummary,
  CampaignUpdateView,
  CategorySummary,
  CreateCampaignInput,
  DonationFeedItem,
  DonationResponse,
  KycStatusView,
  PaginatedAdminUsers,
  PaginatedCampaigns,
  PendingKycReview,
  PlatformStats,
  UserRole,
  WithdrawalRequestView,
} from './types';

// Kept in their own module so server components can prefetch under the same keys.
export { queryKeys };

/* ------------------------------------------------------------------ auth */

export function useMe(): UseQueryResult<AuthenticatedUser | null> {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        const { data } = await api.get<AuthenticatedUser>('/auth/me');
        return data ?? null;
      } catch (error) {
        // A signed-out visitor is a normal state, not an error to surface.
        if (isUnauthorized(error)) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      // The API's LoginDto field is `emailOrPhone`, and its ValidationPipe runs with
      // forbidNonWhitelisted, so posting `email` is rejected outright. Map it here
      // rather than renaming the form field, which users read as "email address".
      const { data } = await api.post<AuthResponse>('/auth/login', {
        emailOrPhone: payload.email,
        password: payload.password,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data.user);
    },
  });
}

/** Creates the account. No session yet: the emailed link signs the person in. */
/**
 * Creates the account. Normally answers VERIFICATION_SENT; when the API has email
 * verification switched off it signs the person in and returns the session instead.
 */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      phoneNumber: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      const { data } = await api.post<{ status: 'VERIFICATION_SENT'; email: string } | AuthResponse>(
        '/auth/register',
        payload,
      );
      return data;
    },
    onSuccess: (data) => {
      if ('user' in data) queryClient.setQueryData(queryKeys.me, data.user);
    },
  });
}

/** Opens the emailed link: verifies the address and starts the session. */
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post<AuthResponse>('/auth/verify-email', { token });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me, data.user);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      await api.post('/auth/resend-verification', { email });
    },
  });
}

/** Always succeeds, whether or not the address has an account. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      await api.post('/auth/forgot-password', { email });
    },
  });
}

/** Sets the new password; the API signs out every device, so the person logs in again. */
export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { token: string; password: string }) => {
      await api.post('/auth/reset-password', payload);
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export type OAuthProvider = 'google' | 'apple';

/** Which social sign-in providers the API has credentials for. */
export function useOAuthProviders() {
  return useQuery({
    queryKey: ['auth', 'oauth-providers'] as const,
    queryFn: async () => {
      const { data } = await api.get<Record<OAuthProvider, boolean>>('/auth/oauth/providers');
      return data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout', {});
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.clear();
    },
  });
}

/* ------------------------------------------------------------- campaigns */

export function useCampaigns(page = 1, limit = 9) {
  return useQuery({
    queryKey: queryKeys.campaigns(page, limit),
    queryFn: async () => {
      const { data } = await api.get<PaginatedCampaigns>('/campaigns', {
        params: { page, limit },
      });
      return data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Live campaigns matching a search, across the whole site (the API searches
 * title, story, category and organiser). Off until there are 2+ characters.
 */
export function useCampaignSearch(query: string, limit = 6, page = 1) {
  const q = query.trim();
  return useQuery({
    queryKey: ['campaigns', 'search', q.toLowerCase(), limit, page] as const,
    queryFn: async () => {
      const { data } = await api.get<PaginatedCampaigns>('/campaigns', { params: { q, limit, page } });
      return data;
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
    // Keep the previous results on screen while the next keystroke's results load.
    placeholderData: (previous) => previous,
  });
}

export function useCampaign(slug: string) {
  return useQuery({
    queryKey: queryKeys.campaign(slug),
    queryFn: async () => {
      const { data } = await api.get<CampaignDetail>(`/campaigns/${encodeURIComponent(slug)}`);
      return data;
    },
    enabled: Boolean(slug),
    retry: 1,
  });
}

/** Owner/finance-only lookup by UUID; returns wallet balances alongside the campaign. */
export function useCampaignById(id: string) {
  return useQuery({
    queryKey: queryKeys.campaignById(id),
    queryFn: async () => {
      const { data } = await api.get<CampaignDetail>(
        `/campaigns/id/${encodeURIComponent(id)}`,
      );
      return data;
    },
    enabled: Boolean(id),
    retry: 1,
  });
}

/* --------------------------------------------------------------- updates */

export function useCampaignUpdates(campaignId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.campaignUpdates(campaignId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<CampaignUpdateView[]>(
        `/campaigns/${encodeURIComponent(campaignId!)}/updates`,
      );
      return data;
    },
    enabled: Boolean(campaignId),
    retry: 1,
  });
}

export function usePostUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      campaignId: string;
      title: string;
      content: string;
    }) => {
      const { data } = await api.post<CampaignUpdateView>(
        `/campaigns/${encodeURIComponent(payload.campaignId)}/updates`,
        { title: payload.title, content: payload.content },
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.campaignUpdates(variables.campaignId),
      });
    },
  });
}

export function useMyCampaigns() {
  return useQuery({
    queryKey: queryKeys.myCampaigns,
    queryFn: async () => {
      const { data } = await api.get<CampaignSummary[]>('/campaigns/me');
      return data;
    },
    retry: 1,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data } = await api.get<CategorySummary[]>('/categories');
      return data;
    },
    staleTime: 300_000,
    retry: 1,
  });
}

/* ------------------------------------------------------------- donations */

export function useDonationFeed(campaignId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.donations(campaignId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<DonationFeedItem[]>(
        `/payments/history/${encodeURIComponent(campaignId!)}`,
      );
      return data;
    },
    enabled: Boolean(campaignId),
    retry: 1,
  });
}

export function useDonate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      campaignId: string;
      amount: number;
      currency?: string;
      isAnonymous?: boolean;
      provider?: 'stripe' | 'bank_wire' | 'paypal';
      donorName?: string;
      donorEmail?: string;
      donorPhone?: string;
      donorMessage?: string;
    }) => {
      const { data } = await api.post<DonationResponse>('/payments/donate', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.donations(variables.campaignId) });
    },
  });
}

/* ----------------------------------------------------------- withdrawals */

export function useMyWithdrawals() {
  return useQuery({
    queryKey: queryKeys.withdrawals,
    queryFn: async () => {
      const { data } = await api.get<WithdrawalRequestView[]>('/withdrawals/me');
      return data;
    },
    retry: 1,
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      campaignId: string;
      amount: number;
      currency: string;
      bankDetails: BankAccountDetails;
    }) => {
      const { data } = await api.post<WithdrawalRequestView>('/withdrawals/request', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myCampaigns });
    },
  });
}

/* ------------------------------------------------------------------- kyc */

export function useKycStatus() {
  return useQuery({
    queryKey: queryKeys.kyc,
    queryFn: async () => {
      const { data } = await api.get<KycStatusView>('/kyc/status');
      return data;
    },
    retry: 1,
  });
}

/* ----------------------------------------------------------------- admin */

/**
 * Moderation queue. `status` undefined means every status, which is why this
 * endpoint is role-guarded: it exposes drafts and rejected campaigns that never
 * appear in the public list.
 */
export function useAdminCampaigns(status: CampaignStatus | 'ALL', page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.adminCampaigns(status, page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedCampaigns>('/campaigns/admin/queue', {
        params: { page, limit, ...(status === 'ALL' ? {} : { status }) },
      });
      return data;
    },
    retry: 1,
  });
}

export function useAdminCampaignCounts() {
  return useQuery({
    queryKey: queryKeys.adminCampaignCounts,
    queryFn: async () => {
      const { data } = await api.get<CampaignStatusCounts>('/campaigns/admin/counts');
      return data;
    },
    retry: 1,
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      campaignId: string;
      status: CampaignStatus;
      reason?: string;
    }) => {
      const { data } = await api.patch<CampaignSummary>(
        `/campaigns/${encodeURIComponent(payload.campaignId)}/status`,
        { status: payload.status, ...(payload.reason ? { reason: payload.reason } : {}) },
      );
      return data;
    },
    onSuccess: () => {
      // The row moves between queues, so refresh the lists and the badge counts.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminCampaignCounts });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
    },
  });
}

export function usePendingKyc() {
  return useQuery({
    queryKey: queryKeys.adminKyc,
    queryFn: async () => {
      const { data } = await api.get<PendingKycReview[]>('/kyc/pending');
      return data;
    },
    retry: 1,
  });
}

export function useReviewKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      kycId: string;
      status: 'VERIFIED' | 'REJECTED';
      reason?: string;
    }) => {
      const { data } = await api.patch<KycStatusView>(
        `/kyc/${encodeURIComponent(payload.kycId)}/review`,
        { status: payload.status, ...(payload.reason ? { reason: payload.reason } : {}) },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
    },
  });
}

export function usePendingWithdrawals() {
  return useQuery({
    queryKey: queryKeys.adminWithdrawals,
    queryFn: async () => {
      const { data } = await api.get<WithdrawalRequestView[]>('/withdrawals/pending');
      return data;
    },
    retry: 1,
  });
}

/* ------------------------------------------------------------- fees */

export interface DonationFees {
  platformFeePercent: number;
  cardProcessingFeePercent: number;
}

/** The fees a donation carries right now. Public; the platform fee is set by the super admin. */
export function useDonationFees() {
  return useQuery({
    queryKey: ['fees'] as const,
    queryFn: async () => {
      const { data } = await api.get<DonationFees>('/payments/fees');
      return data;
    },
    // Always re-checked when a page mounts, so a fee change shows straight away.
    staleTime: 0,
  });
}

/** The live platform fee as people read it ("5%"), or null while it loads. */
export function usePlatformFeeLabel(): string | null {
  const { data } = useDonationFees();
  return data ? `${data.platformFeePercent}%` : null;
}

export interface PlatformFeeChange {
  id: string;
  ratePercent: number;
  previousRatePercent: number | null;
  reason: string;
  changedBy: string | null;
  createdAt: string;
}

export function useAdminPlatformFee() {
  return useQuery({
    queryKey: ['admin', 'platform-fee'] as const,
    queryFn: async () => {
      const { data } = await api.get<{ ratePercent: number; history: PlatformFeeChange[] }>('/admin/platform-fee');
      return data;
    },
    retry: 1,
  });
}

export function useSetPlatformFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ratePercent: number; reason: string }) => {
      const { data } = await api.put<PlatformFeeChange>('/admin/platform-fee', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-fee'] });
      void queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });
}

/** Super admin only. Archives the campaign; refused while its wallet still holds money. */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { campaignId: string; reason: string }) => {
      const { data } = await api.delete<{ id: string; deletedAt: string }>(
        `/admin/campaigns/${encodeURIComponent(payload.campaignId)}`,
        { data: { reason: payload.reason } },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useReviewWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      withdrawalId: string;
      status: 'APPROVED' | 'REJECTED';
      reason?: string;
    }) => {
      const { data } = await api.patch<WithdrawalRequestView>(
        `/withdrawals/${encodeURIComponent(payload.withdrawalId)}/review`,
        { status: payload.status, ...(payload.reason ? { reason: payload.reason } : {}) },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminWithdrawals });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawal-audit'] });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await api.post<CategorySummary>('/categories', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

/* ----------------------------------------------------------------- stats */

export function usePlatformStats(currency = 'USD') {
  return useQuery({
    queryKey: [...queryKeys.stats, currency],
    queryFn: async () => {
      const { data } = await api.get<PlatformStats>('/stats/platform', {
        params: { currency },
      });
      return data;
    },
    retry: 1,
    staleTime: 300_000,
  });
}

/* ------------------------------------------------------- campaign creation */

/** Stores a cover photo and resolves to the URL to send as `coverImageUrl`. */
export function useUploadCampaignCover() {
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post<{ url: string }>('/uploads/campaign-cover', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    },
  });
}

/**
 * Creates the campaign as a draft, then submits it for review in one step, so
 * a fundraiser never leaves a half-finished draft behind by accident.
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data: created } = await api.post<CampaignDetail>('/campaigns', input);
      const { data: submitted } = await api.post<CampaignSummary>(
        `/campaigns/${encodeURIComponent(created.id)}/submit`,
      );
      return submitted;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myCampaigns });
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

/* ------------------------------------------------------- admin monitoring */

/** Everything the console's overview shows. Refreshes itself every 30 seconds. */
export function useAdminOverview(enabled = true) {
  return useQuery({
    enabled,
    queryKey: queryKeys.adminOverview,
    queryFn: async () => {
      const { data } = await api.get<AdminOverview>('/admin/overview');
      return data;
    },
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useAdminUsers(role: UserRole | 'ALL', search: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.adminUsers(role, search, page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedAdminUsers>('/admin/users', {
        params: {
          page,
          limit,
          ...(role === 'ALL' ? {} : { role }),
          ...(search ? { search } : {}),
        },
      });
      return data;
    },
    placeholderData: (previous) => previous,
    retry: 1,
  });
}

/* ---------------------------------------------------------------- contact */

export function useSubmitContact() {
  return useMutation({
    mutationFn: async (input: ContactMessageInput) => {
      const { data } = await api.post<{ received: true; reference: string }>('/contact', input);
      return data;
    },
  });
}

/* ----------------------------------------------------------- admin inbox */

export function useAdminMessages(
  filter: 'all' | 'unread' | 'read',
  page = 1,
  limit = 25,
  options: { enabled?: boolean; poll?: boolean } = {},
) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryKey: queryKeys.adminMessages(filter, page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedContactMessages>('/admin/messages', {
        params: { filter, page, limit },
      });
      return data;
    },
    refetchInterval: options.poll ? 30_000 : false,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}

export function useMarkMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; read: boolean }) => {
      const { data } = await api.patch<ContactMessageView>(
        `/admin/messages/${encodeURIComponent(payload.id)}`,
        { read: payload.read },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
    },
  });
}

export function useMarkAllMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ updated: number }>('/admin/messages/read-all');
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
    },
  });
}

/* ---------------------------------------------------------- admin audits */

export function useAdminDonations(filters: {
  status: TransactionStatus | 'ALL';
  channel: PaymentChannel | 'ALL';
  search: string;
  page: number;
}) {
  return useQuery({
    queryKey: queryKeys.adminDonations(filters.status, filters.channel, filters.search, filters.page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedDonationAudit>('/admin/donations', {
        params: {
          page: filters.page,
          limit: 25,
          ...(filters.status === 'ALL' ? {} : { status: filters.status }),
          ...(filters.channel === 'ALL' ? {} : { channel: filters.channel }),
          ...(filters.search ? { search: filters.search } : {}),
        },
      });
      return data;
    },
    placeholderData: (previous) => previous,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useAdminWithdrawalAudit(status: WithdrawalStatus | 'ALL', page = 1) {
  return useQuery({
    queryKey: queryKeys.adminWithdrawalAudit(status, page),
    queryFn: async () => {
      const { data } = await api.get<PaginatedWithdrawalAudit>('/admin/withdrawals', {
        params: { page, limit: 25, ...(status === 'ALL' ? {} : { status }) },
      });
      return data;
    },
    placeholderData: (previous) => previous,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function usePendingBankTransfers() {
  return useQuery({
    queryKey: queryKeys.adminBankTransfers('pending'),
    queryFn: async () => {
      const { data } = await api.get<PendingBankTransfer[]>('/admin/bank-transfers', {
        params: { status: 'pending' },
      });
      return data;
    },
  });
}

export function useBankTransferConfirmations() {
  return useQuery({
    queryKey: queryKeys.adminBankTransfers('confirmed'),
    queryFn: async () => {
      const { data } = await api.get<BankTransferConfirmation[]>('/admin/bank-transfers', {
        params: { status: 'confirmed' },
      });
      return data;
    },
  });
}

/** Marks a pledged transfer as received; the API re-checks the staff password. */
export function useConfirmBankTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      bankReference: string;
      amountReceived: string;
      receivedOn: string;
      note?: string;
      password: string;
    }) => {
      const { data } = await api.post<BankTransferConfirmation>(`/admin/bank-transfers/${id}/confirm`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bank-transfers'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'donations'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
    },
  });
}
