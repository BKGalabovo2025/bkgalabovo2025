// The official BGN to EUR conversion rate for reference purposes.
export const BGN_TO_EUR_RATE = 1.95583;

/**
 * Formats a given numeric value as a currency string, ALWAYS in EUR.
 * This is the single, centralized function for displaying prices in the application.
 * It uses the Bulgarian locale ('bg-BG') to ensure correct formatting with a comma for the decimal separator.
 * 
 * IMPORTANT: The value is expected to be in cents and will be divided by 100.
 * 
 * @param value The numeric value to be formatted, in cents.
 * @returns A string representing the formatted currency, e.g., "1,234.56 €".
 */
export const formatPrice = (value: number) => {
    const numberValue = typeof value === 'number' ? value : 0;
    const valueInEur = numberValue / 100;

    return new Intl.NumberFormat('bg-BG', {
        style: 'currency',
        currency: 'EUR', // The currency is hardcoded to EUR.
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valueInEur);
};
