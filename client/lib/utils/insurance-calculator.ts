import { InsuranceOption, InsuranceEligibilityCriteria } from '@/lib/config/insurance';

export interface DriverInfo {
  birthday: string; // Format: "YYYY-MM-DD"
  license_from: string; // Format: "YYYY-MM-DD"
  license_to: string; // Format: "YYYY-MM-DD"
  country: string; // Country code or name
}

export interface CalculationFactors {
  ageFactor: number; // Multiplier based on age
  tenureFactor: number; // Multiplier based on license tenure
  countryFactor: number; // Multiplier based on country
  isValid: boolean; // Whether license is valid
}

export interface CalculatedInsurance {
  option: InsuranceOption;
  basePrice: number;
  calculatedPrice: number;
  factors: CalculationFactors;
  depositPrice: number;
  damageAccess: number;
}

/**
 * Calculate age at pickup date
 */
export function calculateAge(birthday: string, pickupDate: string): number {
  const birth = new Date(birthday);
  const pickup = new Date(pickupDate);
  let age = pickup.getFullYear() - birth.getFullYear();
  const monthDiff = pickup.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && pickup.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate license tenure in years
 */
export function calculateLicenseTenure(licenseFrom: string, pickupDate: string): number {
  const from = new Date(licenseFrom);
  const pickup = new Date(pickupDate);
  let tenure = pickup.getFullYear() - from.getFullYear();
  const monthDiff = pickup.getMonth() - from.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && pickup.getDate() < from.getDate())) {
    tenure--;
  }
  
  return Math.max(0, tenure);
}

/**
 * Check if license is valid at pickup date
 */
