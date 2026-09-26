import { CampaignStatus, UserRole } from '../../common/enums';
import { Campaign } from '../../modules/campaigns/entities/campaign.entity';
import { CampaignCategory } from '../../modules/campaigns/entities/campaign-category.entity';
import { CampaignWallet } from '../../modules/campaigns/entities/campaign-wallet.entity';

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
  coverImageUrl: string | null;
  targetAmount: string;
  /**
   * Gross total of SUCCESS payment intents for this campaign, as a decimal string.
   * This is what donors mean by "raised" — it is NOT the wallet balance, which is
   * net of platform and processing fees.
   */
  raisedAmount: string;
  /** Distinct supporters: signed-in donors deduplicated, each guest gift counted once. */
  donorCount: number;
  currency: string;
  status: Campaign['status'];
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: CategorySummary;
  creator: CreatorSummary;
}

export interface CampaignDetail extends CampaignSummary {
  wallet: {
    campaignId: string;
    clearedBalance: string;
    pendingBalance: string;
    updatedAt: Date;
  };
}

export interface CampaignUpdateView {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface PaginatedCampaigns {
  data: CampaignSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export { CampaignStatus, UserRole } from '../../common/enums';
