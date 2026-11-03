import { ValidationError } from './errors';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  fractionDigits: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', fractionDigits: 0 },
};

export const DEFAULT_CURRENCY = 'TZS';

/**
 * Converts a user-entered amount string into integer minor units (1 major TZS = 100 minor units).
 * Strips commas and handles both whole numbers (e.g. "1,000,000") and optional decimals.
 */
export function parseAmountToMinor(input: string, _currencyCode: string = DEFAULT_CURRENCY): number {
  const trimmed = input.trim().replace(/,/g, '');
  if (!trimmed) {
    throw new ValidationError('amount', 'Amount is required');
  }

  // Enforce positive number format
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new ValidationError('amount', 'Please enter a valid positive number');
  }

  const parts = trimmed.split('.');
  const wholePart = parseInt(parts[0], 10);

  if (isNaN(wholePart) || wholePart < 0) {
    throw new ValidationError('amount', 'Amount must be a positive number');
  }

  // Preserve any fractional digits if present in input, otherwise 0
  const fractionStr = (parts[1] || '').padEnd(2, '0').slice(0, 2);
  const fractionPart = parseInt(fractionStr, 10) || 0;

  const minor = wholePart * 100 + fractionPart;

  if (minor <= 0) {
    throw new ValidationError('amount', 'Amount must be greater than zero');
  }

  return minor;
}

/**
 * Formats integer minor units into whole-number currency string with thousands separators
 * and no decimal places, e.g. "TSh 1,000,000".
 */
export function formatMoney(amountMinor: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const isNegative = amountMinor < 0;
  const absMinor = Math.abs(amountMinor);
  const major = Math.round(absMinor / 100);
  const formattedNumber = major.toLocaleString('en-US');
  const code = !currencyCode || currencyCode === 'USD' ? 'TZS' : currencyCode;
  const symbol = code === 'TZS' ? 'TSh' : (SUPPORTED_CURRENCIES[code]?.symbol || 'TSh');

  const result = `${symbol} ${formattedNumber}`;
  return isNegative ? `-${result}` : result;
}

/**
 * Formats minor units into whole-number value string without currency symbol for form inputs.
 */
export function minorToDecimalString(amountMinor: number, _currencyCode: string = DEFAULT_CURRENCY): string {
  const major = Math.round(Math.abs(amountMinor) / 100);
  return major.toString();
}
