"use client";


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
} from "lucide-react";

interface MemberDocumentsTabProps {
  member: Member;
  formatDocDate: (isoString: string | null | undefined) => string | null;
  updateDocumentStatus: (
    baseField:
      | "signedDeclaration"
      | "medicalCertificate"
      | "isLicensed"
      | "travelDeclaration"
      | "safetyInstruction"
      | "internalRules"
      | "membershipApplication"
      | "terminationRequest",
    action: "print" | "submit" | "cancel"
  ) => Promise<void>;
}

export const MemberDocumentsTab = ({
  member,
  formatDocDate,
  updateDocumentStatus,
}: MemberDocumentsTabProps) => {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-6">
      {/* Membership Application */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.hasMembershipApplication
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Молба за членство
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.hasMembershipApplication ? (
                <span className="text-emerald-600 font-medium">
                  Предадена на {formatDocDate(member.membershipApplicationHandedAt)}
                </span>
              ) : member.membershipApplicationPrintedAt ? (
                <span>
                  Разпечатана на {formatDocDate(member.membershipApplicationPrintedAt)}
                </span>
              ) : (
                "Основен документ за приемане в клуба."
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("membershipApplication", "print");
              window.open(`/members/${member.id}/membership-application`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.hasMembershipApplication &&
                "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
            )}
            onClick={() =>
              updateDocumentStatus(
                "membershipApplication",
                member.hasMembershipApplication ? "cancel" : "submit"
              )
            }
          >
            {member.hasMembershipApplication ? "Отмени" : "Отбележи предадена"}
          </Button>
        </div>
      </div>

      {/* Membership Termination */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.hasTerminationRequest
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            <UserMinus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Молба за прекратяване
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.hasTerminationRequest ? (
                <span className="text-emerald-600 font-medium">
                  Предадена на {formatDocDate(member.terminationRequestHandedAt)}
                </span>
              ) : member.terminationRequestPrintedAt ? (
                <span>
                  Разпечатана на {formatDocDate(member.terminationRequestPrintedAt)}
                </span>
              ) : (
                "Документ за прекратяване на членство."
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("terminationRequest", "print");
              window.open(`/members/${member.id}/termination-request`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.hasTerminationRequest &&
                "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
            )}
            onClick={() =>
              updateDocumentStatus(
                "terminationRequest",
                member.hasTerminationRequest ? "cancel" : "submit"
              )
            }
          >
            {member.hasTerminationRequest ? "Отмени" : "Отбележи предадена"}
          </Button>
        </div>
      </div>

      {/* Internal Rules */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.hasInternalRules
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            <ScrollText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Вътрешен правилник
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.hasInternalRules ? (
                <span className="text-emerald-600 font-medium">
                  Приет на {formatDocDate(member.internalRulesHandedAt)}
                </span>
              ) : member.internalRulesPrintedAt ? (
                <span>
                  Разпечатан на {formatDocDate(member.internalRulesPrintedAt)}
                </span>
              ) : (
                "Правила за работа и етика в клуба."
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("internalRules", "print");
              window.open(`/members/${member.id}/internal-rules`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.hasInternalRules &&
                "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
            )}
            onClick={() =>
              updateDocumentStatus(
                "internalRules",
                member.hasInternalRules ? "cancel" : "submit"
              )
            }
          >
            {member.hasInternalRules ? "Отмени" : "Отбележи приет"}
          </Button>
        </div>
      </div>

      {/* Informed Consent Declaration */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.hasSignedDeclaration
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            {member.hasSignedDeclaration ? (
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
            ) : (
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Декларация за информирано съгласие
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.hasSignedDeclaration ? (
                <span className="text-emerald-600 font-medium">
                  Предадена на {formatDocDate(member.signedDeclarationHandedAt)}
                </span>
              ) : member.signedDeclarationPrintedAt ? (
                <span>
                  Разпечатана на {formatDocDate(member.signedDeclarationPrintedAt)}
                </span>
              ) : (
                "Липсва декларация!"
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("signedDeclaration", "print");
              window.open(`/members/${member.id}/declaration`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.hasSignedDeclaration &&
                "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
            )}
            onClick={() =>
              updateDocumentStatus(
                "signedDeclaration",
                member.hasSignedDeclaration ? "cancel" : "submit"
              )
            }
          >
            {member.hasSignedDeclaration ? "Отмени" : "Отбележи предадена"}
          </Button>
        </div>
      </div>

      {/* Participation & Travel Declaration */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.hasTravelDeclaration
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Съгласие за участие и пътуване
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.hasTravelDeclaration ? (
                <span className="text-emerald-600 font-medium">
                  Предадено на {formatDocDate(member.travelDeclarationHandedAt)}
                </span>
              ) : member.travelDeclarationPrintedAt ? (
                <span>
                  Разпечатано на {formatDocDate(member.travelDeclarationPrintedAt)}
                </span>
              ) : (
                "Съгласие за транспорт и спортни събития."
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("travelDeclaration", "print");
              window.open(`/members/${member.id}/participation-travel`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.hasTravelDeclaration &&
                "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
            )}
            onClick={() =>
              updateDocumentStatus(
                "travelDeclaration",
                member.hasTravelDeclaration ? "cancel" : "submit"
              )
            }
          >
            {member.hasTravelDeclaration ? "Отмени" : "Отбележи предадено"}
          </Button>
        </div>
      </div>

      {/* Safety Instruction */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.hasSafetyInstruction
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Инструктаж за безопасност
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.hasSafetyInstruction ? (
                <span className="text-emerald-600 font-medium">
                  Предаден на {formatDocDate(member.safetyInstructionHandedAt)}
                </span>
              ) : member.safetyInstructionPrintedAt ? (
                <span>
                  Разпечатан на {formatDocDate(member.safetyInstructionPrintedAt)}
                </span>
              ) : (
                "Правила за пътуване и състезания."
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("safetyInstruction", "print");
              window.open(`/members/${member.id}/safety-instruction`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.hasSafetyInstruction &&
                "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
            )}
            onClick={() =>
              updateDocumentStatus(
                "safetyInstruction",
                member.hasSafetyInstruction ? "cancel" : "submit"
              )
            }
          >
            {member.hasSafetyInstruction ? "Отмени" : "Отбележи предаден"}
          </Button>
        </div>
      </div>

      {/* Combined Athlete Card (Kartoteka) */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.isLicensed
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            <Contact className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Картотека към БФБ
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.isLicensed ? (
                <span className="text-emerald-600 font-medium">
                  Активна от {formatDocDate(member.isLicensedHandedAt)}
                </span>
              ) : member.isLicensedPrintedAt ? (
                <span>
                  Разпечатана на {formatDocDate(member.isLicensedPrintedAt)}
                </span>
              ) : (
                "Няма активна картотека."
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("isLicensed", "print");
              window.open(`/members/${member.id}/athlete-card`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.isLicensed &&
                "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
            )}
            onClick={() =>
              updateDocumentStatus(
                "isLicensed",
                member.isLicensed ? "cancel" : "submit"
              )
            }
          >
            {member.isLicensed ? "Отмени" : "Активирай"}
          </Button>
        </div>
      </div>

      {/* Medical Certificate */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full">
          <div
            className={cn(
              "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
              member.hasMedicalCertificate
                ? "bg-zinc-950 text-white"
                : "bg-white border border-zinc-100 text-zinc-300"
            )}
          >
            <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
              Медицинско свидетелство
            </h4>
            <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
              {member.hasMedicalCertificate ? (
                <span className="text-emerald-600 font-medium">
                  Предадено на {formatDocDate(member.medicalCertificateHandedAt)}
                </span>
              ) : member.medicalCertificatePrintedAt ? (
                <span>
                  Разпечатано на {formatDocDate(member.medicalCertificatePrintedAt)}
                </span>
              ) : (
                "Липсва медицинско свидетелство!"
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
            onClick={() => {
              updateDocumentStatus("medicalCertificate", "print");
              window.open(`/members/${member.id}/medical-certificate`, "_blank");
            }}
          >
            <Printer className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            Печат
          </Button>
          <Button
            variant="outline"
            className={cn(
              "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
              !member.hasMedicalCertificate &&
                "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
            )}
            onClick={() =>
              updateDocumentStatus(
                "medicalCertificate",
                member.hasMedicalCertificate ? "cancel" : "submit"
              )
            }
          >
            {member.hasMedicalCertificate ? "Отмени" : "Отбележи предадено"}
          </Button>
        </div>
      </div>
    </div>
  );
};
