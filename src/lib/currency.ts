
/**
 * Formats a given numeric value into a EUR currency string.
 * This is the single, centralized function for displaying prices in the application.
 * It uses the Bulgarian locale ('bg-BG') to ensure correct formatting with a comma for the decimal separator.
 * 
 * IMPORTANT: The value is expected to be a whole number representing the smallest currency unit (e.g., Euro cents).
 * For example, to display €10.50, the input value should be 1050.
 * 
 * @param valueInCents The numeric value to be formatted, in Euro cents.
 * @returns A string representing the formatted currency (e.g., "10,50 €").
 */
export const formatPrice = (valueInCents: number) => {
    const numberValue = typeof valueInCents === 'number' ? valueInCents : 0;

    // We divide by 100 to convert from cents to Euros
    const valueInEuros = numberValue / 100;

    return new Intl.NumberFormat('bg-BG', {
        style: 'currency',
        currency: 'EUR', // Always format as EUR
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valueInEuros);
};
