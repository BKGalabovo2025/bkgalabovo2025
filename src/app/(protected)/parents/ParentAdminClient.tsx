"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSignature,
  KeyRound,
  Loader2,
  Mail,
  Pause,
  Pencil,
  Phone,
  Play,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParentPortalAdmin } from "@/hooks/useParentPortalAdmin";
import {
  approveDataCorrectionAction,
  approveParentAccessRequestAction,
  createParentUserManuallyAction,
  deleteParentUserAction,
  linkChildToParentAction,
  markAbsenceSeenByAdminAction,
  rejectDataCorrectionAction,
  rejectParentAccessRequestAction,
  resetParentPasswordByAdminAction,
  sendDocumentToParentPortalAction,
  toggleParentUserStatusAction,
  unlinkChildFromParentAction,
  updateParentMemberPermissionsAction,
} from "@/lib/actions/parent-portal";
import { formatPhoneDisplay } from "@/lib/phone-utils";
import {
  DOCUMENT_TITLES,
  type DocumentType,
} from "@/types/document-request.types";
import {
  DataCorrectionRequest,
  DefaultParentMemberPermissions,
  ParentAccessRequest,
  ParentMemberPermissions,
  ParentRole,
  ParentUser,
} from "@/types/parent-portal.types";

const OFFICIAL_DOC_OPTIONS: { value: DocumentType; label: string }[] = [
  {
    value: "membershipApplication",
    label: DOCUMENT_TITLES.membershipApplication,
  },
  { value: "signedDeclaration", label: DOCUMENT_TITLES.signedDeclaration },
  { value: "travelDeclaration", label: DOCUMENT_TITLES.travelDeclaration },
  { value: "safetyInstruction", label: DOCUMENT_TITLES.safetyInstruction },
  { value: "internalRules", label: DOCUMENT_TITLES.internalRules },
  { value: "amateurContract", label: DOCUMENT_TITLES.amateurContract },
  { value: "licenseApplication", label: DOCUMENT_TITLES.licenseApplication },
  { value: "terminationRequest", label: DOCUMENT_TITLES.terminationRequest },
];

