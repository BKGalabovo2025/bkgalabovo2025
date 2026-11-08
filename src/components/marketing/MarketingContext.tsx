"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import { useMembers } from "@/hooks/useMembers";
import {
  getRecoveryClientsAction,
  updateRecoveryClientCommunicationAction,
} from "@/lib/actions/recovery-services-server";
import { marketingService } from "@/services/marketing-service";
import { useAppStore } from "@/store/use-app-store";
import type {
  ContactCommunicationStatus,
  MarketingAutomationRule,
  MarketingLog,
  MarketingRecipient,
  MarketingStats,
  MarketingTemplate,
} from "@/types/marketing.types";

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

export type MarketingTemplateInput = Omit<
  MarketingTemplate,
  "id" | "siteId" | "createdAt"
>;
export type MarketingChannel = "email" | "phone";

export interface MarketingContextType {
  siteId: string;
  idToken: string | null;
  isLoading: boolean;
  isSending: boolean;
  allRecipients: MarketingRecipient[];
  filteredContacts: MarketingRecipient[];
  kpiData: {
    total: number;
    pending: number;
    calls: number;
    emails: number;
  };
  templates: MarketingTemplate[];
  selectedTemplateForComposer: MarketingTemplate | null;
  history: MarketingLog[];
  stats: MarketingStats;
  automationRules: MarketingAutomationRule[];
  selectedContactIds: Set<string>;
  contactSearch: string;
  contactBranchFilter: string;
  contactStatusFilter: string;
  contactSegmentFilter: string;
  callingContact: MarketingRecipient | null;
  emailingRecipients: MarketingRecipient[];
  isEmailDialogOpen: boolean;
  // Setters & Actions
  setContactSearch: (val: string) => void;
  setContactBranchFilter: (val: string) => void;
  setContactStatusFilter: (val: string) => void;
  setContactSegmentFilter: (val: string) => void;
  setSelectedContactIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCallingContact: (c: MarketingRecipient | null) => void;
  setEmailingRecipients: (r: MarketingRecipient[]) => void;
  setIsEmailDialogOpen: (open: boolean) => void;
  setSelectedTemplateForComposer: (tmpl: MarketingTemplate | null) => void;
  loadData: () => Promise<void>;
  handleCallLogged: (
    contactId: string,
    newStatus: ContactCommunicationStatus,
    note: string
  ) => Promise<void>;
  handleContactStatusChange: (
    contactId: string,
    newStatus: ContactCommunicationStatus
  ) => Promise<void>;
  handleOpenSingleEmail: (contact: MarketingRecipient) => void;
  handleOpenBulkEmail: () => void;
  toggleSelectAllFiltered: () => void;
  handleCreateTemplate: (data: MarketingTemplateInput) => Promise<void>;
  handleUpdateTemplate: (
    id: string,
    data: Partial<MarketingTemplateInput>
  ) => Promise<void>;
  handleDeleteTemplate: (id: string) => Promise<void>;
  handleSendBatch: (
    channel: MarketingChannel,
    selectedRecipients: MarketingRecipient[],
    messageText: string,
    emailSubject: string
  ) => Promise<void>;
  handleDeleteLog: (id: string) => Promise<void>;
  handleClearHistory: () => Promise<void>;
  handleToggleAutomation: (id: string, isActive: boolean) => Promise<void>;
}

const MarketingContext = createContext<MarketingContextType | null>(null);

