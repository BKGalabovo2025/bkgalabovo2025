"use client";

import { Eye, Loader2, Paperclip, Trash2, UploadCloud } from "lucide-react";
import React, { useRef, useState } from "react";

import {
  DocumentAttachmentType,
  getDocumentIcon,
  getDocumentTypeBadge,
} from "@/components/schedule/DocumentViewerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EventAttachmentSectionProps {
  idPrefix: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: DocumentAttachmentType | null;
  isUploadingAttachment: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
  onOpenPreview: () => void;
  onApplyManualLink: (url: string, name: string) => void;
}

export const EventAttachmentSection: React.FC<EventAttachmentSectionProps> = ({
  idPrefix,
  attachmentUrl,
  attachmentName,
  attachmentType,
  isUploadingAttachment,
  onFileUpload,
  onRemoveAttachment,
  onOpenPreview,
  onApplyManualLink,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentMode, setAttachmentMode] = useState<"upload" | "link">(
    "upload"
  );
  const [manualLinkUrl, setManualLinkUrl] = useState("");
  const [manualLinkName, setManualLinkName] = useState("");

  const handleManualApply = () => {
    onApplyManualLink(manualLinkUrl, manualLinkName);
  };

  const handleClear = () => {
    setManualLinkUrl("");
    setManualLinkName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemoveAttachment();
  };

  return (
    <div className="space-y-2">
      <div className="ml-1 flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-file-upload`}
          className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
        >
          <Paperclip className="size-3" /> Наредба / Прикачен документ (по
          желание)
        </label>
        <span className="text-[10px] text-zinc-400">
          PDF, Word, Excel (до 800KB или външен линк)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        id={`${idPrefix}-file-upload`}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={onFileUpload}
        disabled={isUploadingAttachment}
      />

      {attachmentUrl ? (
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 transition-all dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs dark:bg-zinc-800">
              {getDocumentIcon(attachmentType, "size-5")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {attachmentName || "Прикачен документ"}
              </p>
              <p className="text-[10px] text-zinc-400">
                {getDocumentTypeBadge(attachmentType)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenPreview}
              className="h-8 gap-1 rounded-xl px-2.5 text-xs text-zinc-700 hover:bg-white hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <Eye className="size-3.5" />
              <span>Преглед</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 rounded-xl px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
              title="Премахни документа"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setAttachmentMode("upload")}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                attachmentMode === "upload"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Качи файл от устройството
            </button>
            <button
              type="button"
              onClick={() => setAttachmentMode("link")}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                attachmentMode === "link"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Постави външен линк
            </button>
          </div>

          {attachmentMode === "upload" ? (
            <button
              type="button"
              disabled={isUploadingAttachment}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 p-5 text-center transition-all hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60",
                isUploadingAttachment && "pointer-events-none opacity-60"
              )}
            >
              {isUploadingAttachment ? (
                <>
                  <Loader2 className="size-6 animate-spin text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Качване на документа...
                  </span>
                </>
              ) : (
                <>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <UploadCloud className="size-5 text-zinc-500" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Кликнете за качване на наредба или файл
                    </span>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      PDF, Word или Excel документ
                    </p>
                  </div>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <Input
                placeholder="https://... (Google Drive, Dropbox, URL към PDF/Word)"
                value={manualLinkUrl}
                onChange={(e) => setManualLinkUrl(e.target.value)}
                className="h-10 rounded-xl bg-white text-xs dark:bg-zinc-800"
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Име на файла (напр. Наредба_Държавно_2026.pdf)"
                  value={manualLinkName}
                  onChange={(e) => setManualLinkName(e.target.value)}
                  className="h-10 flex-1 rounded-xl bg-white text-xs dark:bg-zinc-800"
                />
                <Button
                  type="button"
                  onClick={handleManualApply}
                  className="h-10 rounded-xl px-4 text-xs font-medium"
                >
                  Прикачи
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
