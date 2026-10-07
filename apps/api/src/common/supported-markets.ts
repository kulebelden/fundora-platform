/**
 * Single source of truth for what a campaign may be raised in and where money
 * may be paid out.
 *
 * The platform supports exactly two currencies — the US dollar and the euro —
 * and only the countries whose official currency is one of those two. Anything
 * outside these lists is rejected at the API boundary, so an unsupported market
 * can never reach the database.
 */

/** The only currencies a campaign may be denominated in. */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return (
    typeof value === 'string' &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(value.toUpperCase())
  );
}

export interface SupportedCountry {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  currency: SupportedCurrency;
}

/** Supported payout markets: US-dollar and euro economies only. */
export const SUPPORTED_COUNTRIES: readonly SupportedCountry[] = [
  // ---- US dollar
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'EC', name: 'Ecuador', currency: 'USD' },
  { code: 'SV', name: 'El Salvador', currency: 'USD' },
  { code: 'PA', name: 'Panama', currency: 'USD' },
  { code: 'PR', name: 'Puerto Rico', currency: 'USD' },
  { code: 'TL', name: 'Timor-Leste', currency: 'USD' },
  { code: 'MH', name: 'Marshall Islands', currency: 'USD' },
  { code: 'FM', name: 'Micronesia', currency: 'USD' },
  { code: 'PW', name: 'Palau', currency: 'USD' },
  // ---- Euro
  { code: 'AT', name: 'Austria', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', currency: 'EUR' },
  { code: 'HR', name: 'Croatia', currency: 'EUR' },
  { code: 'CY', name: 'Cyprus', currency: 'EUR' },
  { code: 'EE', name: 'Estonia', currency: 'EUR' },
  { code: 'FI', name: 'Finland', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'GR', name: 'Greece', currency: 'EUR' },
  { code: 'IE', name: 'Ireland', currency: 'EUR' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'LV', name: 'Latvia', currency: 'EUR' },
  { code: 'LT', name: 'Lithuania', currency: 'EUR' },
  { code: 'LU', name: 'Luxembourg', currency: 'EUR' },
  { code: 'MT', name: 'Malta', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'PT', name: 'Portugal', currency: 'EUR' },
  { code: 'SK', name: 'Slovakia', currency: 'EUR' },
  { code: 'SI', name: 'Slovenia', currency: 'EUR' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
];

const COUNTRY_BY_CODE = new Map(SUPPORTED_COUNTRIES.map((country) => [country.code, country]));

export function isSupportedCountry(code: unknown): boolean {
  return typeof code === 'string' && COUNTRY_BY_CODE.has(code.toUpperCase());
}

export function supportedCountry(code: string | null | undefined): SupportedCountry | null {
  if (!code) return null;
  return COUNTRY_BY_CODE.get(code.trim().toUpperCase()) ?? null;
}

/** Currency a country's banks settle in, for filling a campaign's default. */
export function currencyForCountry(code: string | null | undefined): SupportedCurrency {
  return supportedCountry(code)?.currency ?? 'USD';
}
