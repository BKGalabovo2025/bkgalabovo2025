"use client";

/**
 * Shared shell for printable member documents (Application / Termination).
 * Encapsulates: back/print toolbar, document wrapper, ОТ: section, footer, print styles.
 */

import { ArrowLeft, Calendar, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import {
  ChairpersonSignatureControl,
  ChairpersonSignatureLine,
} from "@/components/shared/members/ChairpersonSignatureControl";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import type { DocumentNumberKey } from "@/types/document-number.types";

interface MemberDocumentShellProps {
  /** Called when the Back button is clicked */
  onBack?: () => void;
  /** The document title shown below "М О Л Б А" */
  documentSubtitle: string;
  /** Member full name */
  fullName: string;
  /** Today's date string (bg-BG format) */
  today: string;
  /** The specific document body between the ОТ: section and the footer */
  children: React.ReactNode;
  /** Optional parent contact info for signed documents */
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentAddress?: string | null;
  /** Optional embedded digital signature image */
  signatureUrl?: string | null;
  /** Document type used for the issued document number */
  documentKey: DocumentNumberKey;
}

export const MemberDocumentShell = ({
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
}: MemberDocumentShellProps) => {
  const chairperson = useChairpersonSignature();
  const router = useRouter();

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

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    const hasHistory =
      typeof window !== "undefined" &&
      ((window.history.state && window.history.state.idx > 0) ||
        (window.history.length > 1 &&
          document.referrer &&
          document.referrer.includes(window.location.host)));

    if (hasHistory) {
      router.back();
    } else {
      router.push("/documents");
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 md:p-12">
      {/* Non-printable toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Editable Document Date */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <Calendar className="size-3.5 text-slate-500" />
            <span className="font-semibold text-slate-600">Дата:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium text-slate-900 outline-none cursor-pointer"
              title="Редактирай датата на документа"
            />
          </div>

          <ChairpersonSignatureControl {...chairperson} />
          <Button
            onClick={() => window.print()}
            className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
          >
            <Printer className="mr-2 size-4" /> Принтирай
          </Button>
        </div>
      </div>

      {/* Printable area */}
      <div className="print-area relative font-serif text-slate-900 leading-snug">
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
        <div className="text-xs leading-relaxed text-justify">{children}</div>

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
                гр. Гълъбово | Дата: {today} г.
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
      </div>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 10.5pt !important;
            line-height: 1.35 !important;
          }
        }
      `,
        }}
      />
    </div>
  );
};
