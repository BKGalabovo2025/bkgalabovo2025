"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { DocumentAttachmentType } from "@/components/schedule/DocumentViewerDialog";
import { useParentPortal } from "@/hooks/useParentPortal";
import {
  cancelParentAbsenceAction,
  changeParentPasswordAction,
  markDocumentViewedByParentAction,
  parentLogoutAction,
  recordParentHeartbeatAction,
  sendParentSessionReportAction,
  submitDataCorrectionAction,
  submitParentAbsenceAction,
  uploadParentMedicalCertificateAction,
} from "@/lib/actions/parent-portal";
import {
  ParentAbsenceReason,
  ParentFinancialTransactionItem,
  ParentSentDocumentItem,
} from "@/types/parent-portal.types";

import {
  getActiveParentPortalSectionId,
  getParentPortalSectionHref,
} from "./parent-portal-sections";

export type PortalTab =
  | "attendance"
  | "documents"
  | "finances"
  | "profile"
  | "development"
  | "absences";

export type FinanceFilterType =
  "all" | "inventory" | "subscription" | "service";

interface ParentPortalContextType {
  // Base data from hook
  portal: ReturnType<typeof useParentPortal>;
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  selectedChildId: string;
  handleSelectChild: (childId: string) => void;
  copiedLink: boolean;
  handleCopyPortalLink: (overrideTab?: PortalTab) => void;

  // Month & year for attendance
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  monthlyAttendances: ReturnType<typeof useParentPortal>["attendances"];
  attendanceStats: {
    total: number;
    attended: number;
    missed: number;
    rate: number;
  };

  // Finances
  financeFilter: FinanceFilterType;
  setFinanceFilter: (f: FinanceFilterType) => void;
  transactionsList: ParentFinancialTransactionItem[];
  filteredTransactions: ParentFinancialTransactionItem[];
  inventoryTransactionsCount: number;
  subscriptionTransactionsCount: number;
  serviceTransactionsCount: number;
  activeReceiptTx: ParentFinancialTransactionItem | null;
  setActiveReceiptTx: (tx: ParentFinancialTransactionItem | null) => void;

  // Dialogs: Absence
  absenceDialogOpen: boolean;
  setAbsenceDialogOpen: (open: boolean) => void;
  absenceType: "single_day" | "period";
  setAbsenceType: (t: "single_day" | "period") => void;
  absenceStartDate: string;
  setAbsenceStartDate: (d: string) => void;
  absenceEndDate: string;
  setAbsenceEndDate: (d: string) => void;
  absenceReason: ParentAbsenceReason;
  setAbsenceReason: (r: ParentAbsenceReason) => void;
  absenceNote: string;
  setAbsenceNote: (n: string) => void;
  isSubmittingAbsence: boolean;
  handleSubmitAbsence: (e: React.FormEvent) => Promise<void>;
  handleCancelAbsence: (absenceId: string) => Promise<void>;

  // Dialogs: Correction
  correctionDialogOpen: boolean;
  setCorrectionDialogOpen: (open: boolean) => void;
  activeCorrectionField: {
    key: string;
    label: string;
    currentValue: string;
  } | null;
  proposedValue: string;
  setProposedValue: (v: string) => void;
  correctionNote: string;
  setCorrectionNote: (n: string) => void;
  isSubmittingCorrection: boolean;
  openCorrectionDialog: (
    key: string,
    label: string,
    currentValue: string
  ) => void;
  handleSubmitCorrection: (e: React.FormEvent) => Promise<void>;

