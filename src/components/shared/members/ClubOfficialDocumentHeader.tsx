"use client";

import React from "react";

import { useDocumentNumber } from "@/components/members/DocumentNumberBadge";
import {
  DocumentNumberKey,
  formatIssuedAt,
} from "@/types/document-number.types";

interface ClubOfficialDocumentHeaderProps {
  documentKey: DocumentNumberKey;
  overrideDate?: string;
  /** Optional custom document title / subtitle to show in header or right side */
  extraRightContent?: React.ReactNode;
}

/**
 * Official club letterhead header matching the official scanned letterheads.
 * Features:
 * - Round club logo
 * - Official address, phone, email, website and Facebook info (no Bulstat)
 * - Automatic atomic document number badge (№ CODE-YEAR-SEQ, Date & Time)
 * - Clean dividing rule
 */
export function ClubOfficialDocumentHeader({
  documentKey,
  overrideDate,
  extraRightContent,
}: ClubOfficialDocumentHeaderProps) {
  const { record, error } = useDocumentNumber(documentKey);

  return (
    <div className="club-official-header mb-5 border-b-2 border-slate-900 pb-2.5 text-slate-900">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Club Logo & Institutional Contact Block */}
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/LOGO.webp"
            alt="Бадминтон клуб Гълъбово"
            className="shrink-0 object-contain size-16 sm:size-18 print:size-16"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/icons/LOGO.jpg";
            }}
          />
          <div className="space-y-0.5 font-serif text-[9pt] leading-tight text-slate-900 print:text-[8.5pt]">
            <p className="font-semibold text-slate-950">
              СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“
            </p>
            <p className="italic text-slate-700">
              гр. Гълъбово, п.к. 6280, обл. Стара Загора, ул. &bdquo;Иван
              Вазов&ldquo; №22
            </p>
            <p className="text-slate-800">
              тел.:{" "}
              <span className="font-semibold text-slate-950">
                +359 899 82 99 23
              </span>{" "}
              &ndash; Мира Георгиева
            </p>
            <p className="text-slate-800">
              e-mail:{" "}
              <span className="font-sans text-slate-950 font-medium">
                bk_galabovo@abv.bg
              </span>
            </p>
          </div>
        </div>

        {/* Right: Institutional Registration Index Box */}
        <div className="shrink-0 text-right font-sans">
          {record ? (
            <div className="rounded-md border border-slate-300 bg-slate-50/80 px-2.5 py-1 text-right shadow-2xs print:border-slate-500 print:bg-transparent">
              <div className="text-[6.5pt] font-bold tracking-widest text-slate-500 uppercase">
                Регистрационен индекс
              </div>
              <div className="text-[10pt] font-black tracking-wider text-slate-950 font-mono print:text-[9.5pt]">
                № {record.number}
              </div>
              <div className="text-[7.5pt] font-semibold text-slate-600 print:text-[7pt]">
                Дата: {overrideDate || formatIssuedAt(record.issuedAt)}
              </div>
            </div>
          ) : error ? (
            <div className="text-[8pt] text-rose-600 print:hidden">{error}</div>
          ) : (
            <>
              <div className="text-[8pt] text-slate-400 italic print:hidden">
                Издаване на изх. номер...
              </div>
              <div className="hidden text-right print:block text-[8.5pt] text-slate-700">
                Изх. № ........................ / ............ г.
              </div>
            </>
          )}
          {extraRightContent && <div className="mt-1">{extraRightContent}</div>}
        </div>
      </div>
    </div>
  );
}