export function MarketingProvider({ children }: { children: React.ReactNode }) {
  const { activeBranch } = useAppStore();
  const siteId = activeBranch || "bkgalabovo";
  const { user } = useAuth();
  const { members, loading: membersLoading } = useMembers();

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

  const [contactSearch, setContactSearch] = useState("");
  const [contactBranchFilter, setContactBranchFilter] = useState<string>("all");
  const [contactStatusFilter, setContactStatusFilter] = useState<string>("all");
  const [contactSegmentFilter, setContactSegmentFilter] =
    useState<string>("all");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set()
  );

  const [callingContact, setCallingContact] =
    useState<MarketingRecipient | null>(null);
  const [emailingRecipients, setEmailingRecipients] = useState<
    MarketingRecipient[]
  >([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setIdToken).catch(console.error);
    }
  }, [user]);

  const loadData = useCallback(async () => {
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
            }) => ({
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
            })
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
  }, [siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allRecipients: MarketingRecipient[] = useMemo(() => {
    const memberRecipients: MarketingRecipient[] = members
      .filter((m) => m.phoneType !== "parent")
      .map((m) => {
        const athleteFullName =
          m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim();
        const isRecovery =
          m.isRecoveryMember ||
          m.memberType === "recovery" ||
          m.siteId === "recoveryzone";

        return {
          id: m.id,
          name: athleteFullName,
          role: getMemberRole(m),
          phone: m.phone || undefined,
          email: m.email || undefined,
          status:
            m.status === "active" ? ("active" as const) : ("inactive" as const),
          communicationStatus: "pending" as const,
          group: getMemberGroupName(isRecovery, m.ageGroup, false),
          siteId: isRecovery ? "recoveryzone" : "bkgalabovo",
        };
      });

    const combined = [...memberRecipients, ...clientsList];

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

  const filteredContacts = useMemo(() => {
    return allRecipients.filter((contact) => {
      if (
        contactBranchFilter !== "all" &&
        contact.siteId !== contactBranchFilter
      ) {
        return false;
      }

      const currentStatus = contact.communicationStatus || "pending";
      if (
        contactStatusFilter !== "all" &&
        currentStatus !== contactStatusFilter
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

  const kpiData = useMemo(() => {
    const total = allRecipients.length;
    const pending = allRecipients.filter(
      (c) => (c.communicationStatus || "pending") === "pending"
    ).length;
    const calls = stats.callsCount || stats.byChannel?.phone || 0;
    const emails = stats.emailsCount || stats.byChannel?.email || 0;

    return { total, pending, calls, emails };
  }, [allRecipients, stats]);

  const handleCreateTemplate = async (data: MarketingTemplateInput) => {
    await marketingService.createTemplate(siteId, data);
    const updated = await marketingService.getAllTemplates();
    setTemplates(updated);
  };

  const handleUpdateTemplate = async (
    id: string,
    data: Partial<MarketingTemplateInput>
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

    try {
      await updateRecoveryClientCommunicationAction(contactId, {
        communicationStatus: newStatus,
        lastContactAt: now,
      });
    } catch {
      // not a client doc or member
    }

    toast.success("Статусът на контакта беше обновен.");
  };

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
      await marketingService.logPhoneCall(
        contact,
        "Телефонно обаждане",
        note,
        user?.email || "admin"
      );

      if (contact.siteId === "recoveryzone") {
        await updateRecoveryClientCommunicationAction(contactId, {
          communicationStatus: newStatus,
          notes: note,
          lastContactAt: now,
          lastContactType: "phone",
        });
      }

      toast.success(`Разговорът с ${contact.name} беше регистриран успешно!`);

      const [hist, st] = await Promise.all([
        marketingService.getHistory(siteId, 200),
        marketingService.getMarketingStats(siteId),
      ]);
      setHistory(hist);
      setStats(st);
    } catch (e) {
      console.error("Error logging call:", e);
      toast.error("Възникна грешка при запазването на обаждането.");
    }
  };

  const handleSendBatch = async (
    channel: MarketingChannel,
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

  const value: MarketingContextType = {
    siteId,
    idToken,
    isLoading: isLoading || membersLoading,
    isSending,
    allRecipients,
    filteredContacts,
    kpiData,
    templates,
    selectedTemplateForComposer,
    history,
    stats,
    automationRules,
    selectedContactIds,
    contactSearch,
    contactBranchFilter,
    contactStatusFilter,
    contactSegmentFilter,
    callingContact,
    emailingRecipients,
    isEmailDialogOpen,
    setContactSearch,
    setContactBranchFilter,
    setContactStatusFilter,
    setContactSegmentFilter,
    setSelectedContactIds,
    setCallingContact,
    setEmailingRecipients,
    setIsEmailDialogOpen,
    setSelectedTemplateForComposer,
    loadData,
    handleCallLogged,
    handleContactStatusChange,
    handleOpenSingleEmail,
    handleOpenBulkEmail,
    toggleSelectAllFiltered,
    handleCreateTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
    handleSendBatch,
    handleDeleteLog,
    handleClearHistory,
    handleToggleAutomation,
  };

  return (
    <MarketingContext.Provider value={value}>
      {children}
    </MarketingContext.Provider>
  );
}

export function useMarketingContext(): MarketingContextType {
  const ctx = useContext(MarketingContext);
  if (!ctx) {
    throw new Error(
      "useMarketingContext must be used within a <MarketingProvider />"
    );
  }
  return ctx;
}
