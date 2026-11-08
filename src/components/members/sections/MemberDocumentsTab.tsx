"use client";

import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Contact,
  Eye,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Loader2,
  LucideIcon,
  Printer,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Upload,
  UserMinus,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ViewSignedDocumentDialog } from "@/components/documents/ViewSignedDocumentDialog";
import { DocumentRequestsHistory } from "@/components/members/DocumentRequestsHistory";
import { GenerateDocumentLinkDialog } from "@/components/members/GenerateDocumentLinkDialog";
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
import { useAuth } from "@/context/auth-context";
import { useClubFeeServices } from "@/hooks/useClubFeeServices";
import {
  deleteDeclarationAction,
  getMemberDeclarationsAction,
} from "@/lib/actions/declarations";
import { getMemberDocumentRequestsAction } from "@/lib/actions/document-requests";
import { getDocumentTemplatesAction } from "@/lib/actions/document-templates";
import { uploadAdminMedicalCertificateAction } from "@/lib/actions/members";
import { getCalendarYearValidity } from "@/lib/document-validity";
import { isMatchingParticipation } from "@/lib/services-fees";
import { cn } from "@/lib/utils";
import { Member, SignedDeclaration } from "@/types";
import { DocumentRequest, DocumentType } from "@/types/document-request.types";
import { DocumentTemplate } from "@/types/document-template.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocumentField =
  | "signedDeclaration"
  | "medicalCertificate"
  | "isLicensed"
  | "travelDeclaration"
  | "safetyInstruction"
  | "internalRules"
  | "membershipApplication"
  | "terminationRequest"
  | "amateurContract"
  | "licenseApplication";

interface MemberDocumentsTabProps {
  member: Member;
  formatDocDate: (isoString: string | null | undefined) => string | null;
  updateDocumentStatus: (
    baseField: DocumentField,
    action: "print" | "submit" | "cancel"
  ) => Promise<void>;
}

// ── DocumentRow sub-component ────────────────────────────────────────────────

interface DocumentRowProps {
  icon: LucideIcon;
  altIcon?: LucideIcon;
  isCompleted: boolean;
  title: string;
  statusText: string | React.ReactNode;
  printLabel?: string;
  submitLabel: string;
  cancelLabel?: string;
  /** Button variant when not completed. Defaults to dark (zinc-950). */
  pendingVariant?: "dark" | "danger";
  onPrint: () => void;
  onToggle: () => void;
  onGenerateLink?: () => void;
  onViewSignature?: () => void;
  onUploadFile?: () => void;
  onViewFile?: () => void;
}

