"use client";

import {
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Printer,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DocumentAttachmentType = "pdf" | "word" | "excel" | "other";

interface DocumentViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string | null;
  documentName?: string | null;
  documentType?: DocumentAttachmentType | null;
}

export const getDocumentIcon = (
  type?: DocumentAttachmentType | null,
  className = "size-5"
) => {
  switch (type) {
    case "pdf":
      return <FileText className={`${className} text-rose-500`} />;
    case "word":
      return <FileCode className={`${className} text-blue-500`} />;
    case "excel":
      return <FileSpreadsheet className={`${className} text-emerald-500`} />;
    default:
      return <Paperclip className={`${className} text-zinc-500`} />;
  }
};

export const getDocumentTypeBadge = (type?: DocumentAttachmentType | null) => {
  switch (type) {
    case "pdf":
      return "PDF Документ";
    case "word":
      return "Word Документ";
    case "excel":
      return "Excel Таблица";
    default:
      return "Прикачен файл";
  }
};

interface ViewerBodyProps {
  isPdf: boolean;
  isOffice: boolean;
  isGoogleDrive: boolean;
  googleDrivePreviewUrl: string;
  documentUrl: string | null;
  documentName?: string | null;
  documentType?: DocumentAttachmentType | null;
  officeViewerUrl: string;
}

const DocumentViewerBody: React.FC<ViewerBodyProps> = ({
  isPdf,
  isOffice,
  isGoogleDrive,
  googleDrivePreviewUrl,
  documentUrl,
  documentName,
  documentType,
  officeViewerUrl,
}) => {
  if (!documentUrl) return null;

  if (isGoogleDrive) {
    return (
      <iframe
        src={googleDrivePreviewUrl}
        className="size-full border-none"
        title={documentName || "Google Drive Преглед"}
        allow="autoplay"
      />
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={`${documentUrl}#toolbar=1&navpanes=0`}
        className="size-full border-none"
        title={documentName || "PDF Преглед"}
      />
    );
  }

  if (isOffice) {
    return (
      <div className="flex size-full flex-col">
        <div className="shrink-0 border-b border-zinc-200 bg-amber-50/80 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          Визуализация през Office Online Viewer. Ако документът не се зареди,
          можете да го{" "}
          <a
            href={documentUrl}
            download={documentName || "document"}
            className="font-semibold underline underline-offset-2"
          >
            изтеглите директно оттук
          </a>
          .
        </div>
        <iframe
          src={officeViewerUrl}
          className="size-full flex-1 border-none"
          title={documentName || "Office Viewer"}
        />
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
        {getDocumentIcon(documentType, "size-10")}
      </div>
      <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
        {documentName}
      </h3>
      <p className="mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
        Този тип файл няма вграден уеб преглед. Можете да го свалите директно на
        вашето устройство.
      </p>
      <Button asChild className="mt-4 gap-2 rounded-xl">
        <a
          href={documentUrl}
          download={documentName || "document"}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download className="size-4" />
          Изтегли файла
        </a>
      </Button>
    </div>
  );
};

export const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentName = "Документ",
  documentType = "pdf",
}) => {
  if (!documentUrl) return null;

  const driveMatch = documentUrl.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/
  );
  const isGoogleDrive = Boolean(driveMatch && driveMatch[1]);
  const googleDrivePreviewUrl = isGoogleDrive
    ? `https://drive.google.com/file/d/${driveMatch?.[1]}/preview`
    : "";

  const isPdf =
    !isGoogleDrive &&
    (documentType === "pdf" ||
      documentUrl.toLowerCase().includes(".pdf") ||
      (documentName ? documentName.toLowerCase().endsWith(".pdf") : false));

  const isOffice =
    !isGoogleDrive &&
    (documentType === "word" ||
      documentType === "excel" ||
      /\.(docx?|xlsx?|pptx?)$/i.test(documentName || "") ||
      /\.(docx?|xlsx?|pptx?)/i.test(documentUrl));

  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    documentUrl
  )}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[92vh] max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-6 py-4 dark:border-zinc-900 dark:bg-zinc-900/50">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 shadow-xs dark:bg-zinc-800">
                {getDocumentIcon(documentType, "size-5")}
              </div>
              <div className="text-left">
                <DialogTitle className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {documentName || "Преглед на наредба / документ"}
                </DialogTitle>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {getDocumentTypeBadge(documentType)} • Наредба за състезанието
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Action toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 gap-1.5 rounded-xl border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <a
                href={documentUrl}
                download={documentName || "document"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Изтегли</span>
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!documentUrl) return;
                const printWin = window.open(documentUrl, "_blank");
                if (printWin) {
                  printWin.focus();
                  printWin.onload = () => {
                    try {
                      printWin.print();
                    } catch {
                      // Handled by native PDF viewer
                    }
                  };
                }
              }}
              className="h-9 gap-1.5 rounded-xl border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title="Принтирай наредбата"
            >
              <Printer className="size-3.5" />
              <span className="hidden sm:inline">Печат</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 gap-1.5 rounded-xl border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                <span className="hidden sm:inline">Нов прозорец</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <DocumentViewerBody
            isPdf={isPdf}
            isOffice={isOffice}
            isGoogleDrive={isGoogleDrive}
            googleDrivePreviewUrl={googleDrivePreviewUrl}
            documentUrl={documentUrl}
            documentName={documentName}
            documentType={documentType}
            officeViewerUrl={officeViewerUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
