"use client";

/**
 * Shared shell for printable member documents (Application / Termination).
 * Encapsulates: back/print toolbar, document wrapper, ОТ: section, footer, print styles.
 */

import { Loader2, PenLine } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import { PrintableDocumentShell } from "@/components/members/documents/PrintableDocumentShell";
import { SignatureDialog } from "@/components/members/signature-dialog";
import {
  ChairpersonSignatureControl,
  ChairpersonSignatureLine,
} from "@/components/shared/members/ChairpersonSignatureControl";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import {
  DOCUMENT_NUMBER_LABELS,
  type DocumentNumberKey,
} from "@/types/document-number.types";

interface MemberDocumentShellProps {
  /** Member ID for breadcrumbs and fallback back navigation */
  memberId?: string;
  /** Called when the Back button is clicked */
  onBack?: () => void;
  /** The document title shown below "М О Л Б А" */
  documentSubtitle: string;
  /** Member full name */
  fullName: string;
  /** Today's date string (bg-BG format) */
  today: string;
  /** The specific document body between the ОТ: section and the footer */
  children:
    React.ReactNode | ((props: { displayDate: string }) => React.ReactNode);
  /** Optional parent contact info for signed documents */
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentAddress?: string | null;
  /** Optional embedded digital signature image */
  signatureUrl?: string | null;
  /** Document type used for the issued document number */
  documentKey: DocumentNumberKey;
  /** Extra actions rendered in the toolbar */
  extraToolbarActions?: React.ReactNode;
  /** Optional handler to sign the document via SignatureDialog */
  onSaveSignature?: (file: File) => Promise<void>;
  signatureDialogTitle?: string;
  signatureDialogDescription?: string;
}

