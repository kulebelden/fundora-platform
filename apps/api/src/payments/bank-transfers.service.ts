import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { TransactionStatus, UserRole } from '../common/enums';
import { LedgerService } from '../ledger/ledger.service';
import { MailService } from '../mail/mail.service';
import { User } from '../modules/identity/entities/user.entity';
import { BankTransferConfirmation } from '../modules/payments/entities/bank-transfer-confirmation.entity';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';
import { ConfirmBankTransferDto } from './dto/confirm-bank-transfer.dto';

/** Bank-wire intents carry this reference prefix (see BankWirePaymentAdapter). */
const BANK_WIRE_PREFIX = 'bank_wire-';

export interface PendingBankTransferView {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  createdAt: string;
  donorName: string | null;
  donorEmail: string | null;
  campaign: { id: string; title: string; slug: string };
}

export interface BankTransferConfirmationView {
  id: string;
  paymentIntentId: string;
  reference: string;
  bankReference: string;
  amountReceived: string;
  currency: string;
  receivedOn: string;
  note: string | null;
  confirmedByEmail: string;
  confirmedAt: string;
  donorName: string | null;
  campaign: { title: string; slug: string };
}

/**
 * Manual reconciliation for bank transfers: a finance officer or admin matches a
 * transfer on the bank statement to a pending donation and marks it received. That
 * posts the same ledger entries a provider webhook would, records who confirmed it
 * against which bank reference, and emails a copy to every super admin.
 */
@Injectable()
export class BankTransfersService {
  private readonly logger = new Logger(BankTransfersService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly ledger: LedgerService,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
  ) {}

  async pending(): Promise<PendingBankTransferView[]> {
    const rows: Array<Record<string, unknown>> = await this.dataSource.query(
      `SELECT pi."id", pi."providerReference" AS reference, pi."amount"::text AS amount, pi."currency",
              pi."createdAt", pi."donorName", pi."donorEmail",
              c."id" AS "campaignId", c."title" AS "campaignTitle", c."slug" AS "campaignSlug"
         FROM "payment_intents" pi
         JOIN "campaigns" c ON c."id" = pi."campaignId"
        WHERE pi."status" = $1 AND pi."providerReference" LIKE $2
        ORDER BY pi."createdAt" ASC
        LIMIT 500`,
      [TransactionStatus.PENDING, `${BANK_WIRE_PREFIX}%`],
    );
    return rows.map((row) => ({
      id: String(row.id),
      reference: String(row.reference),
      amount: String(row.amount),
      currency: String(row.currency),
      createdAt: new Date(row.createdAt as string).toISOString(),
      donorName: (row.donorName as string | null) ?? null,
      donorEmail: (row.donorEmail as string | null) ?? null,
      campaign: { id: String(row.campaignId), title: String(row.campaignTitle), slug: String(row.campaignSlug) },
    }));
  }

  async confirmations(): Promise<BankTransferConfirmationView[]> {
    const rows: Array<Record<string, unknown>> = await this.dataSource.query(
      `SELECT b."id", b."paymentIntentId", pi."providerReference" AS reference, b."bankReference",
              b."amountReceived"::text AS "amountReceived", b."currency", b."receivedOn"::text AS "receivedOn",
              b."note", b."confirmedByEmail", b."createdAt", pi."donorName",
              c."title" AS "campaignTitle", c."slug" AS "campaignSlug"
         FROM "bank_transfer_confirmations" b
         JOIN "payment_intents" pi ON pi."id" = b."paymentIntentId"
         JOIN "campaigns" c ON c."id" = pi."campaignId"
        ORDER BY b."createdAt" DESC
        LIMIT 1000`,
    );
    return rows.map((row) => ({
      id: String(row.id),
      paymentIntentId: String(row.paymentIntentId),
      reference: String(row.reference),
      bankReference: String(row.bankReference),
      amountReceived: String(row.amountReceived),
      currency: String(row.currency),
      receivedOn: String(row.receivedOn),
      note: (row.note as string | null) ?? null,
      confirmedByEmail: String(row.confirmedByEmail),
      confirmedAt: new Date(row.createdAt as string).toISOString(),
      donorName: (row.donorName as string | null) ?? null,
      campaign: { title: String(row.campaignTitle), slug: String(row.campaignSlug) },
    }));
  }

