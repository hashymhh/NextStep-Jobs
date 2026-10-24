/**
 * Default Pakistani Market Locale, Currency (PKR), and Timezone (PKT / Asia/Karachi) Utilities
 */

export const PK_LOCALE = 'en-PK';
export const PK_TIMEZONE = 'Asia/Karachi';
export const PK_CURRENCY = 'PKR';

/**
 * Formats a numeric value in Pakistani Rupees (PKR) or a specified currency.
 * Uses en-PK grouping (lakhs/thousands) and clean PKR prefix.
 */
export function formatCurrencyPKR(
  amount: number,
  options: {
    currency?: string;
    compact?: boolean;
  } = {}
): string {
  const currency = options.currency || PK_CURRENCY;
  if (!Number.isFinite(amount)) return `${currency} 0`;

  if (options.compact) {
    if (currency === 'PKR') {
      if (amount >= 1_000_000) {
        const val = (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1);
        return `PKR ${val}M`;
      }
      if (amount >= 1_000) {
        const val = Math.round(amount / 1_000);
        return `PKR ${val}k`;
      }
      return `PKR ${amount.toLocaleString(PK_LOCALE)}`;
    }
    if (amount >= 1_000) {
      return `${currency} ${Math.round(amount / 1_000)}k`;
    }
  }

  try {
    const formattedNumber = new Intl.NumberFormat(PK_LOCALE, {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
    return `${currency} ${formattedNumber}`;
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * Formats a job salary band in PKR (defaults to monthly compensation, standard in Pakistan's tech sector).
 */
export function formatSalaryRangePKR(
  min?: number,
  max?: number,
  currency: string = PK_CURRENCY,
  period: 'monthly' | 'yearly' = 'monthly'
): string {
  if (!min && !max) return 'Competitive PKR Package';
  const suffix = period === 'monthly' ? '/ mo' : '/ yr';
  if (min && max) {
    return `${formatCurrencyPKR(min, { currency })} – ${formatCurrencyPKR(max, { currency })} ${suffix}`;
  }
  if (min) {
    return `From ${formatCurrencyPKR(min, { currency })} ${suffix}`;
  }
  return `Up to ${formatCurrencyPKR(max!, { currency })} ${suffix}`;
}

/**
 * Safely parses any ISO string, timestamp, or pre-formatted label into a Date.
 */
function toValidDate(input: string | number | Date): Date | null {
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    // Handle relative strings like "15m ago" or "Just now"
    if (/ago|just now|today|yesterday/i.test(input)) {
      return null;
    }
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formats a date aligned to Pakistan Standard Time (Asia/Karachi, UTC+5).
 */
export function formatDatePKT(
  dateInput: string | number | Date,
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  const date = toValidDate(dateInput);
  if (!date) return String(dateInput);

  const formatOptions: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: '2-digit', month: 'short', year: 'numeric', timeZone: PK_TIMEZONE }
      : style === 'long'
      ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: PK_TIMEZONE }
      : { day: 'numeric', month: 'short', year: 'numeric', timeZone: PK_TIMEZONE };

  return new Intl.DateTimeFormat(PK_LOCALE, formatOptions).format(date);
}

/**
 * Formats a clock time explicitly in Pakistan Standard Time (e.g., "02:35 pm PKT").
 */
export function formatTimePKT(
  dateInput: string | number | Date = new Date(),
  includeZoneSuffix = true
): string {
  const date = toValidDate(dateInput);
  if (!date) return String(dateInput);

  const timeStr = new Intl.DateTimeFormat(PK_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: PK_TIMEZONE,
  }).format(date);

  return includeZoneSuffix ? `${timeStr} PKT` : timeStr;
}

/**
 * Formats full date + time in Pakistan Standard Time (e.g., "24 Oct 2026, 11:20 am PKT").
 */
export function formatDateTimePKT(dateInput: string | number | Date): string {
  const date = toValidDate(dateInput);
  if (!date) return String(dateInput);

  const formatted = new Intl.DateTimeFormat(PK_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: PK_TIMEZONE,
  }).format(date);

  return `${formatted} PKT`;
}

/**
 * Computes human-friendly relative time anchored to current time, falling back to PKT date for older items.
 */
export function formatRelativePKT(dateInput: string | number | Date, nowMs: number = Date.now()): string {
  const date = toValidDate(dateInput);
  if (!date) return String(dateInput);

  const diffSeconds = Math.max(0, Math.floor((nowMs - date.getTime()) / 1000));
  if (diffSeconds < 45) return 'Just now · PKT';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return formatDatePKT(date, 'short');
}
