import { Injectable, Logger } from '@nestjs/common';
import { BankAccountDetails } from '../../modules/withdrawals/entities/withdrawal-request.entity';

export const BANK_PAYOUT_ADAPTER = Symbol('BANK_PAYOUT_ADAPTER');

export interface BankPayoutRequest {
  /** Stable per-withdrawal key: retrying a payout with the same key must never pay twice. */
  idempotencyKey: string;
  amount: string;
  currency: string;
  destination: BankAccountDetails;
}

export interface BankPayoutResult {
  reference: string;
}

export interface IBankPayoutAdapter {
  /** Resolves only when the bank has accepted the payout; throws otherwise. */
  executePayout(request: BankPayoutRequest): Promise<BankPayoutResult>;
}

/**
 * Placeholder until a real bank/PSP payout integration is wired in. It executes no
 * money movement: it only returns a deterministic reference. Replace the
 * BANK_PAYOUT_ADAPTER provider in WithdrawalsModule with a real implementation.
 */
@Injectable()
export class SimulatedBankPayoutAdapter implements IBankPayoutAdapter {
  private readonly logger = new Logger(SimulatedBankPayoutAdapter.name);

  async executePayout(request: BankPayoutRequest): Promise<BankPayoutResult> {
    this.logger.warn(
      `SIMULATED payout of ${request.amount} ${request.currency} (key ${request.idempotencyKey}); no funds moved`,
    );
    return { reference: `SIM-${request.idempotencyKey}` };
  }
}
