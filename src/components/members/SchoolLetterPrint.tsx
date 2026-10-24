"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import {
  ChairpersonSignatureControl,
  ChairpersonSignatureLine,
} from "@/components/shared/members/ChairpersonSignatureControl";
import { ClubOfficialDocumentHeader } from "@/components/shared/members/ClubOfficialDocumentHeader";
import { Button } from "@/components/ui/button";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { getDocumentTemplatesAction } from "@/lib/actions/document-templates";
import { formatFullName } from "@/lib/utils";
import type { DocumentNumberKey } from "@/types/document-number.types";
import { DEFAULT_OFFICIAL_TEMPLATES } from "@/types/document-template.types";

type FieldKey =
  "school" | "memberName" | "grade" | "dateFrom" | "dateTo" | "event";

const FIELD_MIN_CH: Record<FieldKey, number> = {
  school: 28,
  memberName: 24,
  grade: 6,
  dateFrom: 12,
  dateTo: 12,
  event: 0,
};

const FIELD_HINT: Record<FieldKey, string> = {
  school: "учебно заведение",
  memberName: "име на ученика",
  grade: "клас",
  dateFrom: "дд.мм.гггг",
  dateTo: "дд.мм.гггг",
  event: "събитие / турнир / тренировъчен процес",
};

const MULTILINE: FieldKey[] = ["event"];

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatBgDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

interface SchoolLetterPrintProps {
  templateId: string;
  /** Document type used for the issued document number */
  documentKey: DocumentNumberKey;
  /** Label above the chairperson signature line */
  signatureLabel: string;
  /** Text under the signature line */
  signatureCaption: string;
}

/**
 * Printable school letter. The text always comes from the central template
 * catalog (/documents); the member's name and school are filled in
 * automatically and every field stays editable directly in the document.
 */
