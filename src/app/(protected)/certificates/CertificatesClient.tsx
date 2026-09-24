"use client";

import {
  Award,
  FileCheck2,
  Handshake,
  Palette,
  Printer,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { certificateTemplateService } from "@/services/certificate-template-service";
import { sponsorService } from "@/services/sponsor-service";
import { useAppStore } from "@/store/use-app-store";
import {
  CertificateTemplate,
  IssuedCertificate,
  SponsorPartner,
} from "@/types/certificates";

import { IssuedCertificatesTab } from "./components/IssuedCertificatesTab";
import { IssueDocumentTab } from "./components/IssueDocumentTab";
import { SponsorsTab } from "./components/SponsorsTab";
import { TemplatesTab } from "./components/TemplatesTab";

export function CertificatesClient() {
  const { activeBranch } = useAppStore();
  const siteId =
    activeBranch === "recoveryzone" ? "recoveryzone" : "bkgalabovo";

  const [activeTab, setActiveTab] = useState<
    "templates" | "issue" | "issued" | "sponsors"
  >("templates");

  // Sponsors State
  const [sponsors, setSponsors] = useState<SponsorPartner[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(true);

  // Templates State
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<
    string | null
  >(null);

  // Issued Documents Registry State
  const [issuedCertificates, setIssuedCertificates] = useState<
    IssuedCertificate[]
  >([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);

  // 1. Load Sponsors
  const loadSponsors = useCallback(async () => {
    try {
      setIsLoadingSponsors(true);
      const data = await sponsorService.getSponsors(siteId);
      setSponsors(data);
    } catch (error) {
      console.error("Грешка при зареждане на спонсори:", error);
      toast.error("Неуспешно зареждане на списъка със спонсори.");
    } finally {
      setIsLoadingSponsors(false);
    }
  }, [siteId]);

  // 2. Load Templates
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true);
      const data = await certificateTemplateService.getTemplates(siteId);
      setTemplates(data);
    } catch (error) {
      console.error("Грешка при зареждане на шаблони:", error);
      toast.error("Неуспешно зареждане на шаблоните.");
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [siteId]);

  // 3. Load Issued Documents Registry
  const loadIssuedCertificates = useCallback(async () => {
    try {
      setIsLoadingCertificates(true);
      const data =
        await certificateIssuanceService.getIssuedCertificates(siteId);
      setIssuedCertificates(data);
    } catch (error) {
      console.error("Грешка при зареждане на регистъра:", error);
      toast.error("Неуспешно зареждане на издадените документи.");
    } finally {
      setIsLoadingCertificates(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadTemplates();
    loadSponsors();
    loadIssuedCertificates();
  }, [loadTemplates, loadSponsors, loadIssuedCertificates]);

  const handleSelectTemplateForIssuance = (templateId: string) => {
    setPreselectedTemplateId(templateId);
    setActiveTab("issue");
  };

  const isRecoveryZone = siteId === "recoveryzone";

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
              <Award className="size-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 md:text-3xl dark:text-white">
              Сертификати & Ваучери Студио
            </h1>
          </div>
          <p className="text-xs text-zinc-500 md:text-sm">
            Дигитална система за грамоти, персонални ваучери с QR код и
            управление на клубни спонсори
          </p>
        </div>

        {/* Branch / Club indicator */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`rounded-2xl border px-3.5 py-1.5 text-xs font-bold ${
              isRecoveryZone
                ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
            }`}
          >
            <Sparkles className="mr-1.5 inline size-3.5" />
            <span>
              {isRecoveryZone ? "Recovery Zone by ZM" : "БК Гълъбово 2025"}
            </span>
          </Badge>
        </div>
      </div>

      {/* 2. Main Studio Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          const tab = val as "templates" | "issue" | "issued" | "sponsors";
          setActiveTab(tab);
          if (tab === "templates") loadTemplates();
          if (tab === "issue") loadTemplates();
          if (tab === "sponsors") loadSponsors();
          if (tab === "issued") loadIssuedCertificates();
        }}
        className="space-y-6"
      >
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-zinc-200 bg-zinc-100/80 p-1 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
          <TabsTrigger
            value="templates"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Palette className="size-3.5" />
            <span>🎨 Шаблони & AI ({templates.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="issue"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Printer className="size-3.5" />
            <span>🖨️ Издай документ</span>
          </TabsTrigger>

          <TabsTrigger
            value="issued"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <FileCheck2 className="size-3.5" />
            <span>📜 Издадени ({issuedCertificates.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="sponsors"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Handshake className="size-3.5" />
            <span>🤝 Спонсори ({sponsors.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visual Designer / Templates & AI Generator */}
        <TabsContent value="templates" className="mt-0 outline-none">
          <TemplatesTab
            siteId={siteId}
            templates={templates}
            sponsors={sponsors}
            isLoading={isLoadingTemplates}
            onRefresh={loadTemplates}
            onSelectForIssuance={handleSelectTemplateForIssuance}
          />
        </TabsContent>

        {/* Tab 2: Issue Document */}
        <TabsContent value="issue" className="mt-0 outline-none">
          <IssueDocumentTab
            siteId={siteId}
            templates={templates}
            sponsors={sponsors}
            preselectedTemplateId={preselectedTemplateId}
            onIssuedSuccess={async () => {
              await loadIssuedCertificates();
            }}
            onSwitchToRegistry={() => setActiveTab("issued")}
            onOpenTemplates={() => setActiveTab("templates")}
          />
        </TabsContent>

        {/* Tab 3: Issued Documents Registry */}
        <TabsContent value="issued" className="mt-0 outline-none">
          <IssuedCertificatesTab
            siteId={siteId}
            certificates={issuedCertificates}
            isLoading={isLoadingCertificates}
            onRefresh={loadIssuedCertificates}
            onSwitchToIssue={() => setActiveTab("issue")}
          />
        </TabsContent>

        {/* Tab 4: Partners & Sponsors */}
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
