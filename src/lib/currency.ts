
export const BGN_TO_EUR_RATE = 1.95583;

/**
 * Formats a price in EUR to the format "XX.XX EUR (XX.XX лв.)".
 * @param priceInEur The price in EUR.
 * @returns A formatted string with both currencies.
 */
export const formatCurrency = (priceInEur: number | null | undefined): string => {
  if (priceInEur === null || priceInEur === undefined) {
    return "0.00 EUR (0.00 лв.)";
  }

  const priceInBgn = priceInEur * BGN_TO_EUR_RATE;

  const eurString = `${priceInEur.toFixed(2)} EUR`;
  const bgnString = `(${priceInBgn.toFixed(2)} лв.)`;

  return `${eurString} ${bgnString}`;
};

/**
 * Formats a price in BGN to the format "XX.XX лв.".
 * This is for displaying historical data that was recorded in BGN.
 * @param priceInBgn The price in BGN.
 * @returns A formatted string.
 */
export const formatBgnCurrency = (priceInBgn: number | null | undefined): string => {
    if (priceInBgn === null || priceInBgn === undefined) {
        return "0.00 лв.";
    }
    return `${priceInBgn.toFixed(2)} лв.`;
}
