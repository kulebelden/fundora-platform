import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';
import { PaymentChannel, TransactionStatus } from '../../common/enums';
import {
  IPaymentAdapter,
  PaymentIntentResult,
  ProcessedPaymentEvent,
} from './payment-adapter.interface';

const PLATFORM = 'bank_wire';

@Injectable()
export class BankWirePaymentAdapter implements IPaymentAdapter {
  constructor(private readonly config: ConfigService) {}

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
  ): Promise<PaymentIntentResult> {
    const reference = `${PLATFORM}-${randomUUID().slice(0, 12).toUpperCase()}`;

    return {
      providerReference: reference,
      clientSecret: undefined,
      status: TransactionStatus.PENDING,
    };
  }

  verifyWebhookSignature(
    headers: Record<string, any>,
    payload: string,
  ): boolean {
    const secret = this.config.get<string>('BANK_WIRE_WEBHOOK_SECRET');

    if (!secret) {
      throw new UnauthorizedException('Bank wire webhook secret is not configured');
    }

    const signature = headers['x-bank-wire-signature'] ?? headers['X-Bank-Wire-Signature'];

    if (typeof signature !== 'string' || !signature) {
      return false;
    }

    const computed = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return createHash('sha256').update(computed).digest('hex') === signature;
  }

  async handleWebhookEvent(eventPayload: any): Promise<ProcessedPaymentEvent> {
    const statusMap: Record<string, TransactionStatus> = {
      succeeded: TransactionStatus.SUCCESS,
      success: TransactionStatus.SUCCESS,
      failed: TransactionStatus.FAILED,
      pending: TransactionStatus.PENDING,
    };

    const status =
      statusMap[(eventPayload?.status ?? eventPayload?.state)?.toLowerCase()] ??
      TransactionStatus.PENDING;

    return {
      providerEventId:
        eventPayload?.eventId ??
        eventPayload?.id ??
        randomUUID(),
      paymentIntentReference:
        eventPayload?.paymentIntentReference ??
        eventPayload?.payment_intent_reference ??
        randomUUID(),
      status,
      amount: Number(eventPayload?.amount ?? 0),
      currency: (eventPayload?.currency ?? 'ugx').toUpperCase(),
    };
  }

  static readonly provider = PLATFORM;
  static readonly channel = PaymentChannel.BANK_TRANSFER;
}
