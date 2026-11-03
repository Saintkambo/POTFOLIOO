export type BusinessType = 'retail' | 'rental' | 'services' | 'other';
export type BusinessCategory = 'retail' | 'rental' | 'other';
export type BusinessRole = 'owner' | 'admin' | 'accountant' | 'employee';

export interface AccountingPreferences {
  basis: 'cash' | 'accrual';
  vatRegistered?: boolean;
  invoicePrefix?: string;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  category: BusinessCategory;
  currencyCode: string;
  location?: string;
  address?: string;
  financialYearStart: string; // e.g. '01-01'
  accountingPreferences: AccountingPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMember {
  id: string;
  businessId: string;
  userId: string;
  role: BusinessRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessOnboardingData {
  name: string;
  type: BusinessType;
  category: BusinessCategory;
  location: string;
  address?: string;
  currencyCode: string;
  financialYearStart: string;
  accountingPreferences: AccountingPreferences;
}

export const TANZANIAN_REGIONS = [
  'Dar es Salaam',
  'Arusha',
  'Mwanza',
  'Dodoma',
  'Kilimanjaro',
  'Mbeya',
  'Morogoro',
  'Tanga',
  'Zanzibar Urban/West',
  'Kagera',
  'Iringa',
  'Tabora',
  'Kigoma',
  'Shinyanga',
  'Other',
] as const;
