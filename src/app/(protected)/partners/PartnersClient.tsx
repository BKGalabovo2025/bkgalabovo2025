"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SponsorsTab } from "@/app/(protected)/certificates/components/SponsorsTab";
import {
  partnerMatchesSection,
  type PartnerSectionId,
} from "@/components/partners/partner-sections";
import { sponsorService } from "@/services/sponsor-service";
import { useAppStore } from "@/store/use-app-store";
import { SponsorPartner } from "@/types/certificates";

const SPONSORS_TTL_MS = 24 * 60 * 60 * 1000; // 24 ч.

function readCacheWithTTL<T>(key: string, ttlMs: number): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T[] };
    if (Date.now() - ts > ttlMs) return null;
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

function writeCacheWithTTL<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore storage full
  }
}

export function PartnersClient({
  section = "all",
}: {
  section?: PartnerSectionId;
}) {
  const { activeBranch } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("partnerId");
  const isNew = searchParams.get("new") === "true";
  const siteId =
    activeBranch === "recoveryzone" ? "recoveryzone" : "bkgalabovo";

  const [sponsors, setSponsors] = useState<SponsorPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSponsors = useCallback(
    async (forceRefresh = false) => {
      const ttlKey = `bkg_cached_sponsors_ttl_${siteId}`;

      if (!forceRefresh) {
        const fresh = readCacheWithTTL<SponsorPartner>(ttlKey, SPONSORS_TTL_MS);
        if (fresh) {
          setSponsors(fresh);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);
      try {
        const data = await sponsorService.getSponsors(siteId);
        setSponsors(data);
        writeCacheWithTTL(ttlKey, data);
      } catch (error) {
        console.error("Грешка при зареждане на партньори:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [siteId]
  );

  useEffect(() => {
    loadSponsors(false);
  }, [loadSponsors]);

  const visibleSponsors = useMemo(
    () => sponsors.filter((s) => partnerMatchesSection(s.category, section)),
    [sponsors, section]
  );

  const handleDeepLinkChange = (value: string | null) => {
    if (value === null) router.replace(pathname, { scroll: false });
    else if (value === "new")
      router.replace(`${pathname}?new=true`, { scroll: false });
    else router.replace(`${pathname}?partnerId=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <SponsorsTab
        siteId={siteId}
        sponsors={visibleSponsors}
        deepLinkId={partnerId}
        deepLinkNew={isNew}
        onDeepLinkChange={handleDeepLinkChange}
        isLoading={isLoading}
        onRefresh={() => loadSponsors(true)}
      />
    </div>
  );
}