  async confirm(
    paymentIntentId: string,
    staffId: string,
    dto: ConfirmBankTransferDto,
  ): Promise<BankTransferConfirmationView> {
    // Step-up check: the staff member proves it is them, not just their session.
    const staff = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: staffId })
      .getOne();
    if (!staff || !(await this.passwords.verifyPassword(staff.passwordHash, dto.password))) {
      throw new UnauthorizedException('Your password is incorrect.');
    }

    const receivedOn = new Date(`${dto.receivedOn}T00:00:00Z`);
    if (receivedOn.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      throw new BadRequestException('The received date cannot be in the future.');
    }

    const confirmation = await this.dataSource.transaction(async (manager) => {
      const intent = await manager
        .getRepository(PaymentIntent)
        .createQueryBuilder('intent')
        .leftJoinAndSelect('intent.campaign', 'campaign')
        .setLock('pessimistic_write', undefined, ['intent'])
        .where('intent.id = :id', { id: paymentIntentId })
        .getOne();

      if (!intent || !intent.providerReference?.startsWith(BANK_WIRE_PREFIX)) {
        throw new NotFoundException('Bank transfer not found');
      }
      if (intent.status !== TransactionStatus.PENDING) {
        throw new ConflictException('This transfer has already been settled.');
      }
      // Nobody confirms money into their own campaign.
      if (intent.campaign?.creatorId === staffId) {
        throw new ForbiddenException('You cannot confirm a transfer to a campaign you run. Ask another admin.');
      }
      if (!sameAmount(dto.amountReceived, intent.amount)) {
        throw new BadRequestException(
          `The amount received must match the pledge of ${Number(intent.amount).toFixed(2)} ${intent.currency}. ` +
            'For a different amount, contact the donor before confirming.',
        );
      }

      const bankReferenceTaken = await manager
        .getRepository(BankTransferConfirmation)
        .findOne({ where: { bankReference: dto.bankReference } });
      if (bankReferenceTaken) {
        throw new ConflictException('This bank reference has already been used to confirm another transfer.');
      }

      await manager.getRepository(PaymentIntent).update(intent.id, { status: TransactionStatus.SUCCESS });

      const saved = await manager.getRepository(BankTransferConfirmation).save(
        manager.getRepository(BankTransferConfirmation).create({
          paymentIntentId: intent.id,
          bankReference: dto.bankReference,
          amountReceived: dto.amountReceived,
          currency: intent.currency,
          receivedOn: dto.receivedOn,
          note: dto.note ?? null,
          confirmedBy: staff.id,
          confirmedByEmail: staff.email,
        }),
      );

      // Same posting a provider webhook makes; the event id also blocks any replay.
      await this.ledger.postDonationLedger(intent.id, manager, {
        providerEventId: `manual-bank:${dto.bankReference}`,
        providerName: 'bank_wire_manual',
        payload: {
          confirmationId: saved.id,
          bankReference: dto.bankReference,
          amountReceived: dto.amountReceived,
          receivedOn: dto.receivedOn,
          confirmedBy: staff.email,
        },
      });

      return { saved, intent };
    });

    const view: BankTransferConfirmationView = {
      id: confirmation.saved.id,
      paymentIntentId: confirmation.intent.id,
      reference: confirmation.intent.providerReference ?? confirmation.intent.id,
      bankReference: confirmation.saved.bankReference,
      amountReceived: dto.amountReceived,
      currency: confirmation.intent.currency,
      receivedOn: dto.receivedOn,
      note: dto.note ?? null,
      confirmedByEmail: staff.email,
      confirmedAt: new Date().toISOString(),
      donorName: confirmation.intent.donorName,
      campaign: { title: confirmation.intent.campaign.title, slug: confirmation.intent.campaign.slug },
    };

    this.logger.log(
      `Bank transfer ${view.reference} confirmed by ${staff.email} against ${view.bankReference}`,
    );
    await this.sendCopyToSuperAdmins(view);
    return view;
  }

  /** Every super admin gets a copy of every confirmation, whoever made it. */
  private async sendCopyToSuperAdmins(view: BankTransferConfirmationView): Promise<void> {
    const superAdmins = await this.dataSource
      .getRepository(User)
      .find({ where: { role: UserRole.SUPER_ADMIN }, select: { email: true } });

    const amount = `${Number(view.amountReceived).toFixed(2)} ${view.currency}`;
    const lines = [
      `Donation reference: ${view.reference}`,
      `Bank reference: ${view.bankReference}`,
      `Amount received: ${amount}`,
      `Received on: ${view.receivedOn}`,
      `Campaign: ${view.campaign.title}`,
      `Donor: ${view.donorName ?? 'Not given'}`,
      `Confirmed by: ${view.confirmedByEmail}`,
      `Confirmed at: ${view.confirmedAt}`,
      ...(view.note ? [`Note: ${view.note}`] : []),
    ];
    const html = `<!doctype html>
<html><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border-radius:16px;padding:28px">
      <p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:#002b66">HopeNest</p>
      <p style="margin:16px 0;font-size:15px">A bank transfer was marked as received and credited to its campaign.</p>
      <table style="font-size:14px;line-height:1.6;border-collapse:collapse">
        ${lines
          .map((line) => {
            const [label, ...rest] = line.split(': ');
            return `<tr><td style="padding:2px 12px 2px 0;color:#5b6b82;vertical-align:top">${escapeHtml(label)}</td><td style="padding:2px 0;font-weight:bold">${escapeHtml(rest.join(': '))}</td></tr>`;
          })
          .join('')}
      </table>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5b6b82;text-align:center">Your copy as a super admin. If this confirmation looks wrong, review it in the admin console straight away.</p>
  </div>
</body></html>`;

    await Promise.all(
      superAdmins.map((admin) =>
        this.mail
          .send({
            to: admin.email,
            subject: `Bank transfer confirmed: ${amount} (${view.bankReference})`,
            text: `A bank transfer was marked as received and credited to its campaign.\n\n${lines.join('\n')}\n\nYour copy as a super admin. If this confirmation looks wrong, review it in the admin console straight away.`,
            html,
          })
          .catch((error: unknown) =>
            this.logger.error(`Confirmation copy to ${admin.email} not sent: ${String(error)}`),
          ),
      ),
    );
  }
}

/** Compares decimal strings exactly, without floating point. */
function sameAmount(entered: string, stored: string): boolean {
  const toMinor = (value: string) => {
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 10_000n + BigInt((fraction + '0000').slice(0, 4));
  };
  return toMinor(entered) === toMinor(stored);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
