import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CampaignStatus,
  KycStatus,
  TransactionStatus,
  WithdrawalStatus,
} from '../common/enums';
import {
  ActivityItem,
  AdminOverview,
  AdminUserRow,
  CategoryBreakdown,
  CurrencyAmount,
  PaginatedAdminUsers,
  TimelinePoint,
  TopCampaign,
} from './admin.types';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

const AWAITING_REVIEW: CampaignStatus[] = [CampaignStatus.SUBMITTED, CampaignStatus.UNDER_REVIEW];
const WITHDRAWALS_AWAITING: WithdrawalStatus[] = [
  WithdrawalStatus.REQUESTED,
  WithdrawalStatus.PENDING_REVIEW,
];
const WITHDRAWALS_IN_FLIGHT: WithdrawalStatus[] = [
  WithdrawalStatus.REQUESTED,
  WithdrawalStatus.PENDING_REVIEW,
  WithdrawalStatus.APPROVED,
  WithdrawalStatus.PROCESSING,
];

/** Display name for a user row joined to its profile as `u` and `p`. */
const DISPLAY_NAME = `COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p."firstName", p."lastName")), ''), u."email")`;

const TIMELINE_DAYS = 30;

type CountRow = { key: string; count: string | number };
type MoneyRow = { currency: string; amount: string | null; count: string | number };

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toCountMap(rows: CountRow[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) map[row.key] = toInt(row.count);
  return map;
}

function toMoney(rows: MoneyRow[]): CurrencyAmount[] {
  // CHAR(3) comes back space-padded.
  return rows.map((row) => ({
    currency: row.currency.trim().toUpperCase(),
    amount: row.amount ?? '0',
    count: toInt(row.count),
  }));
}

function sum(map: Record<string, number>, keys: string[]): number {
  return keys.reduce((total, key) => total + (map[key] ?? 0), 0);
}

/**
 * Read-only aggregates for the admin console. Everything here is a query over
 * existing tables; nothing mutates, so the service needs no transactions.
 */
