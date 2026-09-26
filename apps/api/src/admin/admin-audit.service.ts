import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TransactionStatus } from '../common/enums';
import {
  ContactMessageView,
  DonationAuditRow,
  PaginatedContactMessages,
  PaginatedDonationAudit,
  WithdrawalAuditRow,
} from './admin.types';
import {
  AdminDonationsQueryDto,
  AdminMessagesQueryDto,
  AdminWithdrawalsQueryDto,
} from './dto/admin-audit-query.dto';

const NAME = (alias: string, profile: string) =>
  `COALESCE(NULLIF(TRIM(CONCAT_WS(' ', ${profile}."firstName", ${profile}."lastName")), ''), ${alias}."email")`;

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function iso(value: Date | string | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** Escape LIKE wildcards so user input matches literally. */
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * Staff reads over the contact inbox, the donation ledger and withdrawals.
 * Donor details here include what the donor typed at checkout; anonymity only
 * hides a donor from the public, never from finance staff.
 */
@Injectable()
export class AdminAuditService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  /* ---------------------------------------------------------------- inbox */

  async unreadMessages(): Promise<number> {
    const rows: Array<{ count: string }> = await this.db.query(
      `SELECT COUNT(*) AS count FROM "contact_messages" WHERE "isRead" = false`,
    );
    return toInt(rows[0]?.count);
  }

  async messages(query: AdminMessagesQueryDto): Promise<PaginatedContactMessages> {
    const where =
      query.filter === 'unread' ? `WHERE m."isRead" = false` : query.filter === 'read' ? `WHERE m."isRead" = true` : '';
    const offset = (query.page - 1) * query.limit;

    const [rows, totals] = await Promise.all([
      this.db.query(
        `SELECT m.*, u."role"::text AS "accountRole"
           FROM "contact_messages" m
           LEFT JOIN "users" u ON u."id" = m."userId"
           ${where}
          ORDER BY m."createdAt" DESC
          LIMIT ${query.limit} OFFSET ${offset}`,
      ) as Promise<Array<Record<string, unknown>>>,
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE true) AS all_count,
                COUNT(*) FILTER (WHERE "isRead" = false) AS unread,
                COUNT(*) FILTER (WHERE "isRead" = true) AS read
           FROM "contact_messages"`,
      ) as Promise<Array<{ all_count: string; unread: string; read: string }>>,
    ]);

    const t = totals[0];
    const total =
      query.filter === 'unread' ? toInt(t?.unread) : query.filter === 'read' ? toInt(t?.read) : toInt(t?.all_count);

    return {
      data: rows.map((row) => this.toMessage(row)),
      total,
      unread: toInt(t?.unread),
      page: query.page,
      limit: query.limit,
    };
  }

  async markMessage(id: string, read: boolean, staffId: string): Promise<ContactMessageView> {
    const rows: Array<Record<string, unknown>> = await this.db.query(
      `UPDATE "contact_messages"
          SET "isRead" = $2,
              "readAt" = CASE WHEN $2 THEN now() ELSE NULL END,
              "readBy" = CASE WHEN $2 THEN $3::uuid ELSE NULL END
        WHERE "id" = $1
        RETURNING *`,
      [id, read, staffId],
    );
    // node-postgres returns [rows, count] for UPDATE ... RETURNING through TypeORM.
    const row = (Array.isArray(rows[0]) ? (rows[0] as Array<Record<string, unknown>>)[0] : rows[0]) as
      | Record<string, unknown>
      | undefined;
    if (!row) throw new NotFoundException('Message not found');
    return this.toMessage({ ...row, accountRole: null });
  }

  async markAllRead(staffId: string): Promise<{ updated: number }> {
    const result: unknown = await this.db.query(
      `UPDATE "contact_messages" SET "isRead" = true, "readAt" = now(), "readBy" = $1::uuid
        WHERE "isRead" = false`,
      [staffId],
    );
    const count = Array.isArray(result) ? toInt(result[1]) : 0;
    return { updated: count };
  }

  private toMessage(row: Record<string, unknown>): ContactMessageView {
    return {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      phone: (row.phone as string | null) ?? null,
      topic: String(row.topic),
      subject: String(row.subject),
      message: String(row.message),
      campaignLink: (row.campaignLink as string | null) ?? null,
      userId: (row.userId as string | null) ?? null,
      accountRole: (row.accountRole as string | null) ?? null,
      isRead: Boolean(row.isRead),
      readAt: iso(row.readAt as Date | null),
      createdAt: iso(row.createdAt as Date) ?? new Date().toISOString(),
    };
  }

  /* ------------------------------------------------------------ donations */

  async donations(query: AdminDonationsQueryDto): Promise<PaginatedDonationAudit> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.status) {
      params.push(query.status);
      where.push(`pi."status"::text = $${params.length}`);
    }
    if (query.channel) {
      params.push(query.channel);
      where.push(`pi."channel"::text = $${params.length}`);
    }
    if (query.search) {
      params.push(likePattern(query.search));
      const p = `$${params.length}`;
      where.push(`(pi."donorName" ILIKE ${p} OR pi."donorEmail" ILIKE ${p} OR pi."donorPhone" ILIKE ${p}
                   OR pi."providerReference" ILIKE ${p} OR c."title" ILIKE ${p}
                   OR u."email" ILIKE ${p} OR CONCAT_WS(' ', pr."firstName", pr."lastName") ILIKE ${p})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const from = `FROM "payment_intents" pi
                  JOIN "campaigns" c ON c."id" = pi."campaignId"
                  LEFT JOIN "users" u ON u."id" = pi."donorId"
                  LEFT JOIN "user_profiles" pr ON pr."userId" = u."id"`;
    const offset = (query.page - 1) * query.limit;

    const [rows, count, byStatus, settled] = await Promise.all([
      this.db.query(
        `SELECT pi."id", pi."createdAt", pi."updatedAt", pi."status"::text AS status,
                pi."channel"::text AS channel, pi."amount"::text AS amount, pi."currency",
                pi."providerReference", pi."isAnonymous",
                pi."donorName", pi."donorEmail", pi."donorPhone", pi."donorMessage",
                u."id" AS "accountId", u."email" AS "accountEmail", u."phoneNumber" AS "accountPhone",
                CASE WHEN u."id" IS NULL THEN NULL ELSE ${NAME('u', 'pr')} END AS "accountName",
                c."id" AS "campaignId", c."title" AS "campaignTitle", c."slug" AS "campaignSlug",
                c."currency" AS "campaignCurrency"
           ${from}
           ${whereSql}
          ORDER BY pi."createdAt" DESC
          LIMIT ${query.limit} OFFSET ${offset}`,
        params,
      ) as Promise<Array<Record<string, unknown>>>,
      this.db.query(`SELECT COUNT(*) AS count ${from} ${whereSql}`, params) as Promise<Array<{ count: string }>>,
      this.db.query(
        `SELECT "status"::text AS key, COUNT(*) AS count FROM "payment_intents" GROUP BY 1`,
      ) as Promise<Array<{ key: string; count: string }>>,
      this.db.query(
        `SELECT "currency", SUM("amount")::text AS amount, COUNT(*) AS count
           FROM "payment_intents" WHERE "status" = $1 GROUP BY "currency" ORDER BY 3 DESC`,
        [TransactionStatus.SUCCESS],
      ) as Promise<Array<{ currency: string; amount: string; count: string }>>,
    ]);

    const data: DonationAuditRow[] = rows.map((row) => ({
      id: String(row.id),
      createdAt: iso(row.createdAt as Date) ?? '',
      updatedAt: iso(row.updatedAt as Date) ?? '',
      status: String(row.status),
      channel: String(row.channel),
      amount: String(row.amount),
      currency: String(row.currency).trim().toUpperCase(),
      providerReference: (row.providerReference as string | null) ?? null,
      isAnonymous: Boolean(row.isAnonymous),
      donorName: (row.donorName as string | null) ?? null,
      donorEmail: (row.donorEmail as string | null) ?? null,
      donorPhone: (row.donorPhone as string | null) ?? null,
      donorMessage: (row.donorMessage as string | null) ?? null,
      account: row.accountId
        ? {
            id: String(row.accountId),
            name: String(row.accountName),
            email: String(row.accountEmail),
            phoneNumber: (row.accountPhone as string | null) ?? null,
          }
        : null,
      campaign: {
        id: String(row.campaignId),
        title: String(row.campaignTitle),
        slug: String(row.campaignSlug),
        currency: String(row.campaignCurrency).trim().toUpperCase(),
      },
    }));

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) statusMap[row.key] = toInt(row.count);

    return {
      data,
      total: toInt(count[0]?.count),
      page: query.page,
      limit: query.limit,
      byStatus: statusMap,
      settledByCurrency: settled.map((row) => ({
        currency: row.currency.trim().toUpperCase(),
        amount: row.amount ?? '0',
        count: toInt(row.count),
      })),
    };
  }

  /* ---------------------------------------------------------- withdrawals */

  async withdrawals(query: AdminWithdrawalsQueryDto): Promise<{
    data: WithdrawalAuditRow[];
    total: number;
    page: number;
    limit: number;
    byStatus: Record<string, number>;
  }> {
    const params: unknown[] = [];
    let whereSql = '';
    if (query.status) {
      params.push(query.status);
      whereSql = `WHERE w."status"::text = $1`;
    }
    const offset = (query.page - 1) * query.limit;

    const [rows, count, byStatus] = await Promise.all([
      this.db.query(
        `SELECT w."id", w."status"::text AS status, w."createdAt", w."reviewedAt", w."rejectionReason",
                w."payoutReference", w."grossAmount"::text AS "grossAmount",
                w."serviceFee"::text AS "serviceFee", w."netAmount"::text AS "netAmount",
                w."currency", w."bankAccountDetails",
                c."id" AS "campaignId", c."title" AS "campaignTitle", c."slug" AS "campaignSlug",
                u."id" AS "userId", u."email", u."phoneNumber", ${NAME('u', 'pr')} AS "organiserName",
                k."status"::text AS "kycStatus"
           FROM "withdrawal_requests" w
           JOIN "campaigns" c ON c."id" = w."campaignId"
           JOIN "users" u ON u."id" = w."userId"
           LEFT JOIN "user_profiles" pr ON pr."userId" = u."id"
           LEFT JOIN "kyc_profiles" k ON k."userId" = u."id"
           ${whereSql}
          ORDER BY w."createdAt" DESC
          LIMIT ${query.limit} OFFSET ${offset}`,
        params,
      ) as Promise<Array<Record<string, unknown>>>,
      this.db.query(`SELECT COUNT(*) AS count FROM "withdrawal_requests" w ${whereSql}`, params) as Promise<
        Array<{ count: string }>
      >,
      this.db.query(
        `SELECT "status"::text AS key, COUNT(*) AS count FROM "withdrawal_requests" GROUP BY 1`,
      ) as Promise<Array<{ key: string; count: string }>>,
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) statusMap[row.key] = toInt(row.count);

    return {
      data: rows.map((row) => ({
        id: String(row.id),
        status: String(row.status),
        createdAt: iso(row.createdAt as Date) ?? '',
        reviewedAt: iso(row.reviewedAt as Date | null),
        rejectionReason: (row.rejectionReason as string | null) ?? null,
        payoutReference: (row.payoutReference as string | null) ?? null,
        grossAmount: String(row.grossAmount),
        serviceFee: String(row.serviceFee),
        netAmount: String(row.netAmount),
        currency: String(row.currency).trim().toUpperCase(),
        bankAccountDetails: (row.bankAccountDetails as Record<string, unknown>) ?? {},
        campaign: {
          id: String(row.campaignId),
          title: String(row.campaignTitle),
          slug: String(row.campaignSlug),
        },
        organiser: {
          id: String(row.userId),
          name: String(row.organiserName),
          email: String(row.email),
          phoneNumber: (row.phoneNumber as string | null) ?? null,
          kycStatus: (row.kycStatus as string | null) ?? null,
        },
      })),
      total: toInt(count[0]?.count),
      page: query.page,
      limit: query.limit,
      byStatus: statusMap,
    };
  }
}
