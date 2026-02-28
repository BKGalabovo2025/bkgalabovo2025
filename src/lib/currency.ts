// The official BGN to EUR conversion rate for reference purposes.
export const BGN_TO_EUR_RATE = 1.95583;

/**
 * Formats a given numeric value as a currency string.
 * This is the single, centralized function for displaying prices in the application.
 * It uses the Bulgarian locale ('bg-BG') to ensure correct formatting with a comma for the decimal separator.
 * 
 * IMPORTANT: The value is expected to be a whole number representing the smallest currency unit (e.g., stotinki).
 * 
 * @param value The numeric value to be formatted, in smallest currency unit.
 * @param currency The currency to format in. Defaults to 'BGN'.
 * @returns A string representing the formatted currency.
 */
export const formatPrice = (value: number, currency: string = 'BGN') => {
    const numberValue = typeof value === 'number' ? value : 0;

    return new Intl.NumberFormat('bg-BG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue / 100); // Divide by 100 to convert from smallest unit
};