@Injectable()
export class AdminService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async overview(): Promise<AdminOverview> {
    const [
      usersByRole,
      userGrowth,
      campaignsByStatus,
      newCampaigns,
      donationsByStatus,
      donors,
      raised,
      withdrawalsByStatus,
      withdrawalsPending,
      withdrawalsPaid,
      kycByStatus,
      timeline,
      topCampaigns,
      categories,
      activity,
      unreadMessages,
    ] = await Promise.all([
      this.db.query(`SELECT "role"::text AS key, COUNT(*) AS count FROM "users" GROUP BY 1`) as Promise<CountRow[]>,
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '7 days')  AS week,
                COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '30 days') AS month
           FROM "users"`,
      ) as Promise<Array<{ week: string; month: string }>>,
      this.db.query(`SELECT "status"::text AS key, COUNT(*) AS count FROM "campaigns" GROUP BY 1`) as Promise<CountRow[]>,
      this.db.query(
        `SELECT COUNT(*) AS count FROM "campaigns" WHERE "createdAt" >= now() - interval '7 days'`,
      ) as Promise<Array<{ count: string }>>,
      this.db.query(`SELECT "status"::text AS key, COUNT(*) AS count FROM "payment_intents" GROUP BY 1`) as Promise<CountRow[]>,
      this.db.query(
        `SELECT COUNT(DISTINCT COALESCE("donorId"::text, 'guest:' || "id"::text)) AS count
           FROM "payment_intents" WHERE "status" = $1`,
        [TransactionStatus.SUCCESS],
      ) as Promise<Array<{ count: string }>>,
      this.moneyByCurrency(
        `SELECT "currency", SUM("amount")::text AS amount, COUNT(*) AS count
           FROM "payment_intents" WHERE "status" = $1 GROUP BY "currency" ORDER BY 3 DESC`,
        [TransactionStatus.SUCCESS],
      ),
      this.db.query(`SELECT "status"::text AS key, COUNT(*) AS count FROM "withdrawal_requests" GROUP BY 1`) as Promise<CountRow[]>,
      this.moneyByCurrency(
        `SELECT "currency", SUM("grossAmount")::text AS amount, COUNT(*) AS count
           FROM "withdrawal_requests" WHERE "status"::text = ANY($1::text[])
          GROUP BY "currency" ORDER BY 3 DESC`,
        [WITHDRAWALS_IN_FLIGHT],
      ),
      this.moneyByCurrency(
        `SELECT "currency", SUM("netAmount")::text AS amount, COUNT(*) AS count
           FROM "withdrawal_requests" WHERE "status" = $1
          GROUP BY "currency" ORDER BY 3 DESC`,
        [WithdrawalStatus.COMPLETED],
      ),
      this.db.query(`SELECT "status"::text AS key, COUNT(*) AS count FROM "kyc_profiles" GROUP BY 1`) as Promise<CountRow[]>,
      this.timeline(),
      this.topCampaigns(),
      this.categories(),
      this.activity(),
      this.db.query(
        `SELECT COUNT(*) AS count FROM "contact_messages" WHERE "isRead" = false`,
      ) as Promise<Array<{ count: string }>>,
    ]);

    const roles = toCountMap(usersByRole);
    const campaignStatuses = toCountMap(campaignsByStatus);
    const donationStatuses = toCountMap(donationsByStatus);
    const withdrawalStatuses = toCountMap(withdrawalsByStatus);
    const kycStatuses = toCountMap(kycByStatus);

    return {
      generatedAt: new Date().toISOString(),
      users: {
        total: Object.values(roles).reduce((a, b) => a + b, 0),
        newLast7Days: toInt(userGrowth[0]?.week),
        newLast30Days: toInt(userGrowth[0]?.month),
        byRole: roles,
      },
      campaigns: {
        total: Object.values(campaignStatuses).reduce((a, b) => a + b, 0),
        newLast7Days: toInt(newCampaigns[0]?.count),
        byStatus: campaignStatuses,
      },
      donations: {
        settled: donationStatuses[TransactionStatus.SUCCESS] ?? 0,
        pending: sum(donationStatuses, [TransactionStatus.PENDING, TransactionStatus.PROCESSING]),
        failed: sum(donationStatuses, [TransactionStatus.FAILED, TransactionStatus.REVERSED]),
        donors: toInt(donors[0]?.count),
        raisedByCurrency: raised,
      },
      withdrawals: {
        byStatus: withdrawalStatuses,
        pendingByCurrency: withdrawalsPending,
        paidOutByCurrency: withdrawalsPaid,
      },
      kyc: { byStatus: kycStatuses },
      queues: {
        campaignsAwaitingReview: sum(campaignStatuses, AWAITING_REVIEW),
        kycAwaitingReview: kycStatuses[KycStatus.SUBMITTED] ?? 0,
        withdrawalsAwaitingReview: sum(withdrawalStatuses, WITHDRAWALS_AWAITING),
        unreadMessages: toInt(unreadMessages[0]?.count),
      },
      timeline,
      topCampaigns,
      categories,
      activity,
    };
  }

  async users(query: AdminUsersQueryDto): Promise<PaginatedAdminUsers> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (query.role) {
      params.push(query.role);
      where.push(`u."role"::text = $${params.length}`);
    }
    if (query.search) {
      // Escape LIKE wildcards so a search for "50%" matches the literal text.
      params.push(`%${query.search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
      const p = `$${params.length}`;
      where.push(
        `(u."email" ILIKE ${p} OR u."phoneNumber" ILIKE ${p}
          OR CONCAT_WS(' ', pr."firstName", pr."lastName") ILIKE ${p})`,
      );
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRows: Array<{ count: string }> = await this.db.query(
      `SELECT COUNT(*) AS count
         FROM "users" u LEFT JOIN "user_profiles" pr ON pr."userId" = u."id"
        ${whereSql}`,
      params,
    );

    const offset = (query.page - 1) * query.limit;
    const rows: Array<{
      id: string;
      email: string;
      phoneNumber: string | null;
      role: string;
      firstName: string | null;
      lastName: string | null;
      countryCode: string | null;
      createdAt: Date;
      kycStatus: string | null;
      campaigns: string;
      liveCampaigns: string;
      donationsGiven: string;
      raised: Array<{ currency: string; amount: string; count: number }> | null;
    }> = await this.db.query(
      `SELECT u."id", u."email", u."phoneNumber", u."role"::text AS role,
              pr."firstName", pr."lastName", pr."countryCode", u."createdAt",
              k."status"::text AS "kycStatus",
              (SELECT COUNT(*) FROM "campaigns" c WHERE c."creatorId" = u."id") AS campaigns,
              (SELECT COUNT(*) FROM "campaigns" c
                WHERE c."creatorId" = u."id" AND c."status" = '${CampaignStatus.LIVE}') AS "liveCampaigns",
              (SELECT COUNT(*) FROM "payment_intents" pi
                WHERE pi."donorId" = u."id" AND pi."status" = '${TransactionStatus.SUCCESS}') AS "donationsGiven",
              (SELECT json_agg(json_build_object('currency', r."currency", 'amount', r.total::text, 'count', r.n))
                 FROM (SELECT pi."currency", SUM(pi."amount") AS total, COUNT(*) AS n
                         FROM "payment_intents" pi
                         JOIN "campaigns" c ON c."id" = pi."campaignId"
                        WHERE c."creatorId" = u."id" AND pi."status" = '${TransactionStatus.SUCCESS}'
                        GROUP BY pi."currency") r) AS raised
         FROM "users" u
         LEFT JOIN "user_profiles" pr ON pr."userId" = u."id"
         LEFT JOIN "kyc_profiles" k ON k."userId" = u."id"
        ${whereSql}
        ORDER BY u."createdAt" DESC
        LIMIT ${query.limit} OFFSET ${offset}`,
      params,
    );

    const roleCounts: CountRow[] = await this.db.query(
      `SELECT "role"::text AS key, COUNT(*) AS count FROM "users" GROUP BY 1`,
    );

    const data: AdminUserRow[] = rows.map((row) => ({
      id: row.id,
      email: row.email,
      phoneNumber: row.phoneNumber,
      role: row.role,
      firstName: row.firstName,
      lastName: row.lastName,
      countryCode: row.countryCode?.trim() ?? null,
      createdAt: new Date(row.createdAt).toISOString(),
      kycStatus: row.kycStatus,
      campaigns: toInt(row.campaigns),
      liveCampaigns: toInt(row.liveCampaigns),
      donationsGiven: toInt(row.donationsGiven),
      raisedByCurrency: (row.raised ?? []).map((r) => ({
        currency: r.currency.trim().toUpperCase(),
        amount: r.amount,
        count: toInt(r.count),
      })),
    }));

    return {
      data,
      total: toInt(totalRows[0]?.count),
      page: query.page,
      limit: query.limit,
      roleCounts: toCountMap(roleCounts),
    };
  }

