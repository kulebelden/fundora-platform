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
/**
 * Fallback only. The live platform fee is set by the super admin and read with
 * `fetchPlatformFeeRate()`; this is the rate used if the API cannot be reached.
 */
export const PLATFORM_FEE_RATE = 0.05;
export const CARD_PROCESSING_FEE_RATE = 0.029;
export const CARD_PROCESSING_FEE_LABEL = '2.9%';

export interface DonationSplit {
  gross: number;
  platformFee: number;
  processingFee: number;
  net: number;
}

/** "5%", "4.5%": a fee rate as people read it. */
export function feeLabel(rate: number): string {
  return `${Math.round(rate * 10_000) / 100}%`;
}

/**
 * Server-side read of the live platform fee for server-rendered pages. Never
 * cached: a change by the super admin shows on the very next page load.
 */
export async function fetchPlatformFeeRate(): Promise<number> {
  const origin = process.env.API_ORIGIN ?? 'http://localhost:3000';
  try {
    const response = await fetch(`${origin}/api/v1/payments/fees`, { cache: 'no-store' });
    if (!response.ok) return PLATFORM_FEE_RATE;
    const body = (await response.json()) as { platformFeePercent?: unknown };
    return typeof body.platformFeePercent === 'number' ? body.platformFeePercent / 100 : PLATFORM_FEE_RATE;
  } catch {
    return PLATFORM_FEE_RATE;
  }
}

/** Mirrors `LedgerService.settleDonation`'s split for display on the pricing page. */
export function previewDonation(
  amount: number,
  channel: 'card' | 'bank' = 'card',
  platformFeeRate = PLATFORM_FEE_RATE,
): DonationSplit {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { gross: 0, platformFee: 0, processingFee: 0, net: 0 };
  }
  const round = (value: number) => Math.round(value * 100) / 100;
  const platformFee = round(amount * platformFeeRate);
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
