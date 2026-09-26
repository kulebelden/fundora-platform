import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CampaignStatus, PaymentChannel, TransactionStatus } from '../common/enums';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';
import { ProcessedWebhook } from '../modules/payments/entities/processed-webhook.entity';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { BankWirePaymentAdapter } from './adapters/bank-wire.adapter';
import { IPaymentAdapter } from './adapters/payment-adapter.interface';
import { CreateDonationDto, DonationProvider } from './dto/create-donation.dto';
import { LedgerService } from '../ledger/ledger.service';
import { CARD_PROCESSING_FEE_RATE, PLATFORM_FEE_RATE } from '../ledger/fees';

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

export interface WebhookResult {
  statusCode: number;
  message: string;
}

export interface DonationFeedItem {
  amount: number;
  currency: string;
  channel: PaymentChannel;
  providerReference: string | null;
  isAnonymous: boolean;
  /**
   * Public display name. Always 'Anonymous' when the donor asked to be anonymous;
   * the real name is never sent to the client in that case. Guests who left no
   * profile show as 'Supporter'.
   */
  donorName: string;
  createdAt: Date;
}

interface AdapterEntry {
  provider: string;
  channel: PaymentChannel;
  instance: IPaymentAdapter;
}

@Injectable()
export class PaymentsService {
  private readonly adapters: Record<string, AdapterEntry>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly stripe: StripePaymentAdapter,
    private readonly bankWire: BankWirePaymentAdapter,
    private readonly ledger: LedgerService,
    @InjectRepository(PaymentIntent)
    private readonly paymentIntents: Repository<PaymentIntent>,
    @InjectRepository(ProcessedWebhook)
    private readonly processedWebhooks: Repository<ProcessedWebhook>,
    @InjectRepository(Campaign)
    private readonly campaigns: Repository<Campaign>,
  ) {
    this.adapters = {
      [StripePaymentAdapter.provider]: {
        provider: StripePaymentAdapter.provider,
        channel: StripePaymentAdapter.channel,
        instance: stripe,
      },
      [BankWirePaymentAdapter.provider]: {
        provider: BankWirePaymentAdapter.provider,
        channel: BankWirePaymentAdapter.channel,
        instance: bankWire,
      },
    };
  }

  async initiateDonation(
    donorId: string | null,
    dto: CreateDonationDto,
  ): Promise<DonationResponse> {
    const provider: DonationProvider = dto.provider ?? 'stripe';
    const adapter = this.adapters[provider]?.instance;

    if (!adapter) {
      throw new BadRequestException(`Unsupported payment provider: ${provider}`);
    }

    const campaign = await this.campaigns.findOne({
      where: { id: dto.campaignId, status: CampaignStatus.LIVE },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign is not live');
    }

    const currency = dto.currency ?? campaign.currency;
    const grossAmount = Number(dto.amount);
    const platformFee = Number((grossAmount * PLATFORM_FEE_RATE).toFixed(2));
    const processingFee = Number(
      (grossAmount * CARD_PROCESSING_FEE_RATE).toFixed(2),
    );
    const netAmount = Number(
      (grossAmount - platformFee - processingFee).toFixed(2),
    );

    const intentResult = await adapter.createPaymentIntent(
      grossAmount,
      currency,
      {
        campaignId: dto.campaignId,
        donorId: donorId ?? 'guest',
        isAnonymous: dto.isAnonymous ?? false,
      },
    );

    const channel =
      provider === 'bank_wire'
        ? PaymentChannel.BANK_TRANSFER
        : PaymentChannel.CARD;

    const paymentIntent = await this.paymentIntents.save({
      campaignId: dto.campaignId,
      donorId: donorId ?? null,
      amount: grossAmount.toString(),
      currency,
      channel,
      providerReference: intentResult.providerReference,
      status: TransactionStatus.PENDING,
      isAnonymous: Boolean(dto.isAnonymous),
      donorName: dto.donorName ?? null,
      donorEmail: dto.donorEmail?.toLowerCase() ?? null,
      donorPhone: dto.donorPhone ?? null,
      donorMessage: dto.donorMessage ?? null,
    });

    return {
      paymentIntentId: paymentIntent.id,
      providerReference: intentResult.providerReference,
      clientSecret: intentResult.clientSecret,
      status: intentResult.status,
      amount: grossAmount,
      currency,
      platformFee,
      processingFee,
      netAmount,
    };
  }

  async processWebhook(
    providerName: string,
    headers: Record<string, any>,
    rawPayload: string,
  ): Promise<WebhookResult> {
    const adapter = this.adapters[providerName]?.instance;

    if (!adapter) {
      throw new BadRequestException(`Unsupported payment provider: ${providerName}`);
    }

    const providerEventId = this.extractEventId(rawPayload);

    if (providerEventId) {
      const alreadyProcessed = await this.processedWebhooks.findOne({
        where: { providerEventId },
      });

      if (alreadyProcessed) {
        return { statusCode: 200, message: 'Webhook already processed' };
      }
    }

    if (!adapter.verifyWebhookSignature(headers, rawPayload)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = await adapter.handleWebhookEvent(
      typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload,
    );

    if (event.status === TransactionStatus.SUCCESS) {
      const paymentIntent = await this.paymentIntents.findOne({
        where: { providerReference: event.paymentIntentReference },
      });

      if (!paymentIntent) {
        throw new NotFoundException('Payment intent not found');
      }

      if (paymentIntent.status !== TransactionStatus.SUCCESS) {
        await this.dataSource.transaction(async (manager) => {
          await manager
            .getRepository(PaymentIntent)
            .update(paymentIntent.id, { status: TransactionStatus.SUCCESS });

          await this.ledger.postDonationLedger(paymentIntent.id, manager, {
            providerEventId: event.providerEventId,
            providerName,
            payload:
              typeof rawPayload === 'string'
                ? JSON.parse(rawPayload)
                : rawPayload,
          });
        });
      }
    }

    return { statusCode: 200, message: 'Webhook processed' };
  }

  async findDonationHistory(
    campaignId: string,
  ): Promise<DonationFeedItem[]> {
    const intents = await this.paymentIntents.find({
      where: { campaignId, status: TransactionStatus.SUCCESS },
      order: { createdAt: 'DESC' },
      relations: { donor: { profile: true } },
    });

    return intents.map((intent) => ({
      amount: Number(intent.amount),
      currency: intent.currency,
      channel: intent.channel,
      providerReference: intent.providerReference,
      isAnonymous: intent.isAnonymous,
      // Public feed: first name only, from the account or what the guest typed.
      donorName: intent.isAnonymous
        ? 'Anonymous'
        : (intent.donor?.profile?.firstName?.trim() ||
            intent.donorName?.trim().split(/\s+/)[0] ||
            'Supporter'),
      createdAt: intent.createdAt,
    }));
  }

  private extractEventId(rawPayload: string): string {
    try {
      const payload = JSON.parse(rawPayload) as Record<string, unknown>;

      if (payload && typeof payload === 'object') {
        if (typeof payload.id === 'string' && payload.id) {
          return payload.id;
        }
        if (payload.eventId && typeof payload.eventId === 'string') {
          return payload.eventId;
        }
        const reference = (payload.data as { object?: { id?: string } } | undefined)
          ?.object?.id;
        if (typeof reference === 'string' && reference) {
          return reference;
        }
      }

      return '';
    } catch {
      return '';
    }
  }
}
