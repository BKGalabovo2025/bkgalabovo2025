
// Официален обменен курс
const EUR_TO_BGN_RATE = 1.95583;

/**
 * Форматира числова сума (приема се, че е в EUR) в низ, показващ стойности и в EUR, и в BGN.
 * Тази функция осигурява консистентно форматиране на валутите в цялото приложение съгласно изискванията за двойно обозначаване.
 *
 * @param amountInEur - Числовата стойност в EUR, която трябва да бъде форматирана.
 * @returns Форматиран низ, например: "10.00 € (19.56 лв.)".
 */
export const formatCurrency = (amountInEur: number): string => {
  const sanitizedAmount = typeof amountInEur === 'number' ? amountInEur : 0;

  // Изчисляване на еквивалента в BGN
  const bgnAmount = sanitizedAmount * EUR_TO_BGN_RATE;

  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  // Форматиране на двете суми
  const formattedEur = new Intl.NumberFormat('bg-BG', options).format(sanitizedAmount);
  const formattedBgn = new Intl.NumberFormat('bg-BG', options).format(bgnAmount);

  // Връщане на крайния низ
  return `${formattedEur} € (${formattedBgn} лв.)`;
};

/**
 * Карта със символи на валутите.
 * Запазва се за евентуална бъдеща употреба, но не се използва активно от новата функция formatCurrency.
 */
export const CURRENCY_SYMBOLS: { [key: string]: string } = {
    BGN: 'лв.',
    EUR: '€',
}; 