const DocumentRow = ({
  icon: Icon,
  altIcon: AltIcon,
  isCompleted,
  title,
  statusText,
  submitLabel,
  cancelLabel = "Отмени",
  pendingVariant = "dark",
  onPrint,
  onToggle,
  onGenerateLink,
  onViewSignature,
  onUploadFile,
  onViewFile,
}: DocumentRowProps) => {
  const IconComponent = isCompleted || !AltIcon ? Icon : AltIcon;

  const pendingClass =
    pendingVariant === "danger"
      ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
      : "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border-zinc-950 dark:border-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200";

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-zinc-100/50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:gap-6 sm:rounded-4xl sm:p-8 lg:flex-row lg:items-center">
      <div className="flex w-full items-center gap-4 sm:gap-6">
        <div
          className={cn(
            "shrink-0 rounded-xl p-3 sm:rounded-2xl sm:p-4",
            isCompleted
              ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
              : "border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-300 dark:text-zinc-600"
          )}
        >
          <IconComponent className="size-5 sm:size-6" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="tracking-widest2 mb-1 truncate text-[10px] font-medium text-zinc-950 dark:text-zinc-100 uppercase sm:text-[11px]">
            {title}
          </h4>
          <div className="line-clamp-2 text-xs font-light text-zinc-400 sm:text-sm">
            {statusText}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto">
        {onViewSignature && (
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-lg border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 px-3 text-[9px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-900 sm:h-11 sm:rounded-xl sm:px-4 sm:text-[10px] lg:flex-none"
            onClick={onViewSignature}
            title="Прегледай положения електронен подпис"
          >
            <Eye
              className="mr-1.5 size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400"
              strokeWidth={2}
            />
            Подпис
          </Button>
        )}

        {onViewFile && (
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-lg border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/40 px-3 text-[9px] font-bold tracking-wider text-sky-800 dark:text-sky-300 uppercase transition-all hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:text-sky-900 sm:h-11 sm:rounded-xl sm:px-4 sm:text-[10px] lg:flex-none"
            onClick={onViewFile}
            title="Прегледай прикачения документ"
          >
            <Eye
              className="mr-1.5 size-3.5 sm:size-4 text-sky-600 dark:text-sky-400"
              strokeWidth={2}
            />
            Виж файл
          </Button>
        )}

        {onUploadFile && (
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-lg border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900/60 px-3 text-[9px] font-semibold tracking-wider text-zinc-700 dark:text-zinc-300 uppercase transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 sm:h-11 sm:rounded-xl sm:px-4 sm:text-[10px] lg:flex-none"
            onClick={onUploadFile}
            title="Прикачи скан или снимка на документ"
          >
            <Upload
              className="mr-1.5 size-3.5 sm:size-4 text-zinc-600 dark:text-zinc-400"
              strokeWidth={2}
            />
            Качи файл
          </Button>
        )}

        {onGenerateLink && (
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-lg border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 px-3 text-[9px] font-semibold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-900 sm:h-11 sm:rounded-xl sm:px-4 sm:text-[10px] lg:flex-none"
            onClick={onGenerateLink}
            title="Генерирай линк за родител"
          >
            <LinkIcon
              className="mr-1.5 size-3.5 sm:size-4 text-emerald-600 dark:text-emerald-400"
              strokeWidth={2}
            />
            Линк
          </Button>
        )}
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-lg border-zinc-100 dark:border-zinc-800 px-4 text-[9px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-950 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 sm:h-11 sm:rounded-xl sm:px-6 sm:text-[10px] lg:flex-none"
          onClick={onPrint}
        >
          <Printer className="mr-2 size-3.5 sm:size-4" strokeWidth={1.5} />
          Печат
        </Button>
        <Button
          variant="outline"
          className={cn(
            "h-10 flex-1 rounded-lg border-zinc-100 dark:border-zinc-800 px-4 text-[9px] font-medium tracking-widest uppercase transition-all sm:h-11 sm:rounded-xl sm:px-6 sm:text-[10px] lg:flex-none",
            !isCompleted && pendingClass
          )}
          onClick={onToggle}
        >
          {isCompleted ? cancelLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
};

// ── Status text helpers ───────────────────────────────────────────────────────

function completedText(
  label: string,
  date: string | null,
  rawIsoDate?: string | null
): React.ReactNode {
  const validity = rawIsoDate ? getCalendarYearValidity(rawIsoDate) : null;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-emerald-600 dark:text-emerald-400">
        {label} {date}
      </span>
      {validity && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
            validity.isExpired
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
          )}
        >
          {validity.badgeText}
        </span>
      )}
      {validity?.isExpired && (
        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
          (Изисква подновяване за {validity.currentYear} г.!)
        </span>
      )}
    </span>
  );
}

function printedText(label: string, date: string | null): React.ReactNode {
  return (
    <span>
      {label} {date}
    </span>
  );
}

type StatusResult = string | React.ReactNode;

function getMembershipStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasMembershipApplication)
    return completedText(
      "Предадена на",
      fmt(member.membershipApplicationHandedAt),
      member.membershipApplicationHandedAt
    );
  if (member.membershipApplicationPrintedAt)
    return printedText(
      "Разпечатана на",
      fmt(member.membershipApplicationPrintedAt)
    );
  return "Основен документ за приемане в клуба.";
}

function getTerminationStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasTerminationRequest)
    return completedText(
      "Предадена на",
      fmt(member.terminationRequestHandedAt),
      member.terminationRequestHandedAt
    );
  if (member.terminationRequestPrintedAt)
    return printedText(
      "Разпечатана на",
      fmt(member.terminationRequestPrintedAt)
    );
  return "Документ за прекратяване на членство.";
}

function getInternalRulesStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasInternalRules)
    return completedText(
      "Приет на",
      fmt(member.internalRulesHandedAt),
      member.internalRulesHandedAt
    );
  if (member.internalRulesPrintedAt)
    return printedText("Разпечатан на", fmt(member.internalRulesPrintedAt));
  return "Правила за работа и етика в клуба.";
}

function getDeclarationStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasSignedDeclaration)
    return completedText(
      "Предадена на",
      fmt(member.signedDeclarationHandedAt),
      member.signedDeclarationHandedAt
    );
  if (member.signedDeclarationPrintedAt)
    return printedText(
      "Разпечатана на",
      fmt(member.signedDeclarationPrintedAt)
    );
  return "Липсва декларация!";
}

function getTravelStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasTravelDeclaration)
    return completedText(
      "Предадено на",
      fmt(member.travelDeclarationHandedAt),
      member.travelDeclarationHandedAt
    );
  if (member.travelDeclarationPrintedAt)
    return printedText(
      "Разпечатано на",
      fmt(member.travelDeclarationPrintedAt)
    );
  return "Съгласие за транспорт и спортни събития.";
}

function getSafetyStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasSafetyInstruction)
    return completedText(
      "Предаден на",
      fmt(member.safetyInstructionHandedAt),
      member.safetyInstructionHandedAt
    );
  if (member.safetyInstructionPrintedAt)
    return printedText("Разпечатан на", fmt(member.safetyInstructionPrintedAt));
  return "Правила за пътуване и състезания.";
}

function getLicenseStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.isLicensed)
    return completedText(
      "Активна от",
      fmt(member.isLicensedHandedAt),
      member.isLicensedHandedAt
    );
  if (member.isLicensedPrintedAt)
    return printedText("Разпечатана на", fmt(member.isLicensedPrintedAt));
  return "Няма активна картотека.";
}

function getMedicalStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasMedicalCertificate) {
    const isPendingReview =
      member.medicalCertificateStatus === "pending_review";
    return (
      <div className="space-y-1">
        {completedText(
          "Предадено на",
          fmt(
            member.medicalCertificateHandedAt || member.medicalCertificateDate
          ),
          member.medicalCertificateDate || member.medicalCertificateHandedAt
        )}
        {member.medicalCertificateDate && (
          <div className="text-[11px] text-zinc-500">
            Дата на преглед:{" "}
            <b>
              {new Date(member.medicalCertificateDate).toLocaleDateString(
                "bg-BG"
              )}{" "}
              г.
            </b>
          </div>
        )}
        {member.medicalCertificateUrl && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
              📎 Прикачен скан/файл
            </span>
            {isPendingReview && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                ⏳ Качен от родител (очаква преглед)
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
  if (member.medicalCertificatePrintedAt)
    return printedText(
      "Разпечатано на",
      fmt(member.medicalCertificatePrintedAt)
    );
  return "Липсва медицинско свидетелство!";
}

function getAmateurContractStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasAmateurContract)
    return completedText(
      "Подписан на",
      fmt(member.amateurContractHandedAt),
      member.amateurContractHandedAt
    );
  if (member.amateurContractPrintedAt)
    return printedText("Разпечатан на", fmt(member.amateurContractPrintedAt));
  return "Едногодишен договор за спортисти с аматьорски статут.";
}

function getLicenseApplicationStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasLicenseApplication)
    return completedText(
      "Подадена на",
      fmt(member.licenseApplicationHandedAt),
      member.licenseApplicationHandedAt
    );
  if (member.licenseApplicationPrintedAt)
    return printedText(
      "Разпечатана на",
      fmt(member.licenseApplicationPrintedAt)
    );
  return "Официална молба за картотекиране в БФБадминтон.";
}

// ── Main component ────────────────────────────────────────────────────────────

