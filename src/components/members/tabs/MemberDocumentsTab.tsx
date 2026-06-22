"use client";

import React from "react";
import { Member } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FileText,
  Printer,
  UserMinus,
  ScrollText,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  ClipboardCheck,
  Stethoscope,
  Contact,
  LucideIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocumentField =
  | "signedDeclaration"
  | "medicalCertificate"
  | "isLicensed"
  | "travelDeclaration"
  | "safetyInstruction"
  | "internalRules"
  | "membershipApplication"
  | "terminationRequest";

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
}: DocumentRowProps) => {
  const IconComponent = isCompleted || !AltIcon ? Icon : AltIcon;

  const pendingClass =
    pendingVariant === "danger"
      ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
      : "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800";

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
      <div className="flex items-center gap-4 sm:gap-6 w-full">
        <div
          className={cn(
            "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
            isCompleted
              ? "bg-zinc-950 text-white"
              : "bg-white border border-zinc-100 text-zinc-300"
          )}
        >
          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
            {title}
          </h4>
          <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
        <Button
          variant="outline"
          className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
          onClick={onPrint}
        >
          <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
          Печат
        </Button>
        <Button
          variant="outline"
          className={cn(
            "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
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

function completedText(label: string, date: string | null): React.ReactNode {
  return <span className="text-emerald-600 font-medium">{label} {date}</span>;
}

function printedText(label: string, date: string | null): React.ReactNode {
  return <span>{label} {date}</span>;
}

type StatusResult = string | React.ReactNode;

function getMembershipStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.hasMembershipApplication) return completedText("Предадена на", fmt(member.membershipApplicationHandedAt));
  if (member.membershipApplicationPrintedAt) return printedText("Разпечатана на", fmt(member.membershipApplicationPrintedAt));
  return "Основен документ за приемане в клуба.";
}

function getTerminationStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.hasTerminationRequest) return completedText("Предадена на", fmt(member.terminationRequestHandedAt));
  if (member.terminationRequestPrintedAt) return printedText("Разпечатана на", fmt(member.terminationRequestPrintedAt));
  return "Документ за прекратяване на членство.";
}

function getInternalRulesStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.hasInternalRules) return completedText("Приет на", fmt(member.internalRulesHandedAt));
  if (member.internalRulesPrintedAt) return printedText("Разпечатан на", fmt(member.internalRulesPrintedAt));
  return "Правила за работа и етика в клуба.";
}

function getDeclarationStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.hasSignedDeclaration) return completedText("Предадена на", fmt(member.signedDeclarationHandedAt));
  if (member.signedDeclarationPrintedAt) return printedText("Разпечатана на", fmt(member.signedDeclarationPrintedAt));
  return "Липсва декларация!";
}

function getTravelStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.hasTravelDeclaration) return completedText("Предадено на", fmt(member.travelDeclarationHandedAt));
  if (member.travelDeclarationPrintedAt) return printedText("Разпечатано на", fmt(member.travelDeclarationPrintedAt));
  return "Съгласие за транспорт и спортни събития.";
}

function getSafetyStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.hasSafetyInstruction) return completedText("Предаден на", fmt(member.safetyInstructionHandedAt));
  if (member.safetyInstructionPrintedAt) return printedText("Разпечатан на", fmt(member.safetyInstructionPrintedAt));
  return "Правила за пътуване и състезания.";
}

function getLicenseStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.isLicensed) return completedText("Активна от", fmt(member.isLicensedHandedAt));
  if (member.isLicensedPrintedAt) return printedText("Разпечатана на", fmt(member.isLicensedPrintedAt));
  return "Няма активна картотека.";
}

function getMedicalStatus(member: Member, fmt: (d: string | null | undefined) => string | null): StatusResult {
  if (member.hasMedicalCertificate) return completedText("Предадено на", fmt(member.medicalCertificateHandedAt));
  if (member.medicalCertificatePrintedAt) return printedText("Разпечатано на", fmt(member.medicalCertificatePrintedAt));
  return "Липсва медицинско свидетелство!";
}

// ── Main component ────────────────────────────────────────────────────────────

