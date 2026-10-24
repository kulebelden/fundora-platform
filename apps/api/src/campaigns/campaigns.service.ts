import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignStatus, TransactionStatus, UserRole } from '../common/enums';
import {
  Campaign,
} from '../modules/campaigns/entities/campaign.entity';
import { CampaignCategory } from '../modules/campaigns/entities/campaign-category.entity';
import { CampaignUpdate } from '../modules/campaigns/entities/campaign-update.entity';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { AdminCampaignQueryDto } from './dto/admin-campaign-query.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateCampaignUpdateDto } from './dto/create-campaign-update.dto';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import {
  ALLOWED_STATUS_TRANSITIONS,
} from './dto/update-campaign-status.dto';
import {
  CampaignDetail,
  CampaignSummary,
  CampaignUpdateView,
  CreatorSummary,
  PaginatedCampaigns,
} from './interfaces/campaign-response';
import { uniqueSlug } from './utils/slug';

interface RelationsMap {
  category: true;
  creator: { profile: true };
  wallet: true;
}

/** Live donation totals for one campaign, derived from settled payment intents. */
export interface CampaignAggregate {
  raisedAmount: string;
  donorCount: number;
}

const EMPTY_AGGREGATE: CampaignAggregate = { raisedAmount: '0', donorCount: 0 };

/** Roles allowed to read any campaign's finances, not just their own. */
const FINANCE_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.FINANCE_OFFICER,
];

export interface CampaignRequester {
  id: string;
  role: UserRole;
}

@Injectable()
export class CampaignsService {
  private static readonly RELATIONS: RelationsMap = {
    category: true,
    creator: { profile: true },
    wallet: true,
  };

  constructor(
    @InjectRepository(Campaign)
    private readonly campaigns: Repository<Campaign>,
    @InjectRepository(CampaignUpdate)
    private readonly updates: Repository<CampaignUpdate>,
  ) {}

