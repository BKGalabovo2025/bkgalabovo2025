"use client";

import {
  Award,
  FileCheck2,
  Handshake,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { sponsorService } from "@/services/sponsor-service";
import { useAppStore } from "@/store/use-app-store";
import { IssuedCertificate, SponsorPartner } from "@/types/certificates";

import { IssuedCertificatesTab } from "./components/IssuedCertificatesTab";
import { SponsorsTab } from "./components/SponsorsTab";
import { UploadVoucherTab } from "./components/UploadVoucherTab";

const SPONSORS_TTL_MS = 24 * 60 * 60 * 1000; // 24 ч.

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

/** Прочита кеш само ако е по-нов от TTL ms */
function readCacheWithTTL<T>(key: string, ttlMs: number): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T[] };
    if (Date.now() - ts > ttlMs) return null; // изтекъл кеш
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

export function CertificatesClient() {
  const { activeBranch } = useAppStore();
  const siteId =
    activeBranch === "recoveryzone" ? "recoveryzone" : "bkgalabovo";

  const [activeTab, setActiveTab] = useState<"issue" | "issued" | "sponsors">(
    "issue"
  );

  // Sponsors State
  const [sponsors, setSponsors] = useState<SponsorPartner[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(true);

  // Issued Documents Registry State
  const [issuedCertificates, setIssuedCertificates] = useState<
    IssuedCertificate[]
  >([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);

  // 1. Load Sponsors — с 24-часов TTL кеш (0 Firestore четения ако кешът е свеж)
  const loadSponsors = useCallback(
    async (forceRefresh = false) => {
      const ttlKey = `bkg_cached_sponsors_ttl_${siteId}`;

      if (!forceRefresh) {
        // Провери TTL кеша — ако е свеж, СПРИ тук (без Firestore)
        const fresh = readCacheWithTTL<SponsorPartner>(ttlKey, SPONSORS_TTL_MS);
        if (fresh) {
          setSponsors(fresh);
          setIsLoadingSponsors(false);
          return; // ← 0 Firestore четения!
        }
      }

      // Покажи веднага от стар кеш (без TTL) докато зареждаме
      const stale = readLocalCache<SponsorPartner>(
        `bkg_cached_sponsors_${siteId}`
      );
      if (stale) {
        setSponsors(stale);
        setIsLoadingSponsors(false);
      }

      try {
        const data = await sponsorService.getSponsors(siteId);
        if (data && data.length > 0) {
          setSponsors(data);
          writeCacheWithTTL(ttlKey, data); // запиши с TTL
          writeLocalCache(`bkg_cached_sponsors_${siteId}`, data); // запиши и без TTL като fallback
        }
      } catch (error) {
        console.warn("Notice loading sponsors from Firestore:", error);
      } finally {
        setIsLoadingSponsors(false);
      }
    },
    [siteId]
  );

  // 2. Load Issued Documents Registry — САМО при явно действие от потребителя
  // НЕ зарежда автоматично при mount за да пести Firestore четения!
  const loadIssuedCertificates = useCallback(async () => {
    // Покажи веднага от кеш
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

  // Зарежда спонсорите при mount — с TTL кеш (без Firestore ако е свеж)
  useEffect(() => {
    loadSponsors();
  }, [loadSponsors]);

  // Зарежда кешираните сертификати от localStorage при mount (0 Firestore четения)
  useEffect(() => {
    const cached = readLocalCache<IssuedCertificate>(
      `bkg_cached_certificates_${siteId}`
    );
    if (cached) {
      setIssuedCertificates(cached);
    }
    setIsLoadingCertificates(false);
  }, [siteId]);

  const isRecoveryZone = siteId === "recoveryzone";

  return (
    <div className="space-y-6 sm:space-y-8 p-3 sm:p-6 md:p-8">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Award className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Сертификати & Ваучери Студио
            </h1>
          </div>
          <p className="text-xs text-zinc-500 md:text-sm">
            Качване на готови ваучери и грамоти, електронна QR верификация и
            клубен дневник за присъствия
          </p>
        </div>

        {/* Branch / Club indicator */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`rounded-2xl border px-3 py-1 text-xs font-bold ${
              isRecoveryZone
                ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
            }`}
          >
            <Sparkles className="mr-1.5 inline size-3.5" />
            <span>
              {isRecoveryZone
                ? "Recovery Zone by ZM"
                : "БАДМИНТОН КЛУБ ГЪЛЪБОВО"}
            </span>
          </Badge>
        </div>
      </div>

      {/* 2. Main Studio Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          const tab = val as "issue" | "issued" | "sponsors";
          setActiveTab(tab);
          // Sponsors: принудително опресняване само ако потребителят кликне таба
          if (tab === "sponsors") loadSponsors(true);
          // Issued: зарежда от Firestore само при явен клик
          if (tab === "issued") loadIssuedCertificates();
        }}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto sm:h-12 w-full gap-1.5 sm:gap-1 rounded-2xl border border-zinc-200 bg-zinc-100/90 p-1.5 dark:border-zinc-800 dark:bg-zinc-900">
          <TabsTrigger
            value="issue"
            className="flex min-h-11 sm:min-h-0 items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <UploadCloud className="size-4 shrink-0" />
            <span>📤 Издай ваучер / документ</span>
          </TabsTrigger>

          <TabsTrigger
            value="issued"
            className="flex min-h-11 sm:min-h-0 items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <FileCheck2 className="size-4 shrink-0" />
            <span>📜 Издадени ({issuedCertificates.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="sponsors"
            className="flex min-h-11 sm:min-h-0 items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Handshake className="size-4 shrink-0" />
            <span>🤝 Партньори ({sponsors.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Upload Voucher & Issue Electronic Document */}
        <TabsContent value="issue" className="mt-0 outline-none">
          <UploadVoucherTab
            siteId={siteId}
            sponsors={sponsors}
            onIssuedSuccess={async () => {
              await loadIssuedCertificates();
            }}
            onSwitchToRegistry={() => setActiveTab("issued")}
          />
        </TabsContent>

        {/* Tab 2: Issued Documents Registry */}
        <TabsContent value="issued" className="mt-0 outline-none">
          <IssuedCertificatesTab
            siteId={siteId}
            certificates={issuedCertificates}
            isLoading={isLoadingCertificates}
            onRefresh={loadIssuedCertificates}
            onSwitchToIssue={() => setActiveTab("issue")}
          />
        </TabsContent>

        {/* Tab 3: Partners & Sponsors */}
        <TabsContent value="sponsors" className="mt-0 outline-none">
          <SponsorsTab
            siteId={siteId}
            sponsors={sponsors}
            isLoading={isLoadingSponsors}
            onRefresh={loadSponsors}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