  private async moneyByCurrency(sql: string, params: unknown[]): Promise<CurrencyAmount[]> {
    const rows: MoneyRow[] = await this.db.query(sql, params);
    return toMoney(rows);
  }

  /** One row per UTC day for the last 30 days, zero-filled. */
  private async timeline(): Promise<TimelinePoint[]> {
    const rows: Array<{ date: string; signups: string; campaigns: string; donations: string }> =
      await this.db.query(
        `WITH days AS (
           SELECT generate_series(
                    (now() AT TIME ZONE 'UTC')::date - ${TIMELINE_DAYS - 1},
                    (now() AT TIME ZONE 'UTC')::date,
                    interval '1 day')::date AS day
         ),
         s AS (SELECT ("createdAt" AT TIME ZONE 'UTC')::date AS day, COUNT(*) AS n
                 FROM "users" GROUP BY 1),
         c AS (SELECT ("createdAt" AT TIME ZONE 'UTC')::date AS day, COUNT(*) AS n
                 FROM "campaigns" GROUP BY 1),
         d AS (SELECT ("createdAt" AT TIME ZONE 'UTC')::date AS day, COUNT(*) AS n
                 FROM "payment_intents" WHERE "status" = $1 GROUP BY 1)
         SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
                COALESCE(s.n, 0) AS signups,
                COALESCE(c.n, 0) AS campaigns,
                COALESCE(d.n, 0) AS donations
           FROM days
           LEFT JOIN s ON s.day = days.day
           LEFT JOIN c ON c.day = days.day
           LEFT JOIN d ON d.day = days.day
          ORDER BY days.day`,
        [TransactionStatus.SUCCESS],
      );
    return rows.map((row) => ({
      date: row.date,
      signups: toInt(row.signups),
      campaigns: toInt(row.campaigns),
      donations: toInt(row.donations),
    }));
  }