export default function ParentAdminClient() {
  const {
    requests,
    parents,
    absences,
    corrections,
    documentRequests,
    onlineParents,
    onlineParentsCount,
    isParentOnline,
    members,
    stats,
    isLoading,
    refetch,
  } = useParentPortalAdmin();

  const [selectedDocTypePerChild, setSelectedDocTypePerChild] = useState<
    Record<string, DocumentType>
  >({});
  const [isSendingDocPerChild, setIsSendingDocPerChild] = useState<
    Record<string, boolean>
  >({});

  const handleSendDocFromAdmin = async (parentId: string, memberId: string) => {
    const key = `${parentId}_${memberId}`;
    const docType = selectedDocTypePerChild[key] || "membershipApplication";
    setIsSendingDocPerChild((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await sendDocumentToParentPortalAction({
        memberId,
        parentUserId: parentId,
        documentType: docType,
      });
      if (!res.success) {
        toast.error(res.error || "Грешка при изпращане на документа.");
      } else {
        toast.success(
          `Документът „${res.documentTitle}“ е изпратен в профила на родителя!`
        );
        refetch();
      }
    } catch {
      toast.error("Системна грешка при изпращане.");
    } finally {
      setIsSendingDocPerChild((prev) => ({ ...prev, [key]: false }));
    }
  };

  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [parentFilter, setParentFilter] = useState<
    "all" | "active" | "suspended"
  >("all");

  // Child Link / Unlink States
  const [linkingParentId, setLinkingParentId] = useState<string | null>(null);
  const [selectedChildToLink, setSelectedChildToLink] = useState<string>("");
  const [isLinkingChild, setIsLinkingChild] = useState(false);
  const [isUnlinkingChild, setIsUnlinkingChild] = useState<string | null>(null);

  const handleLinkChild = async (parentId: string) => {
    if (!selectedChildToLink) {
      toast.error("Моля, изберете дете от списъка.");
      return;
    }
    setIsLinkingChild(true);
    try {
      const res = await linkChildToParentAction(parentId, selectedChildToLink);
      if (res.success) {
        toast.success("Детето беше успешно свързано към профила!");
        setLinkingParentId(null);
        setSelectedChildToLink("");
        refetch();
      } else {
        toast.error(res.error || "Грешка при свързване.");
      }
    } catch {
      toast.error("Възникна системна грешка.");
    } finally {
      setIsLinkingChild(false);
    }
  };

  const handleUnlinkChild = async (
    parentId: string,
    memberId: string,
    memberName: string
  ) => {
    if (
      !confirm(
        `Сигурни ли сте, че искате да разкачите ${memberName} от този родителски профил?`
      )
    ) {
      return;
    }
    const key = `${parentId}_${memberId}`;
    setIsUnlinkingChild(key);
    try {
      const res = await unlinkChildFromParentAction(parentId, memberId);
      if (res.success) {
        toast.success(`${memberName} беше разкачен(а) от профила.`);
        refetch();
      } else {
        toast.error(res.error || "Грешка при разкачане.");
      }
    } catch {
      toast.error("Възникна системна грешка.");
    } finally {
      setIsUnlinkingChild(null);
    }
  };

  // Dialog States
  const [approveDialogReq, setApproveDialogReq] =
    useState<ParentAccessRequest | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [permissionsState, setPermissionsState] =
    useState<ParentMemberPermissions>(DefaultParentMemberPermissions);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  const [rejectDialogReq, setRejectDialogReq] =
    useState<ParentAccessRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualRole, setManualRole] = useState<ParentRole>("mother");
  const [manualMemberId, setManualMemberId] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const [editPermParent, setEditPermParent] = useState<ParentUser | null>(null);
  const [editPermMemberId, setEditPermMemberId] = useState<string>("");
  const [editPermValues, setEditPermValues] = useState<ParentMemberPermissions>(
    DefaultParentMemberPermissions
  );
  const [isSubmittingPerms, setIsSubmittingPerms] = useState(false);

  const [absenceReplyId, setAbsenceReplyId] = useState<string | null>(null);
  const [absenceReplyText, setAbsenceReplyText] = useState("");
  const [isReplyingAbsence, setIsReplyingAbsence] = useState(false);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<ParentUser | null>(
    null
  );
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Filtered Parents
  const filteredParents = useMemo(() => {
    return parents.filter((p) => {
      if (parentFilter === "active" && p.status !== "active") return false;
      if (parentFilter === "suspended" && p.status !== "suspended")
        return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const inName = p.name.toLowerCase().includes(q);
      const inPhone = p.phone.toLowerCase().includes(q);
      const inEmail = p.email.toLowerCase().includes(q);
      const inChildren = (p.linkedMemberIds || []).some((mId) => {
        const m = members.find((mem) => mem.id === mId);
        return m?.fullName.toLowerCase().includes(q);
      });
      return inName || inPhone || inEmail || inChildren;
    });
  }, [parents, parentFilter, searchQuery, members]);

  // Pending Requests filtered
  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === "pending");
  }, [requests]);

  // Export to CSV
  const handleExportCsv = () => {
    if (parents.length === 0) {
      toast.error("Няма регистрирани родители за експорт.");
      return;
    }

    const headers = [
      "Име на родител",
      "Роля",
      "Телефон",
      "Имейл",
      "Свързани деца",
      "Статус",
      "Дата на регистрация",
    ];

    const rows = parents.map((p) => {
      const roleLabel =
        p.parentRole === "mother"
          ? "Майка"
          : p.parentRole === "father"
            ? "Баща"
            : "Настойник";
      const childrenNames = (p.linkedMemberIds || [])
        .map((id) => members.find((m) => m.id === id)?.fullName || id)
        .join("; ");
      const statusLabel = p.status === "active" ? "Активен" : "Временно спрян";
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${roleLabel}"`,
        `"${p.phone}"`,
        `"${p.email}"`,
        `"${childrenNames.replace(/"/g, '""')}"`,
        `"${statusLabel}"`,
        `"${(p.createdAt || "").slice(0, 10)}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `roditeli-bkgalabovo-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Списъкът беше изтеглен успешно в CSV формат!");
  };

  // Open approve dialog
  const handleOpenApproveDialog = (req: ParentAccessRequest) => {
    setApproveDialogReq(req);
    setSelectedChildId(req.matchedMemberId || "");
    setPermissionsState({ ...DefaultParentMemberPermissions });
  };

  // Submit approve
  const handleConfirmApprove = async () => {
    if (!approveDialogReq) return;
    if (!selectedChildId) {
      toast.error("Моля, изберете член (дете), с което да свържете родителя.");
      return;
    }

    setIsSubmittingApprove(true);
    try {
      const res = await approveParentAccessRequestAction(approveDialogReq.id, {
        customPermissions: permissionsState,
        manualMemberId: selectedChildId,
      });

      if (!res.success) {
        toast.error(res.error || "Грешка при одобрение.");
      } else {
        toast.success(
          `Заявката беше одобрена! Данните за родител са вписани в досието на детето и е изпратен потвърдителен имейл.`
        );
        setApproveDialogReq(null);
        refetch();
      }
    } catch {
      toast.error("Възникна системна грешка.");
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  // Submit reject
  const handleConfirmReject = async () => {
    if (!rejectDialogReq) return;
    if (!rejectReason.trim()) {
      toast.error("Моля, посочете причина за отказа.");
      return;
    }

    setIsSubmittingReject(true);
    try {
      const res = await rejectParentAccessRequestAction(
        rejectDialogReq.id,
        rejectReason
      );
      if (!res.success) {
        toast.error(res.error || "Грешка при отказ на заявката.");
      } else {
        toast.success("Заявката е отказана и на родителя е изпратен имейл.");
        setRejectDialogReq(null);
        setRejectReason("");
        refetch();
      }
    } catch {
      toast.error("Възникна системна грешка.");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Toggle parent status
  const handleToggleStatus = async (parent: ParentUser) => {
    const newStatus = parent.status === "active" ? "suspended" : "active";
    const res = await toggleParentUserStatusAction(parent.id, newStatus);
    if (!res.success) {
      toast.error(res.error || "Грешка при промяна на статуса.");
    } else {
      toast.success(
        newStatus === "active"
          ? `Профилът на ${parent.name} е активиран.`
          : `Профилът на ${parent.name} е временно спрян.`
      );
      refetch();
    }
  };

  // Reset password by admin
  const handleResetPassword = async (parent: ParentUser) => {
    if (
      !confirm(
        `Сигурни ли сте, че искате да генерирате нова временна парола за ${parent.name}? На имейла му ще бъде изпратен линк за вход.`
      )
    ) {
      return;
    }

    const res = await resetParentPasswordByAdminAction(parent.id);
    if (!res.success) {
      toast.error(res.error || "Грешка при рестартиране на парола.");
    } else {
      if (res.emailSent) {
        toast.success(
          `Генерирана нова парола: "${res.tempPassword}". На ${parent.email} е изпратен имейл.`
        );
      } else {
        toast.warning(
          `Генерирана нова парола: "${res.tempPassword}". Имейлът не можа да бъде доставен от Gmail (проверете конфигурацията на пощата).`
        );
      }
    }
  };

  // Delete parent
  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteParentUserAction(deleteConfirmUser.id);
      if (!res.success) {
        toast.error(res.error || "Грешка при изтриване.");
      } else {
        toast.success(`Профилът на ${deleteConfirmUser.name} беше премахнат.`);
        setDeleteConfirmUser(null);
        refetch();
      }
    } catch {
      toast.error("Грешка при изтриване.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Manual Add submit
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPhone || !manualEmail || !manualMemberId) {
      toast.error("Моля, попълнете всички задължителни полета.");
      return;
    }

    setIsSubmittingManual(true);
    try {
      const res = await createParentUserManuallyAction({
        parentName: manualName,
        parentPhone: manualPhone,
        parentEmail: manualEmail,
        parentRole: manualRole,
        memberId: manualMemberId,
      });

      if (!res.success) {
        toast.error(res.error || "Грешка при създаване на родител.");
      } else {
        toast.success(
          `Родителят беше добавен успешно! Временна парола: "${res.tempPassword}". Изпратен е имейл за достъп.`
        );
        setManualAddOpen(false);
        setManualName("");
        setManualPhone("");
        setManualEmail("");
        setManualMemberId("");
        refetch();
      }
    } catch {
      toast.error("Системна грешка.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Edit permissions
  const handleOpenEditPerms = (parent: ParentUser, memberId: string) => {
    setEditPermParent(parent);
    setEditPermMemberId(memberId);
    const existing =
      parent.permissionsPerMember?.[memberId] || DefaultParentMemberPermissions;
    setEditPermValues({ ...existing });
  };

  const handleSavePerms = async () => {
    if (!editPermParent || !editPermMemberId) return;
    setIsSubmittingPerms(true);
    try {
      const res = await updateParentMemberPermissionsAction(
        editPermParent.id,
        editPermMemberId,
        editPermValues
      );
      if (!res.success) {
        toast.error(res.error || "Грешка при запазване на правата.");
      } else {
        toast.success("Правата за видимост са обновени успешно!");
        setEditPermParent(null);
        refetch();
      }
    } catch {
      toast.error("Системна грешка.");
    } finally {
      setIsSubmittingPerms(false);
    }
  };

  // Mark absence seen
  const handleConfirmAbsenceSeen = async (absenceId: string) => {
    setIsReplyingAbsence(true);
    try {
      const res = await markAbsenceSeenByAdminAction(
        absenceId,
        absenceReplyText
      );
      if (!res.success) {
        toast.error(res.error || "Грешка при отбелязване.");
      } else {
        toast.success("Отсъствието е отбелязано като прегледано.");
        setAbsenceReplyId(null);
        setAbsenceReplyText("");
        refetch();
      }
    } catch {
      toast.error("Системна грешка.");
    } finally {
      setIsReplyingAbsence(false);
    }
  };

  // Approve correction (1 click)
  const handleApproveCorrection = async (corr: DataCorrectionRequest) => {
    if (
      !confirm(
        `Потвърждавате ли автоматичното обновяване на полето "${corr.fieldLabel}" за ${corr.memberName} на нова стойност: "${corr.proposedValue}"?`
      )
    ) {
      return;
    }

    const res = await approveDataCorrectionAction(corr.id);
    if (!res.success) {
      toast.error(res.error || "Грешка при одобряване на корекцията.");
    } else {
      toast.success(
        `Корекцията е приета! Картонът на ${corr.memberName} беше автоматично обновен в базата данни и е изпратен потвърдителен имейл.`
      );
      refetch();
    }
  };

  // Reject correction
  const handleRejectCorrection = async (corr: DataCorrectionRequest) => {
    const comment = prompt("Въведете кратък коментар към родителя (по избор):");
    if (comment === null) return;

    const res = await rejectDataCorrectionAction(corr.id, comment || "");
    if (!res.success) {
      toast.error(res.error || "Грешка при отказ.");
    } else {
      toast.success("Заявката за корекция беше отказана.");
      refetch();
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900 sm:text-3xl dark:text-white">
              Родителски достъп
            </h1>
            {stats.totalPending > 0 && (
              <Badge className="bg-red-600 text-white font-bold animate-pulse">
                {stats.totalPending} чакащи
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Управление на родителски профили, заявки за регистрация, уведомления
            за отсъствия и корекции на данни.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <Download size={15} className="mr-1.5" />
            <span>Експорт контакти (CSV)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setManualAddOpen(true)}
            className="rounded-xl bg-blue-600 font-semibold text-white shadow-md hover:bg-blue-500"
          >
            <UserPlus size={15} className="mr-1.5" />
            <span>+ Добави родител</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="rounded-xl"
            title="Презареди данни"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin text-blue-500" : ""}
            />
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-3">
        <div
          onClick={() => setActiveTab("pending")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeTab === "pending"
              ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Чакащи заявки
            </span>
            <Users size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {stats.pendingRequestsCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("parents")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeTab === "parents"
              ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Активни родители
            </span>
            <UserCheck size={16} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {parents.length}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("activity")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeTab === "activity"
              ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              На линия сега
            </span>
            <span className="relative flex size-2.5">
              {onlineParentsCount > 0 && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex size-2.5 rounded-full ${
                  onlineParentsCount > 0
                    ? "bg-emerald-500"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {onlineParentsCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("absences")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeTab === "absences"
              ? "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Чакащи отсъствия
            </span>
            <CalendarDays size={16} className="text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {stats.pendingAbsencesCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab("corrections")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all hover:scale-1.02 ${
            activeTab === "corrections"
              ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-bold uppercase tracking-wider">
              Корекции на данни
            </span>
            <Pencil size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {stats.pendingCorrectionsCount}
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="h-11 rounded-2xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <TabsTrigger
            value="pending"
            className="rounded-xl px-4 text-xs font-bold uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-950"
          >
            <span>Чакащи заявки</span>
            {stats.pendingRequestsCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white font-black">
                {stats.pendingRequestsCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="parents"
            className="rounded-xl px-4 text-xs font-bold uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-950"
          >
            <span>Активни родители</span>
            <span className="ml-1.5 text-[11px] text-zinc-400">
              ({parents.length})
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="absences"
            className="rounded-xl px-4 text-xs font-bold uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-950"
          >
            <span>Уведомления за отсъствия</span>
            {stats.pendingAbsencesCount > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-0.2 text-[10px] text-white font-black">
                {stats.pendingAbsencesCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="corrections"
            className="rounded-xl px-4 text-xs font-bold uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-950"
          >
            <span>Заявки за корекции</span>
            {stats.pendingCorrectionsCount > 0 && (
              <span className="ml-1.5 rounded-full bg-indigo-500 px-1.5 py-0.2 text-[10px] text-white font-black">
                {stats.pendingCorrectionsCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="activity"
            className="rounded-xl px-4 text-xs font-bold uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-950"
          >
            <div className="flex items-center gap-1.5">
              <span>На линия & Вход</span>
              {onlineParentsCount > 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] text-white font-black animate-pulse">
                  <span className="size-1.5 rounded-full bg-white" />
                  {onlineParentsCount}
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400">
                  ({parents.length})
                </span>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENDING REQUESTS */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
              <CheckCircle2
                size={40}
                className="mx-auto text-emerald-500 opacity-60"
              />
              <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                Няма чакащи заявки
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Всички подадени заявки от родители са прегледани и обработени.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {pendingRequests.map((req) => {
                const matchedMember = members.find(
                  (m) => m.id === req.matchedMemberId
                );

                const roleLabel =
                  req.parentRole === "mother"
                    ? "Майка"
                    : req.parentRole === "father"
                      ? "Баща"
                      : "Настойник";

                return (
                  <div
                    key={req.id}
                    className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold"
                        >
                          Чака одобрение
                        </Badge>
                        <span className="text-[11px] text-zinc-400">
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleDateString(
                                "bg-BG",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </span>
                      </div>

                      {/* Parent details */}
                      <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-base font-black text-zinc-900 dark:text-white">
                            {req.parentName}
                          </h4>
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            ({roleLabel})
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} className="text-zinc-400" />
                            <a
                              href={`tel:${req.parentPhone}`}
                              className="font-medium hover:underline"
                            >
                              {formatPhoneDisplay(req.parentPhone)}
                            </a>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="text-zinc-400" />
                            <a
                              href={`mailto:${req.parentEmail}`}
                              className="font-medium hover:underline"
                            >
                              {req.parentEmail}
                            </a>
                          </span>
                        </div>
                      </div>

                      {/* Child info requested */}
                      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                          Заявено дете:
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">
                            {req.childFullName}
                          </span>
                          <span className="text-xs text-zinc-500">
                            Роден(а): {req.childBirthDate}
                          </span>
                        </div>

                        {/* Match Status */}
                        {matchedMember ? (
                          <div className="mt-2.5 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-50/80 px-2.5 py-1.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle2
                                size={14}
                                className="text-emerald-500"
                              />
                              <span>
                                Открито съвпадение в картотеката:{" "}
                                {matchedMember.fullName}
                              </span>
                            </span>
                            <Link
                              href={`/members/${matchedMember.id}`}
                              className="text-[11px] font-bold underline hover:opacity-80"
                              target="_blank"
                            >
                              Картон ↗
                            </Link>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-50/80 px-2.5 py-1.5 text-xs text-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
                            <AlertTriangle
                              size={14}
                              className="text-orange-500 shrink-0"
                            />
                            <span>
                              Няма автоматично съвпадение. Моля, изберете член
                              ръчно преди одобрение.
                            </span>
                          </div>
                        )}

                        {req.isSecondParent && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                            <Users size={12} />
                            <span>ℹ️ Втори родител за това дете</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                      <Button
                        size="sm"
                        onClick={() => handleOpenApproveDialog(req)}
                        className="flex-1 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 shadow-sm"
                      >
                        <Check size={15} className="mr-1.5" />
                        <span>Одобри достъп</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectDialogReq(req);
                          setRejectReason(
                            "Няма открито дете с посочените данни."
                          );
                        }}
                        className="rounded-xl border-zinc-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-zinc-800 dark:hover:bg-red-950/20"
                      >
                        <X size={15} className="mr-1.5" />
                        <span>Откажи</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ACTIVE PARENTS */}
        <TabsContent value="parents" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
              />
              <Input
                placeholder="Търсене по родител, дете, телефон или имейл..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-9"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "all", label: "Всички" },
                  { id: "active", label: "Активни" },
                  { id: "suspended", label: "Спрени" },
                ] as const
              ).map((f) => (
                <Button
                  key={f.id}
                  variant={parentFilter === f.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setParentFilter(f.id)}
                  className="rounded-xl text-xs font-semibold"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {filteredParents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
              <Users size={40} className="mx-auto text-zinc-400" />
              <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                Няма намерени родители
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Променете критериите за търсене или добавете родител ръчно.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredParents.map((parent) => {
                const roleLabel =
                  parent.parentRole === "mother"
                    ? "Майка"
                    : parent.parentRole === "father"
                      ? "Баща"
                      : "Настойник";

                return (
                  <div
                    key={parent.id}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isParentOnline(parent) ? (
                            <span
                              className="relative flex size-3"
                              title="На линия в момента"
                            >
                              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                            </span>
                          ) : (
                            <span
                              className={`size-2.5 rounded-full ${
                                parent.status === "active"
                                  ? "bg-zinc-300 dark:bg-zinc-600"
                                  : "bg-zinc-400"
                              }`}
                            />
                          )}

                          <Badge
                            variant={
                              parent.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[11px] font-bold"
                          >
                            {parent.status === "active"
                              ? "Активен профил"
                              : "Временно спрян"}
                          </Badge>
                          <span className="text-xs font-semibold text-zinc-500">
                            • {roleLabel}
                          </span>

                          {isParentOnline(parent) && (
                            <Badge className="bg-emerald-500 text-white text-[10px] font-extrabold animate-pulse">
                              🟢 На линия
                            </Badge>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-zinc-400">
                          {isParentOnline(parent) ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Последно: {parent.lastAction || "В портала"}
                            </span>
                          ) : parent.lastLoginAt ? (
                            `Последен вход: ${new Date(
                              parent.lastLoginAt
                            ).toLocaleDateString("bg-BG", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })} ч.`
                          ) : (
                            "Все още не е влизал"
                          )}
                        </div>
                      </div>

                      {/* Parent Name & Contacts */}
                      <div className="mt-3">
                        <h4 className="text-base font-black text-zinc-900 dark:text-white">
                          {parent.name}
                        </h4>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                          <a
                            href={`tel:${parent.phone}`}
                            className="flex items-center gap-1 font-medium hover:underline text-blue-600 dark:text-blue-400"
                          >
                            <Phone size={13} />
                            {formatPhoneDisplay(parent.phone)}
                          </a>
                          <a
                            href={`mailto:${parent.email}`}
                            className="flex items-center gap-1 font-medium hover:underline text-zinc-500 dark:text-zinc-400"
                          >
                            <Mail size={13} />
                            {parent.email}
                          </a>
                        </div>
                      </div>

                      {/* Linked Children & Document Sending */}
                      <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800/60 dark:bg-zinc-950/40 space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          <span>
                            Свързани деца &amp; Изпращане на документи:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setLinkingParentId(
                                linkingParentId === parent.id ? null : parent.id
                              );
                              setSelectedChildToLink("");
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            <UserPlus size={12} />
                            <span>+ Свържи още едно дете</span>
                          </button>
                        </div>

                        {/* Inline selector for linking child */}
                        {linkingParentId === parent.id && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-900/50 dark:bg-zinc-900 space-y-2">
                            <div className="text-[11px] font-semibold text-blue-900 dark:text-blue-200">
                              Свързване на състезател към {parent.name}:
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <select
                                aria-label="Изберете състезател за свързване"
                                value={selectedChildToLink}
                                onChange={(e) =>
                                  setSelectedChildToLink(e.target.value)
                                }
                                className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                              >
                                <option value="">
                                  -- Изберете състезател --
                                </option>
                                {members
                                  .filter(
                                    (m) =>
                                      !(parent.linkedMemberIds || []).includes(
                                        m.id
                                      )
                                  )
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.fullName ||
                                        `${m.firstName} ${m.lastName}`}
                                    </option>
                                  ))}
                              </select>
                              <div className="flex items-center gap-1.5 justify-end">
                                <Button
                                  size="sm"
                                  disabled={
                                    !selectedChildToLink || isLinkingChild
                                  }
                                  onClick={() => handleLinkChild(parent.id)}
                                  className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500"
                                >
                                  {isLinkingChild ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    "Свържи"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setLinkingParentId(null)}
                                  className="h-8 px-2.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                                >
                                  Отказ
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2.5">
                          {(parent.linkedMemberIds || []).map((mId) => {
                            const child = members.find((m) => m.id === mId);
                            const childName = child?.fullName || `Член ${mId}`;
                            const sendKey = `${parent.id}_${mId}`;
                            const childDocs = documentRequests.filter(
                              (dr) =>
                                dr.memberId === mId && dr.status !== "cancelled"
                            );
                            return (
                              <div
                                key={mId}
                                className="rounded-xl border border-blue-200/70 bg-white p-2.5 text-xs shadow-2xs dark:border-blue-900/40 dark:bg-zinc-900 space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <Link
                                    href={`/members/${mId}`}
                                    className="font-bold text-zinc-900 dark:text-white hover:underline flex items-center gap-1"
                                    target="_blank"
                                  >
                                    <span>{childName}</span>
                                    <ArrowRight
                                      size={11}
                                      className="text-zinc-400"
                                    />
                                  </Link>

                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenEditPerms(parent, mId)
                                      }
                                      className="text-[11px] text-blue-600 hover:text-blue-700 underline font-semibold dark:text-blue-400"
                                      title="Настройка на права за видимост"
                                    >
                                      ⚙️ Права за видимост
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        isUnlinkingChild ===
                                        `${parent.id}_${mId}`
                                      }
                                      onClick={() =>
                                        handleUnlinkChild(
                                          parent.id,
                                          mId,
                                          childName
                                        )
                                      }
                                      className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-semibold dark:text-rose-400 cursor-pointer"
                                      title="Разкачване на това дете от профила"
                                    >
                                      {isUnlinkingChild ===
                                      `${parent.id}_${mId}` ? (
                                        <Loader2
                                          size={11}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <>
                                          <Trash2 size={11} />
                                          <span>Разкачи</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Send official document to parent portal */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                  <select
                                    aria-label={`Избор на документ за ${childName}`}
                                    value={
                                      selectedDocTypePerChild[sendKey] ||
                                      "membershipApplication"
                                    }
                                    onChange={(e) =>
                                      setSelectedDocTypePerChild((prev) => ({
                                        ...prev,
                                        [sendKey]: e.target
                                          .value as DocumentType,
                                      }))
                                    }
                                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                                  >
                                    {OFFICIAL_DOC_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        📄 {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    size="sm"
                                    disabled={isSendingDocPerChild[sendKey]}
                                    onClick={() =>
                                      handleSendDocFromAdmin(parent.id, mId)
                                    }
                                    className="h-7 rounded-lg bg-indigo-600 px-2.5 text-[11px] font-semibold text-white hover:bg-indigo-500 shrink-0"
                                  >
                                    {isSendingDocPerChild[sendKey] ? (
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <>
                                        <Send size={11} className="mr-1" />
                                        <span>Изпрати за подпис</span>
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Sent documents status for this child */}
                                {childDocs.length > 0 && (
                                  <div className="space-y-1 pt-1">
                                    {childDocs.slice(0, 4).map((docReq) => {
                                      const isSigned =
                                        docReq.status === "completed";
                                      const isViewed = Boolean(
                                        docReq.viewedByParentAt
                                      );
                                      return (
                                        <div
                                          key={docReq.id}
                                          className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-zinc-50 px-2 py-1 text-[11px] dark:bg-zinc-950/60"
                                        >
                                          <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate flex items-center gap-1">
                                            <FileSignature
                                              size={11}
                                              className="text-indigo-500 shrink-0"
                                            />
                                            {docReq.documentTitle}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            {isSigned ? (
                                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                ✍️ Подписан (
                                                {docReq.signedAt
                                                  ? new Date(
                                                      docReq.signedAt
                                                    ).toLocaleDateString(
                                                      "bg-BG"
                                                    )
                                                  : ""}
                                                )
                                              </span>
                                            ) : isViewed ? (
                                              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                                                👁️ Прегледан (очаква подпис)
                                              </span>
                                            ) : (
                                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                ⏳ Изпратен
                                              </span>
                                            )}
                                            <Link
                                              href={`/sign/${docReq.token}`}
                                              target="_blank"
                                              className="text-[10px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                              {isSigned
                                                ? "Преглед ↗"
                                                : "Линк ↗"}
                                            </Link>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(parent)}
                        className="rounded-xl text-xs font-semibold"
                      >
                        {parent.status === "active" ? (
                          <>
                            <Pause size={13} className="mr-1 text-amber-500" />
                            <span>Спри достъп</span>
                          </>
                        ) : (
                          <>
                            <Play size={13} className="mr-1 text-emerald-500" />
                            <span>Активирай</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPassword(parent)}
                        className="rounded-xl text-xs font-semibold"
                        title="Генерирай нова временна парола"
                      >
                        <KeyRound size={13} className="mr-1 text-blue-500" />
                        <span>Нова парола</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmUser(parent)}
                        className="ml-auto rounded-xl text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: ABSENCES */}
        <TabsContent value="absences" className="space-y-4">
          {absences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
              <CalendarDays size={40} className="mx-auto text-zinc-400" />
              <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                Няма подадени уведомления за отсъствие
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Когато родител заяви предстоящо отсъствие през своя портал, то
                ще се появи тук.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {absences.map((abs) => {
                const reasonLabels: Record<string, string> = {
                  illness: "Болест / Неразположение 🤒",
                  school: "Училище / Изпит 📚",
                  travel: "Семейно пътуване / Лични 🚗",
                  injury: "Контузия / Възстановяване 🩹",
                  other: "Друго ✏️",
                };

                const dateDisplay =
                  abs.type === "period" && abs.endDate
                    ? `от ${abs.startDate} до ${abs.endDate}`
                    : `на ${abs.startDate}`;

                return (
                  <div
                    key={abs.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {abs.memberName}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-[11px]"
                        >
                          {reasonLabels[abs.reason] || abs.reason}
                        </Badge>
                        {abs.status === "submitted" ? (
                          <Badge className="bg-orange-500 text-white text-[10px]">
                            Ново
                          </Badge>
                        ) : abs.status === "seen" ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-500/40 text-[10px]"
                          >
                            ✓ Видяно от треньор
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Отменено от родител
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Период:{" "}
                        <strong className="text-zinc-700 dark:text-zinc-200">
                          {dateDisplay}
                        </strong>{" "}
                        • Подадено от: {abs.parentName} (
                        {new Date(abs.createdAt).toLocaleDateString("bg-BG")})
                      </div>

                      {abs.note && (
                        <p className="mt-1.5 text-xs text-zinc-600 italic dark:text-zinc-300">
                          Бележка: &quot;{abs.note}&quot;
                        </p>
                      )}

                      {abs.coachReply && (
                        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Ваш отговор към родителя: &quot;{abs.coachReply}&quot;
                        </p>
                      )}
                    </div>

                    {abs.status === "submitted" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setAbsenceReplyId(abs.id);
                            setAbsenceReplyText("Бързо оздравяване!");
                          }}
                          className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
                        >
                          <Check size={14} className="mr-1" />
                          <span>Маркирай като видяно</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: CORRECTIONS */}
        <TabsContent value="corrections" className="space-y-4">
          {corrections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
              <Pencil size={40} className="mx-auto text-zinc-400" />
              <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
                Няма чакащи корекции на данни
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Когато родител посочи сгрешено поле през моливчето ✏️, заявката
                ще се появи тук за 1-клик одобрение.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {corrections.map((corr) => {
                return (
                  <div
                    key={corr.id}
                    className="flex flex-col gap-3 rounded-2xl border border-indigo-500/30 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/80"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-white font-bold text-[11px]">
                          Корекция: {corr.fieldLabel}
                        </Badge>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          за {corr.memberName}
                        </span>
                        <span className="text-xs text-zinc-400">
                          (от {corr.parentName})
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-3 text-xs">
                        <div className="rounded-lg bg-zinc-100 px-2.5 py-1 text-zinc-600 line-through dark:bg-zinc-800 dark:text-zinc-400">
                          {corr.currentValue || "(празно)"}
                        </div>
                        <ArrowRight size={14} className="text-zinc-400" />
                        <div className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          {corr.proposedValue}
                        </div>
                      </div>

                      {corr.note && (
                        <p className="mt-1.5 text-xs text-zinc-500 italic">
                          Бележка: &quot;{corr.note}&quot;
                        </p>
                      )}
                    </div>

                    {corr.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveCorrection(corr)}
                          className="rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 shadow-sm"
                        >
                          <Check size={14} className="mr-1" />
                          <span>Приеми и обнови картона</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectCorrection(corr)}
                          className="rounded-xl border-zinc-200 text-red-600 hover:bg-red-50 dark:border-zinc-800 dark:hover:bg-red-950/20"
                        >
                          <X size={14} className="mr-1" />
                          <span>Откажи</span>
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant={
                          corr.status === "approved" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {corr.status === "approved" ? "✓ Приета" : "✕ Отказана"}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 5: AUDIT LOG & LIVE ACTIVITY */}
        <TabsContent value="activity" className="space-y-6">
          {/* Top Live Banner */}
          <div className="rounded-3xl border border-emerald-200 bg-linear-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 p-5 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-emerald-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <Eye size={22} className="relative z-10" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-zinc-900 dark:text-white">
                    Родители на живо & История на прегледите
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Виждате в реално време кои родители са в портала и какви
                    данни от досието на детето си са преглеждали.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white font-extrabold px-3 py-1 text-xs shadow-xs">
                  🟢 {onlineParentsCount} на линия в момента
                </Badge>
              </div>
            </div>
          </div>

          {/* Online Parents Cards */}
          {onlineParents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Родители в портала точно сега ({onlineParents.length})
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {onlineParents.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-emerald-300/80 bg-white p-4 shadow-sm dark:border-emerald-800/80 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h5 className="font-bold text-zinc-900 dark:text-white text-sm">
                            {p.name}
                          </h5>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {p.phone} • {p.email}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        На линия
                      </Badge>
                    </div>

                    <div className="mt-3 rounded-xl bg-emerald-50/70 p-2.5 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
                      <span className="font-semibold">Последно действие:</span>{" "}
                      <span>
                        {p.lastAction || "Преглежда родителското табло"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parents Presence & Last Login Overview */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <h4 className="text-sm font-bold uppercase text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>Статус на профилите & Последен вход</span>
                  <Badge variant="outline" className="text-xs">
                    {parents.length} регистрирани родители
                  </Badge>
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Следене на живо кой родител е на линия в момента и кога е бил
                  последният му успешен вход в системата.
                </p>
              </div>
            </div>

            {parents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
                <Clock size={36} className="mx-auto text-zinc-400 opacity-60" />
                <h5 className="mt-2 text-sm font-bold text-zinc-900 dark:text-white">
                  Няма регистрирани родители
                </h5>
                <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                  След одобряване на родителски заявки или ръчно добавяне, тук
                  ще виждате техния онлайн статус и последно влизане.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {parents
                  .slice()
                  .sort((a, b) => {
                    const aOnline = isParentOnline(a) ? 1 : 0;
                    const bOnline = isParentOnline(b) ? 1 : 0;
                    if (aOnline !== bOnline) return bOnline - aOnline;
                    return (b.lastLoginAt || "").localeCompare(
                      a.lastLoginAt || ""
                    );
                  })
                  .map((p) => {
                    const online = isParentOnline(p);
                    const roleLabel =
                      p.parentRole === "mother"
                        ? "Майка"
                        : p.parentRole === "father"
                          ? "Баща"
                          : "Настойник";

                    const matchedMembers = members.filter((m) =>
                      p.linkedMemberIds?.includes(m.id)
                    );

                    return (
                      <div
                        key={p.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 text-xs transition-all ${
                          online
                            ? "border-emerald-300 bg-emerald-50/40 shadow-xs dark:border-emerald-800/80 dark:bg-emerald-950/20"
                            : "border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl font-black text-sm shadow-xs ${
                              online
                                ? "bg-emerald-500 text-white"
                                : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-zinc-900 dark:text-white text-sm">
                                {p.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold"
                              >
                                {roleLabel}
                              </Badge>
                              {online ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                                  🟢 На линия
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  Офлайн
                                </Badge>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                              <span>{p.phone}</span>
                              <span>•</span>
                              <span>{p.email}</span>
                              {matchedMembers.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    Дете:{" "}
                                    {matchedMembers
                                      .map((m) => m.fullName)
                                      .join(", ")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1 shrink-0 text-[11px]">
                          {online ? (
                            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                              <span>
                                Последно: {p.lastAction || "Активен в портала"}
                              </span>
                            </div>
                          ) : p.lastLoginAt ? (
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                              <Clock size={13} className="text-zinc-400" />
                              <span>
                                Последен вход:{" "}
                                <strong>
                                  {new Date(p.lastLoginAt).toLocaleDateString(
                                    "bg-BG",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}{" "}
                                  ч.
                                </strong>
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400">
                              Все още не е влизал
                            </span>
                          )}

                          {p.lastAction && !online && (
                            <span className="text-[10px] text-zinc-400">
                              Действие: {p.lastAction}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: APPROVE REQUEST */}
      {approveDialogReq && (
        <Dialog
          open={Boolean(approveDialogReq)}
          onOpenChange={(open) => !open && setApproveDialogReq(null)}
        >
          <DialogContent className="max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                Одобрение на родителски достъп
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Потвърдете свързването на{" "}
                <strong>{approveDialogReq.parentName}</strong> към досието на
                детето.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Member association */}
              <div>
                <Label
                  htmlFor="admin-approve-child-id"
                  className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400"
                >
                  Изберете член (дете) от картотеката:
                </Label>
                <select
                  id="admin-approve-child-id"
                  name="childId"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                  <option value="">-- Изберете дете --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} {m.dateOfBirth ? `(${m.dateOfBirth})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notice */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-3 text-xs text-blue-900 dark:bg-blue-950/20 dark:text-blue-300">
                <p className="font-semibold">Автоматично попълване:</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  При одобрение телефонът ({approveDialogReq.parentPhone}) и
                  имейлът ({approveDialogReq.parentEmail}) ще се запишат в
                  картона на детето в графите за{" "}
                  <strong>
                    {approveDialogReq.parentRole === "mother"
                      ? "Майка"
                      : approveDialogReq.parentRole === "father"
                        ? "Баща"
                        : "Родител"}
                  </strong>
                  .
                </p>
              </div>

              {/* Permissions Checkboxes (Default: name & attendance only) */}
              <div>
                <Label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                  Права за видимост на данни за това дете:
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                  {[
                    { key: "showBirthDate", label: "Дата на раждане" },
                    { key: "showAgeGroup", label: "Възрастова група" },
                    { key: "showPhone", label: "Телефон на детето" },
                    { key: "showAddress", label: "Адрес на живеене" },
                    { key: "showSchool", label: "Учебно заведение" },
                    { key: "showApparelSize", label: "Размер на екип" },
                    { key: "showEmergencyContact", label: "Спешен телефон" },
                    { key: "showHealthNotes", label: "Здравни бележки" },
                    { key: "showAttendance", label: "Присъствия (Календар)" },
                    { key: "showStatusBadge", label: "Клубна значка" },
                    {
                      key: "showNextTrainingCard",
                      label: "Следваща тренировка",
                    },
                    {
                      key: "showFeeStatus",
                      label: "💳 Членски внос и такси",
                    },
                    {
                      key: "showDocumentsStatus",
                      label: "📄 Документи и медицинско",
                    },
                    {
                      key: "showRanking",
                      label: "🏆 Точки и ранглиста",
                    },
                    {
                      key: "showShadowAndQuizzes",
                      label: "⚡ „Сянка“ и куизове",
                    },
                  ].map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(
                          permissionsState[
                            field.key as keyof ParentMemberPermissions
                          ]
                        )}
                        onChange={(e) =>
                          setPermissionsState((prev) => ({
                            ...prev,
                            [field.key]: e.target.checked,
                          }))
                        }
                        className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveDialogReq(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingApprove}
                onClick={handleConfirmApprove}
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {isSubmittingApprove ? "Одобряване..." : "Одобри и активирай"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 2: REJECT REQUEST */}
      {rejectDialogReq && (
        <Dialog
          open={Boolean(rejectDialogReq)}
          onOpenChange={(open) => !open && setRejectDialogReq(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-red-600">
                Отказ на заявка за достъп
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Посочете причина. Тя ще бъде изпратена по имейл на{" "}
                <strong>{rejectDialogReq.parentEmail}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Label
                htmlFor="admin-reject-reason"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Причина за отказа:
              </Label>
              <textarea
                id="admin-reject-reason"
                name="rejectReason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="напр. Не е открито записано дете с тези имена и рождена дата в клуба..."
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectDialogReq(null)}
                className="rounded-xl"
              >
                Затвори
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingReject}
                onClick={handleConfirmReject}
                className="rounded-xl bg-red-600 text-white hover:bg-red-500"
              >
                {isSubmittingReject ? "Отказване..." : "Изпрати отказ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 3: MANUAL ADD PARENT */}
      <Dialog open={manualAddOpen} onOpenChange={setManualAddOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
              Ръчно създаване на родител
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Въведете контактите на родителя. Системата ще му генерира профил и
              ще му изпрати имейл за достъп.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualAddSubmit} className="space-y-3.5 py-2">
            <div>
              <Label
                htmlFor="admin-manual-name"
                className="text-xs font-semibold"
              >
                Име и фамилия *
              </Label>
              <Input
                id="admin-manual-name"
                name="name"
                autoComplete="name"
                required
                placeholder="напр. Георги Иванов"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="admin-manual-phone"
                  className="text-xs font-semibold"
                >
                  Телефон *
                </Label>
                <Input
                  id="admin-manual-phone"
                  name="phone"
                  autoComplete="tel"
                  required
                  placeholder="0888 123 456"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <Label
                  htmlFor="admin-manual-role"
                  className="text-xs font-semibold"
                >
                  Роля *
                </Label>
                <select
                  id="admin-manual-role"
                  name="role"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as ParentRole)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                  <option value="mother">Майка</option>
                  <option value="father">Баща</option>
                  <option value="guardian">Настойник</option>
                </select>
              </div>
            </div>

            <div>
              <Label
                htmlFor="admin-manual-email"
                className="text-xs font-semibold"
              >
                Имейл адрес *
              </Label>
              <Input
                id="admin-manual-email"
                name="email"
                autoComplete="email"
                type="email"
                required
                placeholder="roditel@email.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <Label
                htmlFor="admin-manual-member-id"
                className="text-xs font-semibold"
              >
                Свързано дете (член) *
              </Label>
              <select
                id="admin-manual-member-id"
                name="memberId"
                required
                value={manualMemberId}
                onChange={(e) => setManualMemberId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              >
                <option value="">-- Изберете дете --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setManualAddOpen(false)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingManual}
                className="rounded-xl bg-blue-600 text-white hover:bg-blue-500"
              >
                {isSubmittingManual ? "Създаване..." : "Създай профил"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: EDIT PERMISSIONS MODAL */}
      {editPermParent && (
        <Dialog
          open={Boolean(editPermParent)}
          onOpenChange={(open) => !open && setEditPermParent(null)}
        >
          <DialogContent className="max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                Настройки за видимост на данни
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Изберете кои полета да вижда{" "}
                <strong>{editPermParent.name}</strong> за избраното дете. Всичко
                немаркирано остава скрито.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto rounded-xl border border-zinc-200 p-3 text-xs dark:border-zinc-800">
                {[
                  { key: "showBirthDate", label: "Дата на раждане" },
                  { key: "showAgeGroup", label: "Възрастова група" },
                  { key: "showPhone", label: "Телефон на детето" },
                  { key: "showAddress", label: "Адрес на живеене" },
                  { key: "showSchool", label: "Учебно заведение" },
                  { key: "showApparelSize", label: "Размер на екип" },
                  { key: "showEmergencyContact", label: "Спешен телефон" },
                  { key: "showHealthNotes", label: "Здравни бележки" },
                  { key: "showAttendance", label: "Присъствия (Календар)" },
                  { key: "showStatusBadge", label: "Клубна значка" },
                  { key: "showNextTrainingCard", label: "Следваща тренировка" },
                  {
                    key: "showFeeStatus",
                    label: "💳 Членски внос и такси",
                  },
                  {
                    key: "showDocumentsStatus",
                    label: "📄 Документи и медицинско",
                  },
                  {
                    key: "showRanking",
                    label: "🏆 Точки и ранглиста",
                  },
                  {
                    key: "showShadowAndQuizzes",
                    label: "⚡ „Сянка“ и куизове",
                  },
                ].map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        editPermValues[
                          field.key as keyof ParentMemberPermissions
                        ]
                      )}
                      onChange={(e) =>
                        setEditPermValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.checked,
                        }))
                      }
                      className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditPermParent(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingPerms}
                onClick={handleSavePerms}
                className="rounded-xl bg-blue-600 text-white hover:bg-blue-500"
              >
                {isSubmittingPerms ? "Записване..." : "Запази права"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 5: REPLY / MARK ABSENCE SEEN */}
      {absenceReplyId && (
        <Dialog
          open={Boolean(absenceReplyId)}
          onOpenChange={(open) => !open && setAbsenceReplyId(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold uppercase text-zinc-900 dark:text-white">
                Преглед на отсъствие
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Можете да въведете кратък окуражаващ отговор, който родителят ще
                види в портала си.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Label className="text-xs font-semibold">
                Отговор от треньора (по избор):
              </Label>
              <Input
                value={absenceReplyText}
                onChange={(e) => setAbsenceReplyText(e.target.value)}
                placeholder="напр. Бързо оздравяване! Ще те чакаме в залата."
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAbsenceReplyId(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isReplyingAbsence}
                onClick={() => handleConfirmAbsenceSeen(absenceReplyId)}
                className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {isReplyingAbsence ? "Запис..." : "Маркирай като видяно"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 6: DELETE CONFIRMATION */}
      {deleteConfirmUser && (
        <Dialog
          open={Boolean(deleteConfirmUser)}
          onOpenChange={(open) => !open && setDeleteConfirmUser(null)}
        >
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold uppercase text-red-600">
                Изтриване на родителски профил
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Сигурни ли сте, че искате да премахнете профила на{" "}
                <strong>{deleteConfirmUser.name}</strong>? Родителят няма да
                може да влиза в портала.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmUser(null)}
                className="rounded-xl"
              >
                Отказ
              </Button>
              <Button
                size="sm"
                disabled={isDeletingUser}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 text-white hover:bg-red-500"
              >
                {isDeletingUser ? "Изтриване..." : "Да, изтрий профила"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
