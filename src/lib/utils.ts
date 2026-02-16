import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string = '') => {
    const names = name.split(' ').filter(Boolean);
    if (names.length === 0) return '?';
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
}

export const formatFullName = (member: { firstName: string, middleName?: string | null, lastName: string }) => {
    return [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' ');
}

export const getAgeGroup = (birthDate: string): string => {
    const birthDateObj = new Date(birthDate);
    const yearOfBirth = birthDateObj.getFullYear();

    if (yearOfBirth <= 2006) return 'Мъже и жени';
    if (yearOfBirth === 2007 || yearOfBirth === 2008) return 'Под 19 год.';
    if (yearOfBirth === 2009 || yearOfBirth === 2010) return 'Под 17 год.';
    if (yearOfBirth === 2011 || yearOfBirth === 2012) return 'Под 15 год.';
    if (yearOfBirth === 2013 || yearOfBirth === 2014) return 'Под 13 год.';
    if (yearOfBirth === 2015 || yearOfBirth === 2016) return 'Под 11 год.';
    if (yearOfBirth >= 2017) return 'Под 9 години';

    return 'Неопределена';
};