  async createCampaign(
    creatorId: string,
    dto: CreateCampaignDto,
  ): Promise<CampaignDetail> {
    if (dto.endDate && dto.startDate && dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const campaign = await this.campaigns.manager.transaction(
      async (manager) => {
        const categories = manager.getRepository(CampaignCategory);
        const category = await categories.findOne({
          where: { id: dto.categoryId },
        });

        if (!category) {
          throw new NotFoundException(
            `Category ${dto.categoryId} not found`,
          );
        }

        const campaignRepo = manager.getRepository(Campaign);
        let slug: string;
        while (true) {
          slug = uniqueSlug(dto.title);
          const existing = await campaignRepo.findOne({ where: { slug } });
          if (!existing) {
            break;
          }
        }

        const created = await campaignRepo.save(
          campaignRepo.create({
            title: dto.title,
            slug,
            story: dto.story,
            coverImageUrl: dto.coverImageUrl ?? null,
            targetAmount: dto.targetAmount.toString(),
            currency: dto.currency,
            category: { id: dto.categoryId },
            creator: { id: creatorId },
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            endDate: dto.endDate ? new Date(dto.endDate) : null,
            status: CampaignStatus.DRAFT,
          }),
        );

        // The ledger credits donations to this row and payouts debit it, so every
        // campaign needs one from the start.
        await manager.getRepository(CampaignWallet).insert({
          campaignId: created.id,
          clearedBalance: '0',
          pendingBalance: '0',
        });
        return created;
      },
    );

    return this.detailFor(await this.load(campaign.id));
  }

  async submitForReview(
    campaignId: string,
    creatorId: string,
  ): Promise<CampaignSummary> {
    const campaign = await this.campaigns.findOne({
      where: { id: campaignId, creator: { id: creatorId } },
      relations: CampaignsService.RELATIONS,
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException(
        `Only DRAFT campaigns can be submitted (current: ${campaign.status})`,
      );
    }

    await this.campaigns.update(campaignId, {
      status: CampaignStatus.SUBMITTED,
    });

    return this.summaryFor(await this.load(campaignId));
  }

  async updateStatus(
    campaignId: string,
    dto: UpdateCampaignStatusDto,
  ): Promise<CampaignSummary> {
    const campaign = await this.campaigns.findOne({
      where: { id: campaignId },
      select: { id: true, status: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[campaign.status];

    if (!allowed.includes(dto.status)) {
      throw new ConflictException(
        `Cannot transition from ${campaign.status} to ${dto.status}`,
      );
    }

    await this.campaigns.update(campaignId, { status: dto.status });

    return this.summaryFor(await this.load(campaignId));
  }

  /**
   * Super-admin delete. Archives rather than removes: the campaign's ledger
   * entries are immutable and its donations stay part of the audit trail, so
   * the row is kept with `deletedAt` set, which hides it from every read.
   *
   * Refused while the wallet still holds money (cleared, or mid-payout): the
   * fundraiser could no longer reach it. Pay out or suspend instead.
   */
  async archive(campaignId: string, deletedById: string, reason: string): Promise<{ id: string; deletedAt: string }> {
    return this.campaigns.manager.transaction(async (manager) => {
      const campaign = await manager
        .getRepository(Campaign)
        .createQueryBuilder('campaign')
        .leftJoinAndSelect('campaign.wallet', 'wallet')
        .where('campaign.id = :campaignId', { campaignId })
        .setLock('pessimistic_write', undefined, ['campaign'])
        .getOne();

      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      const cleared = Number(campaign.wallet?.clearedBalance ?? 0);
      const pending = Number(campaign.wallet?.pendingBalance ?? 0);
      if (cleared > 0 || pending > 0) {
        const held = (cleared + pending).toFixed(2);
        throw new ConflictException(
          `This campaign still holds ${held} ${campaign.currency}. Pay it out to the fundraiser or suspend the campaign instead.`,
        );
      }

      const deletedAt = new Date();
      await manager.getRepository(Campaign).update(
        { id: campaign.id },
        { deletedAt, deletedById, deletionReason: reason.trim() },
      );
      return { id: campaign.id, deletedAt: deletedAt.toISOString() };
    });
  }

  async findAllPublic(
    query: CampaignQueryDto,
  ): Promise<PaginatedCampaigns> {
    const page = Math.max(1, query.page);
    const limit = Math.max(1, query.limit);
    const skip = (page - 1) * limit;

    // Only campaigns that can take donations. Completed, suspended and
    // rejected ones (and archived ones, which TypeORM drops) stay off the
    // home page, category hubs and search; their own links still work.
    const builder = this.campaigns
      .createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.category', 'category')
      .leftJoinAndSelect('campaign.creator', 'creator')
      .leftJoinAndSelect('creator.profile', 'profile')
      .where('campaign.status = :status', { status: CampaignStatus.LIVE });

    if (query.category) {
      builder.andWhere('category.slug = :category', { category: query.category });
    }

    // Every word must appear somewhere: title, story, category or organiser.
    const words = searchWords(query.q);
    words.forEach((word, index) => {
      builder.andWhere(
        `(campaign.title ILIKE :w${index} OR campaign.story ILIKE :w${index} OR category.name ILIKE :w${index}
          OR profile.firstName ILIKE :w${index} OR profile.lastName ILIKE :w${index})`,
        { [`w${index}`]: `%${escapeLike(word)}%` },
      );
    });

    if (words.length) {
      // Title hits first: they are what the person most likely meant.
      builder
        .addSelect(`CASE WHEN campaign.title ILIKE :phrase THEN 0 ELSE 1 END`, 'title_rank')
        .setParameter('phrase', `%${escapeLike(words.join(' '))}%`)
        .orderBy('title_rank', 'ASC')
        .addOrderBy('campaign.createdAt', 'DESC');
    } else {
      builder.orderBy('campaign.createdAt', 'DESC');
    }

    const [items, total] = await builder.skip(skip).take(limit).getManyAndCount();

    // One grouped query for the whole page rather than one per campaign.
    const aggregates = await this.aggregatesFor(items.map((c) => c.id));

    return {
      data: items.map((campaign) =>
        this.toSummary(campaign, aggregates.get(campaign.id)),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string): Promise<CampaignDetail> {
    const campaign = await this.campaigns.findOne({
      where: { slug },
      relations: CampaignsService.RELATIONS,
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return this.detailFor(campaign);
  }

  /**
   * Dashboard lookup by UUID. Wallet balances are private financial data, so this is
   * restricted to the campaign owner and finance/admin staff.
   */
  async findByIdForRequester(
    campaignId: string,
    requester: CampaignRequester,
  ): Promise<CampaignDetail> {
    const campaign = await this.campaigns.findOne({
      where: { id: campaignId },
      relations: CampaignsService.RELATIONS,
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (
      campaign.creatorId !== requester.id &&
      !FINANCE_ROLES.includes(requester.role)
    ) {
      // Same shape as "missing" so campaign ids cannot be probed for existence.
      throw new NotFoundException('Campaign not found');
    }

    return this.detailFor(campaign);
  }

  /**
   * Moderation queue: every status is reachable, newest first, so a reviewer sees
   * what is waiting rather than only what is already public.
   */
  async findAllForAdmin(query: AdminCampaignQueryDto): Promise<PaginatedCampaigns> {
    const page = Math.max(1, query.page);
    const limit = Math.max(1, query.limit);

    const [items, total] = await this.campaigns.findAndCount({
      where: query.status ? { status: query.status } : {},
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: {
        category: true,
        creator: { profile: true },
      },
    });

    const aggregates = await this.aggregatesFor(items.map((c) => c.id));

    return {
      data: items.map((campaign) => this.toSummary(campaign, aggregates.get(campaign.id))),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Campaign counts per status, for the moderation dashboard's queue badges. */
  async countsByStatus(): Promise<Record<string, number>> {
    const rows = await this.campaigns
      .createQueryBuilder('campaign')
      .select('campaign.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('campaign.status')
      .getRawMany<{ status: string; count: string }>();

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {});
  }

  async findUserCampaigns(userId: string): Promise<CampaignSummary[]> {
    const campaigns = await this.campaigns.find({
      where: { creator: { id: userId } },
      relations: {
        category: true,
        creator: { profile: true },
      },
    });

    const aggregates = await this.aggregatesFor(campaigns.map((c) => c.id));

    return campaigns.map((campaign) =>
      this.toSummary(campaign, aggregates.get(campaign.id)),
    );
  }

  /* ----------------------------------------------------------- updates */

  async listUpdates(campaignId: string): Promise<CampaignUpdateView[]> {
    const exists = await this.campaigns.findOne({
      where: { id: campaignId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Campaign not found');
    }

    const rows = await this.updates.find({
      where: { campaignId },
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) => this.toUpdateView(row));
  }

  async addUpdate(
    campaignId: string,
    authorId: string,
    dto: CreateCampaignUpdateDto,
  ): Promise<CampaignUpdateView> {
    const campaign = await this.campaigns.findOne({
      where: { id: campaignId },
      select: { id: true, creatorId: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.creatorId !== authorId) {
      throw new ForbiddenException('Only the campaign owner can post updates');
    }

    const saved = await this.updates.save(
      this.updates.create({
        campaignId,
        title: dto.title,
        content: dto.content,
      }),
    );

    return this.toUpdateView(saved);
  }

  /* ------------------------------------------------------- aggregates */

  /**
   * Gross raised and distinct supporter count per campaign, from settled payment
   * intents. A guest gift has no donorId, so each one counts as its own supporter;
   * signed-in donors are deduplicated across their gifts.
   */
  private async aggregatesFor(
    campaignIds: string[],
  ): Promise<Map<string, CampaignAggregate>> {
    const result = new Map<string, CampaignAggregate>();

    if (!campaignIds.length) {
      return result;
    }

    const rows: Array<{
      campaignId: string;
      raised: string | null;
      donors: string | null;
    }> = await this.campaigns.manager.query(
      `SELECT "campaignId",
              COALESCE(SUM("amount"), 0)::text AS raised,
              COUNT(DISTINCT COALESCE("donorId"::text, 'guest:' || "id"::text)) AS donors
         FROM "payment_intents"
        WHERE "status" = $1
          AND "campaignId" = ANY($2::uuid[])
        GROUP BY "campaignId"`,
      [TransactionStatus.SUCCESS, campaignIds],
    );

    for (const row of rows) {
      result.set(row.campaignId, {
        raisedAmount: row.raised ?? '0',
        donorCount: Number(row.donors ?? 0) || 0,
      });
    }

    return result;
  }

  private async load(id: string): Promise<Campaign> {
    const campaign = await this.campaigns.findOne({
      where: { id },
      relations: CampaignsService.RELATIONS,
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  private async summaryFor(campaign: Campaign): Promise<CampaignSummary> {
    const aggregates = await this.aggregatesFor([campaign.id]);
    return this.toSummary(campaign, aggregates.get(campaign.id));
  }

  private async detailFor(campaign: Campaign): Promise<CampaignDetail> {
    const aggregates = await this.aggregatesFor([campaign.id]);
    return this.toDetail(campaign, aggregates.get(campaign.id));
  }

  private toCreator(campaign: Campaign): CreatorSummary {
    const profile = campaign.creator?.profile;

    return {
      id: campaign.creator.id,
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      avatarUrl: profile?.avatarUrl ?? null,
    };
  }

  private toUpdateView(row: CampaignUpdate): CampaignUpdateView {
    return {
      id: row.id,
      campaignId: row.campaignId,
      title: row.title,
      content: row.content,
      createdAt: row.createdAt,
    };
  }

  private toSummary(
    campaign: Campaign,
    aggregate: CampaignAggregate = EMPTY_AGGREGATE,
  ): CampaignSummary {
    return {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      story: campaign.story,
      coverImageUrl: campaign.coverImageUrl ?? null,
      targetAmount: campaign.targetAmount,
      raisedAmount: aggregate.raisedAmount,
      donorCount: aggregate.donorCount,
      currency: campaign.currency,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      category: {
        id: campaign.category.id,
        name: campaign.category.name,
        slug: campaign.category.slug,
        description: campaign.category.description,
      },
      creator: this.toCreator(campaign),
    };
  }

  private toDetail(
    campaign: Campaign,
    aggregate: CampaignAggregate = EMPTY_AGGREGATE,
  ): CampaignDetail {
    return {
      ...this.toSummary(campaign, aggregate),
      wallet: {
        campaignId: campaign.wallet?.campaignId ?? campaign.id,
        clearedBalance: campaign.wallet?.clearedBalance ?? '0',
        pendingBalance: campaign.wallet?.pendingBalance ?? '0',
        updatedAt: campaign.wallet?.updatedAt ?? campaign.updatedAt,
      },
    };
  }
}

/** Up to five distinct words from a search box, each at most 50 characters. */
function searchWords(raw: string | undefined): string[] {
  if (!raw) return [];
  const words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean).map((word) => word.slice(0, 50));
  return [...new Set(words)].slice(0, 5);
}

/** Makes `%`, `_` and `\` in user input match literally inside ILIKE. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
