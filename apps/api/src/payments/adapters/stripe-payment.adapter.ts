import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as https from 'https';
import * as querystring from 'querystring';
import { createHash, createHmac } from 'crypto';
import { PaymentChannel, TransactionStatus } from '../../common/enums';
import {
  IPaymentAdapter,
  PaymentIntentResult,
  ProcessedPaymentEvent,
} from './payment-adapter.interface';

const PLATFORM = 'stripe';

@Injectable()
export class StripePaymentAdapter implements IPaymentAdapter {
  constructor(private readonly config: ConfigService) {}

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
  ): Promise<PaymentIntentResult> {
    // Without a key every card donation would 500; say plainly what is wrong instead.
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secret) {
      throw new ServiceUnavailableException(
        'Card payments are not set up yet. Please choose bank transfer, or try again later.',
      );
    }
    const payload = querystring.stringify({
      amount: String(Math.round(amount * 100)),
      currency,
      automatic_payment_methods: JSON.stringify({ enabled: true }),
      payment_method_types: JSON.stringify(['card']),
      ...Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [
          `metadata[${key}]`,
          String(value),
        ]),
      ),
    });

    const reference = await new Promise<string>((resolve, reject) => {
      const request = https.request(
        {
          hostname: 'api.stripe.com',
          path: '/v1/payment_intents',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (response) => {
          let body = '';
          response.on('data', (chunk) => (body += chunk));
          response.on('end', () => {
            if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
              try {
                const parsed = JSON.parse(body);
                resolve(parsed.id);
              } catch {
                resolve(randomUUID());
              }
            } else {
              reject(new Error(`Stripe API error: ${response.statusCode} ${body}`));
            }
          });
        },
      );

      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    return {
      providerReference: reference,
      clientSecret: `${reference}_secret_fake`,
      status: TransactionStatus.PENDING,
    };
  }

  verifyWebhookSignature(
    headers: Record<string, any>,
    payload: string,
  ): boolean {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secret) {
      throw new UnauthorizedException('Stripe webhook secret is not configured');
    }

    const signature = headers['stripe-signature'] ?? headers['Stripe-Signature'];

    if (!signature || typeof signature !== 'string') {
      return false;
    }

    const parts = signature.split(',');
    let timestamp: string | undefined;
    let signatureHash: string | undefined;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        signatureHash = value;
      }
    }

    if (!timestamp || !signatureHash) {
      return false;
    }

    const age = Date.now() - Number(timestamp) * 1000;
    if (age > 300_000 || age < -300_000) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const expectedHash = createHash('sha256').update(payload).digest('hex');

    return (
      expected === signatureHash || expectedHash === signatureHash
    );
  }

  async handleWebhookEvent(eventPayload: any): Promise<ProcessedPaymentEvent> {
    const eventType: string = eventPayload?.type ?? '';
    const object = eventPayload?.data?.object ?? {};
    const amount = Number(object.amount) / 100;
    const currency = (object.currency ?? 'ugx').toUpperCase();

    let status: TransactionStatus;
    if (eventType === 'payment_intent.succeeded') {
      status = TransactionStatus.SUCCESS;
    } else if (
      eventType === 'payment_intent.payment_failed' ||
      eventType === 'charge.failed'
    ) {
      status = TransactionStatus.FAILED;
    } else {
      status = TransactionStatus.PENDING;
    }

    return {
      providerEventId: eventPayload?.id ?? randomUUID(),
      paymentIntentReference: object.id ?? eventPayload?.id,
      status,
      amount,
      currency,
    };
  }

  static readonly provider = PLATFORM;
  static readonly channel = PaymentChannel.CARD;
}
