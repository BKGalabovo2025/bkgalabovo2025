"use client";

import { Check, Edit3, PenLine, Trash2 } from "lucide-react";
import React from "react";

import { SignatureDialog } from "@/components/members/signature-dialog";
import { Button } from "@/components/ui/button";

interface ChairpersonSignatureControlProps {
  signatureUrl: string | null;
  isApplied: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  toggleApplied: () => void;
  handleSaveSignature: (file: File) => Promise<void>;
  handleRemoveSignature?: () => Promise<void>;
  className?: string;
}

export function ChairpersonSignatureControl({
  signatureUrl,
  isApplied,
  dialogOpen,
  setDialogOpen,
  toggleApplied,
  handleSaveSignature,
  handleRemoveSignature,
  className = "",
}: ChairpersonSignatureControlProps) {
  return (
    <>
      <div className={`flex items-center gap-1.5 print:hidden ${className}`}>
        {signatureUrl ? (
          <>
            <Button
              type="button"
              variant={isApplied ? "default" : "outline"}
              size="sm"
              onClick={toggleApplied}
              className={`rounded-xl h-9 px-3 text-xs font-medium transition-all ${
                isApplied
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
              title={
                isApplied
                  ? "Подписът на Председателя е положен в документа. Натиснете, за да го махнете."
                  : "Натиснете, за да положите електронния подпис на Председателя."
              }
            >
              {isApplied ? (
                <>
                  <Check className="mr-1.5 size-3.5" />
                  Подпис: Положен
                </>
              ) : (
                <>
                  <PenLine className="mr-1.5 size-3.5" />
                  Сложи електронен подпис
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="rounded-xl h-9 px-2 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
              title="Смени / начертай нов подпис"
            >
              <Edit3 className="size-3.5" />
            </Button>

            {handleRemoveSignature && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveSignature}
                className="rounded-xl h-9 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                title="Изтрий подписа на Председателя от базата данни"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="rounded-xl h-9 px-3 text-xs font-medium text-slate-800 border-slate-300 hover:bg-slate-50"
            title="Начертайте подпис на Председателя, който ще се запази за всички официални документи"
          >
            <PenLine className="mr-1.5 size-3.5" />
            Подпис на Председателя
          </Button>
        )}
      </div>

      <SignatureDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSignature}
        title="Официален електронен подпис на Председателя"
        description="Начертайте официалния подпис на Мира Георгиева. Той ще се запази в системата и ще може да се прилага автоматично към всички официални клубни бланки и решения."
      />
    </>
  );
}

interface ChairpersonSignatureLineProps {
  isApplied: boolean;
  signatureUrl: string | null;
  caption?: string;
  className?: string;
  lineWidthClass?: string;
  align?: "left" | "center" | "right";
}

export function ChairpersonSignatureLine({
  isApplied,
  signatureUrl,
  caption = "/ Мира Георгиева /",
  className = "",
  lineWidthClass = "w-44",
  align = "center",
}: ChairpersonSignatureLineProps) {
  const alignContainerClass =
    align === "right"
      ? "text-right ml-auto mr-0 items-end"
      : align === "left"
        ? "text-left mr-auto ml-0 items-start"
        : "text-center mx-auto items-center";

  return (
    <div
      className={`relative flex flex-col ${alignContainerClass} ${className}`}
    >
      {isApplied && signatureUrl ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureUrl}
            alt="Подпис на Председателя"
            className={`h-11 w-auto object-contain mix-blend-multiply ${
              align === "right"
                ? "ml-auto"
                : align === "left"
                  ? "mr-auto"
                  : "mx-auto"
            }`}
          />
          <div className={`${lineWidthClass} border-b border-slate-700`} />
        </div>
      ) : (
        <div className={`${lineWidthClass} pt-8 border-b border-slate-700`} />
      )}
      {caption && (
        <p className="mt-1 text-[8pt] text-slate-900 font-semibold italic">
          {caption}
        </p>
      )}
    </div>
  );
}