  // Dialogs: Password Change
  changePwdOpen: boolean;
  setChangePwdOpen: (open: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (p: string) => void;
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  isChangingPwd: boolean;
  handleChangePasswordSubmit: (e: React.FormEvent) => Promise<void>;

  // Dialogs: Sent Document Preview & Sign
  selectedSentDoc: ParentSentDocumentItem | null;
  setSelectedSentDoc: (doc: ParentSentDocumentItem | null) => void;
  isSigningDoc: boolean;
  setIsSigningDoc: (s: boolean) => void;
  handlePreviewSentDocument: (doc: ParentSentDocumentItem) => void;
  handleOpenSignDocument: (doc: ParentSentDocumentItem) => void;
  handleSignDocSuccess: () => void;

  // Dialogs: Document Viewer (PDF/image attachments)
  activeDocViewer: {
    url: string;
    name: string;
    type: DocumentAttachmentType;
  } | null;
  setActiveDocViewer: (
    v: {
      url: string;
      name: string;
      type: DocumentAttachmentType;
    } | null
  ) => void;

  // Dialogs: Event Inquiry
  activeInquiryEvent: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    type?: string;
  } | null;
  setActiveInquiryEvent: (
    e: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      location?: string;
      type?: string;
    } | null
  ) => void;
  submittedInquiries: Set<string>;
  setSubmittedInquiries: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Dialogs: Medical Certificate Upload
  parentMedicalModalOpen: boolean;
  setParentMedicalModalOpen: (open: boolean) => void;
  parentMedicalDate: string;
  setParentMedicalDate: (d: string) => void;
  parentMedicalBase64: string | null;
  setParentMedicalBase64: (b64: string | null) => void;
  parentMedicalFileName: string;
  setParentMedicalFileName: (f: string) => void;
  isUploadingMedical: boolean;
  handleMedicalUpload: () => Promise<void>;

  // Announcements expanded state
  expandedEvents: Record<string, boolean>;
  toggleEventExpanded: (id: string, title?: string) => void;

  // Welcome Tour
  showWelcomeTour: boolean;
  setShowWelcomeTour: (open: boolean) => void;
  handleCloseWelcomeTour: () => void;

  // Other helpers
  handleLogout: () => Promise<void>;
  logSessionAction: (actionText: string) => void;
  isBirthdayToday: boolean;
  selectedChildAgeStr: string;
  deepLinkedDocId: string | null;
}

const ParentPortalContext = createContext<ParentPortalContextType | null>(null);