  private async topCampaigns(): Promise<TopCampaign[]> {
    const rows: Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
      currency: string;
      targetAmount: string;
      raised: string;
      donors: string;
      creatorName: string;
      coverImageUrl: string | null;
    }> = await this.db.query(
      `SELECT c."id", c."title", c."slug", c."status"::text AS status, c."currency",
              c."targetAmount"::text AS "targetAmount", c."coverImageUrl",
              COALESCE(SUM(pi."amount"), 0)::text AS raised,
              COUNT(DISTINCT COALESCE(pi."donorId"::text, 'guest:' || pi."id"::text))
                FILTER (WHERE pi."id" IS NOT NULL) AS donors,
              ${DISPLAY_NAME} AS "creatorName"
         FROM "campaigns" c
         JOIN "users" u ON u."id" = c."creatorId"
         LEFT JOIN "user_profiles" p ON p."userId" = u."id"
         LEFT JOIN "payment_intents" pi ON pi."campaignId" = c."id" AND pi."status" = $1
        GROUP BY c."id", u."id", p."userId"
        ORDER BY SUM(pi."amount") DESC NULLS LAST, c."createdAt" DESC
        LIMIT 6`,
      [TransactionStatus.SUCCESS],
    );
    return rows.map((row) => ({
      ...row,
      currency: row.currency.trim().toUpperCase(),
      donors: toInt(row.donors),
    }));
  }

  private async categories(): Promise<CategoryBreakdown[]> {
    const rows: Array<{ name: string; slug: string; campaigns: string; live: string }> =
      await this.db.query(
        `SELECT cat."name", cat."slug",
                COUNT(c."id") AS campaigns,
                COUNT(c."id") FILTER (WHERE c."status" = $1) AS live
           FROM "campaign_categories" cat
           LEFT JOIN "campaigns" c ON c."categoryId" = cat."id"
          GROUP BY cat."id"
          ORDER BY COUNT(c."id") DESC, cat."name"`,
        [CampaignStatus.LIVE],
      );
    return rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      campaigns: toInt(row.campaigns),
      live: toInt(row.live),
    }));
  }

  /** The latest events of every kind, newest first. */
  private async activity(): Promise<ActivityItem[]> {
    const rows: Array<{
      kind: ActivityItem['kind'];
      at: Date;
      actor: string;
      subject: string | null;
      amount: string | null;
      currency: string | null;
      status: string | null;
      slug: string | null;
    }> = await this.db.query(
      `SELECT * FROM (
         SELECT 'signup' AS kind, u."createdAt" AS at, ${DISPLAY_NAME} AS actor,
                u."role"::text AS subject, NULL::text AS amount, NULL::text AS currency,
                NULL::text AS status, NULL::text AS slug
           FROM "users" u LEFT JOIN "user_profiles" p ON p."userId" = u."id"
         UNION ALL
         SELECT 'campaign_created', c."createdAt", ${DISPLAY_NAME},
                c."title", c."targetAmount"::text, c."currency"::text, c."status"::text, c."slug"
           FROM "campaigns" c
           JOIN "users" u ON u."id" = c."creatorId"
           LEFT JOIN "user_profiles" p ON p."userId" = u."id"
         UNION ALL
         SELECT 'donation', pi."createdAt",
                -- Staff see who gave; anonymity only hides donors from the public.
                COALESCE(
                  CASE WHEN u."id" IS NOT NULL THEN ${DISPLAY_NAME} END,
                  NULLIF(TRIM(pi."donorName"), ''),
                  'Guest donor'
                ) || CASE WHEN pi."isAnonymous" THEN ' (anonymous)' ELSE '' END,
                c."title", pi."amount"::text, pi."currency"::text, pi."status"::text, c."slug"
           FROM "payment_intents" pi
           JOIN "campaigns" c ON c."id" = pi."campaignId"
           LEFT JOIN "users" u ON u."id" = pi."donorId"
           LEFT JOIN "user_profiles" p ON p."userId" = u."id"
         UNION ALL
         SELECT 'withdrawal_requested', w."createdAt", ${DISPLAY_NAME},
                c."title", w."grossAmount"::text, w."currency"::text, w."status"::text, c."slug"
           FROM "withdrawal_requests" w
           JOIN "campaigns" c ON c."id" = w."campaignId"
           JOIN "users" u ON u."id" = w."userId"
           LEFT JOIN "user_profiles" p ON p."userId" = u."id"
         UNION ALL
         SELECT 'kyc_submitted', k."updatedAt", ${DISPLAY_NAME},
                NULL::text, NULL::text, NULL::text, k."status"::text, NULL::text
           FROM "kyc_profiles" k
           JOIN "users" u ON u."id" = k."userId"
           LEFT JOIN "user_profiles" p ON p."userId" = u."id"
          WHERE k."status" <> $1
       ) events
       ORDER BY at DESC
       LIMIT 20`,
      [KycStatus.NOT_STARTED],
    );
    return rows.map((row) => ({
      ...row,
      at: new Date(row.at).toISOString(),
      currency: row.currency?.trim().toUpperCase() ?? null,
    }));
  }
}
