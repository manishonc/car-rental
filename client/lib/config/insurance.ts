export interface InsuranceEligibilityCriteria {
  minAge?: number; // Minimum age requirement
  maxAge?: number; // Maximum age requirement
  minTenure?: number; // Minimum license tenure in years
  maxTenure?: number; // Maximum license tenure in years
  allowedCountries?: string[]; // List of allowed country codes
  blockedCountries?: string[]; // List of blocked country codes
  requiresValidLicense?: boolean; // Whether valid license is required (default: true)
}

export interface InsuranceOption {
  id: number;
  title: string;
  type: 'Fix' | 'Price' | 'Percent';
  value: string; // Base value
  price: string; // Base price
  price_title: string; // e.g., "/ day"
  icon: string;
  deposit: number; // 0 or 1
  deposit_price: string;
  damage: number; // 0 or 1
  damage_access: string;
  checked?: boolean;
  eligibilityCriteria?: InsuranceEligibilityCriteria; // Eligibility rules for this insurance
  isFallback?: boolean; // Mark as fallback option if no others match
}

// EU country codes for eligibility checks
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', '31', // 31 is Netherlands code
];

export const insuranceOptions: InsuranceOption[] = [
  {
    id: 1001,
    title: 'Basic Coverage',
    type: 'Fix',
    value: '80.00',
    price: '80.00',
    price_title: '',
    icon: 'insur-min',
    deposit: 1,
    deposit_price: '250.00',
    damage: 1,
    damage_access: '250.00',
    checked: true,
    eligibilityCriteria: {
      minAge: 18,
      requiresValidLicense: true,
    },
    isFallback: true, // Fallback option if no others match
  },
  {
    id: 1002,
    title: 'Young Driver Coverage',
    type: 'Fix',
    value: '120.00',
    price: '120.00',
    price_title: '',
    icon: 'insur-mid',
    deposit: 1,
    deposit_price: '300.00',
    damage: 1,
    damage_access: '300.00',
    checked: false,
    eligibilityCriteria: {
      maxAge: 24, // Age < 25
      maxTenure: 2.99, // Tenure < 3 years
      allowedCountries: EU_COUNTRIES,
      requiresValidLicense: true,
    },
  },
  {
    id: 1003,
    title: 'Experienced Driver Coverage',
    type: 'Fix',
    value: '100.00',
    price: '100.00',
    price_title: '',
    icon: 'insur-max',
    deposit: 0,
    deposit_price: '0.00',
    damage: 0,
    damage_access: '0.00',
    checked: false,
    eligibilityCriteria: {
      minAge: 25,
      maxAge: 65,
      minTenure: 3, // Tenure >= 3 years
      requiresValidLicense: true,
    },
  },
  {
    id: 1004,
    title: 'Senior Driver Coverage',
    type: 'Fix',
    value: '110.00',
    price: '110.00',
    price_title: '',
    icon: 'insur-mid',
    deposit: 1,
    deposit_price: '350.00',
    damage: 1,
    damage_access: '350.00',
    checked: false,
    eligibilityCriteria: {
      minAge: 66, // Age > 65
      minTenure: 5, // Tenure >= 5 years
      allowedCountries: EU_COUNTRIES,
      requiresValidLicense: true,
    },
  },
  {
    id: 1005,
    title: 'High Risk Coverage',
    type: 'Fix',
    value: '150.00',
    price: '150.00',
    price_title: '',
    icon: 'insur-max',
    deposit: 1,
    deposit_price: '500.00',
    damage: 1,
    damage_access: '500.00',
    checked: false,
    eligibilityCriteria: {
      maxAge: 24, // Age < 25
      maxTenure: 0.99, // Tenure < 1 year
      requiresValidLicense: true,
    },
  },
  {
    id: 1006,
    title: 'Standard Coverage',
    type: 'Fix',
    value: '90.00',
    price: '90.00',
    price_title: '',
    icon: 'insur-min',
    deposit: 0,
    deposit_price: '0.00',
    damage: 0,
    damage_access: '0.00',
    checked: false,
    eligibilityCriteria: {
      minAge: 25,
      maxAge: 65,
      requiresValidLicense: true,
    },
  },
];
