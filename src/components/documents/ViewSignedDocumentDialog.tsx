"use client";

import { Download, Loader2, PenTool, Printer, ShieldCheck } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { OfficialDocumentRenderer } from "@/components/documents/OfficialDocumentRenderer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useChairpersonSignature } from "@/hooks/useChairpersonSignature";
import { signAsPresidentAction } from "@/lib/actions/document-requests";
import {
  formatValidityBadgeText,
  getCalendarYearValidity,
} from "@/lib/document-validity";
import { generatePdfFromElement } from "@/lib/html-to-pdf";
import { DocumentRequest } from "@/types/document-request.types";

interface ViewSignedDocumentDialogProps {
  request: DocumentRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function ViewSignedDocumentDialog({
  request,
  open,
  onOpenChange,
  onUpdated,
}: ViewSignedDocumentDialogProps) {
  const { idToken, getFreshToken } = useAuth();
  const chairperson = useChairpersonSignature();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSigningPresident, setIsSigningPresident] = useState(false);
  const [currentReq, setCurrentReq] = useState<DocumentRequest | null>(request);

  React.useEffect(() => {
    setCurrentReq(request);
  }, [request]);

  if (!currentReq) return null;

  const validity = getCalendarYearValidity(
    currentReq.signedAt || currentReq.createdAt
  );
  const validityBadge = formatValidityBadgeText(validity);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPdf(true);
    const toastId = toast.loading("Генериране на официален PDF документ...");

    try {
      const cleanFileName =
        `${currentReq.documentTitle}_${currentReq.memberName}`
          .replace(/\s+/g, "_")
          .replace(/[^\w\u0400-\u04FF_]/g, "");

      await generatePdfFromElement(
        printAreaRef.current,
        `${cleanFileName}.pdf`,
        "portrait"
      );
      toast.success("PDF документът е изтеглен успешно!", { id: toastId });
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Възникна грешка при сваляне на PDF документа.", {
        id: toastId,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSignAsPresident = async () => {
    if (!chairperson.signatureUrl) {
      toast.error(
        "Моля, първо въведете или нарисувайте подписа на председателя от контрола горе вдясно."
      );
      return;
    }

    setIsSigningPresident(true);
    const toastId = toast.loading("Поставяне на подпис на Председателя...");

    try {
      const token = idToken || (await getFreshToken());
      if (!token) {
        toast.error("Неоторизиран достъп.", { id: toastId });
        return;
      }

      const res = await signAsPresidentAction({
        requestId: currentReq.id,
        idToken: token,
        signatureBase64: chairperson.signatureUrl,
      });

      if (res.success && res.data) {
        toast.success("Документът е подписан успешно от Председателя!", {
          id: toastId,
        });
        setCurrentReq((prev) =>
          prev
            ? {
                ...prev,
                presidentSignatureUrl: chairperson.signatureUrl,
                presidentSignedAt: res.data?.presidentSignedAt,
              }
            : null
        );
        if (onUpdated) onUpdated();
      } else {
        toast.error(res.error || "Грешка при подписване.", { id: toastId });
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Грешка при подписване като председател.",
        { id: toastId }
      );
    } finally {
      setIsSigningPresident(false);
    }
  };

  const signedDateStr = currentReq.signedAt
    ? new Date(currentReq.signedAt).toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0 sm:rounded-2xl border-zinc-200 bg-zinc-100 font-sans">
        {/* Modal Top Bar (Non-printable) */}
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-200/80 bg-white/95 px-4 py-2.5 sm:px-5 sm:py-3 backdrop-blur-md print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Официален клубен документ
              </span>
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[10px] ${validityBadge.badgeClass}`}
              >
                {validityBadge.label}
              </span>
            </div>
            <h2 className="text-base font-bold text-zinc-950 sm:text-lg">
              {currentReq.documentTitle}
            </h2>
            <p className="text-xs text-zinc-500">
              Състезател:{" "}
              <strong className="text-zinc-900">{currentReq.memberName}</strong>
              {signedDateStr && ` • Подписан: ${signedDateStr} ч.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!currentReq.presidentSignatureUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSigningPresident}
                onClick={handleSignAsPresident}
                className="h-9 rounded-xl border-emerald-300 bg-emerald-50/70 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs"
                title="Постави електронен подпис на Председателя върху документа"
              >
                {isSigningPresident ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <PenTool className="mr-1.5 size-3.5 text-emerald-600" />
                )}
                Подпиши като Председател
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="h-9 rounded-xl border-zinc-200 text-xs font-semibold hover:bg-zinc-50 shadow-2xs"
            >
              {isExportingPdf ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 size-3.5 text-zinc-600" />
              )}
              PDF Сваляне
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-9 rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white shadow-md hover:bg-zinc-800"
            >
              <Printer className="mr-1.5 size-3.5" />
              Принтирай
            </Button>
          </div>
        </div>

        {/* Document Display Area */}
        <div className="p-4 sm:p-8">
          <div
            ref={printAreaRef}
            className="mx-auto max-w-[210mm] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm print:m-0 print:border-none print:p-0 print:shadow-none"
          >
            <OfficialDocumentRenderer
              slug={currentReq.documentType}
              title={currentReq.documentTitle}
              bodyText={currentReq.documentLegalTextSnapshot || undefined}
              memberName={currentReq.memberName}
              memberBirthDate={currentReq.memberBirthDate}
              participationType={currentReq.parentData?.participationType}
              parentName={currentReq.parentData?.parentName}
              parentPhone={currentReq.parentData?.parentPhone}
              parentEmail={currentReq.parentData?.parentEmail}
              parentAddress={currentReq.parentData?.parentAddress}
              fatherName={currentReq.parentData?.parentName}
              fatherPhone={currentReq.parentData?.parentPhone}
              motherName={currentReq.parentData?.secondParentName}
              motherPhone={currentReq.parentData?.secondParentPhone}
              documentDate={
                currentReq.signedAt
                  ? new Date(currentReq.signedAt).toLocaleDateString("bg-BG")
                  : new Date(currentReq.createdAt).toLocaleDateString("bg-BG")
              }
              parentSignatureDataUrl={currentReq.signatureUrl}
              secondParentSignatureDataUrl={currentReq.secondParentSignatureUrl}
              memberSignatureDataUrl={currentReq.memberSignatureUrl}
              presidentSignatureDataUrl={
                currentReq.presidentSignatureUrl || chairperson.signatureUrl
              }
              parentSignedAt={currentReq.signedAt}
              presidentSignedAt={currentReq.presidentSignedAt}
              isPrintMode={false}
            />

            {/* Official Digital Signature Certificate Stamp */}
            <div className="mt-8 border-t border-slate-200 pt-4 text-[7.5pt] text-slate-500 font-sans print:border-slate-400">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>
                    Електронно заверен документ на СНЦ „Бадминтон клуб Гълъбово”
                  </span>
                </div>
                <div>
                  <span>Рег. ключ: </span>
                  <span className="font-mono font-bold text-slate-800">
                    {currentReq.token.slice(0, 16)}...
                  </span>
                </div>
                <div>
                  <span>Валидност на картотеката / документа: </span>
                  <strong className="text-slate-900">
                    {validity?.validUntilDateStr ||
                      "края на календарната година"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
