
const EUR_TO_BGN_RATE = 1.95583;

export const CURRENCY_SYMBOLS: { [key: string]: string } = {
    BGN: 'лв.',
    EUR: '€',
};

/**
 * Formats a price provided in the smallest currency unit (e.g., cents)
 * and displays it converted to both EUR and BGN.
 *
 * @param amountInSmallestUnit - The numeric value in the smallest unit (e.g., 2000 for 20.00 EUR).
 * @param primaryCurrency - The original currency of the amount ('EUR' or 'BGN').
 * @returns A formatted string showing both values, e.g., "20.00 € (39.12 лв.)".
 */
export const formatPriceWithConversion = (amountInSmallestUnit: number, primaryCurrency: 'EUR' | 'BGN'): string => {
  const sanitizedAmount = typeof amountInSmallestUnit === 'number' ? amountInSmallestUnit : 0;
  
  // Convert from smallest unit (cents) to main unit (euros/leva)
  const amountInMainUnit = sanitizedAmount / 100;

  let eurAmount: number;
  let bgnAmount: number;

  // Determine EUR and BGN values based on the primary currency
  if (primaryCurrency === 'EUR') {
    eurAmount = amountInMainUnit;
    bgnAmount = eurAmount * EUR_TO_BGN_RATE;
  } else { // Assumes 'BGN'
    bgnAmount = amountInMainUnit;
    eurAmount = bgnAmount / EUR_TO_BGN_RATE;
  }

  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  // Format both amounts
  const formattedEur = new Intl.NumberFormat('bg-BG', options).format(eurAmount);
  const formattedBgn = new Intl.NumberFormat('bg-BG', options).format(bgnAmount);

  // Return the final string in the format "EUR (BGN)"
  return `${formattedEur} € (${formattedBgn} лв.)`;
};

/**
 * Formats a numeric amount into a string for a single, specified currency.
 * This does NOT handle conversion from smallest units.
 *
 * @param amount - The numeric value to be formatted.
 * @param currency - The currency code (e.g., 'EUR', 'BGN').
 * @returns A formatted currency string, e.g., "10.00 €".
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const sanitizedAmount = typeof amount === 'number' ? amount : 0;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  const formattedAmount = new Intl.NumberFormat('bg-BG', options).format(sanitizedAmount);

  return `${formattedAmount} ${symbol}`;
};
