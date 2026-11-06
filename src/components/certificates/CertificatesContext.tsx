"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { sponsorService } from "@/services/sponsor-service";
import { useAppStore } from "@/store/use-app-store";
import type { IssuedCertificate, SponsorPartner } from "@/types/certificates";

const SPONSORS_TTL_MS = 24 * 60 * 60 * 1000;

function readLocalCache<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalCache<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota/full storage
  }
}

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
    // ignore quota/full storage
  }
}

export interface CertificatesContextType {
  siteId: "bkgalabovo" | "recoveryzone";
  isRecoveryZone: boolean;
  sponsors: SponsorPartner[];
  issuedCertificates: IssuedCertificate[];
  isLoadingCertificates: boolean;
  loadSponsors: (forceRefresh?: boolean) => Promise<void>;
  loadIssuedCertificates: () => Promise<void>;
}

const CertificatesContext = createContext<CertificatesContextType | null>(null);

export function CertificatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeBranch } = useAppStore();
  const siteId: "bkgalabovo" | "recoveryzone" =
    activeBranch === "recoveryzone" ? "recoveryzone" : "bkgalabovo";

  const [sponsors, setSponsors] = useState<SponsorPartner[]>([]);
  const [issuedCertificates, setIssuedCertificates] = useState<
    IssuedCertificate[]
  >([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);

  const loadSponsors = useCallback(
    async (forceRefresh = false) => {
      const ttlKey = `bkg_cached_sponsors_ttl_${siteId}`;

      if (!forceRefresh) {
        const fresh = readCacheWithTTL<SponsorPartner>(ttlKey, SPONSORS_TTL_MS);
        if (fresh) {
          setSponsors(fresh);
          return;
        }
      }

      const stale = readLocalCache<SponsorPartner>(
        `bkg_cached_sponsors_${siteId}`
      );
      if (stale) {
        setSponsors(stale);
      }

      try {
        const data = await sponsorService.getSponsors(siteId);
        if (data && data.length > 0) {
          setSponsors(data);
          writeCacheWithTTL(ttlKey, data);
          writeLocalCache(`bkg_cached_sponsors_${siteId}`, data);
        }
      } catch (error) {
        console.warn("Notice loading sponsors from Firestore:", error);
      }
    },
    [siteId]
  );

  const loadIssuedCertificates = useCallback(async () => {
    const cached = readLocalCache<IssuedCertificate>(
      `bkg_cached_certificates_${siteId}`
    );
    if (cached) {
      setIssuedCertificates(cached);
      setIsLoadingCertificates(false);
    }

    try {
      const data =
        await certificateIssuanceService.getIssuedCertificates(siteId);
      if (data && data.length > 0) {
        setIssuedCertificates(data);
        writeLocalCache(`bkg_cached_certificates_${siteId}`, data);
      }
    } catch (error) {
      console.warn("Notice loading certificates from Firestore:", error);
    } finally {
      setIsLoadingCertificates(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  useEffect(() => {
    const cached = readLocalCache<IssuedCertificate>(
      `bkg_cached_certificates_${siteId}`
    );
    if (cached) {
      setIssuedCertificates(cached);
    }
    setIsLoadingCertificates(false);
  }, [siteId]);

  const value: CertificatesContextType = {
    siteId,
    isRecoveryZone: siteId === "recoveryzone",
    sponsors,
    issuedCertificates,
    isLoadingCertificates,
    loadSponsors,
    loadIssuedCertificates,
  };

  return (
    <CertificatesContext.Provider value={value}>
      {children}
    </CertificatesContext.Provider>
  );
}

export function useCertificatesContext(): CertificatesContextType {
  const ctx = useContext(CertificatesContext);
  if (!ctx) {
    throw new Error(
      "useCertificatesContext must be used within a <CertificatesProvider />"
    );
  }
  return ctx;
}
