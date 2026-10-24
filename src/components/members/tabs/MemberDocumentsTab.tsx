"use client";

import { deleteDoc, doc, getDocs } from "firebase/firestore";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Contact,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  LucideIcon,
  Printer,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserMinus,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { DocumentRequestsHistory } from "@/components/members/DocumentRequestsHistory";
import { GenerateDocumentLinkDialog } from "@/components/members/GenerateDocumentLinkDialog";
import { Button } from "@/components/ui/button";
import { getDocumentTemplatesAction } from "@/lib/actions/document-templates";
import { getCalendarYearValidity } from "@/lib/document-validity";
import { getDb } from "@/lib/firebase";
import { getSignedDeclarationsQuery } from "@/lib/firebase-collections";
import { cn } from "@/lib/utils";
import { Member, SignedDeclaration } from "@/types";
import { DocumentType } from "@/types/document-request.types";
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
}: DocumentRowProps) => {
  const IconComponent = isCompleted || !AltIcon ? Icon : AltIcon;

  const pendingClass =
    pendingVariant === "danger"
      ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
      : "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800";

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-zinc-100/50 bg-zinc-50/50 p-5 sm:gap-6 sm:rounded-4xl sm:p-8 lg:flex-row lg:items-center">
      <div className="flex w-full items-center gap-4 sm:gap-6">
        <div
          className={cn(
            "shrink-0 rounded-xl p-3 sm:rounded-2xl sm:p-4",
            isCompleted
              ? "bg-zinc-950 text-white"
              : "border border-zinc-100 bg-white text-zinc-300"
          )}
        >
          <IconComponent className="size-5 sm:size-6" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="tracking-widest2 mb-1 truncate text-[10px] font-medium text-zinc-950 uppercase sm:text-[11px]">
            {title}
          </h4>
          <div className="line-clamp-2 text-xs font-light text-zinc-400 sm:text-sm">
            {statusText}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto">
        {onGenerateLink && (
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-lg border-emerald-200/80 bg-emerald-50/40 px-3 text-[9px] font-semibold tracking-wider text-emerald-800 uppercase transition-all hover:bg-emerald-100 hover:text-emerald-900 sm:h-11 sm:rounded-xl sm:px-4 sm:text-[10px] lg:flex-none"
            onClick={onGenerateLink}
            title="Генерирай линк за родител"
          >
            <LinkIcon
              className="mr-1.5 size-3.5 sm:size-4 text-emerald-600"
              strokeWidth={2}
            />
            Линк
          </Button>
        )}
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-lg border-zinc-100 px-4 text-[9px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-950 hover:text-white sm:h-11 sm:rounded-xl sm:px-6 sm:text-[10px] lg:flex-none"
          onClick={onPrint}
        >
          <Printer className="mr-2 size-3.5 sm:size-4" strokeWidth={1.5} />
          Печат
        </Button>
        <Button
          variant="outline"
          className={cn(
            "h-10 flex-1 rounded-lg border-zinc-100 px-4 text-[9px] font-medium tracking-widest uppercase transition-all sm:h-11 sm:rounded-xl sm:px-6 sm:text-[10px] lg:flex-none",
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
      <span className="font-medium text-emerald-600">
        {label} {date}
      </span>
      {validity && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
            validity.isExpired
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          )}
        >
          {validity.badgeText}
        </span>
      )}
      {validity?.isExpired && (
        <span className="text-[10px] font-semibold text-rose-600">
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
  if (member.hasMedicalCertificate)
    return completedText(
      "Предадено на",
      fmt(member.medicalCertificateHandedAt),
      member.medicalCertificateHandedAt
    );
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
  const [declarations, setDeclarations] = useState<SignedDeclaration[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(
    "membershipApplication"
  );
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleOpenLinkDialog = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setLinkDialogOpen(true);
  };

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
      const snapshot = await getDocs(getSignedDeclarationsQuery(member.id));
      const list = snapshot.docs.map((d) => d.data() as SignedDeclaration);
      list.sort(
        (a, b) =>
          new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
      );
      setDeclarations(list);
    }
    fetchDeclarations();
  }, [member.id]);

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
        await deleteDoc(doc(getDb(), "member_declarations", id));
        setDeclarations((prev) => prev.filter((d) => d.id !== id));
        // Note: Ideally, we should also trigger an update of the member's hasSignedDeclaration status
        // but that requires updating the reservation or member record which is handled separately.
        // For now, this cleanly removes it from the list and DB.
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

  const handlePrintCustomTemplate = (tpl: DocumentTemplate) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

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
            font-size: 10pt;
            margin-bottom: 15px;
          }
          .body-content {
            font-size: 10.5pt;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-line;
            margin: 15px 0;
          }
          .checkboxes-box {
            margin: 15px 0;
            font-size: 10pt;
          }
          .chk-row {
            margin: 4px 0;
          }
          .footer-box {
            margin-top: 35px;
            padding-top: 15px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10pt;
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
          <div><b>Състезател / Член:</b> ${member.name}</div>
        </div>

        <div class="body-content">
          ${tpl.content}
        </div>

        ${
          tpl.checkboxes && tpl.checkboxes.length > 0
            ? `
          <div class="checkboxes-box">
            ${tpl.checkboxes
              .map((c) => `<div class="chk-row">☐ ${c.label}</div>`)
              .join("")}
          </div>
        `
            : ""
        }

        <div class="footer-box">
          <div>
            <div>${tpl.closingLocation || "гр. Гълъбово"}</div>
            <div style="margin-top: 5px;">Дата: ${new Date().toLocaleDateString("bg-BG")} г.</div>
          </div>
          <div style="text-align: right;">
            <div style="border-bottom: 1px solid #0f172a; width: 180px; margin-bottom: 4px; display: inline-block;"></div>
            <div>(Подпис)</div>
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

  return (
    <div className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-4 sm:space-y-6 sm:rounded-4xl sm:p-8 lg:rounded-5xl lg:p-10">
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
        onGenerateLink={() => handleOpenLinkDialog("membershipApplication")}
        onPrint={() =>
          openPrint(
            `/members/${member.id}/membership-application`,
            "membershipApplication"
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
        onGenerateLink={() => handleOpenLinkDialog("terminationRequest")}
        onPrint={() =>
          openPrint(
            `/members/${member.id}/termination-request`,
            "terminationRequest"
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
        onGenerateLink={() => handleOpenLinkDialog("internalRules")}
        onPrint={() =>
          openPrint(`/members/${member.id}/internal-rules`, "internalRules")
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
        onGenerateLink={() => handleOpenLinkDialog("signedDeclaration")}
        onPrint={() =>
          openPrint(`/members/${member.id}/declaration`, "signedDeclaration")
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
        onGenerateLink={() => handleOpenLinkDialog("travelDeclaration")}
        onPrint={() =>
          openPrint(
            `/members/${member.id}/participation-travel`,
            "travelDeclaration"
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
        onGenerateLink={() => handleOpenLinkDialog("safetyInstruction")}
        onPrint={() =>
          openPrint(
            `/members/${member.id}/safety-instruction`,
            "safetyInstruction"
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
        onGenerateLink={() => handleOpenLinkDialog("amateurContract")}
        onPrint={() =>
          openPrint(`/members/${member.id}/amateur-contract`, "amateurContract")
        }
        onToggle={() => toggle("amateurContract", !!member.hasAmateurContract)}
      />

      <DocumentRow
        icon={ClipboardCheck}
        isCompleted={!!member.hasLicenseApplication}
        title="Молба за картотекиране в БФБ"
        statusText={licenseApplicationStatus}
        submitLabel="Отбележи подадена"
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
          onPrint={() => window.open(`/members/${member.id}/${path}`, "_blank")}
          onToggle={() =>
            window.open(`/members/${member.id}/${path}`, "_blank")
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
          onPrint={() => handlePrintCustomTemplate(tpl)}
          onToggle={() => handlePrintCustomTemplate(tpl)}
        />
      ))}

      {declarations.length > 0 && (
        <div className="mt-12 border-t border-zinc-100 pt-8">
          <h3 className="mb-6 text-lg font-bold text-zinc-900">
            Подписани Декларации (Recovery Zone)
          </h3>
          <div className="space-y-4">
            {declarations.map((decl) => (
              <div
                key={decl.id}
                className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-100/50 bg-zinc-50/50 p-5 sm:flex-row sm:items-center sm:p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <CheckCircle className="size-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-bold text-zinc-900">
                      Декларация за информирано съгласие
                    </h4>
                    <p className="text-xs text-zinc-500">
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
                    className="h-10 flex-1 rounded-xl border-zinc-200 px-6 text-xs font-medium transition-all hover:bg-zinc-950 hover:text-white sm:flex-none"
                    onClick={() =>
                      window.open(`/print-declaration/${decl.id}`, "_blank")
                    }
                  >
                    <Printer className="mr-2 size-4" strokeWidth={1.5} />
                    Печат
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-10 shrink-0 rounded-xl border border-transparent px-3 text-red-500 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600"
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
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onGenerated={() => setHistoryRefreshKey((k) => k + 1)}
      />
    </div>
  );
};