export const MemberDocumentsTab = ({
  member,
  formatDocDate,
  updateDocumentStatus,
}: MemberDocumentsTabProps) => {
  const { idToken, getFreshToken } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlAction = searchParams?.get("action");
  const urlDocType = searchParams?.get("generateLink") as DocumentType | null;
  const urlPreviewId = searchParams?.get("previewDoc");

  const { feeOptions } = useClubFeeServices();
  const [declarations, setDeclarations] = useState<SignedDeclaration[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [previewRequest, setPreviewRequest] = useState<DocumentRequest | null>(
    null
  );
  const [internalLinkDialogOpen, setInternalLinkDialogOpen] = useState(false);
  const isLinkDialogOpen = Boolean(urlDocType) || internalLinkDialogOpen;

  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(
    urlDocType || "membershipApplication"
  );
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Medical Certificate Upload Modal State
  const [internalMedicalModalOpen, setInternalMedicalModalOpen] =
    useState(false);
  const isMedicalModalOpen =
    urlAction === "upload-medical" || internalMedicalModalOpen;

  const [medicalCertDate, setMedicalCertDate] = useState(
    member.medicalCertificateDate || new Date().toISOString().split("T")[0]
  );
  const [medicalFileBase64, setMedicalFileBase64] = useState<string | null>(
    null
  );
  const [medicalFileName, setMedicalFileName] = useState("");
  const [isUploadingMedical, setIsUploadingMedical] = useState(false);

  const handleOpenLinkDialog = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setInternalLinkDialogOpen(true);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("generateLink", docType);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleLinkDialogChange = (open: boolean) => {
    setInternalLinkDialogOpen(open);
    if (!open) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("generateLink");
      const q = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${q}`, { scroll: false });
    }
  };

  const handleOpenMedicalModal = () => {
    setInternalMedicalModalOpen(true);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("action", "upload-medical");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleMedicalModalChange = (open: boolean) => {
    setInternalMedicalModalOpen(open);
    if (!open) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("action");
      const q = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${q}`, { scroll: false });
    }
  };

  const handleOpenPreview = (req: DocumentRequest) => {
    setPreviewRequest(req);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("previewDoc", req.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePreviewChange = (open: boolean) => {
    if (!open) {
      setPreviewRequest(null);
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("previewDoc");
      const q = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${q}`, { scroll: false });
    }
  };

  const fetchRequests = useCallback(async () => {
    try {
      const token = idToken || (await getFreshToken());
      if (!token) return;
      const res = await getMemberDocumentRequestsAction({
        memberId: member.id,
        idToken: token,
      });
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  }, [idToken, getFreshToken, member.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, historyRefreshKey]);

  useEffect(() => {
    if (urlPreviewId && requests.length > 0 && !previewRequest) {
      const found = requests.find((r) => r.id === urlPreviewId);
      if (found) {
        setPreviewRequest(found);
      }
    }
  }, [urlPreviewId, requests, previewRequest]);

  useEffect(() => {
    if (urlDocType && urlDocType !== selectedDocType) {
      setSelectedDocType(urlDocType);
    }
  }, [urlDocType, selectedDocType]);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await getDocumentTemplatesAction();
        if (res.success && res.data) {
          setTemplates(res.data);
        }
      } catch (err) {
        console.error("Error loading templates:", err);
      }
    }
    loadTemplates();
  }, []);

  useEffect(() => {
    async function fetchDeclarations() {
      try {
        const res = await getMemberDeclarationsAction(member.id);
        if (res.success && res.data) {
          setDeclarations(res.data);
        }
      } catch (err) {
        console.error("Error fetching declarations for member:", err);
      }
    }
    fetchDeclarations();
  }, [member.id]);

  const handleMedicalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMedicalFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMedicalFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMedicalCertificate = async () => {
    if (!medicalFileBase64) {
      toast.error("Моля, изберете файл (снимка или PDF).");
      return;
    }
    const token = idToken || (await getFreshToken());
    if (!token) {
      toast.error("Не сте оторизиран.");
      return;
    }

    setIsUploadingMedical(true);
    try {
      const res = await uploadAdminMedicalCertificateAction({
        memberId: member.id,
        fileBase64: medicalFileBase64,
        fileName: medicalFileName,
        certificateDate: medicalCertDate,
        idToken: token,
      });
      if (res.success) {
        toast.success("Медицинското свидетелство е качено успешно!");
        handleMedicalModalChange(false);
        setMedicalFileBase64(null);
        setMedicalFileName("");
        window.location.reload();
      } else {
        toast.error(res.error || "Грешка при качване на медицинско.");
      }
    } catch (err) {
      console.error("Medical upload error:", err);
      toast.error("Възникна грешка при качването на файла.");
    } finally {
      setIsUploadingMedical(false);
    }
  };

  const openPrint = (path: string, field: DocumentField) => {
    updateDocumentStatus(field, "print");
    window.open(path, "_blank");
  };

  const toggle = (field: DocumentField, isCompleted: boolean) =>
    updateDocumentStatus(field, isCompleted ? "cancel" : "submit");

  const handleDeleteDeclaration = async (id: string) => {
    if (
      window.confirm("Сигурни ли сте, че искате да изтриете тази декларация?")
    ) {
      try {
        const res = await deleteDeclarationAction(id);
        if (res.success) {
          setDeclarations((prev) => prev.filter((d) => d.id !== id));
        } else {
          alert(res.message || "Грешка при изтриването.");
        }
      } catch (error) {
        console.error("Error deleting declaration:", error);
        alert("Възникна грешка при изтриването.");
      }
    }
  };

  const membershipTpl = templates.find((t) => t.id === "membershipApplication");
  const terminationTpl = templates.find((t) => t.id === "terminationRequest");
  const internalRulesTpl = templates.find((t) => t.id === "internalRules");
  const declarationTpl = templates.find((t) => t.id === "signedDeclaration");
  const travelTpl = templates.find((t) => t.id === "travelDeclaration");
  const safetyTpl = templates.find((t) => t.id === "safetyInstruction");
  const amateurContractTpl = templates.find((t) => t.id === "amateurContract");
  const schoolLetters = [
    {
      id: "schoolRelease",
      path: "school-release",
      purpose:
        "За по-рано тръгване от училище за тренировка (освобождаване от занималня).",
    },
    {
      id: "schoolAbsence",
      path: "school-absence",
      purpose:
        "За отсъствие от училище при участие в състезание (освобождаване от учебни занятия).",
    },
  ]
    .map((l) => ({
      ...l,
      tpl: templates.find((t) => t.id === l.id && t.isActive),
    }))
    .filter((l) => !!l.tpl);

  const customTemplates = templates.filter(
    (t) =>
      t.isActive &&
      t.isRequiredForMember &&
      ![
        "membershipApplication",
        "internalRules",
        "signedDeclaration",
        "travelDeclaration",
        "safetyInstruction",
        "terminationRequest",
        "schoolRelease",
        "schoolAbsence",
        "amateurContract",
        "licenseApplicationAdult",
        "licenseApplicationMinor",
        "athleteCard",
      ].includes(t.id)
  );

  const handlePrintDocumentTemplate = (
    tpl: DocumentTemplate | undefined,
    field: DocumentField,
    fallbackPath: string
  ) => {
    updateDocumentStatus(field, "print");

    if (!tpl) {
      window.open(fallbackPath, "_blank");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const matchingReq = requests.find(
      (r) => r.documentType === tpl.id && r.status === "completed"
    );
    const signatureUrl =
      matchingReq?.signatureUrl ||
      ((member as Record<string, unknown>)[`${field}SignatureUrl`] as string) ||
      ((member as Record<string, unknown>)[`${field}Url`] as string) ||
      null;
    const secondParentSigUrl = matchingReq?.secondParentSignatureUrl || null;
    const memberSigUrl = matchingReq?.memberSignatureUrl || null;

    const secondParentName =
      (member as Record<string, unknown>).secondParentName ||
      matchingReq?.parentData?.secondParentName ||
      "";
    const secondParentPhone =
      (member as Record<string, unknown>).secondParentPhone ||
      matchingReq?.parentData?.secondParentPhone ||
      "";

    const memberBirthStr = member.dateOfBirth
      ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
      : "";

    const printCheckboxes =
      (tpl.id === "internalRules" || tpl.id === "membershipApplication") &&
      feeOptions.length > 0
        ? feeOptions.map((f) => ({
            id: f.id,
            label: `${f.name} ( ${f.price} ${f.currency} )`,
          }))
        : tpl.checkboxes || [];

    const participationType = matchingReq?.parentData?.participationType || "";
    const renderedCheckboxesHtml =
      printCheckboxes.length > 0
        ? `
          <div class="checkboxes-box">
            <div style="font-weight: bold; margin-bottom: 6px;">ИЗБИРАМ/Е СЛЕДНАТА ФОРМА НА УЧАСТИЕ:</div>
            ${printCheckboxes
              .map((c) => {
                const isSelected =
                  Boolean(participationType) &&
                  isMatchingParticipation(participationType, c.label);
                return `<div class="chk-row">${isSelected ? "☑ <b>" : "☐ "}${c.label}${isSelected ? "</b>" : ""}</div>`;
              })
              .join("")}
          </div>
        `
        : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="utf-8">
        <title>${tpl.title} — ${member.name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff;
            color: #0f172a;
            font-family: 'Times New Roman', Times, serif;
          }
          .header-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .logo-group {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-img {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          .header-text {
            font-size: 8.5pt;
            line-height: 1.3;
          }
          .title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 15px 0 10px 0;
            letter-spacing: 1px;
          }
          .addressee {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 15px;
          }
          .addressee-inner {
            width: 50%;
            text-align: left;
            font-size: 10pt;
            white-space: pre-line;
            font-weight: bold;
          }
          .applicant-box {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            padding: 8px 12px;
            font-size: 9.5pt;
            margin-bottom: 15px;
            line-height: 1.4;
          }
          .body-content {
            font-size: 10pt;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-line;
            margin: 15px 0;
          }
          .checkboxes-box {
            margin: 15px 0;
            font-size: 9.5pt;
          }
          .chk-row {
            margin: 4px 0;
          }
          .footer-box {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10pt;
          }
          .sig-img {
            height: 44px;
            max-width: 160px;
            object-fit: contain;
            display: block;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        ${
          tpl.headerType !== "none"
            ? `
          <div class="header-box">
            <div class="logo-group">
              <img src="/icons/LOGO.webp" class="logo-img" onerror="this.src='/icons/LOGO.jpg'" />
              <div class="header-text">
                <div style="font-weight: bold; font-size: 9.5pt;">СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“</div>
                <div style="font-style: italic;">гр. Гълъбово, п.к 6280, обл. Стара Загора, ул. "Иван Вазов" №22</div>
                <div>тел: <b>+359 899 82 99 23</b> – Мира Георгиева</div>
                <div>e-mail: bk_galabovo@abv.bg</div>
              </div>
            </div>
          </div>
        `
            : ""
        }
        
        <div class="title">${tpl.title}</div>
        
        ${
          tpl.addressee
            ? `
          <div class="addressee">
            <div class="addressee-inner">${tpl.addressee}</div>
          </div>
        `
            : ""
        }

        <div class="applicant-box">
          <div><b>Състезател / Член:</b> ${member.name} ${
            memberBirthStr ? `(роден/а на: ${memberBirthStr} г.)` : ""
          }</div>
          ${member.egn ? `<div><b>ЕГН:</b> ${member.egn}</div>` : ""}
          ${
            member.parentName
              ? `<div><b>Родител / Настойник 1:</b> ${member.parentName} ${
                  member.parentPhone ? `(тел: ${member.parentPhone})` : ""
                }</div>`
              : member.phone
                ? `<div><b>Тел. за връзка:</b> ${member.phone}</div>`
                : ""
          }
          ${
            secondParentName
              ? `<div><b>Втори родител:</b> ${secondParentName} ${
                  secondParentPhone ? `(тел: ${secondParentPhone})` : ""
                }</div>`
              : ""
          }
          ${member.address ? `<div><b>Адрес:</b> ${member.address}</div>` : ""}
        </div>

        <div class="body-content">
          ${tpl.content}
        </div>

        ${renderedCheckboxesHtml}

        <div class="footer-box">
          <div>
            <div>${tpl.closingLocation || "спортна зала „Енергетик“, град Гълъбово"}</div>
            <div style="margin-top: 5px;">Дата: ${new Date().toLocaleDateString("bg-BG")} г.</div>
          </div>
          <div style="text-align: right;">
            ${
              signatureUrl
                ? `<img src="${signatureUrl}" class="sig-img" alt="Подпис" />`
                : `<div style="border-bottom: 1px solid #0f172a; width: 180px; margin-bottom: 4px; display: inline-block;"></div>`
            }
            <div>(Подпис на родител / настойник 1)</div>
            ${
              secondParentSigUrl
                ? `
              <div style="margin-top: 10px;">
                <img src="${secondParentSigUrl}" class="sig-img" alt="Подпис втори родител" />
                <div>(Подпис на втори родител)</div>
              </div>
            `
                : ""
            }
            ${
              memberSigUrl
                ? `
              <div style="margin-top: 10px;">
                <img src="${memberSigUrl}" class="sig-img" alt="Подпис състезател" />
                <div>(Подпис на състезател)</div>
              </div>
            `
                : ""
            }
            ${
              tpl.signatures?.requirePresident
                ? `
              <div style="margin-top: 12px; font-weight: bold;">Председател: ${tpl.signatures.presidentName}</div>
            `
                : ""
            }
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const membershipStatus = getMembershipStatus(member, formatDocDate);
  const terminationStatus = getTerminationStatus(member, formatDocDate);
  const internalRulesStatus = getInternalRulesStatus(member, formatDocDate);
  const declarationStatus = getDeclarationStatus(member, formatDocDate);
  const travelStatus = getTravelStatus(member, formatDocDate);
  const safetyStatus = getSafetyStatus(member, formatDocDate);
  const licenseStatus = getLicenseStatus(member, formatDocDate);
  const medicalStatus = getMedicalStatus(member, formatDocDate);
  const amateurContractStatus = getAmateurContractStatus(member, formatDocDate);
  const licenseApplicationStatus = getLicenseApplicationStatus(
    member,
    formatDocDate
  );

  // Find completed requests with signatures for direct 1-click preview
  const membershipReq = requests.find(
    (r) =>
      r.documentType === "membershipApplication" && r.status === "completed"
  );
  const terminationReq = requests.find(
    (r) => r.documentType === "terminationRequest" && r.status === "completed"
  );
  const internalRulesReq = requests.find(
    (r) => r.documentType === "internalRules" && r.status === "completed"
  );
  const declarationReq = requests.find(
    (r) => r.documentType === "signedDeclaration" && r.status === "completed"
  );
  const travelReq = requests.find(
    (r) => r.documentType === "travelDeclaration" && r.status === "completed"
  );
  const safetyReq = requests.find(
    (r) => r.documentType === "safetyInstruction" && r.status === "completed"
  );
  const amateurContractReq = requests.find(
    (r) => r.documentType === "amateurContract" && r.status === "completed"
  );
  const licenseApplicationReq = requests.find(
    (r) => r.documentType === "licenseApplication" && r.status === "completed"
  );

  return (
    <div className="space-y-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:space-y-6 sm:rounded-4xl sm:p-8 lg:rounded-5xl lg:p-10">
      <DocumentRow
        icon={FileText}
        isCompleted={!!member.hasMembershipApplication}
        title={
          membershipTpl
            ? `${membershipTpl.title} (v${membershipTpl.version})`
            : "Молба за членство"
        }
        statusText={membershipStatus}
        submitLabel="Отбележи предадена"
        onViewSignature={
          membershipReq ? () => handleOpenPreview(membershipReq) : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("membershipApplication")}
        onPrint={() =>
          handlePrintDocumentTemplate(
            membershipTpl,
            "membershipApplication",
            `/members/${member.id}/membership-application`
          )
        }
        onToggle={() =>
          toggle("membershipApplication", !!member.hasMembershipApplication)
        }
      />

      <DocumentRow
        icon={UserMinus}
        isCompleted={!!member.hasTerminationRequest}
        title={
          terminationTpl
            ? `${terminationTpl.title} (v${terminationTpl.version})`
            : "Молба за прекратяване"
        }
        statusText={terminationStatus}
        submitLabel="Отбележи предадена"
        onViewSignature={
          terminationReq ? () => handleOpenPreview(terminationReq) : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("terminationRequest")}
        onPrint={() =>
          handlePrintDocumentTemplate(
            terminationTpl,
            "terminationRequest",
            `/members/${member.id}/termination-request`
          )
        }
        onToggle={() =>
          toggle("terminationRequest", !!member.hasTerminationRequest)
        }
      />

      <DocumentRow
        icon={ScrollText}
        isCompleted={!!member.hasInternalRules}
        title={
          internalRulesTpl
            ? `${internalRulesTpl.title} (v${internalRulesTpl.version})`
            : "Вътрешен правилник"
        }
        statusText={internalRulesStatus}
        submitLabel="Отбележи приет"
        onViewSignature={
          internalRulesReq
            ? () => handleOpenPreview(internalRulesReq)
            : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("internalRules")}
        onPrint={() =>
          handlePrintDocumentTemplate(
            internalRulesTpl,
            "internalRules",
            `/members/${member.id}/internal-rules`
          )
        }
        onToggle={() => toggle("internalRules", !!member.hasInternalRules)}
      />

      <DocumentRow
        icon={CheckCircle}
        altIcon={AlertTriangle}
        isCompleted={!!member.hasSignedDeclaration}
        title={
          declarationTpl
            ? `${declarationTpl.title} (v${declarationTpl.version})`
            : "Декларация за информирано съгласие"
        }
        statusText={declarationStatus}
        submitLabel="Отбележи предадена"
        onViewSignature={
          declarationReq ? () => handleOpenPreview(declarationReq) : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("signedDeclaration")}
        onPrint={() =>
          handlePrintDocumentTemplate(
            declarationTpl,
            "signedDeclaration",
            `/members/${member.id}/declaration`
          )
        }
        onToggle={() =>
          toggle("signedDeclaration", !!member.hasSignedDeclaration)
        }
      />

      <DocumentRow
        icon={ShieldCheck}
        isCompleted={!!member.hasTravelDeclaration}
        title={
          travelTpl
            ? `${travelTpl.title} (v${travelTpl.version})`
            : "Съгласие за участие и пътуване"
        }
        statusText={travelStatus}
        submitLabel="Отбележи предадено"
        onViewSignature={
          travelReq ? () => handleOpenPreview(travelReq) : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("travelDeclaration")}
        onPrint={() =>
          handlePrintDocumentTemplate(
            travelTpl,
            "travelDeclaration",
            `/members/${member.id}/participation-travel`
          )
        }
        onToggle={() =>
          toggle("travelDeclaration", !!member.hasTravelDeclaration)
        }
      />

      <DocumentRow
        icon={ClipboardCheck}
        isCompleted={!!member.hasSafetyInstruction}
        title={
          safetyTpl
            ? `${safetyTpl.title} (v${safetyTpl.version})`
            : "Инструктаж за безопасност"
        }
        statusText={safetyStatus}
        submitLabel="Отбележи предаден"
        onViewSignature={
          safetyReq ? () => handleOpenPreview(safetyReq) : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("safetyInstruction")}
        onPrint={() =>
          handlePrintDocumentTemplate(
            safetyTpl,
            "safetyInstruction",
            `/members/${member.id}/safety-instruction`
          )
        }
        onToggle={() =>
          toggle("safetyInstruction", !!member.hasSafetyInstruction)
        }
      />

      <DocumentRow
        icon={FileText}
        isCompleted={!!member.hasAmateurContract}
        title={
          amateurContractTpl
            ? `${amateurContractTpl.title} (v${amateurContractTpl.version})`
            : "Договор за аматьорски статут"
        }
        statusText={amateurContractStatus}
        submitLabel="Отбележи подписан"
        onViewSignature={
          amateurContractReq
            ? () => handleOpenPreview(amateurContractReq)
            : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("amateurContract")}
        onPrint={() =>
          handlePrintDocumentTemplate(
            amateurContractTpl,
            "amateurContract",
            `/members/${member.id}/amateur-contract`
          )
        }
        onToggle={() => toggle("amateurContract", !!member.hasAmateurContract)}
      />

      <DocumentRow
        icon={ClipboardCheck}
        isCompleted={!!member.hasLicenseApplication}
        title="Молба за картотекиране в БФБ"
        statusText={licenseApplicationStatus}
        submitLabel="Отбележи подадена"
        onViewSignature={
          licenseApplicationReq
            ? () => handleOpenPreview(licenseApplicationReq)
            : undefined
        }
        onGenerateLink={() => handleOpenLinkDialog("licenseApplication")}
        onPrint={() =>
          openPrint(
            `/members/${member.id}/license-application`,
            "licenseApplication"
          )
        }
        onToggle={() =>
          toggle("licenseApplication", !!member.hasLicenseApplication)
        }
      />

      <DocumentRow
        icon={Contact}
        isCompleted={!!member.isLicensed}
        title="Картон на състезателя (БФБ)"
        statusText={licenseStatus}
        submitLabel="Активирай"
        onPrint={() =>
          openPrint(`/members/${member.id}/athlete-card`, "isLicensed")
        }
        onToggle={() => toggle("isLicensed", !!member.isLicensed)}
      />

      <DocumentRow
        icon={Stethoscope}
        isCompleted={!!member.hasMedicalCertificate}
        title="Медицинско свидетелство"
        statusText={medicalStatus}
        submitLabel="Отбележи предадено"
        pendingVariant="danger"
        onViewFile={
          member.medicalCertificateUrl
            ? () => window.open(member.medicalCertificateUrl!, "_blank")
            : undefined
        }
        onUploadFile={handleOpenMedicalModal}
        onPrint={() =>
          openPrint(
            `/members/${member.id}/medical-certificate`,
            "medicalCertificate"
          )
        }
        onToggle={() =>
          toggle("medicalCertificate", !!member.hasMedicalCertificate)
        }
      />

      {schoolLetters.map(({ id, path, purpose, tpl }) => (
        <DocumentRow
          key={id}
          icon={GraduationCap}
          isCompleted={false}
          title={`${tpl!.title} (v${tpl!.version})`}
          statusText={
            member.educationInstitution
              ? `${purpose} Училище: ${member.educationInstitution}`
              : purpose
          }
          submitLabel="Печат"
          onPrint={() =>
            handlePrintDocumentTemplate(
              tpl,
              "signedDeclaration",
              `/members/${member.id}/${path}`
            )
          }
          onToggle={() =>
            handlePrintDocumentTemplate(
              tpl,
              "signedDeclaration",
              `/members/${member.id}/${path}`
            )
          }
        />
      ))}

      {/* Dynamic Custom Templates configured in /documents */}
      {customTemplates.map((tpl) => (
        <DocumentRow
          key={tpl.id}
          icon={FileText}
          isCompleted={false}
          title={`${tpl.title} (v${tpl.version})`}
          statusText={tpl.description || "Официален клубен образец"}
          submitLabel="Печат"
          onPrint={() =>
            handlePrintDocumentTemplate(
              tpl,
              "signedDeclaration",
              `/members/${member.id}`
            )
          }
          onToggle={() =>
            handlePrintDocumentTemplate(
              tpl,
              "signedDeclaration",
              `/members/${member.id}`
            )
          }
        />
      ))}

      {declarations.length > 0 && (
        <div className="mt-12 border-t border-zinc-100 dark:border-zinc-800 pt-8">
          <h3 className="mb-6 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Подписани Декларации (Recovery Zone)
          </h3>
          <div className="space-y-4">
            {declarations.map((decl) => (
              <div
                key={decl.id}
                className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-100/50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 sm:flex-row sm:items-center sm:p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3 text-blue-600 dark:text-blue-400">
                    <CheckCircle className="size-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Декларация за информирано съгласие
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Подписана на:{" "}
                      {new Date(decl.signedAt).toLocaleDateString("bg-BG")} в{" "}
                      {new Date(decl.signedAt).toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-10 flex-1 rounded-xl border-zinc-200 dark:border-zinc-700 px-6 text-xs font-medium transition-all hover:bg-zinc-950 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 sm:flex-none"
                    onClick={() =>
                      window.open(`/print-declaration/${decl.id}`, "_blank")
                    }
                  >
                    <Printer className="mr-2 size-4" strokeWidth={1.5} />
                    Печат
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-10 shrink-0 rounded-xl border border-transparent px-3 text-red-500 transition-all hover:border-red-100 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                    onClick={() => handleDeleteDeclaration(decl.id)}
                  >
                    <Trash2 className="size-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Requests History */}
      <DocumentRequestsHistory
        memberId={member.id}
        refreshKey={historyRefreshKey}
        onRefresh={() => setHistoryRefreshKey((k) => k + 1)}
      />

      {/* Generate Link Dialog */}
      <GenerateDocumentLinkDialog
        member={member}
        documentType={selectedDocType}
        open={isLinkDialogOpen}
        onOpenChange={handleLinkDialogChange}
        onGenerated={() => setHistoryRefreshKey((k) => k + 1)}
      />

      {/* View Signed Document Modal */}
      <ViewSignedDocumentDialog
        request={previewRequest}
        open={!!previewRequest}
        onOpenChange={handlePreviewChange}
        onUpdated={fetchRequests}
      />

      {/* Admin Medical Certificate Upload Modal */}
      <Dialog open={isMedicalModalOpen} onOpenChange={handleMedicalModalChange}>
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Stethoscope className="size-4" />
              </span>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-100">
                Прикачи медицинско свидетелство
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Качете скан или снимка на издаденото от лекар медицинско
              удостоверение за {member.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Дата на медицинския преглед (по печат):
              </label>
              <Input
                type="date"
                value={medicalCertDate}
                onChange={(e) => setMedicalCertDate(e.target.value)}
                className="h-10 rounded-xl text-xs font-medium"
              />
              <p className="text-[10px] text-zinc-400">
                Валидността е 6 месеца (180 дни) от тази дата.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Файл (снимка или PDF):
              </label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleMedicalFileChange}
                className="h-10 rounded-xl text-xs cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-100 dark:file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:font-semibold"
              />
              {medicalFileName && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  ✓ Избран: {medicalFileName}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleMedicalModalChange(false)}
                className="h-10 rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="button"
                disabled={!medicalFileBase64 || isUploadingMedical}
                onClick={handleSaveMedicalCertificate}
                className="h-10 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                {isUploadingMedical ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Качване...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 size-3.5 text-emerald-400" />
                    Запази и прикачи
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
