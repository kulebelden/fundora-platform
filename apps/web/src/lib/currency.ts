export interface CurrencyMeta {
  code: string;
  label: string;
  symbol: string;
  /** Quick-donate presets, in major units of this currency. */
  presets: number[];
}

/**
 * The only two currencies a campaign can raise in. Mirrors
 * `SUPPORTED_CURRENCIES` in apps/api/src/common/supported-markets.ts, which is
 * what actually enforces it — this list only keeps the UI from offering
 * something the API would reject.
 */
export const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', presets: [25, 50, 100, 250] },
  { code: 'EUR', label: 'Euro', symbol: '€', presets: [25, 50, 100, 250] },
];

export interface CountryMeta {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  currency: string;
}

/**
 * Supported payout markets: the countries whose official currency is the US
 * dollar or the euro. Nothing else is offered.
 */
export const COUNTRIES: CountryMeta[] = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'EC', name: 'Ecuador', currency: 'USD' },
  { code: 'SV', name: 'El Salvador', currency: 'USD' },
  { code: 'PA', name: 'Panama', currency: 'USD' },
  { code: 'PR', name: 'Puerto Rico', currency: 'USD' },
  { code: 'TL', name: 'Timor-Leste', currency: 'USD' },
  { code: 'MH', name: 'Marshall Islands', currency: 'USD' },
  { code: 'FM', name: 'Micronesia', currency: 'USD' },
  { code: 'PW', name: 'Palau', currency: 'USD' },
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

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

export function countryMeta(code: string | undefined | null): CountryMeta | null {
  if (!code) return null;
  return COUNTRY_BY_CODE.get(code.trim().toUpperCase()) ?? null;
}

export function countryName(code: string | undefined | null): string {
  return countryMeta(code)?.name ?? code?.toUpperCase() ?? '—';
}

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currencyMeta(code: string | undefined | null): CurrencyMeta {
  return (code && BY_CODE.get(code.toUpperCase())) || CURRENCIES[0];
}

/**
 * Currencies with no minor unit; a "cent" does not exist for these. USD and EUR
 * both have two, so this only matters for legacy rows and imported data.
 */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP']);

export function fractionDigits(code: string): number {
  return ZERO_DECIMAL.has(code.toUpperCase()) ? 0 : 2;
}

/**
 * Formats money for display. Parses from string to keep the wire format exact for
 * as long as possible. `compact` renders 1.2M-style labels for stat tiles.
 */
export function formatMoney(
  value: string | number | null | undefined,
  code = 'USD',
  options: { compact?: boolean; hideFraction?: boolean } = {},
): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return '—';

  const digits = options.hideFraction ? 0 : fractionDigits(code);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.toUpperCase(),
      notation: options.compact ? 'compact' : 'standard',
      maximumFractionDigits: options.compact ? 1 : digits,
      minimumFractionDigits: options.compact ? 0 : digits,
    }).format(amount);
  } catch {
    // Unknown ISO code: fall back to a plain number with the code appended.
    return `${amount.toLocaleString('en-US')} ${code.toUpperCase()}`;
  }
}

export function formatNumber(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
}

/** Clamped 0-100 so an over-funded campaign never overflows its progress bar. */
export function fundedPercent(
  raised: string | number | null | undefined,
  target: string | number | null | undefined,
): number {
  const r = typeof raised === 'string' ? Number(raised) : (raised ?? 0);
  const t = typeof target === 'string' ? Number(target) : (target ?? 0);
  if (!Number.isFinite(r) || !Number.isFinite(t) || t <= 0) return 0;
  return Math.max(0, Math.min(100, (r / t) * 100));
}

export function daysRemaining(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return '—';

  const seconds = Math.round((Date.now() - then) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

  for (const [unit, secondsPer] of units) {
    if (Math.abs(seconds) >= secondsPer) {
      return rtf.format(-Math.round(seconds / secondsPer), unit);
    }
  }
  return rtf.format(-seconds, 'second');
}
