# Insurance Filtering and Calculation Test Cases

This document provides test cases to manually verify the insurance filtering and premium calculation functionality.

## Test Setup

1. Navigate through the booking flow:
   - Step 1: Search for vehicles
   - Step 2: Select a vehicle
   - Step 3: Enter driver information
   - Step 4: View insurance options (filtered based on driver criteria)
   - Step 5: Confirm order

2. For each test case, verify:
   - Only eligible insurance options are displayed
   - At least 1 insurance option is always shown
   - Premium prices are calculated correctly
   - Selected insurance can be confirmed

---

## Test Case 1: Young Driver (EU, Low Tenure)

**Driver Profile:**
- Age: 22 years old (birthday: 2002-01-15, pickup: 2026-02-16)
- Country: DE (Germany - EU)
- License Issue Date: 2025-06-01 (tenure: ~0.7 years)
- License Expiry: 2030-06-01 (valid)

**Expected Results:**
- ✅ Should show: **High Risk Coverage** (ID: 1005)
  - Age < 25 AND tenure < 1 year
  - Base price: 150.00 CHF
  - Calculated: 150.00 × (1 + 0.2 + 0.3) × 0.95 = 213.75 CHF
- ✅ Should show: **Basic Coverage** (ID: 1001) - fallback
- ❌ Should NOT show: Young Driver Coverage (tenure requirement not met)
- ❌ Should NOT show: Experienced/Senior/Standard (age/tenure requirements not met)

**Total Options Expected:** 2

---

## Test Case 2: Young Driver (EU, Medium Tenure)

**Driver Profile:**
- Age: 23 years old (birthday: 2003-03-20, pickup: 2026-02-16)
- Country: FR (France - EU)
- License Issue Date: 2023-01-15 (tenure: ~3.1 years)
- License Expiry: 2033-01-15 (valid)

**Expected Results:**
- ✅ Should show: **Young Driver Coverage** (ID: 1002)
  - Age < 25, tenure < 3 years, EU country
  - Base price: 120.00 CHF
  - Calculated: 120.00 × (1 + 0.2 + 0.15) × 0.95 = 153.90 CHF
- ✅ Should show: **Basic Coverage** (ID: 1001) - fallback
- ❌ Should NOT show: High Risk (tenure >= 1 year)
- ❌ Should NOT show: Experienced/Senior/Standard (age requirements not met)

**Total Options Expected:** 2

---

## Test Case 3: Experienced Driver (EU, High Tenure)

**Driver Profile:**
- Age: 35 years old (birthday: 1991-05-10, pickup: 2026-02-16)
- Country: IT (Italy - EU)
- License Issue Date: 2018-01-01 (tenure: ~8 years)
- License Expiry: 2028-01-01 (valid)

**Expected Results:**
- ✅ Should show: **Experienced Driver Coverage** (ID: 1003)
  - Age 25-65, tenure >= 3 years
  - Base price: 100.00 CHF
  - Calculated: 100.00 × (1 + 0 + 0) × 0.95 = 95.00 CHF
- ✅ Should show: **Standard Coverage** (ID: 1006)
  - Age 25-65, all countries
  - Base price: 90.00 CHF
  - Calculated: 90.00 × (1 + 0 + 0) × 0.95 = 85.50 CHF
- ✅ Should show: **Basic Coverage** (ID: 1001) - fallback
- ❌ Should NOT show: Young Driver (age >= 25)
- ❌ Should NOT show: Senior (age <= 65)
- ❌ Should NOT show: High Risk (age >= 25)

**Total Options Expected:** 3

---

## Test Case 4: Senior Driver (EU, High Tenure)

**Driver Profile:**
- Age: 70 years old (birthday: 1956-08-25, pickup: 2026-02-16)
- Country: NL (Netherlands - EU)
- License Issue Date: 2000-01-01 (tenure: ~26 years)
- License Expiry: 2030-01-01 (valid)

