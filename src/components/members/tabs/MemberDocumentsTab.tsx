"use client";

import React, { useEffect, useState } from "react";
import { Member, SignedDeclaration } from "@/types";
import { getSignedDeclarationsQuery } from "@/lib/firebase-collections";
import { getDocs, deleteDoc, doc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
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
  Trash2,
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
          <p className="line-clamp-2 text-xs font-light text-zinc-400 sm:text-sm">
            {statusText}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 lg:w-auto">
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-lg border-zinc-100 px-4 text-[9px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-950 hover:text-white sm:h-11 sm:rounded-xl sm:px-6 sm:text-[10px] lg:flex-none"
          onClick={onPrint}
        >
          <Printer
            className="mr-2 size-3.5 sm:size-4"
            strokeWidth={1.5}
          />
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

function completedText(label: string, date: string | null): React.ReactNode {
  return (
    <span className="font-medium text-emerald-600">
      {label} {date}
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
      fmt(member.membershipApplicationHandedAt)
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
      fmt(member.terminationRequestHandedAt)
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
    return completedText("Приет на", fmt(member.internalRulesHandedAt));
  if (member.internalRulesPrintedAt)
    return printedText("Разпечатан на", fmt(member.internalRulesPrintedAt));
  return "Правила за работа и етика в клуба.";
}

function getDeclarationStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.hasSignedDeclaration)
    return completedText("Предадена на", fmt(member.signedDeclarationHandedAt));
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
    return completedText("Предадено на", fmt(member.travelDeclarationHandedAt));
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
    return completedText("Предаден на", fmt(member.safetyInstructionHandedAt));
  if (member.safetyInstructionPrintedAt)
    return printedText("Разпечатан на", fmt(member.safetyInstructionPrintedAt));
  return "Правила за пътуване и състезания.";
}

function getLicenseStatus(
  member: Member,
  fmt: (d: string | null | undefined) => string | null
): StatusResult {
  if (member.isLicensed)
    return completedText("Активна от", fmt(member.isLicensedHandedAt));
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
      fmt(member.medicalCertificateHandedAt)
    );
  if (member.medicalCertificatePrintedAt)
    return printedText(
      "Разпечатано на",
      fmt(member.medicalCertificatePrintedAt)
    );
  return "Липсва медицинско свидетелство!";
}

// ── Main component ────────────────────────────────────────────────────────────

export const MemberDocumentsTab = ({
  member,
  formatDocDate,
  updateDocumentStatus,
}: MemberDocumentsTabProps) => {
  const [declarations, setDeclarations] = useState<SignedDeclaration[]>([]);

  useEffect(() => {
    async function fetchDeclarations() {
      const snapshot = await getDocs(getSignedDeclarationsQuery(member.id));
      const list = snapshot.docs.map(d => d.data() as SignedDeclaration);
      list.sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime());
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
    if (window.confirm("Сигурни ли сте, че искате да изтриете тази декларация?")) {
      try {
        await deleteDoc(doc(getDb(), "member_declarations", id));
        setDeclarations(prev => prev.filter(d => d.id !== id));
        // Note: Ideally, we should also trigger an update of the member's hasSignedDeclaration status
        // but that requires updating the reservation or member record which is handled separately.
        // For now, this cleanly removes it from the list and DB.
      } catch (error) {
        console.error("Error deleting declaration:", error);
        alert("Възникна грешка при изтриването.");
      }
    }
  };

  const membershipStatus = getMembershipStatus(member, formatDocDate);
  const terminationStatus = getTerminationStatus(member, formatDocDate);
  const internalRulesStatus = getInternalRulesStatus(member, formatDocDate);
  const declarationStatus = getDeclarationStatus(member, formatDocDate);
  const travelStatus = getTravelStatus(member, formatDocDate);
  const safetyStatus = getSafetyStatus(member, formatDocDate);
  const licenseStatus = getLicenseStatus(member, formatDocDate);
  const medicalStatus = getMedicalStatus(member, formatDocDate);

  return (
    <div className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-4 sm:space-y-6 sm:rounded-4xl sm:p-8 lg:rounded-5xl lg:p-10">
      <DocumentRow
        icon={FileText}
        isCompleted={!!member.hasMembershipApplication}
        title="Молба за членство"
        statusText={membershipStatus}
        submitLabel="Отбележи предадена"
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
        title="Молба за прекратяване"
        statusText={terminationStatus}
        submitLabel="Отбележи предадена"
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
        title="Вътрешен правилник"
        statusText={internalRulesStatus}
        submitLabel="Отбележи приет"
        onPrint={() =>
          openPrint(`/members/${member.id}/internal-rules`, "internalRules")
        }
        onToggle={() => toggle("internalRules", !!member.hasInternalRules)}
      />

      <DocumentRow
        icon={CheckCircle}
        altIcon={AlertTriangle}
        isCompleted={!!member.hasSignedDeclaration}
        title="Декларация за информирано съгласие"
        statusText={declarationStatus}
        submitLabel="Отбележи предадена"
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
        title="Съгласие за участие и пътуване"
        statusText={travelStatus}
        submitLabel="Отбележи предадено"
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
        title="Инструктаж за безопасност"
        statusText={safetyStatus}
        submitLabel="Отбележи предаден"
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
        icon={Contact}
        isCompleted={!!member.isLicensed}
        title="Картотека към БФБ"
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

      {declarations.length > 0 && (
        <div className="mt-12 border-t border-zinc-100 pt-8">
          <h3 className="mb-6 text-lg font-bold text-zinc-900">Подписани Декларации (Recovery Zone)</h3>
          <div className="space-y-4">
            {declarations.map((decl) => (
              <div key={decl.id} className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-100/50 bg-zinc-50/50 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <CheckCircle className="size-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-bold text-zinc-900">Декларация за информирано съгласие</h4>
                    <p className="text-xs text-zinc-500">
                      Подписана на: {new Date(decl.signedAt).toLocaleDateString("bg-BG")} в {new Date(decl.signedAt).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-10 flex-1 rounded-xl border-zinc-200 px-6 text-xs font-medium transition-all hover:bg-zinc-950 hover:text-white sm:flex-none"
                    onClick={() => window.open(`/print-declaration/${decl.id}`, "_blank")}
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
    </div>
  );
};
