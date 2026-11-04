"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";

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

export const OFFICIAL_DOC_OPTIONS: { value: DocumentType; label: string }[] = [
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

export type ParentFilterStatus = "all" | "active" | "suspended";
export type CommChannelFilterType = "all" | "phone" | "email";

export interface CredentialsModalState {
  open: boolean;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  tempPassword: string;
  childName?: string;
  title: string;
  emailSent?: boolean;
  copiedPassword?: boolean;
  copiedMessage?: boolean;
}

interface ParentAdminContextType {
  // Data from hook
  requests: ReturnType<typeof useParentPortalAdmin>["requests"];
  parents: ReturnType<typeof useParentPortalAdmin>["parents"];
  absences: ReturnType<typeof useParentPortalAdmin>["absences"];
  corrections: ReturnType<typeof useParentPortalAdmin>["corrections"];
  documentRequests: ReturnType<typeof useParentPortalAdmin>["documentRequests"];
  onlineParents: ReturnType<typeof useParentPortalAdmin>["onlineParents"];
  onlineParentsCount: number;
  isParentOnline: (parent: ParentUser | null | undefined) => boolean;
  members: ReturnType<typeof useParentPortalAdmin>["members"];
  communications: ReturnType<typeof useParentPortalAdmin>["communications"];
  stats: ReturnType<typeof useParentPortalAdmin>["stats"];
  isLoading: boolean;
  refetch: () => void;

  // Search & Filters for Parents Tab
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  parentFilter: ParentFilterStatus;
  setParentFilter: (f: ParentFilterStatus) => void;
  filteredParents: ParentUser[];
  pendingRequests: ParentAccessRequest[];

  // Helpers
  getChildrenForParent: (
    parent: ParentUser | null
  ) => { id: string; name: string }[];
  handleExportCsv: () => void;

  // Communication states
  callingParent: ParentUser | null;
  setCallingParent: (p: ParentUser | null) => void;
  emailingParent: ParentUser | null;
  setEmailingParent: (p: ParentUser | null) => void;
  selectedCommParentId: string;
  setSelectedCommParentId: (id: string) => void;
  commChannelFilter: CommChannelFilterType;
  setCommChannelFilter: (c: CommChannelFilterType) => void;
  commSearchQuery: string;
  setCommSearchQuery: (q: string) => void;

  // Send document state & action
  selectedDocTypePerChild: Record<string, DocumentType>;
  setSelectedDocTypePerChild: React.Dispatch<
    React.SetStateAction<Record<string, DocumentType>>
  >;
  isSendingDocPerChild: Record<string, boolean>;
  handleSendDocFromAdmin: (parentId: string, memberId: string) => Promise<void>;

  // Link / Unlink child state & actions
  linkingParentId: string | null;
  setLinkingParentId: (id: string | null) => void;
  selectedChildToLink: string;
  setSelectedChildToLink: (id: string) => void;
  isLinkingChild: boolean;
  isUnlinkingChild: string | null;
  handleLinkChild: (parentId: string) => Promise<void>;
  handleUnlinkChild: (
    parentId: string,
    memberId: string,
    memberName: string
  ) => Promise<void>;

  // Approve dialog
  approveDialogReq: ParentAccessRequest | null;
  setApproveDialogReq: (req: ParentAccessRequest | null) => void;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  permissionsState: ParentMemberPermissions;
  setPermissionsState: React.Dispatch<
    React.SetStateAction<ParentMemberPermissions>
  >;
  isSubmittingApprove: boolean;
  handleOpenApproveDialog: (req: ParentAccessRequest) => void;
  handleConfirmApprove: () => Promise<void>;

  // Reject dialog
  rejectDialogReq: ParentAccessRequest | null;
  setRejectDialogReq: (req: ParentAccessRequest | null) => void;
  rejectReason: string;
  setRejectReason: (r: string) => void;
  isSubmittingReject: boolean;
  handleConfirmReject: () => Promise<void>;

  // Manual Add parent dialog
  manualAddOpen: boolean;
  setManualAddOpen: (o: boolean) => void;
  manualName: string;
  setManualName: (s: string) => void;
  manualPhone: string;
  setManualPhone: (s: string) => void;
  manualEmail: string;
  setManualEmail: (s: string) => void;
  manualRole: ParentRole;
  setManualRole: (r: ParentRole) => void;
  manualMemberId: string;
  setManualMemberId: (id: string) => void;
  isSubmittingManual: boolean;
  handleManualAddSubmit: (e: React.FormEvent) => Promise<void>;

  // Edit Permissions dialog
  editPermParent: ParentUser | null;
  setEditPermParent: (p: ParentUser | null) => void;
  editPermMemberId: string;
  setEditPermMemberId: (id: string) => void;
  editPermValues: ParentMemberPermissions;
  setEditPermValues: React.Dispatch<
    React.SetStateAction<ParentMemberPermissions>
  >;
  isSubmittingPerms: boolean;
  handleOpenEditPerms: (parent: ParentUser, memberId: string) => void;
  handleSavePerms: () => Promise<void>;

  // Absence reply dialog
  absenceReplyId: string | null;
  setAbsenceReplyId: (id: string | null) => void;
  absenceReplyText: string;
  setAbsenceReplyText: (t: string) => void;
  isReplyingAbsence: boolean;
  handleConfirmAbsenceSeen: (absenceId: string) => Promise<void>;

  // Delete parent dialog
  deleteConfirmUser: ParentUser | null;
  setDeleteConfirmUser: (u: ParentUser | null) => void;
  isDeletingUser: boolean;
  handleConfirmDelete: () => Promise<void>;

  // Toggle status & password reset
  handleToggleStatus: (parent: ParentUser) => Promise<void>;
  handleResetPassword: (parent: ParentUser) => Promise<void>;

  // Data corrections
  handleApproveCorrection: (corr: DataCorrectionRequest) => Promise<void>;
  handleRejectCorrection: (corr: DataCorrectionRequest) => Promise<void>;

  // Persistent Credentials modal
  credentialsModal: CredentialsModalState;
  setCredentialsModal: React.Dispatch<
    React.SetStateAction<CredentialsModalState>
  >;
}

const ParentAdminContext = createContext<ParentAdminContextType | null>(null);

export function ParentAdminProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
    communications,
    stats,
    isLoading,
    refetch,
  } = useParentPortalAdmin();

  // Individual communication states
  const [callingParent, setCallingParent] = useState<ParentUser | null>(null);
  const [emailingParent, setEmailingParent] = useState<ParentUser | null>(null);
  const [selectedCommParentId, setSelectedCommParentId] =
    useState<string>("all");
  const [commChannelFilter, setCommChannelFilter] = useState<
    "all" | "phone" | "email"
  >("all");
  const [commSearchQuery, setCommSearchQuery] = useState("");

  const getChildrenForParent = (parent: ParentUser | null) => {
    if (!parent) return [];
    const linked = parent.linkedMemberIds || [];
    return members
      .filter((m) => linked.includes(m.id))
      .map((m) => ({
        id: m.id,
        name: m.fullName || `${m.firstName} ${m.lastName}`.trim(),
      }));
  };

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

  // Persistent Credentials Modal State
  const [credentialsModal, setCredentialsModal] =
    useState<CredentialsModalState>({
      open: false,
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      tempPassword: "",
      title: "",
    });

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
          `Заявката за ${approveDialogReq.parentName} беше одобрена успешно! Данните са вписани в досието на детето и е изпратен потвърдителен имейл.`
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
      const childNames = (parent.linkedMemberIds || [])
        .map((mId) => members.find((m) => m.id === mId)?.fullName || mId)
        .join(", ");

      setCredentialsModal({
        open: true,
        parentName: parent.name,
        parentPhone: parent.phone,
        parentEmail: parent.email,
        tempPassword: res.tempPassword || "",
        childName: childNames,
        title: "Генерирана е нова парола за родителя!",
        emailSent: res.emailSent,
      });

      if (res.emailSent) {
        toast.success(
          `Генерирана нова парола! На ${parent.email} е изпратен имейл.`
        );
      } else {
        toast.warning(
          `Генерирана нова парола, но имейлът не можа да бъде доставен автоматично.`
        );
      }
      refetch();
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
        const matchedMember = members.find((m) => m.id === manualMemberId);
        setCredentialsModal({
          open: true,
          parentName: manualName,
          parentPhone: manualPhone,
          parentEmail: manualEmail,
          tempPassword: res.tempPassword || "",
          childName: matchedMember?.fullName || "",
          title: "Родителският профил е създаден успешно!",
          emailSent: res.emailSent,
        });

        toast.success(
          `Родителят беше добавен успешно! Временна парола: "${res.tempPassword}".`
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
    <ParentAdminContext.Provider
      value={{
        requests,
        parents,
        absences,
        corrections,
        documentRequests,
        onlineParents,
        onlineParentsCount,
        isParentOnline,
        members,
        communications,
        stats,
        isLoading,
        refetch,

        searchQuery,
        setSearchQuery,
        parentFilter,
        setParentFilter,
        filteredParents,
        pendingRequests,

        getChildrenForParent,
        handleExportCsv,

        callingParent,
        setCallingParent,
        emailingParent,
        setEmailingParent,
        selectedCommParentId,
        setSelectedCommParentId,
        commChannelFilter,
        setCommChannelFilter,
        commSearchQuery,
        setCommSearchQuery,

        selectedDocTypePerChild,
        setSelectedDocTypePerChild,
        isSendingDocPerChild,
        handleSendDocFromAdmin,

        linkingParentId,
        setLinkingParentId,
        selectedChildToLink,
        setSelectedChildToLink,
        isLinkingChild,
        isUnlinkingChild,
        handleLinkChild,
        handleUnlinkChild,

        approveDialogReq,
        setApproveDialogReq,
        selectedChildId,
        setSelectedChildId,
        permissionsState,
        setPermissionsState,
        isSubmittingApprove,
        handleOpenApproveDialog,
        handleConfirmApprove,

        rejectDialogReq,
        setRejectDialogReq,
        rejectReason,
        setRejectReason,
        isSubmittingReject,
        handleConfirmReject,

        manualAddOpen,
        setManualAddOpen,
        manualName,
        setManualName,
        manualPhone,
        setManualPhone,
        manualEmail,
        setManualEmail,
        manualRole,
        setManualRole,
        manualMemberId,
        setManualMemberId,
        isSubmittingManual,
        handleManualAddSubmit,

        editPermParent,
        setEditPermParent,
        editPermMemberId,
        setEditPermMemberId,
        editPermValues,
        setEditPermValues,
        isSubmittingPerms,
        handleOpenEditPerms,
        handleSavePerms,

        absenceReplyId,
        setAbsenceReplyId,
        absenceReplyText,
        setAbsenceReplyText,
        isReplyingAbsence,
        handleConfirmAbsenceSeen,

        deleteConfirmUser,
        setDeleteConfirmUser,
        isDeletingUser,
        handleConfirmDelete,

        handleToggleStatus,
        handleResetPassword,

        handleApproveCorrection,
        handleRejectCorrection,

        credentialsModal,
        setCredentialsModal,
      }}
    >
      {children}
    </ParentAdminContext.Provider>
  );
}

export function useParentAdminContext() {
  const context = useContext(ParentAdminContext);
  if (!context) {
    throw new Error(
      "useParentAdminContext must be used within a ParentAdminProvider"
    );
  }
  return context;
}