export const MemberDocumentsTab = ({
  member,
  formatDocDate,
  updateDocumentStatus,
}: MemberDocumentsTabProps) => {
  const openPrint = (path: string, field: DocumentField) => {
    updateDocumentStatus(field, "print");
    window.open(path, "_blank");
  };

  const toggle = (field: DocumentField, isCompleted: boolean) =>
    updateDocumentStatus(field, isCompleted ? "cancel" : "submit");

  const membershipStatus = getMembershipStatus(member, formatDocDate);
  const terminationStatus = getTerminationStatus(member, formatDocDate);
  const internalRulesStatus = getInternalRulesStatus(member, formatDocDate);
  const declarationStatus = getDeclarationStatus(member, formatDocDate);
  const travelStatus = getTravelStatus(member, formatDocDate);
  const safetyStatus = getSafetyStatus(member, formatDocDate);
  const licenseStatus = getLicenseStatus(member, formatDocDate);
  const medicalStatus = getMedicalStatus(member, formatDocDate);

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-6">

      <DocumentRow
        icon={FileText}
        isCompleted={!!member.hasMembershipApplication}
        title="Молба за членство"
        statusText={membershipStatus}
        submitLabel="Отбележи предадена"
        onPrint={() => openPrint(`/members/${member.id}/membership-application`, "membershipApplication")}
        onToggle={() => toggle("membershipApplication", !!member.hasMembershipApplication)}
      />

      <DocumentRow
        icon={UserMinus}
        isCompleted={!!member.hasTerminationRequest}
        title="Молба за прекратяване"
        statusText={terminationStatus}
        submitLabel="Отбележи предадена"
        onPrint={() => openPrint(`/members/${member.id}/termination-request`, "terminationRequest")}
        onToggle={() => toggle("terminationRequest", !!member.hasTerminationRequest)}
      />

      <DocumentRow
        icon={ScrollText}
        isCompleted={!!member.hasInternalRules}
        title="Вътрешен правилник"
        statusText={internalRulesStatus}
        submitLabel="Отбележи приет"
        onPrint={() => openPrint(`/members/${member.id}/internal-rules`, "internalRules")}
        onToggle={() => toggle("internalRules", !!member.hasInternalRules)}
      />

      <DocumentRow
        icon={CheckCircle}
        altIcon={AlertTriangle}
        isCompleted={!!member.hasSignedDeclaration}
        title="Декларация за информирано съгласие"
        statusText={declarationStatus}
        submitLabel="Отбележи предадена"
        onPrint={() => openPrint(`/members/${member.id}/declaration`, "signedDeclaration")}
        onToggle={() => toggle("signedDeclaration", !!member.hasSignedDeclaration)}
      />

      <DocumentRow
        icon={ShieldCheck}
        isCompleted={!!member.hasTravelDeclaration}
        title="Съгласие за участие и пътуване"
        statusText={travelStatus}
        submitLabel="Отбележи предадено"
        onPrint={() => openPrint(`/members/${member.id}/participation-travel`, "travelDeclaration")}
        onToggle={() => toggle("travelDeclaration", !!member.hasTravelDeclaration)}
      />

      <DocumentRow
        icon={ClipboardCheck}
        isCompleted={!!member.hasSafetyInstruction}
        title="Инструктаж за безопасност"
        statusText={safetyStatus}
        submitLabel="Отбележи предаден"
        onPrint={() => openPrint(`/members/${member.id}/safety-instruction`, "safetyInstruction")}
        onToggle={() => toggle("safetyInstruction", !!member.hasSafetyInstruction)}
      />

      <DocumentRow
        icon={Contact}
        isCompleted={!!member.isLicensed}
        title="Картотека към БФБ"
        statusText={licenseStatus}
        submitLabel="Активирай"
        onPrint={() => openPrint(`/members/${member.id}/athlete-card`, "isLicensed")}
        onToggle={() => toggle("isLicensed", !!member.isLicensed)}
      />

      <DocumentRow
        icon={Stethoscope}
        isCompleted={!!member.hasMedicalCertificate}
        title="Медицинско свидетелство"
        statusText={medicalStatus}
        submitLabel="Отбележи предадено"
        pendingVariant="danger"
        onPrint={() => openPrint(`/members/${member.id}/medical-certificate`, "medicalCertificate")}
        onToggle={() => toggle("medicalCertificate", !!member.hasMedicalCertificate)}
      />

    </div>
  );
};
