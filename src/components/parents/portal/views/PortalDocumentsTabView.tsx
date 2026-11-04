"use client";

import {
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileSignature,
  HeartPulse,
  Link2,
  ShieldAlert,
  Upload,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useParentPortalContext } from "../ParentPortalContext";

export function PortalDocumentsTabView() {
  const {
    portal,
    handlePreviewSentDocument,
    handleOpenSignDocument,
    setParentMedicalModalOpen,
    deepLinkedDocId,
    selectedChildId,
  } = useParentPortalContext();

  const { documentsData, selectedChild } = portal;
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const handleCopyDocLink = (docId: string, docTitle: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/club/parents?child=${selectedChildId}&tab=documents&doc=${docId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedDocId(docId);
          toast.success(`Директният линк за „${docTitle}“ е копиран!`);
          setTimeout(() => setCopiedDocId(null), 2500);
        })
        .catch(() => toast.info(`Линк: ${url}`));
    } else {
      toast.info(`Линк: ${url}`);
    }
  };

  const sentDocs = documentsData?.sentDocuments || [];
  const pendingDocs = sentDocs.filter((d) => d.status === "pending");
  const signedDocs = sentDocs.filter((d) => d.status === "completed");
  const isMedicalValid = Boolean(
    documentsData?.medicalCertificate?.hasCertificate &&
    !documentsData?.medicalCertificate?.isExpired
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Section 1: Official Sent Documents for Signature & Preview ── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-2">
              <FileSignature size={16} className="text-indigo-600" />
              <span>Официални клубни документи за подписване</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Молби за членство, декларации за съгласие, споразумения и
              правилници, изпратени от ръководството.
            </p>
          </div>

          <Badge
            variant="outline"
            className="text-xs font-bold self-start sm:self-auto"
          >
            {sentDocs.length} документа в досието
          </Badge>
        </div>

        {/* Pending documents for signature */}
        {pendingDocs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} />
              <span>Очакващи подпис ({pendingDocs.length}):</span>
            </h4>

            <div className="space-y-2.5">
              {pendingDocs.map((doc) => {
                const isHighlighted = deepLinkedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    id={`doc-${doc.id}`}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 shadow-2xs transition-all",
                      isHighlighted
                        ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/40"
                        : "border-indigo-200/80 bg-indigo-50/30 hover:bg-white hover:border-indigo-300 dark:border-indigo-900/50 dark:bg-zinc-950/50"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-zinc-900 dark:text-white">
                          📄 {doc.documentTitle}
                        </span>
                        <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                          ⏳ Очаква подпис
                        </Badge>
                        {doc.viewedByParentAt && (
                          <Badge
                            variant="outline"
                            className="border-sky-300 bg-sky-50 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                          >
                            👁️ Прегледан от вас
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Изпратен на:{" "}
                        {new Date(doc.createdAt).toLocaleDateString("bg-BG")} •
                        Валиден до:{" "}
                        {new Date(doc.expiresAt).toLocaleDateString("bg-BG")}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyDocLink(doc.id, doc.documentTitle)
                        }
                        className="h-8 gap-1 rounded-xl text-[11px] font-semibold"
                        title="Копирай директен линк към този документ"
                      >
                        {copiedDocId === doc.id ? (
                          <>
                            <Check size={11} className="text-emerald-600" />
                            <span>Копиран!</span>
                          </>
                        ) : (
                          <>
                            <Link2 size={11} />
                            <span>Линк</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewSentDocument(doc)}
                        className="h-8 rounded-xl border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
                      >
                        <Eye size={12} className="mr-1" />
                        Преглед
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenSignDocument(doc)}
                        className="h-8 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 cursor-pointer"
                      >
                        <FileSignature size={12} className="mr-1" />
                        ✍️ Подпиши онлайн
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Signed documents */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            <span>Подписани и входирани документи ({signedDocs.length}):</span>
          </h4>

          {signedDocs.length === 0 && pendingDocs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
              Няма активни документи за подписване или преглед в досието на
              детето.
            </div>
          ) : signedDocs.length === 0 ? (
            <div className="rounded-xl bg-zinc-50 p-4 text-center text-xs text-zinc-500 dark:bg-zinc-950/40">
              Все още няма подписани документи.
            </div>
          ) : (
            <div className="space-y-2">
              {signedDocs.map((doc) => (
                <div
                  key={doc.id}
                  id={`doc-${doc.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        📄 {doc.documentTitle}
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                        ✓ Подписан
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Подписан на:{" "}
                      {doc.signedAt
                        ? new Date(doc.signedAt).toLocaleDateString("bg-BG")
                        : "Архивиран"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleCopyDocLink(doc.id, doc.documentTitle)
                      }
                      className="h-8 gap-1 rounded-xl text-[11px] font-semibold"
                    >
                      <Link2 size={11} />
                      <span>Линк</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewSentDocument(doc)}
                      className="h-8 rounded-xl text-xs font-semibold"
                    >
                      <Eye size={12} className="mr-1" />
                      Прегледай
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Medical Certificate & Health Status ─────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shadow-2xs">
              <HeartPulse size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wider text-zinc-900 dark:text-white uppercase">
                Медицинско свидетелство за тренировъчна дейност
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Задължителен периодичен медицински преглед по изискване на
                Министерството на младежта и спорта.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setParentMedicalModalOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Upload size={13} />
            <span>Качи медицинско</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Текущ статус
            </span>
            <div className="flex items-center gap-2">
              {isMedicalValid ? (
                <Badge className="bg-emerald-600 text-white text-xs font-bold gap-1.5 py-1">
                  <CheckCircle2 size={13} />
                  Валидно медицинско свидетелство
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-rose-400 bg-rose-50 text-rose-700 text-xs font-bold gap-1.5 py-1 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <ShieldAlert size={13} />
                  Липсва или изтекло свидетелство
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Валидността е 6 или 12 месеца според възрастта и нормативните
              изисквания на спортния диспансер.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Данни в картотеката
            </span>
            <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
              <p>
                Състезател: <strong>{selectedChild?.fullName}</strong>
              </p>
              <p>
                Медицински статус:{" "}
                <strong>
                  {isMedicalValid
                    ? "Допуснат до тренировки и състезания"
                    : "Изисква подновяване"}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
