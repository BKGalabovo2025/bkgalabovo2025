"use client";

import { collection, getDocs, query } from "firebase/firestore";
import { FileText, History, Loader2, Megaphone, Send, Zap } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useMembers } from "@/hooks/useMembers";
import { db } from "@/lib/firebase";
import { marketingService } from "@/services/marketing-service";
import { useAppStore } from "@/store/use-app-store";
import {
  MarketingAutomationRule,
  MarketingChannel,
  MarketingLog,
  MarketingRecipient,
  MarketingStats,
  MarketingTemplate,
} from "@/types/marketing.types";

import { MarketingAutomationsTab } from "./components/MarketingAutomationsTab";
import { MarketingComposerTab } from "./components/MarketingComposerTab";
import { MarketingHistoryTab } from "./components/MarketingHistoryTab";
import { MarketingTemplatesTab } from "./components/MarketingTemplatesTab";

function getMemberRole(m: {
  isCoach?: boolean;
  isGuest?: boolean;
}): "athlete" | "parent" | "member" | "guest" {
  if (m.isCoach) return "member";
  if (m.isGuest) return "guest";
  return "athlete";
}

export default function MarketingClient() {
  const { activeBranch } = useAppStore();
  const siteId = activeBranch || "bkgalabovo";
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers();

  const [activeTab, setActiveTab] = useState<
    "composer" | "templates" | "history" | "automations"
  >("composer");

  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [selectedTemplateForComposer, setSelectedTemplateForComposer] =
    useState<MarketingTemplate | null>(null);
  const [history, setHistory] = useState<MarketingLog[]>([]);
  const [clientsList, setClientsList] = useState<MarketingRecipient[]>([]);
  const [stats, setStats] = useState<MarketingStats>({
    totalSent: 0,
    sentThisMonth: 0,
    byChannel: { whatsapp: 0, viber: 0, sms: 0, email: 0 },
    activeRecipientsCount: 0,
  });
  const [automationRules, setAutomationRules] = useState<
    MarketingAutomationRule[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Map club members & recovery clients to uniform MarketingRecipient entities
  const recipients: MarketingRecipient[] = useMemo(() => {
    if (siteId === "recoveryzone" && clientsList.length > 0) {
      return clientsList;
    }

    return members.map((m) => {
      const isParentPhone = m.phoneType === "parent";
      const athleteFullName =
        m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim();
      const parentName =
        m.emergencyContactName || (isParentPhone ? "Родител" : undefined);

      return {
        id: m.id,
        name: athleteFullName,
        childName: isParentPhone ? athleteFullName : undefined,
        parentName: parentName,
        role: getMemberRole(m),
        phone: m.phone || m.emergencyContactPhone || undefined,
        email: m.email || undefined,
        status: m.status === "active" ? "active" : "inactive",
        group: m.ageGroup || "Обща група",
        siteId: m.siteId || siteId,
      };
    });
  }, [members, clientsList, siteId]);

  // Load all marketing data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tmpls, hist, st, rules] = await Promise.all([
        marketingService.getTemplates(siteId),
        marketingService.getHistory(siteId, 200),
        marketingService.getMarketingStats(siteId),
        marketingService.getAutomationRules(siteId),
      ]);
      setTemplates(tmpls);
      setHistory(hist);
      setStats(st);
      setAutomationRules(rules);

      if (siteId === "recoveryzone") {
        try {
          const clientsSnap = await getDocs(query(collection(db, "clients")));
          const recoveryRecipients: MarketingRecipient[] = clientsSnap.docs.map(
            (docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                name: data.name || data.fullName || "Клиент",
                phone: data.phone || undefined,
                email: data.email || undefined,
                role: "athlete" as const,
                status: "active" as const,
                group: "Recovery Zone Клиенти",
                siteId: "recoveryzone",
              };
            }
          );
          setClientsList(recoveryRecipients);
        } catch {
          setClientsList([]);
        }
      } else {
        setClientsList([]);
      }
    } catch (e) {
      console.error("Failed to load marketing data:", e);
      toast.error("Възникна проблем при зареждането на данните.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Handle template selection from Templates tab to Composer tab
  const handleSelectTemplateForComposer = (tmpl: MarketingTemplate) => {
    setSelectedTemplateForComposer(tmpl);
    setActiveTab("composer");
  };

  // CRUD for templates
  const handleCreateTemplate = async (
    data: Omit<MarketingTemplate, "id" | "siteId" | "createdAt">
  ) => {
    await marketingService.createTemplate(siteId, data);
    const updated = await marketingService.getTemplates(siteId);
    setTemplates(updated);
  };

  const handleUpdateTemplate = async (
    id: string,
    data: Partial<Omit<MarketingTemplate, "id" | "siteId" | "createdAt">>
  ) => {
    await marketingService.updateTemplate(id, data);
    const updated = await marketingService.getTemplates(siteId);
    setTemplates(updated);
  };

  const handleDeleteTemplate = async (id: string) => {
    await marketingService.deleteTemplate(id);
    const updated = await marketingService.getTemplates(siteId);
    setTemplates(updated);
  };

  // Batch Sending Handler
  const handleSendBatch = async (
    channel: MarketingChannel,
    selectedRecipients: MarketingRecipient[],
    messageText: string,
    emailSubject: string
  ) => {
    setIsSending(true);
    try {
      // Build log entries for all recipients
      const logEntries = selectedRecipients.map((r) => {
        const recipientName = r.name || r.parentName || "Член";
        const childName = r.childName || r.name;
        const personalized = messageText
          .replace(/{ИМЕ}/g, recipientName)
          .replace(/{ДЕТЕ}/g, childName)
          .replace(/{СЪБИТИЕ}/g, "Клубно събитие")
          .replace(/{ДАТА}/g, "15-20 юли")
          .replace(/{ЧАС}/g, "18:00 ч.")
          .replace(/{ЛОКАЦИЯ}/g, "Спортна зала Гълъбово")
          .replace(/{ЛИНК}/g, "https://bkgalabovo.bg")
          .replace(
            /{ЛИНК_АНКЕТА}/g,
            "https://bkgalabovo2025.vercel.app/feedback/sample"
          );

        return {
          siteId,
          recipientId: r.id,
          recipientName: r.name,
          recipientPhone: r.phone,
          recipientEmail: r.email,
          channel,
          messageText: personalized,
          templateUsed: selectedTemplateForComposer?.title || "Ръчно съставено",
          status: "sent" as const,
          sentBy: user?.uid || "admin",
        };
      });

      // Write logs in batch to Firestore
      await marketingService.logBatchMessages(logEntries);

      // If single recipient and email/whatsapp, open automatically
      if (selectedRecipients.length === 1) {
        const single = selectedRecipients[0];
        const text = logEntries[0].messageText;
        if (channel === "whatsapp" && single.phone) {
          const cleanPhone = single.phone.replace(/\D/g, "");
          const finalPhone = cleanPhone.startsWith("0")
            ? "359" + cleanPhone.substring(1)
            : cleanPhone;
          window.open(
            `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`,
            "_blank"
          );
        } else if (channel === "email" && single.email) {
          window.open(
            `mailto:${single.email}?subject=${encodeURIComponent(
              emailSubject || "Известие от БК Гълъбово"
            )}&body=${encodeURIComponent(text)}`,
            "_blank"
          );
        }
      }

      toast.success(
        `Кампанията беше изпратена и регистрирана успешно за ${selectedRecipients.length} получатели!`
      );

      // Refresh history and stats
      const [hist, st] = await Promise.all([
        marketingService.getHistory(siteId, 200),
        marketingService.getMarketingStats(siteId),
      ]);
      setHistory(hist);
      setStats(st);
    } catch (e) {
      console.error("Error dispatching marketing campaign:", e);
      toast.error("Възникна грешка при изпращането на кампанията.");
      throw e;
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    await marketingService.deleteMarketingLog(id);
    const [hist, st] = await Promise.all([
      marketingService.getHistory(siteId, 200),
      marketingService.getMarketingStats(siteId),
    ]);
    setHistory(hist);
    setStats(st);
  };

  const handleClearHistory = async () => {
    await marketingService.clearMarketingHistory(siteId);
    const [hist, st] = await Promise.all([
      marketingService.getHistory(siteId, 200),
      marketingService.getMarketingStats(siteId),
    ]);
    setHistory(hist);
    setStats(st);
  };

  const handleToggleAutomation = async (id: string, isActive: boolean) => {
    await marketingService.toggleAutomationRule(id, isActive);
    const updated = await marketingService.getAutomationRules(siteId);
    setAutomationRules(updated);
  };

  if (isLoading || membersLoading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      {/* 1. Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <Megaphone className="size-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 uppercase dark:text-white">
              Маркетинг & Комуникация
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            Мултиканални съобщения, шаблони за лагери и турнири, история и
            автоматизирани известия
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            {recipients.length} активни контакта
          </Badge>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(
            v as "composer" | "templates" | "history" | "automations"
          )
        }
        className="space-y-6"
      >
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-zinc-200 bg-zinc-100/80 p-1 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
          <TabsTrigger
            value="composer"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Send className="size-3.5" />
            <span>🚀 Бързо изпращане</span>
          </TabsTrigger>

          <TabsTrigger
            value="templates"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <FileText className="size-3.5" />
            <span>📑 Шаблони ({templates.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <History className="size-3.5" />
            <span>📊 История & KPI</span>
          </TabsTrigger>

          <TabsTrigger
            value="automations"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Zap className="size-3.5" />
            <span>⚡ Автоматизации</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Composer */}
        <TabsContent
          value="composer"
          className="space-y-4 focus-visible:outline-hidden"
        >
          <MarketingComposerTab
            recipients={recipients}
            templates={templates}
            selectedTemplate={selectedTemplateForComposer}
            onSendBatch={handleSendBatch}
            isSending={isSending}
          />
        </TabsContent>

        {/* Tab 2: Templates */}
        <TabsContent
          value="templates"
          className="space-y-4 focus-visible:outline-hidden"
        >
          <MarketingTemplatesTab
            templates={templates}
            onSelectTemplate={handleSelectTemplateForComposer}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </TabsContent>

        {/* Tab 3: History & Analytics */}
        <TabsContent
          value="history"
          className="space-y-4 focus-visible:outline-hidden"
        >
          <MarketingHistoryTab
            history={history}
            stats={stats}
            onDeleteLog={handleDeleteLog}
            onClearHistory={handleClearHistory}
          />
        </TabsContent>

        {/* Tab 4: Automations */}
        <TabsContent
          value="automations"
          className="space-y-4 focus-visible:outline-hidden"
        >
          <MarketingAutomationsTab
            rules={automationRules}
            onToggleRule={handleToggleAutomation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
