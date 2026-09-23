/* eslint-disable sonarjs/cognitive-complexity */
"use client";

import {
  Eye,
  ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import React, { useId, useRef, useState } from "react";

import {
  DocumentAttachmentType,
  DocumentViewerDialog,
  getDocumentIcon,
  getDocumentTypeBadge,
} from "@/components/schedule/DocumentViewerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSiteConfig } from "@/config/sites";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/services/storage-service";

export interface UniversalMediaUploadProps {
  id?: string;
  label?: string;
  description?: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  storageFolder?: string;
  accept?: string;
  maxSizeBytes?: number;
  placeholderUrl?: string;
  className?: string;
}

export const isImageFileOrUrl = (fileNameOrUrl?: string | null): boolean => {
  if (!fileNameOrUrl) return false;
  const lower = fileNameOrUrl.toLowerCase();

  // 1. Check query parameter fileName/filename/name if present
  try {
    const urlObj = new URL(fileNameOrUrl, "http://localhost");
    const param =
      urlObj.searchParams.get("fileName") ||
      urlObj.searchParams.get("filename") ||
      urlObj.searchParams.get("name");
    if (param && isImageFileOrUrl(param)) {
      return true;
    }
  } catch {
    // ignore parsing errors for relative/special paths
  }

  // 2. Direct extension checks
  const clean = lower.split("?")[0];
  return (
    clean.endsWith(".png") ||
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".svg") ||
    clean.startsWith("data:image/") ||
    clean.startsWith("/zones/") ||
    clean.includes("/magazin/")
  );
};

export const detectAttachmentType = (
  fileNameOrUrl?: string | null
): DocumentAttachmentType => {
  if (!fileNameOrUrl) return "other";
  if (isImageFileOrUrl(fileNameOrUrl)) return "image";
  const ext = fileNameOrUrl.split("?")[0].split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  return "other";
};

export function UniversalMediaUpload({
  id,
  label = "Снимка / Прикачен файл",
  description = "PNG, JPG, WEBP или документ (до 800KB или външен линк)",
  value,
  onChange,
  storageFolder = "media",
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  maxSizeBytes = 800 * 1024,
  placeholderUrl = "https://... или /zones/...",
  className,
}: UniversalMediaUploadProps) {
  const generatedId = useId();
  const elementId = id || `media-upload-${generatedId.replace(/:/g, "")}`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { idToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"upload" | "link">("upload");
  const [manualUrl, setManualUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isImageContext =
    Boolean(
      accept?.startsWith("image") &&
      !accept.includes(".pdf") &&
      !accept.includes(".doc")
    ) ||
    Boolean(
      storageFolder &&
      [
        "sponsors",
        "certificate-backgrounds",
        "avatars",
        "products",
        "services",
      ].includes(storageFolder)
    );

  const isImage = isImageFileOrUrl(value) || (Boolean(value) && isImageContext);
  const docType: DocumentAttachmentType = isImage
    ? "image"
    : detectAttachmentType(value);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeBytes) {
      setError(
        `Файлът надвишава ${Math.round(maxSizeBytes / 1024)}KB. За по-големи файлове използвайте опцията "Постави външен линк" (Google Drive, Cloudinary и др.).`
      );
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const siteId = getSiteConfig().id;
      const storagePath = `sites/${siteId}/${storageFolder}/${Date.now()}_${safeName}`;

      const downloadUrl = await uploadFile(storagePath, file, idToken);
      onChange(downloadUrl);
    } catch (err: unknown) {
      console.error("Upload failed", err);
      setError(
        err instanceof Error ? err.message : "Грешка при качване на файла."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApplyManual = () => {
    if (!manualUrl.trim()) {
      setError("Моля, въведете валиден линк.");
      return;
    }
    onChange(manualUrl.trim());
    setManualUrl("");
    setError(null);
  };

  const handleClear = () => {
    onChange("");
    setManualUrl("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCleanFileName = (rawUrl?: string | null) => {
    if (!rawUrl) return "";
    try {
      const urlObj = new URL(rawUrl, "http://localhost");
      const queryName =
        urlObj.searchParams.get("fileName") ||
        urlObj.searchParams.get("filename") ||
        urlObj.searchParams.get("name");
      if (queryName) {
        return decodeURIComponent(queryName);
      }
      const withoutQuery = rawUrl.split("?")[0];
      const parts = withoutQuery.split("/");
      const lastPart = parts[parts.length - 1];
      const decoded = decodeURIComponent(lastPart);
      if (decoded === "upload") {
        return isImage ? "Прикачено изображение" : "Прикачен файл";
      }
      return decoded || rawUrl;
    } catch {
      return rawUrl;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-1">
          <Label
            htmlFor={`${elementId}-file`}
            className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-zinc-400 uppercase"
          >
            {isImage ? (
              <ImageIcon className="size-3.5" />
            ) : (
              <Paperclip className="size-3.5" />
            )}
            {label}
          </Label>
          {description && (
            <span className="text-[10px] text-zinc-500">{description}</span>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        id={`${elementId}-file`}
        name={`${elementId}-file`}
        className="hidden"
        accept={accept}
        onChange={handleFileUpload}
        disabled={isUploading}
      />

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
          {error}
        </div>
      )}

      {value ? (
        /* Attached Resource Preview Card */
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 transition-all dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-800">
              {isImage ? (
                <Image
                  src={value}
                  alt={getCleanFileName(value) || "Thumbnail"}
                  fill
                  sizes="48px"
                  loading="eager"
                  unoptimized
                  className="object-contain p-0.5"
                />
              ) : (
                getDocumentIcon(docType, "size-5")
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                title={value}
              >
                {getCleanFileName(value)}
              </p>
              <p className="text-[10px] text-zinc-400">
                {isImage
                  ? "Графично изображение / Лого"
                  : getDocumentTypeBadge(docType)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 pl-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
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
              title="Премахни"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        /* Selector Tabs + Upload / Link Zone */
        <div className="space-y-3">
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => {
                setActiveTab("upload");
                setError(null);
              }}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === "upload"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Качи файл от устройството
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("link");
                setError(null);
              }}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === "link"
                  ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              Постави външен линк
            </button>
          </div>

          {activeTab === "upload" ? (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 p-5 text-center transition-all hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60",
                isUploading && "pointer-events-none opacity-60"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-6 animate-spin text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Качване на файла...
                  </span>
                </>
              ) : (
                <>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <UploadCloud className="size-5 text-zinc-500" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Кликнете за качване на снимка или файл
                    </span>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      PNG, JPG, WEBP, PDF, Word или Excel
                    </p>
                  </div>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <Input
                id={`${elementId}-manual-url`}
                name={`${elementId}-manual-url`}
                placeholder={placeholderUrl}
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="h-10 flex-1 rounded-xl bg-white text-xs dark:bg-zinc-800"
              />
              <Button
                type="button"
                onClick={handleApplyManual}
                className="h-10 rounded-xl px-4 text-xs font-medium"
              >
                Прикачи
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Document & Image Viewer Modal */}
      {value && (
        <DocumentViewerDialog
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          documentUrl={value}
          documentName={getCleanFileName(value)}
          documentType={docType}
          subtitle={isImage ? "Изображение / Лого" : "Прикачен документ"}
        />
      )}
    </div>
  );
}
