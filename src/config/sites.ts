export type SiteConfig = {
  id: string;
  name: string;
  shortName: string;
  domain?: string;
  logoUrl?: string;
  themeColor: string;
  bulstat?: string;
  contact: {
    address: string;
    phone: string;
    email?: string;
    mol?: string;
    website?: string;
  };
};

const SITES: Record<string, SiteConfig> = {
  bkgalabovo: {
    id: "bkgalabovo",
    name: 'СНЦ "Бадминтон клуб Гълъбово"',
    shortName: "Бадминтон клуб Гълъбово",
    domain: "bkgalabovo.com", // This would be the production domain
    themeColor: "#1e3a8a", // Blue
    bulstat: "176641351",
    contact: {
      address:
        "град Гълъбово, п.к 6280, обл. Стара Загора, ул. „Иван Вазов“ №22",
      phone: "+359 899 82 99 23",
      email: "bk_galabovo@abv.bg",
      mol: "Мира Георгиева",
      website: "www.bkgalabovo.alle.bg",
    },
  },
  recoveryzone: {
    id: "recoveryzone",
    name: "Recovery zone by ZM",
    shortName: "recoveryzone",
    themeColor: "#065f46",
    contact: {
      address:
        "град Гълъбово, п.к 6280, обл. Стара Загора, ул. „Иван Вазов“ №22",
      phone: "+359 899 82 99 23",
    },
  },
};

import { useAppStore } from "@/store/use-app-store";

export const getSiteConfig = (): SiteConfig => {
  // Use the activeBranch from the store for runtime switching
  // We use getState() to access it outside of React components
  const activeBranch = useAppStore.getState()?.activeBranch;
  const siteId =
    activeBranch || process.env.NEXT_PUBLIC_SITE_ID || "bkgalabovo";
  return SITES[siteId] || SITES.bkgalabovo;
};

// Маршрути, валидни САМО за бадминтон клуб Гълъбово
const BKG_EXCLUSIVE_PREFIXES = [
  "/training",
  "/tournaments",
  "/rankings",
  "/inventory",
];

// Маршрути, валидни САМО за Recovery Zone
const RZ_EXCLUSIVE_PREFIXES = [
  "/recovery-zone",
  "/recovery",
  "/finances/recovery",
];

/**
 * Проверява дали даден URL маршрут е валиден за избрания клон/сайт.
 */
export function isRouteValidForBranch(
  pathname: string,
  targetBranch: string
): boolean {
  if (!pathname) return true;

  if (targetBranch === "recoveryzone") {
    // В Recovery Zone няма турнири, ранглисти, кортови бадминтон тренировки и инвентар
    const isBkgExclusive = BKG_EXCLUSIVE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    return !isBkgExclusive;
  }

  if (targetBranch === "bkgalabovo") {
    // В бадминтон клуба няма специфични Recovery Zone изгледи за спа/възстановяване
    const isRzExclusive = RZ_EXCLUSIVE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    return !isRzExclusive;
  }

  return true;
}

/**
 * Връща безопасен URL за редирект, ако текущият маршрут не е валиден за новия клон.
 */
export function getSafeRedirectForBranch(
  pathname: string,
  targetBranch: string
): string {
  if (!isRouteValidForBranch(pathname, targetBranch)) {
    return "/dashboard";
  }
  return pathname;
}
