"use client";

/**
 * Shared shell for printable member documents (Application / Termination).
 * Encapsulates: back/print toolbar, document wrapper, ОТ: section, footer, print styles.
 */

import { ArrowLeft, Printer } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

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
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 md:p-12">
      {/* Non-printable toolbar */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
        <Button
          onClick={() => window.print()}
          className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
        >
          <Printer className="mr-2 size-4" /> Принтирай
        </Button>
      </div>

      {/* Printable area */}
      <div className="print-area text-justify font-serif leading-snug text-slate-900">
        {/* Document header */}
        <div className="mb-6 text-center">
          <h1 className="mb-1 text-xl font-bold tracking-tight uppercase">
            М О Л Б А
          </h1>
          <p className="text-base italic">{documentSubtitle}</p>
        </div>

        {/* Address block */}
        <div className="mb-8 flex justify-end">
          <div className="w-1/2 space-y-0.5 text-sm">
            <p className="font-bold">ДО</p>
            <p className="font-bold">Председателя на</p>
            <p className="font-bold">СНЦ „Бадминтон клуб Гълъбово&quot;</p>
            <p className="text-sm font-bold">град ГЪЛЪБОВО</p>
          </div>
        </div>

        {/* ОТ: section */}
        <div className="mb-8 space-y-4">
          <div>
            <p className="flex items-baseline gap-2 text-sm">
              <span className="shrink-0 font-bold">ОТ:</span>
              <span className="min-h-[1.2rem] flex-1 border-b border-dotted border-slate-400"></span>
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500 italic">
              (трите имена на родителя/настойника, адрес, телефон, e-mail)
            </p>
          </div>

          <div>
            <p className="min-h-[1.2rem] w-full border-b border-dotted border-slate-400"></p>
            <p className="mt-0.5 text-[9px] text-slate-500 italic">
              (трите имена на втория родител/настойник, адрес, телефон, e-mail –
              ако е приложимо)
            </p>
          </div>

          <div>
            <p className="flex items-baseline gap-2 text-sm">
              <span className="shrink-0 font-bold">ЗА:</span>
              <span className="min-h-[1.2rem] flex-1 border-b border-dotted border-slate-400">
                <strong>{fullName}</strong>
              </span>
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500 italic">
              (трите имена на детето/члена, ЕГН, адрес)
            </p>
          </div>
        </div>

        {/* Document-specific body */}
        {children}

        {/* Footer with signatures */}
        <div className="mt-10 flex items-end justify-between text-sm">
          <div className="space-y-0.5">
            <p>Спортна зала „Енергетик&quot; град Гълъбово</p>
            <p>Дата: {today} г.</p>
          </div>
          <div className="text-right">
            <p className="mb-6 italic">С уважение:</p>
            <div className="flex gap-6">
              <div className="text-center">
                <p>........................................</p>
                <p className="mt-0.5 text-[9px] text-slate-500">
                  1. (подпис на родител/настойник)
                </p>
              </div>
              <div className="text-center">
                <p>........................................</p>
                <p className="mt-0.5 text-[9px] text-slate-500">
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