export function isLicenseValid(licenseTo: string, pickupDate: string): boolean {
  const expiry = new Date(licenseTo);
  const pickup = new Date(pickupDate);
  
  // License must be valid and have at least 30 days remaining
  const daysUntilExpiry = Math.floor((expiry.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry >= 30;
}

/**
 * Get age-based adjustment (simplified)
 */
export function getAgeAdjustment(age: number): number {
  if (age < 25) {
    return 0.2; // +20% adjustment
  } else if (age > 65) {
    return 0.15; // +15% adjustment
  }
  return 0; // No adjustment for ages 25-65
}

/**
 * Get license tenure-based adjustment (simplified)
 */
export function getTenureAdjustment(tenure: number): number {
  if (tenure < 1) {
    return 0.3; // +30% adjustment
  } else if (tenure < 3) {
    return 0.15; // +15% adjustment
  }
  return 0; // No adjustment for 3+ years
}

/**
 * Get country-based multiplier
 * EU countries get a discount
 */
export function getCountryMultiplier(country: string): number {
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', '31',
  ];
  
  const countryUpper = country.toUpperCase().trim();
  return euCountries.includes(countryUpper) ? 0.95 : 1.0;
}

/**
 * Check if an insurance option is eligible for a driver
 */
export function checkInsuranceEligibility(
  option: InsuranceOption,
  driverInfo: DriverInfo,
  pickupDate: string
): boolean {
  const criteria = option.eligibilityCriteria;
  if (!criteria) {
    // No criteria means available to all
    return true;
  }

  const age = calculateAge(driverInfo.birthday, pickupDate);
  const tenure = calculateLicenseTenure(driverInfo.license_from, pickupDate);
  const isValid = isLicenseValid(driverInfo.license_to, pickupDate);

  // Check license validity requirement
  if (criteria.requiresValidLicense !== false && !isValid) {
    return false;
  }

  // Check age requirements
  if (criteria.minAge !== undefined && age < criteria.minAge) {
    return false;
  }
  if (criteria.maxAge !== undefined && age > criteria.maxAge) {
    return false;
  }

  // Check tenure requirements
  if (criteria.minTenure !== undefined && tenure < criteria.minTenure) {
    return false;
  }
  if (criteria.maxTenure !== undefined && tenure > criteria.maxTenure) {
    return false;
  }

  // Check country requirements
  const countryUpper = driverInfo.country.toUpperCase().trim();
  if (criteria.allowedCountries && criteria.allowedCountries.length > 0) {
    if (!criteria.allowedCountries.some(c => c.toUpperCase().trim() === countryUpper)) {
      return false;
    }
  }
  if (criteria.blockedCountries && criteria.blockedCountries.length > 0) {
    if (criteria.blockedCountries.some(c => c.toUpperCase().trim() === countryUpper)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter insurance options based on driver criteria
 * Always returns at least 1 option (fallback if needed)
 */
export function filterEligibleInsurances(
  insuranceOptions: InsuranceOption[],
  driverInfo: DriverInfo,
  pickupDate: string
): InsuranceOption[] {
  const eligible = insuranceOptions.filter(option =>
    checkInsuranceEligibility(option, driverInfo, pickupDate)
  );

  // If we have eligible options, return them
  if (eligible.length > 0) {
    return eligible;
  }

  // If no options match, return fallback option or basic coverage
  const fallback = insuranceOptions.find(opt => opt.isFallback) ||
                   insuranceOptions.find(opt => !opt.eligibilityCriteria) ||
                   insuranceOptions[0];

  return fallback ? [fallback] : [];
}

/**
 * Calculate insurance premium for a driver and insurance option (simplified)
 */
export function calculateInsurancePremium(
  option: InsuranceOption,
  driverInfo: DriverInfo,
  pickupDate: string,
  rentalDays: number
): CalculatedInsurance {
  const age = calculateAge(driverInfo.birthday, pickupDate);
  const tenure = calculateLicenseTenure(driverInfo.license_from, pickupDate);
  const isValid = isLicenseValid(driverInfo.license_to, pickupDate);
  
  // Parse base price
  const basePrice = parseFloat(option.price) || 0;
  
  // Calculate price based on insurance type
  let calculatedPrice = basePrice;
  
  if (option.type === 'Price') {
    // Price per day - multiply by rental days
    calculatedPrice = basePrice * rentalDays;
  } else if (option.type === 'Percent') {
    // Percent type - use base price as is
    calculatedPrice = basePrice;
  }
  // 'Fix' type uses base price as is
  
  // Apply simplified calculation formula if license is valid
  if (isValid) {
    const ageAdjustment = getAgeAdjustment(age);
    const tenureAdjustment = getTenureAdjustment(tenure);
    const countryMultiplier = getCountryMultiplier(driverInfo.country);
    
    // Simplified formula: basePrice * (1 + ageAdjustment + tenureAdjustment) * countryMultiplier
    calculatedPrice = calculatedPrice * (1 + ageAdjustment + tenureAdjustment) * countryMultiplier;
  } else {
    // If license is invalid, double the price as penalty
    calculatedPrice = basePrice * 2;
  }
  
  // Round to 2 decimal places
  calculatedPrice = Math.round(calculatedPrice * 100) / 100;
  
  // Keep factors for backward compatibility
  const factors: CalculationFactors = {
    ageFactor: 1 + getAgeAdjustment(age),
    tenureFactor: 1 + getTenureAdjustment(tenure),
    countryFactor: getCountryMultiplier(driverInfo.country),
    isValid,
  };
  
  const depositPrice = parseFloat(option.deposit_price) || 0;
  const damageAccess = parseFloat(option.damage_access) || 0;
  
  return {
    option,
    basePrice,
    calculatedPrice,
    factors,
    depositPrice,
    damageAccess,
  };
}

/**
 * Calculate premiums for eligible insurance options only
 */
export function calculateAllInsurancePremiums(
  insuranceOptions: InsuranceOption[],
  driverInfo: DriverInfo,
  pickupDate: string,
  rentalDays: number
): CalculatedInsurance[] {
  // First filter eligible insurances
  const eligibleOptions = filterEligibleInsurances(insuranceOptions, driverInfo, pickupDate);
  
  // Then calculate premiums for eligible options only
  return eligibleOptions.map(option =>
    calculateInsurancePremium(option, driverInfo, pickupDate, rentalDays)
  );
}
