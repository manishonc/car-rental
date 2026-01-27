# Guide: How to Create and Edit Insurance Options

This guide explains how to add or change insurance plans in simple terms.  
**File to edit:** `client/lib/config/insurance.ts`

---

## 1. What Each Insurance Plan Needs

Every insurance option has two parts:

1. **Basic details** — name, price, deposit, etc.
2. **Eligibility rules** — who can get this plan (age, license tenure, country)

---

## 2. Basic Details (What the Customer Sees)

| Field | What it means | Example |
|-------|----------------|---------|
| **id** | Unique number for this plan. Use 1001, 1002, 1003… and never reuse. | `1001` |
| **title** | Name of the plan shown to the customer. | `"Basic Coverage"` |
| **type** | How the price is calculated. Use `"Fix"` for a fixed price. | `"Fix"` |
| **value** | Base value (same as price when type is Fix). | `"80.00"` |
| **price** | The price in the main currency (e.g. CHF). | `"80.00"` |
| **price_title** | Extra text after the price (e.g. `/ day`). Leave `""` if not needed. | `""` or `"/ day"` |
| **icon** | Icon style. Use: `insur-min`, `insur-mid`, or `insur-max`. | `"insur-min"` |
| **deposit** | Is a deposit required? `1` = yes, `0` = no. | `1` or `0` |
| **deposit_price** | Deposit amount. Use `"0.00"` when deposit is 0. | `"250.00"` |
| **damage** | Is there a damage/excess amount? `1` = yes, `0` = no. | `1` or `0` |
| **damage_access** | Damage/excess amount. Use `"0.00"` when damage is 0. | `"250.00"` |
| **checked** | Should this plan be pre-selected? `true` or `false`. Only one should be `true`. | `true` or `false` |

---

## 3. Eligibility Rules (Who Can Get This Plan)

These rules decide if a customer qualifies for the plan. All rules you set must be satisfied.

| Rule | What it means | Example |
|------|--------------|---------|
| **minAge** | Customer must be at least this age (in years). | `18` → 18 or older |
| **maxAge** | Customer must be at most this age. | `24` → 24 or younger (under 25) |
| **minTenure** | Customer must have held their **driving license for at least** this many years. | `3` → 3+ years with a license |
| **maxTenure** | Customer must have held their **driving license for at most** this many years. | `2.99` → less than 3 years with a license |
| **allowedCountries** | Only customers from these countries (by country code). | `['CH', 'DE', 'FR']` or `EU_COUNTRIES` |
| **blockedCountries** | Customers from these countries cannot get this plan. | `['XY']` |
| **requiresValidLicense** | Customer must have a valid license. Usually `true`. | `true` |

**Tenure in simple words:**  
**Tenure = How many years the customer has had their driving license.**  
- `minTenure: 3` → at least 3 years  
- `maxTenure: 2.99` → less than 3 years  
- `maxTenure: 0.99` → less than 1 year (new drivers)

---

## 4. Special Flags

| Flag | What it means |
|------|----------------|
| **isFallback: true** | Use this plan when **no other** plan’s rules match. Only **one** plan in the list should have `isFallback: true`. It’s your “default” or “basic” option. |
| **eligibilityCriteria** | If you omit it, the plan is offered to everyone (as long as other logic allows). Use it when the plan is only for certain ages, tenure, or countries. |

---

## 5. Country Codes

- Use **2-letter codes** (e.g. `CH`, `DE`, `FR`, `AT`).
- There is a ready-made list **EU_COUNTRIES** in the file. Use `allowedCountries: EU_COUNTRIES` to restrict a plan to EU countries.

---

## 6. How to Add a New Insurance Plan

1. Open `client/lib/config/insurance.ts`.
2. Find the `insuranceOptions` array (the list `[ ... ]`).
3. Copy an existing plan (e.g. Basic Coverage) as a template.
4. Change:
   - **id** to a new number (e.g. 1007) that is not used elsewhere.
   - **title**, **price**, **deposit_price**, **damage_access**, etc., to your values.
   - **eligibilityCriteria** to your rules (age, tenure, countries). If the plan is for everyone, you can leave eligibility simple (e.g. only `minAge` and `requiresValidLicense`) or match your “standard” plan.
5. Do **not** set `isFallback: true` unless this new plan should be the one used when no other plan matches.
6. Add a comma after the previous plan and paste your new plan before the closing `];`.

---

## 7. How to Change an Existing Plan

1. Open `client/lib/config/insurance.ts`.
2. Find the plan by **title** or **id**.
3. Edit only the fields you want to change (price, eligibility, deposit, etc.).
4. Save the file. The app will use the updated values.

---

## 8. Common Patterns

- **Young drivers (e.g. under 25, new license):**  
  `maxAge: 24`, `maxTenure: 2.99` (or `0.99` for very new drivers).

- **Experienced drivers (e.g. 25–65, 3+ years license):**  
  `minAge: 25`, `maxAge: 65`, `minTenure: 3`.

- **Senior drivers (e.g. 66+):**  
  `minAge: 66`, and often `minTenure: 5` and `allowedCountries: EU_COUNTRIES`.

- **Default / everyone else:**  
  Loose rules (e.g. only `minAge: 18`) and `isFallback: true`.

---

## 9. Important Notes

- **IDs must be unique** — no two plans can share the same `id`.
- **Exactly one plan** should have `isFallback: true`.
- **Prices and amounts** are strings with 2 decimals, e.g. `"80.00"`, `"0.00"`.
- **deposit** and **damage** are numbers: `0` or `1` only.
- If you use both `minTenure` and `maxTenure`, the customer’s license years must fall **between** them.

---

## 10. Where to Get Help

- **Technical / code:** Ask your development team.
- **Business rules (who should get which plan, prices):** Check with your insurance or product team.
