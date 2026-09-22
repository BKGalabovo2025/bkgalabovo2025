"use client";

import {
  Clock,
  FileText,
  History,
  Inbox,
  Loader2,
  Mail,
  Megaphone,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  Users,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CallLogDialog } from "@/components/marketing/CallLogDialog";
import { ContactCard } from "@/components/marketing/ContactCard";
import { QuickEmailDialog } from "@/components/marketing/QuickEmailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useMembers } from "@/hooks/useMembers";
import {
  getRecoveryClientsAction,
  updateRecoveryClientCommunicationAction,
} from "@/lib/actions/recovery-services-server";
import { marketingService } from "@/services/marketing-service";
import { useAppStore } from "@/store/use-app-store";
import {
  ContactCommunicationStatus,
  MarketingAutomationRule,
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

function getMemberGroupName(
  isRecovery: boolean,
  ageGroup?: string | null,
  isParentPhone?: boolean
): string {
  if (isRecovery) return "Recovery Членове";
  if (ageGroup) return ageGroup;
  if (isParentPhone) return "Родители";
  return "Състезатели";
}

export default function MarketingClient() {
  const { activeBranch } = useAppStore();
  const siteId = activeBranch || "bkgalabovo";
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers();

  const [activeTab, setActiveTab] = useState<
    "contacts" | "composer" | "templates" | "history" | "automations"
  >("contacts");

  const [templates, setTemplates] = useState<MarketingTemplate[]>(() =>
    marketingService.getDefaultTemplates()
  );
  const [selectedTemplateForComposer, setSelectedTemplateForComposer] =
    useState<MarketingTemplate | null>(null);
  const [history, setHistory] = useState<MarketingLog[]>([]);
  const [clientsList, setClientsList] = useState<MarketingRecipient[]>([]);
  const [stats, setStats] = useState<MarketingStats>({
    totalSent: 0,
    sentThisMonth: 0,
    byChannel: { phone: 0, email: 0 },
    activeRecipientsCount: 0,
    callsCount: 0,
    emailsCount: 0,
  });
  const [automationRules, setAutomationRules] = useState<
    MarketingAutomationRule[]
  >(() => marketingService.getDefaultAutomationRules(siteId));

  // Local contact communication status overrides
  const [statusOverrides, setStatusOverrides] = useState<
    Record<
      string,
      {
        status: ContactCommunicationStatus;
        notes?: string;
        lastContactAt?: string;
        lastContactType?: "phone" | "email";
      }
    >
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  // CRM Contact Filter State
  const [contactSearch, setContactSearch] = useState("");
  const [contactBranchFilter, setContactBranchFilter] = useState<string>("all");
  const [contactStatusFilter, setContactStatusFilter] = useState<string>("all");
  const [contactSegmentFilter, setContactSegmentFilter] =
    useState<string>("all");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set()
  );

  // Dialog states
  const [callingContact, setCallingContact] =
    useState<MarketingRecipient | null>(null);
  const [emailingRecipients, setEmailingRecipients] = useState<
    MarketingRecipient[]
  >([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Retrieve user ID token for direct SMTP sending
  useEffect(() => {
    if (user) {
      user.getIdToken().then(setIdToken).catch(console.error);
    }
  }, [user]);

  // Load all marketing data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tmpls, hist, st, rules] = await Promise.all([
        marketingService.getAllTemplates(),
        marketingService.getHistory(siteId, 200),
        marketingService.getMarketingStats(siteId),
        marketingService.getAutomationRules(siteId),
      ]);
      setTemplates(tmpls);
      setHistory(hist);
      setStats(st);
      setAutomationRules(rules);

      try {
        const clientsRes = await getRecoveryClientsAction(siteId);
        if (clientsRes.success && Array.isArray(clientsRes.data)) {
          const recoveryRecipients: MarketingRecipient[] = clientsRes.data.map(
            (data: {
              id: string;
              name?: string;
              fullName?: string;
              phone?: string;
              email?: string;
              communicationStatus?: ContactCommunicationStatus;
              notes?: string;
              lastContactAt?: string;
              lastContactType?: "phone" | "email";
            }) => {
              return {
                id: data.id,
                name: data.name || data.fullName || "Клиент",
                phone: data.phone || undefined,
                email: data.email || undefined,
                role: "athlete" as const,
                status: "active" as const,
                communicationStatus:
                  data.communicationStatus || ("pending" as const),
                notes: data.notes || undefined,
                lastContactAt: data.lastContactAt || undefined,
                lastContactType: data.lastContactType || undefined,
                group: "Recovery Zone Клиенти",
                siteId: "recoveryzone",
              };
            }
          );
          setClientsList(recoveryRecipients);
        } else {
          setClientsList([]);
        }
      } catch {
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

  // Unified list of all recipients (badminton members + recovery clients)
  const allRecipients: MarketingRecipient[] = useMemo(() => {
    const memberRecipients: MarketingRecipient[] = members.map((m) => {
      const isParentPhone = m.phoneType === "parent";
      const athleteFullName =
        m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim();
      const parentName =
        m.emergencyContactName || (isParentPhone ? "Родител" : undefined);
      const isRecovery =
        m.isRecoveryMember ||
        m.memberType === "recovery" ||
        m.siteId === "recoveryzone";

      return {
        id: m.id,
        name: athleteFullName,
        childName: isParentPhone ? athleteFullName : undefined,
        parentName: parentName,
        role: getMemberRole(m),
        phone: m.phone || m.emergencyContactPhone || undefined,
        email: m.email || undefined,
        status:
          m.status === "active" ? ("active" as const) : ("inactive" as const),
        communicationStatus: "pending" as const,
        group: getMemberGroupName(isRecovery, m.ageGroup, isParentPhone),
        siteId: isRecovery ? "recoveryzone" : "bkgalabovo",
      };
    });

    // Merge members with recovery clients
    const combined = [...memberRecipients, ...clientsList];

    // Apply any local status overrides
    return combined.map((r) => {
      const override = statusOverrides[r.id];
      if (override) {
        return {
          ...r,
          communicationStatus: override.status,
          notes: override.notes ?? r.notes,
          lastContactAt: override.lastContactAt ?? r.lastContactAt,
          lastContactType: override.lastContactType ?? r.lastContactType,
        };
      }
      return r;
    });
  }, [members, clientsList, statusOverrides]);

  // Filtered recipients according to active CRM filters
  const filteredContacts = useMemo(() => {
    return allRecipients.filter((contact) => {
      // 1. Branch filter
      if (
        contactBranchFilter !== "all" &&
        contact.siteId !== contactBranchFilter
      ) {
        return false;
      }

      // 2. Status filter
      const currentStatus = contact.communicationStatus || "pending";
      if (
        contactStatusFilter !== "all" &&
        currentStatus !== contactStatusFilter
      ) {
        return false;
      }

      // 3. Segment filter
      if (
        contactSegmentFilter === "parents" &&
        contact.role !== "parent" &&
        !contact.childName
      ) {
        return false;
      }
      if (contactSegmentFilter === "athletes" && contact.role !== "athlete") {
        return false;
      }
      if (
        contactSegmentFilter === "recovery" &&
        contact.siteId !== "recoveryzone"
      ) {
        return false;
      }
      if (contactSegmentFilter === "members" && contact.role !== "member") {
        return false;
      }

      // 4. Search query
      if (contactSearch.trim()) {
        const q = contactSearch.toLowerCase();
        const matchesName = contact.name.toLowerCase().includes(q);
        const matchesChild = contact.childName?.toLowerCase().includes(q);
        const matchesParent = contact.parentName?.toLowerCase().includes(q);
        const matchesPhone = contact.phone?.includes(q);
        const matchesEmail = contact.email?.toLowerCase().includes(q);
        const matchesNotes = contact.notes?.toLowerCase().includes(q);
        return (
          matchesName ||
          matchesChild ||
          matchesParent ||
          matchesPhone ||
          matchesEmail ||
          matchesNotes
        );
      }

      return true;
    });
  }, [
    allRecipients,
    contactBranchFilter,
    contactStatusFilter,
    contactSegmentFilter,
    contactSearch,
  ]);

  // Compute live KPI metrics
  const kpiData = useMemo(() => {
    const total = allRecipients.length;
    const pending = allRecipients.filter(
      (c) => (c.communicationStatus || "pending") === "pending"
    ).length;
    const calls = stats.callsCount || stats.byChannel?.phone || 0;
    const emails = stats.emailsCount || stats.byChannel?.email || 0;

    return { total, pending, calls, emails };
  }, [allRecipients, stats]);

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
    const updated = await marketingService.getAllTemplates();
    setTemplates(updated);
  };

  const handleUpdateTemplate = async (
    id: string,
    data: Partial<Omit<MarketingTemplate, "id" | "siteId" | "createdAt">>
  ) => {
    await marketingService.updateTemplate(id, data);
    const updated = await marketingService.getAllTemplates();
    setTemplates(updated);
  };

  const handleDeleteTemplate = async (id: string) => {
    await marketingService.deleteTemplate(id);
    const updated = await marketingService.getAllTemplates();
    setTemplates(updated);
  };

  // Status Change for Contact
  const handleContactStatusChange = async (
    contactId: string,
    newStatus: ContactCommunicationStatus
  ) => {
    const now = new Date().toISOString();
    setStatusOverrides((prev) => ({
      ...prev,
      [contactId]: {
        ...prev[contactId],
        status: newStatus,
        lastContactAt: now,
      },
    }));

    // Persist via Server Action
    try {
      await updateRecoveryClientCommunicationAction(contactId, {
        communicationStatus: newStatus,
        lastContactAt: now,
      });
    } catch {
      // not a client doc or member, silently skip
    }

    toast.success("Статусът на контакта беше обновен.");
  };

  // Call Logging
  const handleCallLogged = async (
    contactId: string,
    newStatus: ContactCommunicationStatus,
    note: string
  ) => {
    const contact = allRecipients.find((c) => c.id === contactId);
    if (!contact) return;

    const now = new Date().toISOString();
    setStatusOverrides((prev) => ({
      ...prev,
      [contactId]: {
        status: newStatus,
        notes: note,
        lastContactAt: now,
        lastContactType: "phone",
      },
    }));

    try {
      // Log to marketing history
      await marketingService.logPhoneCall(
        contact,
        "Телефонно обаждане",
        note,
        user?.email || "admin"
      );

      // Persist contact update to clients via server action if recovery client
      if (contact.siteId === "recoveryzone") {
        await updateRecoveryClientCommunicationAction(contactId, {
          communicationStatus: newStatus,
          lastContactAt: now,
          lastContactType: "phone",
        });
      }

      // Refresh history & stats
      const [hist, st] = await Promise.all([
        marketingService.getHistory(siteId, 200),
        marketingService.getMarketingStats(siteId),
      ]);
      setHistory(hist);
      setStats(st);
    } catch (err) {
      console.error(err);
    }
  };

  // Batch Sending Handler for Composer tab
  const handleSendBatch = async (
    channel: "email",
    selectedRecipients: MarketingRecipient[],
    messageText: string,
    emailSubject: string
  ) => {
    setIsSending(true);
    try {
      const logEntries = selectedRecipients.map((r) => {
        const recipientName = r.name || r.parentName || "Член";
        const childName = r.childName || r.name;
        const personalized = messageText
          .replace(/{ИМЕ}/g, recipientName)
          .replace(/{ДЕТЕ}/g, childName)
          .replace(/{СЪБИТИЕ}/g, "Клубно събитие")
          .replace(/{ДАТА}/g, new Date().toLocaleDateString("bg-BG"))
          .replace(/{ЧАС}/g, "18:00 ч.")
          .replace(/{ЛОКАЦИЯ}/g, "Спортна зала Гълъбово");

        return {
          siteId,
          recipientId: r.id,
          recipientName: r.name,
          recipientPhone: r.phone,
          channel,
          messageText: personalized,
          templateUsed: selectedTemplateForComposer?.title || "Ръчно съставено",
          campaignTitle: emailSubject || undefined,
          status: "sent" as const,
          sentBy: user?.uid || "admin",
        };
      });

      await marketingService.logBatchMessages(logEntries);

      toast.success(
        `Кампанията беше регистрирана успешно за ${selectedRecipients.length} получатели!`
      );

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

  const handleOpenBulkEmail = () => {
    const selected = allRecipients.filter((r) => selectedContactIds.has(r.id));
    if (selected.length === 0) {
      toast.error("Моля, маркирайте поне един контакт от списъка.");
      return;
    }
    setEmailingRecipients(selected);
    setIsEmailDialogOpen(true);
  };

  const handleOpenSingleEmail = (contact: MarketingRecipient) => {
    setEmailingRecipients([contact]);
    setIsEmailDialogOpen(true);
  };

  const toggleSelectAllFiltered = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      const next = new Set<string>();
      filteredContacts.forEach((c) => next.add(c.id));
      setSelectedContactIds(next);
      toast.success(`Маркирани са ${filteredContacts.length} контакта.`);
    }
  };

  if (isLoading || membersLoading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      {/* 1. Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200 dark:shadow-none">
              <Megaphone className="size-5.5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950 uppercase dark:text-white">
                Маркетинг & CRM Център
              </h1>
              <p className="text-xs text-zinc-500">
                Телефонни обаждания, брандирани имейли, дневник на комуникацията
                и шаблони
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={isLoading}
            className="rounded-full border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            title="Презареди данни и шаблони"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`}
            />
            Обнови
          </Button>
          <Badge
            variant="outline"
            className="rounded-full border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
          >
            {allRecipients.length} обединени контакта
          </Badge>
        </div>
      </div>

      {/* 2. Top KPI Analytics Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Contacts */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо контакти
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-white">
                {kpiData.total}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="size-5" />
            </div>
          </div>
        </Card>

        {/* Calls Logged */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Проведени разговори
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {kpiData.calls}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <PhoneCall className="size-5" />
            </div>
          </div>
        </Card>

        {/* Emails Sent */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Изпратени имейли
              </span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {kpiData.emails}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Mail className="size-5" />
            </div>
          </div>
        </Card>

        {/* Pending Contacts */}
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Чакащи за контакт
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {kpiData.pending}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const tab = v as
            "contacts" | "composer" | "templates" | "history" | "automations";
          setActiveTab(tab);
          if (tab === "templates" || tab === "composer") {
            loadData();
          }
        }}
        className="space-y-6"
      >
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-zinc-200 bg-zinc-100/80 p-1 sm:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-900">
          <TabsTrigger
            value="contacts"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Phone className="size-3.5" />
            <span>📞 Контакти & Hub</span>
          </TabsTrigger>

          <TabsTrigger
            value="composer"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Send className="size-3.5" />
            <span>✉️ Имейл Кампания</span>
          </TabsTrigger>

          <TabsTrigger
            value="templates"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <FileText className="size-3.5" />
            <span>📑 Шаблони ({templates.length})</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <History className="size-3.5" />
            <span>📊 История & Дневник</span>
          </TabsTrigger>

          <TabsTrigger
            value="automations"
            className="flex items-center gap-2 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white"
          >
            <Zap className="size-3.5" />
            <span>⚡ Автоматизации</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Contacts & CRM Hub */}
        <TabsContent
          value="contacts"
          className="space-y-6 focus-visible:outline-hidden"
        >
          {/* Controls Bar: Filters & Search */}
          <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Търсене по име, родител, дете, телефон, имейл или бележка..."
                  className="h-10 rounded-2xl pl-10 text-xs font-medium"
                />
              </div>

              {/* Branch Selector */}
              <div className="flex items-center gap-2">
                <Select
                  value={contactBranchFilter}
                  onValueChange={setContactBranchFilter}
                >
                  <SelectTrigger className="h-10 w-44 rounded-2xl text-xs font-semibold">
                    <SelectValue placeholder="Всички бази" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">🌐 Всички бази</SelectItem>
                    <SelectItem value="bkgalabovo">🏸 БК Гълъбово</SelectItem>
                    <SelectItem value="recoveryzone">
                      🌿 Recovery Zone
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Selector */}
                <Select
                  value={contactStatusFilter}
                  onValueChange={setContactStatusFilter}
                >
                  <SelectTrigger className="h-10 w-44 rounded-2xl text-xs font-semibold">
                    <SelectValue placeholder="Всички статуси" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">🌟 Всички статуси</SelectItem>
                    <SelectItem value="pending">🔵 За контакт</SelectItem>
                    <SelectItem value="contacted">
                      🟡 Свързан по тел.
                    </SelectItem>
                    <SelectItem value="emailed">🟢 Изпратен имейл</SelectItem>
                    <SelectItem value="archived">⚪ Архив</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Smart Audience Segment Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase">
                  Сегмент:
                </span>
                {[
                  { id: "all", label: "🌟 Всички" },
                  { id: "parents", label: "👨‍👩‍👧 Родители & Деца" },
                  { id: "athletes", label: "🏸 Състезатели" },
                  { id: "recovery", label: "🌿 Recovery клиенти" },
                  { id: "members", label: "👥 Любители & Членове" },
                ].map((seg) => (
                  <Button
                    key={seg.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setContactSegmentFilter(seg.id)}
                    className={`h-7 rounded-xl px-2.5 text-[11px] font-bold transition-all ${
                      contactSegmentFilter === seg.id
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                    }`}
                  >
                    {seg.label}
                  </Button>
                ))}
              </div>

              {/* Bulk Email Trigger */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAllFiltered}
                  className="h-8 rounded-xl text-xs font-bold"
                >
                  {selectedContactIds.size === filteredContacts.length &&
                  filteredContacts.length > 0
                    ? "Отмаркирай всички"
                    : `Маркирай всички (${filteredContacts.length})`}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={selectedContactIds.size === 0}
                  onClick={handleOpenBulkEmail}
                  className="h-8 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <Mail className="mr-1.5 size-3.5" />
                  Групов имейл ({selectedContactIds.size})
                </Button>
              </div>
            </div>
          </div>

          {/* Contacts Grid */}
          {filteredContacts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/70 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <Inbox className="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-700" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Няма намерени контакти
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
                Опитайте да изчистите или промените филтрите за търсене.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="group relative">
                  <ContactCard
                    contact={contact}
                    onCallLog={(c) => setCallingContact(c)}
                    onEmail={(c) => handleOpenSingleEmail(c)}
                    onStatusChange={handleContactStatusChange}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Composer */}
        <TabsContent
          value="composer"
          className="space-y-4 focus-visible:outline-hidden"
        >
          <MarketingComposerTab
            recipients={allRecipients}
            templates={templates}
            selectedTemplate={selectedTemplateForComposer}
            onSendBatch={handleSendBatch}
            isSending={isSending}
            idToken={idToken}
            siteId={siteId}
          />
        </TabsContent>

        {/* Tab 3: Templates */}
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

        {/* Tab 4: History & Analytics */}
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

        {/* Tab 5: Automations */}
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

      {/* Call Log Dialog */}
      <CallLogDialog
        contact={callingContact}
        isOpen={Boolean(callingContact)}
        onClose={() => setCallingContact(null)}
        onLogged={handleCallLogged}
      />

      {/* Quick Email Dialog (Single or Group) */}
      <QuickEmailDialog
        recipients={emailingRecipients}
        templates={templates}
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        idToken={idToken}
        siteId={siteId}
        onSuccess={() => {
          setSelectedContactIds(new Set());
          loadData();
        }}
      />
    </div>
  );
}