**Expected Results:**
- ✅ Should show: **Senior Driver Coverage** (ID: 1004)
  - Age > 65, tenure >= 5 years, EU country
  - Base price: 110.00 CHF
  - Calculated: 110.00 × (1 + 0.15 + 0) × 0.95 = 120.18 CHF
- ✅ Should show: **Basic Coverage** (ID: 1001) - fallback
- ❌ Should NOT show: Young Driver (age > 25)
- ❌ Should NOT show: Experienced/Standard (age > 65)
- ❌ Should NOT show: High Risk (age > 25)

**Total Options Expected:** 2

---

## Test Case 5: Non-EU Driver (Standard Age)

**Driver Profile:**
- Age: 30 years old (birthday: 1996-07-12, pickup: 2026-02-16)
- Country: US (United States - Non-EU)
- License Issue Date: 2020-01-01 (tenure: ~6 years)
- License Expiry: 2028-01-01 (valid)

**Expected Results:**
- ✅ Should show: **Experienced Driver Coverage** (ID: 1003)
  - Age 25-65, tenure >= 3 years
  - Base price: 100.00 CHF
  - Calculated: 100.00 × (1 + 0 + 0) × 1.0 = 100.00 CHF (no EU discount)
- ✅ Should show: **Standard Coverage** (ID: 1006)
  - Age 25-65, all countries
  - Base price: 90.00 CHF
  - Calculated: 90.00 × (1 + 0 + 0) × 1.0 = 90.00 CHF
- ✅ Should show: **Basic Coverage** (ID: 1001) - fallback
- ❌ Should NOT show: Young Driver (EU only)
- ❌ Should NOT show: Senior Driver (EU preferred)

**Total Options Expected:** 3

---

## Test Case 6: Invalid License (Expired Soon)

**Driver Profile:**
- Age: 28 years old (birthday: 1998-11-05, pickup: 2026-02-16)
- Country: DE (Germany - EU)
- License Issue Date: 2020-01-01 (tenure: ~6 years)
- License Expiry: 2026-03-01 (expires in ~13 days - INVALID)

**Expected Results:**
- ✅ Should show: **Basic Coverage** (ID: 1001) - fallback only
  - Base price: 80.00 CHF
  - Calculated: 80.00 × 2 = 160.00 CHF (penalty for invalid license)
- ❌ Should NOT show: Any other options (all require valid license)
- ⚠️ Note: Invalid license doubles the premium as penalty

**Total Options Expected:** 1

---

## Test Case 7: Edge Case - Exactly 25 Years Old

**Driver Profile:**
- Age: 25 years old (birthday: 2001-02-16, pickup: 2026-02-16)
- Country: FR (France - EU)
- License Issue Date: 2022-01-01 (tenure: ~4 years)
- License Expiry: 2032-01-01 (valid)

**Expected Results:**
- ✅ Should show: **Experienced Driver Coverage** (ID: 1003)
  - Age 25-65 (inclusive), tenure >= 3 years
- ✅ Should show: **Standard Coverage** (ID: 1006)
  - Age 25-65 (inclusive)
- ✅ Should show: **Basic Coverage** (ID: 1001)
- ❌ Should NOT show: Young Driver (age >= 25, not < 25)
- ❌ Should NOT show: High Risk (age >= 25)

**Total Options Expected:** 3

---

## Test Case 8: Edge Case - Exactly 65 Years Old

**Driver Profile:**
- Age: 65 years old (birthday: 1961-02-16, pickup: 2026-02-16)
- Country: IT (Italy - EU)
- License Issue Date: 2000-01-01 (tenure: ~26 years)
- License Expiry: 2030-01-01 (valid)

**Expected Results:**
- ✅ Should show: **Experienced Driver Coverage** (ID: 1003)
  - Age 25-65 (inclusive), tenure >= 3 years
- ✅ Should show: **Standard Coverage** (ID: 1006)
  - Age 25-65 (inclusive)
