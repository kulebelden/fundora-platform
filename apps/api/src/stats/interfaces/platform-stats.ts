export interface PlatformStats {
  /**
   * Gross raised in `reportingCurrency` only. The platform holds no FX rates, so
   * amounts in other currencies are deliberately NOT folded into this number —
   * summing UGX into USD would be off by three orders of magnitude.
   */
  totalRaised: string;
  reportingCurrency: string;
  /** Exact gross raised per currency; the authoritative breakdown. */
  totalRaisedByCurrency: Record<string, string>;
  totalDonors: number;
  successfulCauses: number;
  activeCountries: number;
}
