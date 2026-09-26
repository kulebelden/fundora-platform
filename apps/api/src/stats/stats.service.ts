import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignStatus, TransactionStatus } from '../common/enums';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { PlatformStats } from './interfaces/platform-stats';

export const DEFAULT_REPORTING_CURRENCY = 'USD';

/** Campaign states whose money counts towards public, marketing-facing totals. */
const PUBLIC_STATUSES: CampaignStatus[] = [
  CampaignStatus.LIVE,
  CampaignStatus.COMPLETED,
];

/** These are four aggregate scans; a public ticker must not run them per request. */
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  expiresAt: number;
  value: PlatformStats;
}

@Injectable()
export class StatsService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    @InjectRepository(Campaign)
    private readonly campaigns: Repository<Campaign>,
  ) {}

  async getPlatformStats(currency?: string): Promise<PlatformStats> {
    const reportingCurrency = (currency ?? DEFAULT_REPORTING_CURRENCY).toUpperCase();

    const cached = this.cache.get(reportingCurrency);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const [byCurrency, totalDonors, successfulCauses, activeCountries] =
      await Promise.all([
        this.raisedByCurrency(),
        this.countDonors(),
        this.countSuccessfulCauses(),
        this.countActiveCountries(),
      ]);

    const value: PlatformStats = {
      totalRaised: byCurrency[reportingCurrency] ?? '0',
      reportingCurrency,
      totalRaisedByCurrency: byCurrency,
      totalDonors,
      successfulCauses,
      activeCountries,
    };

    this.cache.set(reportingCurrency, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value,
    });

    return value;
  }

  private get manager() {
    return this.campaigns.manager;
  }

  private async raisedByCurrency(): Promise<Record<string, string>> {
    const rows: Array<{ currency: string; total: string | null }> =
      await this.manager.query(
        `SELECT pi."currency" AS currency,
                COALESCE(SUM(pi."amount"), 0)::text AS total
           FROM "payment_intents" pi
           JOIN "campaigns" c ON c."id" = pi."campaignId"
          WHERE pi."status" = $1
            AND c."status"::text = ANY($2::text[])
          GROUP BY pi."currency"`,
        [TransactionStatus.SUCCESS, PUBLIC_STATUSES],
      );

    const result: Record<string, string> = {};
    for (const row of rows) {
      // `currency` is CHAR(3) and comes back space-padded.
      result[row.currency.trim().toUpperCase()] = row.total ?? '0';
    }
    return result;
  }

  /**
   * Signed-in donors are deduplicated across their gifts; each guest gift has no
   * donorId so it counts as one distinct supporter.
   */
  private async countDonors(): Promise<number> {
    const rows: Array<{ count: string | number }> = await this.manager.query(
      `SELECT COUNT(DISTINCT COALESCE(pi."donorId"::text, 'guest:' || pi."id"::text)) AS count
         FROM "payment_intents" pi
        WHERE pi."status" = $1`,
      [TransactionStatus.SUCCESS],
    );
    return Number(rows[0]?.count ?? 0) || 0;
  }

  /** COMPLETED, or fully funded against its own target in its own currency. */
  private async countSuccessfulCauses(): Promise<number> {
    const rows: Array<{ count: string | number }> = await this.manager.query(
      `SELECT COUNT(*) AS count
         FROM (
           SELECT c."id"
             FROM "campaigns" c
             LEFT JOIN "payment_intents" pi
               ON pi."campaignId" = c."id" AND pi."status" = $1
            GROUP BY c."id", c."status", c."targetAmount"
           HAVING c."status" = $2
               OR COALESCE(SUM(pi."amount"), 0) >= c."targetAmount"
         ) AS funded`,
      [TransactionStatus.SUCCESS, CampaignStatus.COMPLETED],
    );
    return Number(rows[0]?.count ?? 0) || 0;
  }

  /** Countries of people actually taking part: public campaign creators and donors. */
  private async countActiveCountries(): Promise<number> {
    const rows: Array<{ count: string | number }> = await this.manager.query(
      `SELECT COUNT(DISTINCT up."countryCode") AS count
         FROM "user_profiles" up
        WHERE up."userId" IN (
                SELECT c."creatorId" FROM "campaigns" c
                 WHERE c."status"::text = ANY($1::text[])
                UNION
                SELECT pi."donorId" FROM "payment_intents" pi
                 WHERE pi."status" = $2 AND pi."donorId" IS NOT NULL
              )`,
      [PUBLIC_STATUSES, TransactionStatus.SUCCESS],
    );
    return Number(rows[0]?.count ?? 0) || 0;
  }
}
