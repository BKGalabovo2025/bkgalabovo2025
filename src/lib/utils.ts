
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DocumentData, DocumentSnapshot } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Определя възрастовата група на член на базата на годината на раждане.
 * Логиката е базирана на състезателната година, която започва от 1-ви януари.
 * @param dateOfBirth - Дата на раждане в ISO формат (напр. 'YYYY-MM-DDTHH:mm:ss.sssZ').
 * @returns {string} Възрастовата група (напр. "U9", "U17", "МЪЖЕ/ЖЕНИ").
 */
export const getAgeGroup = (dateOfBirth: string): string => {
  if (!dateOfBirth || isNaN(new Date(dateOfBirth).getFullYear())) {
    return 'Н/Д';
  }

  const birthYear = new Date(dateOfBirth).getFullYear();
  const currentYear = new Date().getFullYear();

  // U9: родени currentYear - 8 или currentYear - 7
  if (birthYear >= currentYear - 8 && birthYear <= currentYear - 7) {
    return 'U9';
  }
  // U11: родени currentYear - 10 или currentYear - 9
  if (birthYear >= currentYear - 10 && birthYear <= currentYear - 9) {
    return 'U11';
  }
  // U13: родени currentYear - 12 или currentYear - 11
  if (birthYear >= currentYear - 12 && birthYear <= currentYear - 11) {
    return 'U13';
  }
  // U15: родени currentYear - 14 или currentYear - 13
  if (birthYear >= currentYear - 14 && birthYear <= currentYear - 13) {
    return 'U15';
  }
  // U17: родени currentYear - 16 или currentYear - 15
  if (birthYear >= currentYear - 16 && birthYear <= currentYear - 15) {
    return 'U17';
  }
  // U19: родени currentYear - 18 или currentYear - 17
  if (birthYear >= currentYear - 18 && birthYear <= currentYear - 17) {
    return 'U19';
  }
  // М/Ж: родени преди currentYear - 18
  if (birthYear <= currentYear - 19) {
    return 'М/Ж';
  }

  // За деца, по-малки от U9
  const age = currentYear - birthYear;
  if (age < 7) {
    return 'Деца';
  }

  return 'Н/Д'; // Резервен вариант, ако не попадне в никоя група
};

export const processSubscription = (doc: DocumentSnapshot<DocumentData>) => {
  const data = doc.data();
  const sub = {
    id: doc.id,
    name: data?.name || 'Н/Д',
    status: data?.status || 'неактивен',
    plan: data?.plan?.name || 'Н/Д',
    price: data?.plan?.price || 0,
    currency: data?.plan?.currency || 'EUR', // Add currency, default to EUR
    startDate: data?.startDate
      ? new Date(data.startDate.seconds * 1000).toLocaleDateString('bg-BG')
      : 'Н/Д',
    endDate: data?.endDate
      ? new Date(data.endDate.seconds * 1000).toLocaleDateString('bg-BG')
      : 'Н/Д',
    email: data?.email || 'Н/Д',
  };
  return sub;
};
