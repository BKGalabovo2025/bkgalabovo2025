
// src/config/prices.ts

/**
 * This file centralizes the pricing for all club services.
 * Use this as the single source of truth for prices to ensure consistency across the app.
 * Prices are stored in the smallest currency unit (e.g., cents for EUR) to avoid floating point issues.
 */

export const SERVICE_PRICES = {
  // === SUBSCRIPTIONS ===
  /** Monthly subscription for Children group */
  SUBSCRIPTION_CHILDREN_MONTHLY: 2000, // 20.00 EUR
  
  /** Monthly membership fee for Amateurs */
  SUBSCRIPTION_AMATEUR_MONTHLY: 3000, // 30.00 EUR

  /** Annual membership fee for Amateurs (e.g., provides a discount) */
  SUBSCRIPTION_AMATEUR_ANNUAL: 30000, // 300.00 EUR

  // === SINGLE VISITS ===
  /** Price for a single visit for a child */
  SINGLE_VISIT_CHILDREN: 700, // 7.00 EUR

  /** Price for a single visit for an amateur */
  SINGLE_VISIT_AMATEUR: 1000, // 10.00 EUR

  // === COURT RENTALS ===
  /** Price for renting a court per hour */
  COURT_RENTAL_PER_HOUR: 1500, // 15.00 EUR
};

export const CURRENCY = 'EUR';
export const CURRENCY_SYMBOL = '€';

/**
 * Formats a price from cents to a human-readable string (e.g., 2000 -> "20.00 €")
 * @param cents The price in cents
 * @returns A formatted string with the currency symbol
 */
export const formatPrice = (cents: number | undefined | null) => {
  if (cents === undefined || cents === null) {
    return `0.00 ${CURRENCY_SYMBOL}`;
  }
  const amount = (cents / 100).toFixed(2);
  return `${amount} ${CURRENCY_SYMBOL}`;
};
