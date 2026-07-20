"use client";

/**
 * Shared shell for printable member documents (Application / Termination).
 * Encapsulates: back/print toolbar, document wrapper, ОТ: section, footer, print styles.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

interface MemberDocumentShellProps {
  /** Called when the Back button is clicked */
  onBack: () => void;
  /** The document title shown below "М О Л Б А" */
  documentSubtitle: string;
  /** Member full name */
  fullName: string;
  /** Today's date string (bg-BG format) */
  today: string;
  /** The specific document body between the ОТ: section and the footer */
  children: React.ReactNode;
}

export const MemberDocumentShell = ({
  onBack,
  documentSubtitle,
  fullName,
  today,
  children,
}: MemberDocumentShellProps) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-12 bg-white min-h-screen">
      {/* Non-printable toolbar */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад
        </Button>
        <Button
          onClick={() => window.print()}
          className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl shadow-lg"
        >
          <Printer className="mr-2 h-4 w-4" /> Принтирай
        </Button>
      </div>

      {/* Printable area */}
      <div className="print-area text-slate-900 text-justify leading-snug font-serif">
        {/* Document header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-tight mb-1">
            М О Л Б А
          </h1>
          <p className="text-base italic">{documentSubtitle}</p>
        </div>

        {/* Address block */}
        <div className="flex justify-end mb-8">
          <div className="w-1/2 space-y-0.5 text-sm">
            <p className="font-bold">ДО</p>
            <p className="font-bold">Председателя на</p>
            <p className="font-bold">СНЦ „Бадминтон клуб Гълъбово"</p>
            <p className="font-bold text-sm">град ГЪЛЪБОВО</p>
          </div>
        </div>

        {/* ОТ: section */}
        <div className="space-y-4 mb-8">
          <div>
            <p className="flex items-baseline gap-2 text-sm">
              <span className="font-bold shrink-0">ОТ:</span>
              <span className="border-b border-dotted border-slate-400 flex-1 min-h-[1.2rem]"></span>
            </p>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (трите имена на родителя/настойника, адрес, телефон, e-mail)
            </p>
          </div>

          <div>
            <p className="border-b border-dotted border-slate-400 min-h-[1.2rem] w-full"></p>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (трите имена на втория родител/настойник, адрес, телефон, e-mail –
              ако е приложимо)
            </p>
          </div>

          <div>
            <p className="flex items-baseline gap-2 text-sm">
              <span className="font-bold shrink-0">ЗА:</span>
              <span className="border-b border-dotted border-slate-400 flex-1 min-h-[1.2rem]">
                <strong>{fullName}</strong>
              </span>
            </p>
            <p className="text-[9px] text-slate-500 italic mt-0.5">
              (трите имена на детето/члена, ЕГН, адрес)
            </p>
          </div>
        </div>

        {/* Document-specific body */}
        {children}

        {/* Footer with signatures */}
        <div className="mt-10 flex justify-between items-end text-sm">
          <div className="space-y-0.5">
            <p>Спортна зала „Енергетик" град Гълъбово</p>
            <p>Дата: {today} г.</p>
          </div>
          <div className="text-right">
            <p className="mb-6 italic">С уважение:</p>
            <div className="flex gap-6">
              <div className="text-center">
                <p>........................................</p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  1. (подпис на родител/настойник)
                </p>
              </div>
              <div className="text-center">
                <p>........................................</p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  2. (подпис на родител/настойник)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm">
          <p>Подпис на член (ако е пълнолетен): ……………………………………….</p>
        </div>
      </div>

      {/* Print styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 15mm 20mm;
            font-size: 11pt;
            line-height: 1.4;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `,
        }}
      />
    </div>
  );
};