export const SchoolLetterPrint = ({
  templateId,
  documentKey,
  signatureLabel,
  signatureCaption,
}: SchoolLetterPrintProps) => {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { member, loading } = useMemberProfile(memberId);
  const chairperson = useChairpersonSignature();

  const defaultTpl = DEFAULT_OFFICIAL_TEMPLATES.find(
    (t) => t.id === templateId
  );
  const [content, setContent] = useState<string>(defaultTpl?.content || "");
  const [version, setVersion] = useState<number>(defaultTpl?.version || 1);
  const [values, setValues] = useState<Record<FieldKey, string>>({
    school: "",
    memberName: "",
    grade: "",
    dateFrom: "",
    dateTo: "",
    event: "",
  });
  const [date, setDate] = useState<string>(todayIso());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    getDocumentTemplatesAction()
      .then((res) => {
        if (!active || !res.success || !res.data) return;
        const tpl = res.data.find((t) => t.id === templateId);
        if (tpl) {
          setContent(tpl.content);
          setVersion(tpl.version);
        }
      })
      .catch((err) => console.error("Error loading template:", err));
    return () => {
      active = false;
    };
  }, [templateId]);

  useEffect(() => {
    if (!member || initialized) return;
    setValues((prev) => ({
      ...prev,
      memberName: formatFullName(member),
      school: member.educationInstitution?.trim() || "",
    }));
    setInitialized(true);
  }, [member, initialized]);

  const lines = useMemo(() => content.split("\n"), [content]);

  if (loading) return <div className="p-8">Зареждане...</div>;
  if (!member) return <div className="p-8">Членът не е намерен.</div>;

  const setValue = (key: FieldKey, value: string) =>
    setValues((p) => ({ ...p, [key]: value }));

  const renderField = (key: FieldKey) => {
    const value = values[key];
    if (MULTILINE.includes(key)) {
      return (
        <textarea
          value={value}
          rows={2}
          placeholder={FIELD_HINT[key]}
          aria-label={FIELD_HINT[key]}
          onChange={(e) => setValue(key, e.target.value)}
          className="mt-1 block w-full resize-none border-0 border-b border-dotted border-slate-700 bg-transparent px-1 font-bold text-slate-950 outline-none placeholder:font-normal placeholder:text-slate-400 focus:bg-amber-50 print:border-slate-800 print:placeholder:text-transparent"
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        size={Math.max(value.length + 2, FIELD_MIN_CH[key])}
        placeholder={FIELD_HINT[key]}
        aria-label={FIELD_HINT[key]}
        onChange={(e) => setValue(key, e.target.value)}
        className="inline-block max-w-full border-0 border-b border-dotted border-slate-700 bg-transparent px-1.5 text-center font-bold text-slate-950 outline-none placeholder:font-normal placeholder:text-slate-400 focus:bg-amber-50 print:border-slate-800 print:placeholder:text-transparent"
      />
    );
  };

  // Filter out the initial addressee lines from generic line rendering to show them in a dedicated block
  const bodyLines = lines.filter(
    (l) => !l.includes("До ДИРЕКТОРА") && !l.includes("{{school}}")
  );

  const renderBodyLine = (line: string, idx: number) => {
    if (!line.trim()) return <div key={idx} className="h-2" />;
    const parts = line.split(/(\{\{\w+\}\})/g);

    // Formal salutation
    if (
      line.includes("Госпо/дин/жо Директор") ||
      line.includes("Господин/жо Директор")
    ) {
      return (
        <p
          key={idx}
          className="mt-4 mb-2 font-serif font-bold text-slate-900 text-[11pt]"
        >
          Господин/жо Директор,
        </p>
      );
    }

    return (
      <p
        key={idx}
        className="indent-8 text-justify leading-relaxed text-slate-900"
      >
        {parts.map((part, i) => {
          const match = part.match(/^\{\{(\w+)\}\}$/);
          if (!match) return <span key={i}>{part}</span>;
          const key = match[1] as FieldKey;
          return key in values ? (
            <span key={i}>{renderField(key)}</span>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </p>
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 md:p-12">
      {/* Control bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 size-4" /> Назад
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <ChairpersonSignatureControl
            signatureUrl={chairperson.signatureUrl}
            isApplied={chairperson.isApplied}
            dialogOpen={chairperson.dialogOpen}
            setDialogOpen={chairperson.setDialogOpen}
            toggleApplied={chairperson.toggleApplied}
            handleSaveSignature={chairperson.handleSaveSignature}
            handleRemoveSignature={chairperson.handleRemoveSignature}
          />
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            Дата
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayIso())}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-sans"
            />
          </label>
          <Button
            onClick={() => window.print()}
            className="rounded-xl bg-zinc-950 text-white shadow-lg hover:bg-zinc-800"
          >
            <Printer className="mr-2 size-4" /> Принтирай (A4)
          </Button>
        </div>
      </div>

      <p className="mb-6 text-xs text-slate-400 print:hidden">
        Официален клубен образец v{version}. Полетата са редактируеми директно в
        документа. Името и училището се попълват автоматично от профила на
        члена.
      </p>

      {/* Main A4 Printable Document Area */}
      <div className="print-area relative font-serif text-[11pt] leading-relaxed text-slate-900">
        <ClubOfficialDocumentHeader documentKey={documentKey} />

        {/* Executive Addressee Block (Aligned to Right) */}
        <div className="mb-6 mt-3 flex justify-end">
          <div className="w-[55%] space-y-1 text-left font-serif">
            <p className="font-bold tracking-wider text-slate-950 text-[10.5pt] uppercase">
              ДО ДИРЕКТОРА НА
            </p>
            <div className="border-b border-dotted border-slate-600 pb-0.5 font-bold">
              {renderField("school")}
            </div>
            <p className="text-[8.5pt] text-slate-500 italic">
              / наименование на учебното заведение /
            </p>
          </div>
        </div>

        {/* Letter Body */}
        <div className="space-y-3 font-serif text-[11pt]">
          {bodyLines.map(renderBodyLine)}
        </div>

        {/* Institutional Sign-off and Signature Block */}
        <div className="mt-14 flex items-end justify-between font-serif text-[11pt]">
          <div className="space-y-1">
            <p className="font-medium text-slate-800">гр. Гълъбово</p>
            <div className="w-36 border-b border-slate-700 pb-0.5">
              <span className="font-medium">Дата: {formatBgDate(date)} г.</span>
            </div>
          </div>

          <div className="min-w-60 text-center font-serif">
            <p className="mb-2 font-bold uppercase tracking-wider text-[10.5pt] text-slate-950">
              {signatureLabel}
            </p>
            <ChairpersonSignatureLine
              isApplied={chairperson.isApplied}
              signatureUrl={chairperson.signatureUrl}
              caption={signatureCaption}
              lineWidthClass="w-48"
            />
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
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
            font-size: 11pt !important;
            line-height: 1.45 !important;
          }
        }
      `,
        }}
      />
    </div>
  );
};
