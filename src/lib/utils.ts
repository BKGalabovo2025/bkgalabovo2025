/* eslint-disable @typescript-eslint/no-explicit-any, sonarjs/cognitive-complexity */
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

export const resolveMemberAgeGroup = (
  member?: {
    ageGroup?: string | null;
    dateOfBirth?: any;
    birthDate?: any;
    birthYear?: number | null;
    dob?: any;
  } | null
): string | undefined => {
  if (!member) return undefined;

  if (
    member.ageGroup &&
    typeof member.ageGroup === "string" &&
    member.ageGroup.trim()
  ) {
    return member.ageGroup.trim();
  }

  const rawDob = member.dateOfBirth || member.birthDate || member.dob;
  if (rawDob) {
    if (typeof rawDob?.toDate === "function") {
      const res = getAgeGroup(rawDob.toDate().toISOString());
      if (res && res !== "Неопределена") return res;
    }
    if (typeof rawDob === "object") {
      if ("seconds" in rawDob && typeof rawDob.seconds === "number") {
        const res = getAgeGroup(new Date(rawDob.seconds * 1000).toISOString());
        if (res && res !== "Неопределена") return res;
      }
      if ("_seconds" in rawDob && typeof rawDob._seconds === "number") {
        const res = getAgeGroup(new Date(rawDob._seconds * 1000).toISOString());
        if (res && res !== "Неопределена") return res;
      }
    }
    if (typeof rawDob === "string") {
      const trimmed = rawDob.trim();
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
        const [d, mo, yr] = trimmed.split(".").map(Number);
        const res = getAgeGroup(new Date(yr, mo - 1, d).toISOString());
        if (res && res !== "Неопределена") return res;
      }
      const res = getAgeGroup(trimmed);
      if (res && res !== "Неопределена") return res;
    }
    if (rawDob instanceof Date) {
      const res = getAgeGroup(rawDob.toISOString());
      if (res && res !== "Неопределена") return res;
    }
  }

  if (member.birthYear && typeof member.birthYear === "number") {
    const diff = new Date().getFullYear() - member.birthYear;
    if (diff <= 8) return "U9";
    if (diff <= 10) return "U11";
    if (diff <= 12) return "U13";
    if (diff <= 14) return "U15";
    if (diff <= 16) return "U17";
    if (diff <= 18) return "U19";
    return "Мъже/Жени";
  }

  return undefined;
};

export const getValidAvatarUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/${url}`;
};

/**
 * Sanitizes image URLs to prevent invalid browser protocol errors (e.g. file:/// or local Windows disk paths).
 * Transforms accidental Windows file paths containing /public/ into relative web paths (e.g. /MAGAZIN/...).
 * Returns null if the URL is an unrenderable local file path or invalid.
 */
export const sanitizeImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Handle accidental Windows absolute or file:/// paths
  if (
    trimmed.includes("file:///") ||
    trimmed.includes(":\\") ||
    trimmed.includes(":/")
  ) {
    const normalized = trimmed.replace(/\\/g, "/");
    const publicIndex = normalized.toLowerCase().indexOf("/public/");
    if (publicIndex !== -1) {
      return normalized.substring(publicIndex + "/public".length);
    }
    // Cannot load local disk file on web/mobile browser
    return null;
  }

  // Already a valid web path or remote URL
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Relative asset without leading slash
  return `/${trimmed}`;
};
