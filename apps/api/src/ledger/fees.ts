export const PLATFORM_FEE_RATE = 0.05;
export const CARD_PROCESSING_FEE_RATE = 0.029;

/** Platform service fee on withdrawals, expressed in basis points (8.00%) to keep the math integral. */
export const WITHDRAWAL_FEE_BPS = 800;

export interface WithdrawalAmounts {
  gross: string;
  fee: string;
  net: string;
}

function formatMinor(minor: number): string {
  return (minor / 100).toFixed(2);
}

/**
 * Splits a withdrawal into gross / 8% fee / net using integer cents so that
 * gross === fee + net holds exactly (no float drift). The fee is rounded half-up.
 * `amount` must already be validated to have at most 2 decimal places.
 */
export function calculateWithdrawalAmounts(amount: number): WithdrawalAmounts {
  const grossMinor = Math.round(amount * 100);
  const feeMinor = Math.floor((grossMinor * WITHDRAWAL_FEE_BPS + 5000) / 10000);
  const netMinor = grossMinor - feeMinor;

  return {
    gross: formatMinor(grossMinor),
    fee: formatMinor(feeMinor),
    net: formatMinor(netMinor),
  };
}