export function ParentPortalProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: unknown;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state reading
  const urlChild = searchParams.get("child") || undefined;
  const routeSection = getActiveParentPortalSectionId(pathname);
  const urlTab =
    routeSection || (searchParams.get("tab") as PortalTab) || "attendance";
  const urlDoc = searchParams.get("doc") || null;
  const urlMonth = searchParams.get("month");
  const urlYear = searchParams.get("year");

  // Portal hook initialized with child from URL if present
  const portal = useParentPortal(urlChild, initialData);
  const {
    parent,
    selectedChild,
    attendances,
    feeStatus,
    selectedChildId,
    setSelectedChildId,
    refetch,
    isUnauthorized,
  } = portal;

  // First-time Welcome Tour state
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);

  useEffect(() => {
    if (parent?.id) {
      const tourKey = `bkgalabovo_parent_tour_seen_${parent.id}`;
      const seen = localStorage.getItem(tourKey);
      if (!seen) {
        setShowWelcomeTour(true);
      }
    }
  }, [parent?.id]);

  const handleCloseWelcomeTour = useCallback(() => {
    if (parent?.id) {
      localStorage.setItem(`bkgalabovo_parent_tour_seen_${parent.id}`, "true");
    }
    setShowWelcomeTour(false);
  }, [parent]);

  // Active tab state synced with URL / hierarchical route
  const [activeTab, setActiveTabState] = useState<PortalTab>(urlTab);

  // Synchronize activeTab from URL when pathname or searchParams change
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
  }, [urlTab, activeTab]);

  // Synchronize child selection from URL if parameter present
  useEffect(() => {
    if (urlChild && urlChild !== selectedChildId) {
      setSelectedChildId(urlChild);
    }
  }, [urlChild, selectedChildId, setSelectedChildId]);

  // Month & Year state
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (urlMonth !== null && !isNaN(parseInt(urlMonth, 10))) {
      const parsed = parseInt(urlMonth, 10);
      if (parsed >= 0 && parsed <= 11) return parsed;
    }
    return new Date().getMonth();
  });

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (urlYear !== null && !isNaN(parseInt(urlYear, 10))) {
      const parsed = parseInt(urlYear, 10);
      if (parsed >= 2020 && parsed <= 2035) return parsed;
    }
    return new Date().getFullYear();
  });

  // URL Sync helper for updating search params without full page reload
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === "") {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      });
      const query = current.toString() ? `?${current.toString()}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setActiveTab = useCallback(
    (newTab: PortalTab) => {
      setActiveTabState(newTab);
      const targetHref = getParentPortalSectionHref(newTab);
      const current = new URLSearchParams(searchParams.toString());
      current.delete("tab");
      const query = current.toString() ? `?${current.toString()}` : "";
      router.push(`${targetHref}${query}`);
    },
    [router, searchParams]
  );

  const handleSelectChild = useCallback(
    (childId: string) => {
      setSelectedChildId(childId);
      updateUrlParams({ child: childId });
    },
    [setSelectedChildId, updateUrlParams]
  );

  const handlePrevMonth = useCallback(() => {
    let nextM = selectedMonth - 1;
    let nextY = selectedYear;
    if (nextM < 0) {
      nextM = 11;
      nextY -= 1;
    }
    setSelectedMonth(nextM);
    setSelectedYear(nextY);
    updateUrlParams({ month: String(nextM), year: String(nextY) });
  }, [selectedMonth, selectedYear, updateUrlParams]);

  const handleNextMonth = useCallback(() => {
    let nextM = selectedMonth + 1;
    let nextY = selectedYear;
    if (nextM > 11) {
      nextM = 0;
      nextY += 1;
    }
    setSelectedMonth(nextM);
    setSelectedYear(nextY);
    updateUrlParams({ month: String(nextM), year: String(nextY) });
  }, [selectedMonth, selectedYear, updateUrlParams]);

  // Copy link handler (uses clean hierarchical route URL)
  const [copiedLink, setCopiedLink] = useState(false);
  const handleCopyPortalLink = useCallback(
    (overrideTab?: PortalTab) => {
      if (typeof window === "undefined") return;
      const basePath = overrideTab
        ? getParentPortalSectionHref(overrideTab)
        : pathname;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tab");
      if (selectedChildId && params.has("child")) {
        params.set("child", selectedChildId);
      }
      const url = `${window.location.origin}${basePath}${params.toString() ? `?${params.toString()}` : ""}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(() => {
            setCopiedLink(true);
            toast.success("Директният линк към този изглед е копиран!");
            setTimeout(() => setCopiedLink(false), 2500);
          })
          .catch(() => {
            toast.info(`Линк: ${url}`);
          });
      } else {
        toast.info(`Линк: ${url}`);
      }
    },
    [pathname, searchParams, selectedChildId]
  );

  // Session Activity Logger
  const sessionStartTimeRef = useRef<string>("");
  const sessionStartMsRef = useRef<number>(0);
  const sessionActionsRef = useRef<Array<{ time: string; text: string }>>([]);
  const hasSentReportRef = useRef<boolean>(false);
  const hasLoggedLoginRef = useRef<boolean>(false);

  useEffect(() => {
    sessionStartTimeRef.current = new Date().toISOString();
    sessionStartMsRef.current = Date.now();
  }, []);

  const logSessionAction = useCallback((actionText: string) => {
    const time = new Date().toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    sessionActionsRef.current.push({ time, text: actionText });
  }, []);

  useEffect(() => {
    if (parent?.name && !hasLoggedLoginRef.current) {
      hasLoggedLoginRef.current = true;
      logSessionAction(`Вход в профила в Родителския портал (${parent.name})`);
    }
  }, [parent?.name, logSessionAction]);

  const sendSessionReport = useCallback(
    (reason: "logout" | "close" = "close") => {
      if (hasSentReportRef.current) return;
      if (!parent?.name) return;
      if (sessionActionsRef.current.length === 0) return;

      hasSentReportRef.current = true;
      const exitTime = new Date().toLocaleTimeString("bg-BG", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const actions = [
        ...sessionActionsRef.current,
        {
          time: exitTime,
          text:
            reason === "logout"
              ? "Успешен изход от профила (бутон „Изход“)"
              : "Затваряне на портала / браузъра",
        },
      ];

      const payload = {
        parentName: parent.name,
        parentEmail: parent.email,
        childrenNames: (portal.children || [])
          .map(
            (c: { fullName?: string; name?: string }) =>
              c.fullName || c.name || "дете"
          )
          .join(", "),
        startTime: sessionStartTimeRef.current,
        endTime: new Date().toISOString(),
        durationMinutes: Math.max(
          1,
          Math.round(
            (Date.now() - (sessionStartMsRef.current || Date.now())) / 60000
          )
        ),
        actions,
      };

      if (reason === "logout") {
        sendParentSessionReportAction(payload).catch(() => {});
      } else {
        try {
          const blob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
          });
          if (typeof navigator !== "undefined" && navigator.sendBeacon) {
            navigator.sendBeacon("/api/parents/session-report", blob);
          } else {
            fetch("/api/parents/session-report", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              keepalive: true,
            }).catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    },
    [parent, portal.children]
  );

  // Send session activity report via beacon when closing tab
  useEffect(() => {
    if (!parent) return;
    const handleBeforeUnload = () => {
      sendSessionReport("close");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [parent, sendSessionReport]);

  // Heartbeat & auto-report (throttled to 10m and only when active to save CDN/Server Action calls)
  useEffect(() => {
    if (!parent) return;
    recordParentHeartbeatAction().catch(() => {});
    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        recordParentHeartbeatAction().catch(() => {});
      }
    }, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [parent]);

  // Handle Unauthorized redirect
  useEffect(() => {
    if (isUnauthorized) {
      router.replace("/club/parents/login");
    }
  }, [isUnauthorized, router]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      sendSessionReport("logout");
      await parentLogoutAction();
      toast.success("Успешно излязохте от профила си.");
      router.push("/club/parents/login");
    } catch {
      router.push("/club/parents/login");
    }
  }, [router, sendSessionReport]);

  // Age and Birthday
  const isBirthdayToday = useMemo(() => {
    if (!selectedChild?.dateOfBirth) return false;
    try {
      const bDate = new Date(selectedChild.dateOfBirth);
      const today = new Date();
      return (
        bDate.getDate() === today.getDate() &&
        bDate.getMonth() === today.getMonth()
      );
    } catch {
      return false;
    }
  }, [selectedChild]);

  const selectedChildAgeStr = useMemo(() => {
    if (!selectedChild?.dateOfBirth) return "";
    try {
      const birth = new Date(selectedChild.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${Math.max(0, age)} г.`;
    } catch {
      return "";
    }
  }, [selectedChild]);

  // Attendance stats for selected month
  const monthlyAttendances = useMemo(() => {
    return attendances.filter((a) => {
      if (!a.startDate) return false;
      const d = new Date(a.startDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [attendances, selectedMonth, selectedYear]);

  const attendanceStats = useMemo(() => {
    const total = monthlyAttendances.length;
    const attended = monthlyAttendances.filter((a) => a.attended).length;
    const pastTrainings = monthlyAttendances.filter((a) => !a.isUpcoming);
    const denominator = pastTrainings.length > 0 ? pastTrainings.length : total;
    const rate =
      denominator > 0 ? Math.round((attended / denominator) * 100) : 0;
    const missed = Math.max(0, pastTrainings.length - attended);
    return { total, attended, missed, rate };
  }, [monthlyAttendances]);

  // Financial transactions
  const [financeFilter, setFinanceFilter] = useState<FinanceFilterType>("all");
  const [activeReceiptTx, setActiveReceiptTx] =
    useState<ParentFinancialTransactionItem | null>(null);

  const transactionsList: ParentFinancialTransactionItem[] = useMemo(() => {
    return feeStatus?.transactions || [];
  }, [feeStatus]);

  const filteredTransactions = useMemo(() => {
    if (financeFilter === "all") return transactionsList;
    if (financeFilter === "service") {
      return transactionsList.filter(
        (tx) => tx.type === "service" || tx.type === "general_service"
      );
    }
    return transactionsList.filter((tx) => tx.type === financeFilter);
  }, [transactionsList, financeFilter]);

  const inventoryTransactionsCount = useMemo(
    () => transactionsList.filter((t) => t.type === "inventory").length,
    [transactionsList]
  );
  const subscriptionTransactionsCount = useMemo(
    () => transactionsList.filter((t) => t.type === "subscription").length,
    [transactionsList]
  );
  const serviceTransactionsCount = useMemo(
    () =>
      transactionsList.filter(
        (t) => t.type === "service" || t.type === "general_service"
      ).length,
    [transactionsList]
  );

  // Absence Dialog State
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [absenceType, setAbsenceType] = useState<"single_day" | "period">(
    "single_day"
  );
  const [absenceStartDate, setAbsenceStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [absenceEndDate, setAbsenceEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [absenceReason, setAbsenceReason] =
    useState<ParentAbsenceReason>("illness");
  const [absenceNote, setAbsenceNote] = useState("");
  const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false);

  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild?.id) return;
    setIsSubmittingAbsence(true);
    try {
      const res = await submitParentAbsenceAction({
        memberId: selectedChild.id,
        type: absenceType,
        startDate: absenceStartDate,
        endDate: absenceType === "period" ? absenceEndDate : null,
        reason: absenceReason,
        note: absenceNote,
      });

      if (res.success) {
        logSessionAction(
          `Подадено уведомление за отсъствие (${absenceStartDate}${absenceType === "period" ? ` до ${absenceEndDate}` : ""}, причина: ${absenceReason})`
        );
        toast.success("Уведомлението за отсъствие е изпратено на треньора!");
        setAbsenceDialogOpen(false);
        setAbsenceNote("");
        refetch();
      } else {
        toast.error("Неуспешно изпращане", { description: res.error });
      }
    } catch {
      toast.error("Системна грешка при изпращане.");
    } finally {
      setIsSubmittingAbsence(false);
    }
  };

  const handleCancelAbsence = async (absenceId: string) => {
    if (!confirm("Сигурни ли сте, че искате да отмените това уведомление?"))
      return;
    try {
      const res = await cancelParentAbsenceAction(absenceId);
      if (res.success) {
        logSessionAction("Отменено уведомление за отсъствие");
        toast.success("Отсъствието беше отменено.");
        refetch();
      } else {
        toast.error(res.error || "Грешка при отмяна.");
      }
    } catch {
      toast.error("Грешка при отмяна.");
    }
  };

  // Correction Dialog State
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [activeCorrectionField, setActiveCorrectionField] = useState<{
    key: string;
    label: string;
    currentValue: string;
  } | null>(null);
  const [proposedValue, setProposedValue] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const openCorrectionDialog = (
    key: string,
    label: string,
    currentValue: string
  ) => {
    setActiveCorrectionField({ key, label, currentValue });
    setProposedValue(currentValue || "");
    setCorrectionNote("");
    setCorrectionDialogOpen(true);
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild?.id || !activeCorrectionField) return;
    if (!proposedValue.trim()) {
      toast.error("Моля, въведете новата стойност.");
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      const res = await submitDataCorrectionAction({
        memberId: selectedChild.id,
        fieldKey: activeCorrectionField.key,
        fieldLabel: activeCorrectionField.label,
        currentValue: activeCorrectionField.currentValue,
        proposedValue: proposedValue.trim(),
        note: correctionNote.trim(),
      });

      if (res.success) {
        logSessionAction(
          `Подадена заявка за корекция: ${activeCorrectionField.label} -> „${proposedValue.trim()}“`
        );
        toast.success(
          "Заявката за корекция е изпратена! Треньорът ще я прегледа и одобри."
        );
        setCorrectionDialogOpen(false);
        setProposedValue("");
        setCorrectionNote("");
        refetch();
      } else {
        toast.error("Грешка при изпращане", { description: res.error });
      }
    } catch {
      toast.error("Системна грешка при изпращане.");
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Password Change State
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast.error("Моля, попълнете текущата и новата парола.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Новата парола и потвърждението не съвпадат.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Новата парола трябва да бъде поне 6 символа.");
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await changeParentPasswordAction(
        currentPassword,
        newPassword
      );
      if (!res.success) {
        toast.error(res.error || "Грешка при смяна на паролата.");
      } else {
        logSessionAction("Успешна смяна на паролата");
        toast.success("Паролата е сменена успешно!");
        setChangePwdOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Възникна системна грешка.");
    } finally {
      setIsChangingPwd(false);
    }
  };

  // Sent Document Preview & Sign State
  const [selectedSentDoc, setSelectedSentDoc] =
    useState<ParentSentDocumentItem | null>(null);
  const [isSigningDoc, setIsSigningDoc] = useState(false);

  const handlePreviewSentDocument = useCallback(
    (doc: ParentSentDocumentItem) => {
      setSelectedSentDoc(doc);
      setIsSigningDoc(false);
      logSessionAction(`Преглед на изпратен документ: „${doc.documentTitle}“`);
      markDocumentViewedByParentAction(doc.id).catch(() => {});
    },
    [logSessionAction]
  );

  const handleOpenSignDocument = useCallback(
    (doc: ParentSentDocumentItem) => {
      logSessionAction(`Отваряне за онлайн подписване: „${doc.documentTitle}“`);
      markDocumentViewedByParentAction(doc.id).catch(() => {});
      if (
        doc.token &&
        (doc.status as string) !== "signed" &&
        doc.status !== "completed"
      ) {
        router.push(`/sign/${doc.token}`);
        return;
      }
      setSelectedSentDoc(doc);
      setIsSigningDoc(true);
    },
    [logSessionAction, router]
  );

  const handleSignDocSuccess = useCallback(() => {
    setSelectedSentDoc(null);
    setIsSigningDoc(false);
    refetch();
  }, [refetch]);

  // Deep-link document viewer
  const [activeDocViewer, setActiveDocViewer] = useState<{
    url: string;
    name: string;
    type: DocumentAttachmentType;
  } | null>(null);

  // Event Inquiry Dialog
  const [activeInquiryEvent, setActiveInquiryEvent] = useState<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    type?: string;
  } | null>(null);
  const [submittedInquiries, setSubmittedInquiries] = useState<Set<string>>(
    new Set()
  );

  // Medical Certificate Upload
  const [parentMedicalModalOpen, setParentMedicalModalOpen] = useState(false);
  const [parentMedicalDate, setParentMedicalDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [parentMedicalBase64, setParentMedicalBase64] = useState<string | null>(
    null
  );
  const [parentMedicalFileName, setParentMedicalFileName] = useState("");
  const [isUploadingMedical, setIsUploadingMedical] = useState(false);

  const handleMedicalUpload = useCallback(async () => {
    if (!selectedChild?.id) return;
    if (!parentMedicalDate) {
      toast.error("Моля, посочете валидна дата на издаване.");
      return;
    }
    if (!parentMedicalBase64) {
      toast.error("Моля, качете файл (снимка или PDF).");
      return;
    }

    setIsUploadingMedical(true);
    try {
      const res = await uploadParentMedicalCertificateAction({
        memberId: selectedChild.id,
        certificateDate: parentMedicalDate,
        fileBase64: parentMedicalBase64,
        fileName: parentMedicalFileName || "medical-certificate.pdf",
      });

      if (res.success) {
        logSessionAction("Успешно прикачено медицинско свидетелство");
        toast.success(
          "Медицинското свидетелство е качено успешно в досието на детето!"
        );
        setParentMedicalModalOpen(false);
        setParentMedicalBase64(null);
        setParentMedicalFileName("");
        refetch();
      } else {
        toast.error(res.error || "Грешка при качване на документа.");
      }
    } catch {
      toast.error("Системна грешка при качване.");
    } finally {
      setIsUploadingMedical(false);
    }
  }, [
    logSessionAction,
    parentMedicalBase64,
    parentMedicalDate,
    parentMedicalFileName,
    refetch,
    selectedChild,
  ]);

  // Expanded Announcements
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>(
    {}
  );
  const toggleEventExpanded = useCallback(
    (id: string, title?: string) => {
      setExpandedEvents((prev) => {
        const next = !prev[id];
        if (next && title) {
          logSessionAction(`Разгънати детайли за събитие: „${title}“`);
        }
        return { ...prev, [id]: next };
      });
    },
    [logSessionAction]
  );

  // Auto-scroll to deep-linked document
  useEffect(() => {
    if (urlDoc) {
      const el = document.getElementById(`doc-${urlDoc}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [urlDoc]);

  const value: ParentPortalContextType = {
    portal,
    activeTab,
    setActiveTab,
    selectedChildId,
    handleSelectChild,
    copiedLink,
    handleCopyPortalLink,

    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    handlePrevMonth,
    handleNextMonth,
    monthlyAttendances,
    attendanceStats,

    financeFilter,
    setFinanceFilter,
    transactionsList,
    filteredTransactions,
    inventoryTransactionsCount,
    subscriptionTransactionsCount,
    serviceTransactionsCount,
    activeReceiptTx,
    setActiveReceiptTx,

    absenceDialogOpen,
    setAbsenceDialogOpen,
    absenceType,
    setAbsenceType,
    absenceStartDate,
    setAbsenceStartDate,
    absenceEndDate,
    setAbsenceEndDate,
    absenceReason,
    setAbsenceReason,
    absenceNote,
    setAbsenceNote,
    isSubmittingAbsence,
    handleSubmitAbsence,
    handleCancelAbsence,

    correctionDialogOpen,
    setCorrectionDialogOpen,
    activeCorrectionField,
    proposedValue,
    setProposedValue,
    correctionNote,
    setCorrectionNote,
    isSubmittingCorrection,
    openCorrectionDialog,
    handleSubmitCorrection,

    changePwdOpen,
    setChangePwdOpen,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isChangingPwd,
    handleChangePasswordSubmit,

    selectedSentDoc,
    setSelectedSentDoc,
    isSigningDoc,
    setIsSigningDoc,
    handlePreviewSentDocument,
    handleOpenSignDocument,
    handleSignDocSuccess,

    activeDocViewer,
    setActiveDocViewer,

    activeInquiryEvent,
    setActiveInquiryEvent,
    submittedInquiries,
    setSubmittedInquiries,

    parentMedicalModalOpen,
    setParentMedicalModalOpen,
    parentMedicalDate,
    setParentMedicalDate,
    parentMedicalBase64,
    setParentMedicalBase64,
    parentMedicalFileName,
    setParentMedicalFileName,
    isUploadingMedical,
    handleMedicalUpload,

    expandedEvents,
    toggleEventExpanded,

    showWelcomeTour,
    setShowWelcomeTour,
    handleCloseWelcomeTour,

    handleLogout,
    logSessionAction,
    isBirthdayToday,
    selectedChildAgeStr,
    deepLinkedDocId: urlDoc,
  };

  return (
    <ParentPortalContext.Provider value={value}>
      {children}
    </ParentPortalContext.Provider>
  );
}

export function useParentPortalContext() {
  const context = useContext(ParentPortalContext);
  if (!context) {
    throw new Error(
      "useParentPortalContext must be used within ParentPortalProvider"
    );
  }
  return context;
}
