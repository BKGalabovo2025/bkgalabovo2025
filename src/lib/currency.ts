// The official BGN to EUR conversion rate for reference purposes.
export const BGN_TO_EUR_RATE = 1.95583;

/**
 * Formats a given numeric value as a currency string, ALWAYS in EUR.
 * This is the single, centralized function for displaying prices in the application.
 * It uses the Bulgarian locale ('bg-BG') to ensure correct formatting with a comma for the decimal separator.
 * 
 * IMPORTANT: The value is expected to be a whole number representing the main currency unit (e.g., 20 for 20 EUR).
 * 
 * @param value The numeric value to be formatted.
 * @returns A string representing the formatted currency, e.g., "20,00 €".
 */
export const formatPrice = (value: number) => {
    const numberValue = typeof value === 'number' ? value : 0;

    return new Intl.NumberFormat('bg-BG', {
        style: 'currency',
        currency: 'EUR', // The currency is hardcoded to EUR.
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue / 100); // Divide by 100 to convert from cents to EUR
};
