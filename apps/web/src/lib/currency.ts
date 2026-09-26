export interface CurrencyMeta {
  code: string;
  label: string;
  symbol: string;
  /** Quick-donate presets, in major units of this currency. */
  presets: number[];
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', presets: [25, 50, 100, 250] },
  { code: 'EUR', label: 'Euro', symbol: '€', presets: [25, 50, 100, 250] },
  { code: 'GBP', label: 'British Pound', symbol: '£', presets: [20, 50, 100, 250] },
  { code: 'UGX', label: 'Ugandan Shilling', symbol: 'USh', presets: [50000, 100000, 250000, 500000] },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh', presets: [2500, 5000, 10000, 25000] },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦', presets: [10000, 25000, 50000, 100000] },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$', presets: [25, 50, 100, 250] },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', presets: [25, 50, 100, 250] },
];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currencyMeta(code: string | undefined | null): CurrencyMeta {
  return (code && BY_CODE.get(code.toUpperCase())) || CURRENCIES[0];
}

/** Currencies with no minor unit; a "cent" does not exist for these. */
const ZERO_DECIMAL = new Set(['UGX', 'JPY', 'KRW', 'VND', 'RWF', 'XOF', 'XAF', 'CLP']);

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
