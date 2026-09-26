import { TransactionStatus } from '../../common/enums';

export interface PaymentIntentResult {
  providerReference: string;
  clientSecret?: string;
  status: TransactionStatus;
}

export interface ProcessedPaymentEvent {
  providerEventId: string;
  paymentIntentReference: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
}

export interface IPaymentAdapter {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>,
  ): Promise<PaymentIntentResult>;

  verifyWebhookSignature(
    headers: Record<string, any>,
    payload: any,
  ): boolean;

  handleWebhookEvent(eventPayload: any): Promise<ProcessedPaymentEvent>;
}
