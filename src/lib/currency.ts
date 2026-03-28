
/**
 * Formats a given numeric value into a EUR currency string.
 * This is the single, centralized function for displaying prices in the application.
 * It uses the Bulgarian locale ('bg-BG') to ensure correct formatting with a comma for the decimal separator.
 * 
 * IMPORTANT: The value is expected to be a numeric value representing Euros.
 * 
 * @param value The numeric value to be formatted.
 * @returns A string representing the formatted currency (e.g., "10,50 €").
 */
export const formatPrice = (value: number) => {
    const numberValue = typeof value === 'number' ? value : 0;

    return new Intl.NumberFormat('bg-BG', {
        style: 'currency',
        currency: 'EUR', // Always format as EUR
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numberValue);
};
