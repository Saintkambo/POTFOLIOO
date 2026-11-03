export interface CurrencyDefinition {
  code: string;
  symbol: string;
  name: string;
  fractionDigits: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDefinition> = {
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', fractionDigits: 2 },
};

export const DEFAULT_CURRENCY = 'TZS';

export type BusinessCategory = 'rental' | 'retail' | 'other';

export interface Book {
  id: string;
  name: string;
  currencyCode: string;
  category: BusinessCategory;
  userId?: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  schemaVersion: number;
  lowStockThreshold?: number;
}
