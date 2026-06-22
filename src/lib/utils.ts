import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name: string = "") => {
  const names = name.split(" ").filter(Boolean);
  if (names.length === 0) return "?";
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
};

export const formatFullName = (member: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) => {
  return [member.firstName, member.middleName, member.lastName]
    .filter(Boolean)
    .join(" ");
};

export const getAgeGroup = (birthDate: string): string => {
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return "Неопределена";

  const birthYear = dob.getFullYear();
  const currentYear = new Date().getFullYear();
  const diff = currentYear - birthYear;

  if (diff <= 8) return "U9";
  if (diff === 9 || diff === 10) return "U11";
  if (diff === 11 || diff === 12) return "U13";
  if (diff === 13 || diff === 14) return "U15";
  if (diff === 15 || diff === 16) return "U17";
  if (diff === 17 || diff === 18) return "U19";
  if (diff >= 19) return "Мъже/Жени";

  return "Неопределена";
};

