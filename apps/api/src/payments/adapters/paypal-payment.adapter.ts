import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';
import { PaymentChannel, TransactionStatus } from '../../common/enums';
import {
  IPaymentAdapter,
  PaymentIntentResult,
  ProcessedPaymentEvent,
} from './payment-adapter.interface';

const PLATFORM = 'paypal';

@Injectable()
export class PayPalPaymentAdapter implements IPaymentAdapter {
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
    // Fail closed: an unsigned webhook would let anyone mark a donation as paid.
    const secret = this.config.get<string>('PAYPAL_WEBHOOK_SECRET');

    if (!secret) {
      throw new UnauthorizedException('PayPal webhook secret is not configured');
    }

    const signature = headers['x-paypal-signature'] ?? headers['X-PayPal-Signature'];

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
      completed: TransactionStatus.SUCCESS,
      success: TransactionStatus.SUCCESS,
      succeeded: TransactionStatus.SUCCESS,
      failed: TransactionStatus.FAILED,
      pending: TransactionStatus.PENDING,
    };

    const status =
      statusMap[(eventPayload?.status ?? eventPayload?.state ?? '')?.toLowerCase()] ??
      TransactionStatus.PENDING;

    return {
      providerEventId: eventPayload?.eventId ?? eventPayload?.id ?? randomUUID(),
      paymentIntentReference:
        eventPayload?.paymentIntentReference ??
        eventPayload?.payment_intent_reference ??
        eventPayload?.custom_id ??
        randomUUID(),
      status,
      amount: Number(eventPayload?.amount?.value ?? eventPayload?.amount ?? 0),
      currency: (eventPayload?.amount?.currency_code ?? eventPayload?.currency ?? 'USD').toUpperCase(),
    };
  }

  static readonly provider = PLATFORM;
  static readonly channel = PaymentChannel.BANK_TRANSFER;
}