export const MemberDocumentShell = ({
  memberId: memberIdProp,
  onBack,
  documentSubtitle,
  fullName,
  today,
  children,
  parentName,
  parentPhone,
  parentEmail,
  parentAddress,
  signatureUrl,
  documentKey,
  extraToolbarActions,
  onSaveSignature,
  signatureDialogTitle = "Електронен подпис",
  signatureDialogDescription,
}: MemberDocumentShellProps) => {
  const chairperson = useChairpersonSignature();
  const params = useParams();
  const memberId = memberIdProp ?? (params?.id as string) ?? "";
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);

  const handleSaveMemberSignature = async (file: File) => {
    if (!onSaveSignature) return;
    setIsSavingSignature(true);
    try {
      await onSaveSignature(file);
    } finally {
      setIsSavingSignature(false);
    }
  };

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const displayDate = useMemo(() => {
    if (!selectedDate) return today;
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2], 10)}.${parseInt(parts[1], 10)}.${parts[0]}`;
    }
    return today;
  }, [selectedDate, today]);

  return (
    <>
      <PrintableDocumentShell
        memberId={memberId}
        memberName={fullName}
        documentTitle={DOCUMENT_NUMBER_LABELS[documentKey]}
        onBack={onBack}
        dateValue={selectedDate}
        onDateChange={setSelectedDate}
        printPageMargin="10mm 15mm 10mm 15mm"
        printFontSize="10.5pt"
        printLineHeight="1.35"
        printAreaClassName="font-serif leading-snug"
        toolbarActions={
          <>
            {extraToolbarActions}
            {onSaveSignature && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSignatureOpen(true)}
                disabled={isSavingSignature}
                className="h-9 rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase transition-all hover:border-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {isSavingSignature ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <PenLine className="mr-2 size-4" strokeWidth={1.5} />
                )}
                {signatureUrl ? "Смени подписа" : "Добави електронен подпис"}
              </Button>
            )}
            <ChairpersonSignatureControl {...chairperson} />
          </>
        }
      >
        <ClubOfficialDocumentHeader
          documentKey={documentKey}
          overrideDate={`${displayDate} г.`}
        />

        {/* Document Title with Wide Tracking */}
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold tracking-[0.25em] text-slate-950 uppercase">
            М О Л Б А
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-700 tracking-wide uppercase">
            {documentSubtitle}
          </p>
        </div>

        {/* Formal Addressee block */}
        <div className="mb-4 flex justify-end">
          <div className="w-[50%] space-y-0.5 text-left text-xs leading-tight">
            <p className="font-bold text-slate-950 uppercase tracking-wider">
              ДО
            </p>
            <p className="font-bold text-slate-950">ПРЕДСЕДАТЕЛЯ НА</p>
            <p className="font-bold text-slate-950">
              СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“
            </p>
            <p className="font-medium text-slate-800">ГРАД ГЪЛЪБОВО</p>
          </div>
        </div>

        {/* Structured Executive Applicant Data Card */}
        <div className="mb-4 rounded-md border border-slate-300 bg-slate-50/70 p-2.5 text-xs print:border-slate-400 print:bg-transparent">
          <div className="grid grid-cols-[70px_1fr] items-baseline gap-x-2 gap-y-1.5">
            <span className="font-bold text-slate-900 tracking-wider">ОТ:</span>
            <span className="border-b border-dotted border-slate-500 pb-0.5 text-slate-950">
              {parentName ? (
                <>
                  <strong className="font-bold">{parentName}</strong>
                  {parentAddress ? `, ${parentAddress}` : ""}
                  {parentPhone ? `, тел.: ${parentPhone}` : ""}
                  {parentEmail ? `, e-mail: ${parentEmail}` : ""}
                </>
              ) : (
                <span className="text-slate-400 italic text-[8pt]">
                  (трите имена на родителя/настойника, адрес, телефон, e-mail)
                </span>
              )}
            </span>

            <span className="font-bold text-slate-900 tracking-wider">ЗА:</span>
            <span className="border-b border-dotted border-slate-500 pb-0.5 text-slate-950">
              <strong className="text-sm font-bold text-slate-950">
                {fullName}
              </strong>
              <span className="ml-2 text-[8pt] text-slate-600 italic">
                (състезател / член на клуба)
              </span>
            </span>
          </div>
        </div>

        {/* Document-specific body */}
        <div className="text-xs leading-relaxed text-justify">
          {typeof children === "function"
            ? children({ displayDate })
            : children}
        </div>

        {/* Footer with institutional signatures */}
        <div className="mt-8 flex items-end justify-between text-xs font-serif">
          <div className="space-y-1">
            <p className="font-medium text-slate-800">гр. Гълъбово</p>
            <div className="w-36 border-b border-slate-700 pb-0.5">
              <span className="font-medium">Дата: {displayDate} г.</span>
            </div>
            <p className="text-[8pt] text-slate-500 italic">
              спортна зала „Енергетик“
            </p>
          </div>

          <div className="text-right">
            <p className="mb-2 font-medium italic text-slate-800">
              С уважение:
            </p>
            <div className="flex gap-6">
              <div className="min-w-36 text-center">
                {signatureUrl ? (
                  <div className="relative mb-1 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signatureUrl}
                      alt="Подпис"
                      className="mx-auto h-10 w-auto object-contain mix-blend-multiply"
                    />
                    <div className="w-full border-b border-slate-700" />
                  </div>
                ) : (
                  <div className="pt-7 w-36 border-b border-slate-700" />
                )}
                <p className="mt-1 text-[8pt] text-slate-600">
                  1. /подпис на родител/настойник/
                </p>
              </div>
              <div className="min-w-36 text-center">
                <div className="pt-7 w-36 border-b border-slate-700" />
                <p className="mt-1 text-[8pt] text-slate-600">
                  2. /подпис на родител/настойник/
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline justify-end gap-3 text-xs font-serif">
          <span className="text-slate-800">
            Подпис на състезател (ако е пълнолетен):
          </span>
          <span className="inline-block w-48 border-b border-slate-700 pb-0.5 text-center text-[8pt] text-slate-500 italic">
            / {fullName} /
          </span>
        </div>

        {/* Executive Resolution Card (Chairperson Approval) */}
        <div className="mt-3.5 rounded-md border border-slate-300 bg-slate-50/60 p-2 text-[8pt] print:border-slate-400 print:bg-transparent">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold uppercase tracking-wider text-slate-900 text-[8pt]">
                РЕЗОЛЮЦИЯ НА ПРЕДСЕДАТЕЛЯ:
              </span>
              <p className="text-[8pt] text-slate-700 italic">
                {documentKey === "membershipApplication"
                  ? "Одобрявам приемането на лицето за редовен член на клуба."
                  : "Одобрявам молбата за отписване / освобождаване от клуба."}
              </p>
              <p className="text-[7.5pt] text-slate-500">
                гр. Гълъбово | Дата: {displayDate} г.
              </p>
            </div>
            <div className="flex flex-col items-end text-right min-w-44">
              <span className="text-[7.5pt] font-semibold text-slate-900 mb-0.5">
                Председател на клуба:
              </span>
              <ChairpersonSignatureLine
                isApplied={chairperson.isApplied}
                signatureUrl={chairperson.signatureUrl}
                caption="/ Мира Георгиева /"
                align="right"
              />
            </div>
          </div>
        </div>
      </PrintableDocumentShell>
      {onSaveSignature && (
        <SignatureDialog
          open={signatureOpen}
          onClose={() => setSignatureOpen(false)}
          onSave={handleSaveMemberSignature}
          title={signatureDialogTitle}
          description={
            signatureDialogDescription ??
            `Начертайте подпис за ${DOCUMENT_NUMBER_LABELS[documentKey]} на ${fullName}`
          }
        />
      )}
    </>
  );
};
