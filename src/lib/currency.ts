
/**
 * Formats a numeric amount into a currency string based on the provided currency code.
 * This utility ensures consistent currency formatting across the application.
 *
 * @param amount - The numeric value to be formatted.
 * @param currency - The currency code ('BGN' or 'EUR'). Defaults to 'BGN' if not provided or invalid.
 * @returns A formatted string, e.g., "10.00 лв." or "5.50 €".
 */
export const formatCurrency = (amount: number, currency: string = 'BGN'): string => {
  const sanitizedAmount = typeof amount === 'number' ? amount : 0;

  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  const formattedAmount = new Intl.NumberFormat('bg-BG', options).format(sanitizedAmount);

  switch (currency) {
    case 'EUR':
      return `${formattedAmount} €`;
    case 'BGN':
    default:
      return `${formattedAmount} лв.`;
  }
};

/**
 * A simple mapping of currency codes to their symbols.
 */
export const CURRENCY_SYMBOLS: { [key: string]: string } = {
    BGN: 'лв.',
    EUR: '€',
}; 
