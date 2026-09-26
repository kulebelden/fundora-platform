/**
 * Withdrawal fee preview.
 *
 * IMPORTANT: this mirrors `apps/api/src/ledger/fees.ts` so the fundraiser can see the
 * split before submitting. It is a PREVIEW ONLY — the API recomputes the authoritative
 * amounts server-side and its answer wins. Keep the two in step: integer minor units,
 * 8% rounded half-up, so gross === fee + net exactly.
 */
export const WITHDRAWAL_FEE_BPS = 800;
export const WITHDRAWAL_FEE_LABEL = '8%';

/**
 * Donation-side rates, mirrored from `apps/api/src/ledger/fees.ts` so the pricing page
 * cannot quote a number the ledger does not charge. The API applies both to EVERY
 * donation — there is no per-category carve-out in `ledger.service.ts`, so any
 * "0% for medical" copy is marketing ahead of the implementation.
 *
 * Processing is waived on BANK_TRANSFER only; every other channel pays it.
 */
export const PLATFORM_FEE_RATE = 0.05;
export const PLATFORM_FEE_LABEL = '5%';
export const CARD_PROCESSING_FEE_RATE = 0.029;
export const CARD_PROCESSING_FEE_LABEL = '2.9%';

export interface DonationSplit {
  gross: number;
  platformFee: number;
  processingFee: number;
  net: number;
}

/** Mirrors `LedgerService.settleDonation`'s split for display on the pricing page. */
export function previewDonation(amount: number, channel: 'card' | 'bank' = 'card'): DonationSplit {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { gross: 0, platformFee: 0, processingFee: 0, net: 0 };
  }
  const round = (value: number) => Math.round(value * 100) / 100;
  const platformFee = round(amount * PLATFORM_FEE_RATE);
  const processingFee = round(channel === 'bank' ? 0 : amount * CARD_PROCESSING_FEE_RATE);
  return {
    gross: amount,
    platformFee,
    processingFee,
    net: round(amount - platformFee - processingFee),
  };
}

export interface WithdrawalPreview {
  gross: number;
  fee: number;
  net: number;
}

export function previewWithdrawal(amount: number, zeroDecimal = false): WithdrawalPreview {
  if (!Number.isFinite(amount) || amount <= 0) return { gross: 0, fee: 0, net: 0 };

  const scale = zeroDecimal ? 1 : 100;
  const grossMinor = Math.round(amount * scale);
  const feeMinor = Math.floor((grossMinor * WITHDRAWAL_FEE_BPS + 5000) / 10000);
  const netMinor = grossMinor - feeMinor;

  return { gross: grossMinor / scale, fee: feeMinor / scale, net: netMinor / scale };
}