- ✅ Should show: **Basic Coverage** (ID: 1001)
- ❌ Should NOT show: Senior Driver (age <= 65, not > 65)
- ❌ Should NOT show: Young Driver (age >= 25)

**Total Options Expected:** 3

---

## Test Case 9: Minimum Age (18 Years Old)

**Driver Profile:**
- Age: 18 years old (birthday: 2008-02-16, pickup: 2026-02-16)
- Country: DE (Germany - EU)
- License Issue Date: 2025-06-01 (tenure: ~0.7 years)
- License Expiry: 2030-06-01 (valid)

**Expected Results:**
- ✅ Should show: **High Risk Coverage** (ID: 1005)
  - Age < 25 AND tenure < 1 year
- ✅ Should show: **Basic Coverage** (ID: 1001)
  - Age >= 18, valid license
- ❌ Should NOT show: Young Driver (tenure >= 3 years required, but has < 1 year)
- ❌ Should NOT show: Experienced/Senior/Standard (age requirements not met)

**Total Options Expected:** 2

---

## Test Case 10: No Matching Criteria (Fallback)

**Driver Profile:**
- Age: 20 years old (birthday: 2006-02-16, pickup: 2026-02-16)
- Country: JP (Japan - Non-EU)
- License Issue Date: 2025-06-01 (tenure: ~0.7 years)
- License Expiry: 2030-06-01 (valid)

**Expected Results:**
- ✅ Should show: **High Risk Coverage** (ID: 1005)
  - Age < 25 AND tenure < 1 year (no country restriction)
- ✅ Should show: **Basic Coverage** (ID: 1001) - fallback
- ❌ Should NOT show: Young Driver (EU countries only)
- ❌ Should NOT show: Senior Driver (EU countries only)

**Total Options Expected:** 2

---

## Calculation Formula Reference

```
calculatedPrice = basePrice × (1 + ageAdjustment + tenureAdjustment) × countryMultiplier

Where:
- ageAdjustment: <25 = 0.2, 25-65 = 0, >65 = 0.15
- tenureAdjustment: <1 = 0.3, 1-3 = 0.15, >=3 = 0
- countryMultiplier: EU = 0.95, others = 1.0
- Invalid license: basePrice × 2 (penalty)
```

## Insurance Options Reference

| ID | Title | Criteria | Base Price |
|----|-------|----------|------------|
| 1001 | Basic Coverage | Age >= 18, valid license | 80.00 CHF |
| 1002 | Young Driver Coverage | Age < 25, tenure < 3, EU only | 120.00 CHF |
| 1003 | Experienced Driver Coverage | Age 25-65, tenure >= 3 | 100.00 CHF |
| 1004 | Senior Driver Coverage | Age > 65, tenure >= 5, EU | 110.00 CHF |
| 1005 | High Risk Coverage | Age < 25 AND tenure < 1 | 150.00 CHF |
| 1006 | Standard Coverage | Age 25-65 | 90.00 CHF |

## Verification Checklist

For each test case, verify:

- [ ] Only eligible insurance options are displayed
- [ ] At least 1 insurance option is always shown
- [ ] Premium calculation matches expected values (within rounding)
- [ ] Selected insurance can be confirmed in Step 5
- [ ] Invalid license shows penalty pricing
- [ ] EU countries get 5% discount (0.95 multiplier)
- [ ] Non-EU countries use 1.0 multiplier (no discount)
- [ ] Age adjustments are applied correctly
- [ ] Tenure adjustments are applied correctly
- [ ] Fallback option appears when no others match

## Notes

- All dates should be in format: YYYY-MM-DD
- License must be valid with at least 30 days remaining
- Age is calculated at pickup date
- Tenure is calculated in years from license issue date to pickup date
- Country codes should match EU_COUNTRIES list for EU discount
- Premiums are rounded to 2 decimal places
