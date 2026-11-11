"use client";

import {
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  Printer,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type DocxBlock, loadDocxFromBuffer } from "@/lib/docx-parser";

export type DocumentAttachmentType =
  "pdf" | "word" | "excel" | "image" | "other";

interface DocumentViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string | null;
  documentName?: string | null;
  documentType?: DocumentAttachmentType | null;
  subtitle?: string | null;
  /** Опционален callback при клик на "Изтегли" — за логване на сваляне */
  onDownload?: () => void | Promise<void>;
}

export const getDocumentIcon = (
  type?: DocumentAttachmentType | null,
  className = "size-5"
) => {
  switch (type) {
    case "pdf":
      return <FileText className={`${className} text-rose-400`} />;
    case "word":
      return <FileCode className={`${className} text-blue-400`} />;
    case "excel":
      return <FileSpreadsheet className={`${className} text-emerald-400`} />;
    case "image":
      return <ImageIcon className={`${className} text-purple-400`} />;
    default:
      return <Paperclip className={`${className} text-zinc-300`} />;
  }
};

export const getDocumentTypeBadge = (type?: DocumentAttachmentType | null) => {
  switch (type) {
    case "pdf":
      return "PDF Документ";
    case "word":
      return "Word / RTF Документ";
    case "excel":
      return "Excel Таблица";
    case "image":
      return "Изображение";
    default:
      return "Прикачен файл";
  }
};

const RTF_SKIP_DESTINATIONS = new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "info",
  "pict",
  "header",
  "headerl",
  "headerr",
  "headerf",
  "footer",
  "footerl",
  "footerr",
  "footerf",
  "listtable",
  "listoverridetable",
  "rsidtbl",
  "generator",
  "themedata",
  "colorschememapping",
  "latentstyles",
  "datastore",
  "fldinst",
  "object",
  "private",
]);

export function parseRtfToPlainText(rtf: string): string {
  if (!rtf) return "";

  let cp1251: TextDecoder | null = null;
  try {
    cp1251 = new TextDecoder("windows-1251");
  } catch {
    cp1251 = null;
  }
  const decodeByte = (b: number) =>
    cp1251 ? cp1251.decode(new Uint8Array([b])) : String.fromCharCode(b);

  type State = { uc: number; skip: boolean };
  const stack: State[] = [];
  let state: State = { uc: 1, skip: false };
  let pendingSkip = 0; // fallback chars to skip after \uN
  let out = "";
  const emit = (s: string) => {
    if (!state.skip) out += s;
  };

  const n = rtf.length;
  let i = 0;
  let groupStart = false; // just after '{'

  while (i < n) {
    const ch = rtf[i];

    if (ch === "{") {
      stack.push({ ...state });
      groupStart = true;
      i++;
      continue;
    }
    if (ch === "}") {
      state = stack.pop() ?? { uc: 1, skip: false };
      groupStart = false;
      i++;
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      i++;
      continue;
    }

    if (ch === "\\") {
      const next = rtf[i + 1];
      const wasGroupStart = groupStart;
      groupStart = false;

      if (next === "\\" || next === "{" || next === "}") {
        if (pendingSkip > 0) pendingSkip--;
        else emit(next);
        i += 2;
        continue;
      }
      if (next === "*") {
        if (wasGroupStart) state.skip = true;
        i += 2;
        continue;
      }
      if (next === "'") {
        const hex = rtf.substr(i + 2, 2);
        const byte = parseInt(hex, 16);
        i += 4;
        if (pendingSkip > 0) {
          pendingSkip--;
        } else if (!Number.isNaN(byte)) {
          emit(decodeByte(byte));
        }
        continue;
      }
      if (next === "~") {
        emit("\u00a0");
        i += 2;
        continue;
      }
      if (next === "-" || next === "_") {
        emit(next === "_" ? "-" : "");
        i += 2;
        continue;
      }
      if (next && /[a-zA-Z]/.test(next)) {
        let j = i + 1;
        while (j < n && /[a-zA-Z]/.test(rtf[j])) j++;
        const word = rtf.slice(i + 1, j);
        let param: number | null = null;
        const m = /^-?\d+/.exec(rtf.slice(j, j + 12));
        if (m) {
          param = parseInt(m[0], 10);
          j += m[0].length;
        }
        if (rtf[j] === " ") j++; // delimiter space
        i = j;

        if (wasGroupStart && RTF_SKIP_DESTINATIONS.has(word)) {
          state.skip = true;
          continue;
        }

        switch (word) {
          case "uc":
            state.uc = param ?? 1;
            break;
          case "u": {
            if (param !== null) {
              let code = param;
              if (code < 0) code += 65536;
              emit(String.fromCharCode(code));
              pendingSkip = state.uc;
            }
            break;
          }
          case "par":
          case "line":
          case "sect":
          case "page":
            emit("\n");
            break;
          case "tab":
            emit("    ");
            break;
          case "cell":
          case "nestcell":
            emit(" | ");
            break;
          case "row":
          case "nestrow":
            emit("\n");
            break;
          case "emdash":
            emit("—");
            break;
          case "endash":
            emit("–");
            break;
          case "lquote":
            emit("‘");
            break;
          case "rquote":
            emit("’");
            break;
          case "ldblquote":
            emit("“");
            break;
          case "rdblquote":
            emit("”");
            break;
          case "bullet":
            emit("•");
            break;
          default:
            break;
        }
        continue;
      }

      // unknown escaped symbol
      i += 2;
      continue;
    }

    // plain character
    groupStart = false;
    if (pendingSkip > 0) {
      pendingSkip--;
    } else {
      emit(ch);
    }
    i++;
  }

  return out
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, "").replace(/(?:\s*\|\s*)+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function loadRtfContent(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  let raw = "";
  try {
    raw = new TextDecoder("windows-1251").decode(buffer);
  } catch {
    raw = new TextDecoder("utf-8").decode(buffer);
  }

  return parseRtfToPlainText(raw);
}

const RtfViewer: React.FC<{
  url: string;
  name?: string | null;
  onDownload?: () => void | Promise<void>;
}> = ({ url, name, onDownload }) => {
  const [content, setContent] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    loadRtfContent(url)
      .then((txt) => {
        if (cancelled) return;
        if (txt && txt.trim().length > 0) {
          setContent(txt);
        } else {
          setError(true);
        }
      })
      .catch((e) => {
        console.warn("Could not preview RTF:", e);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex size-full flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Зареждане и декодиране на съдийския протокол...
        </p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex size-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
          <FileCode className="size-10 text-blue-500" />
        </div>
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          {name || "RTF Документ"}
        </h3>
        <p className="mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
          Документът е в Rich Text Format (RTF). Можете да го свалите директно и
          да го отворите с Microsoft Word или WordPad.
        </p>
        <Button asChild className="mt-4 gap-2 rounded-xl">
          <a
            href={url}
            download={name || "protocol.rtf"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onDownload?.()}
          >
            <Download className="size-4" />
            Изтегли RTF файла
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <div className="shrink-0 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-2.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex items-center gap-2">
          <FileCode className="size-4 text-blue-600" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Официален съдийски протокол от срещите (RTF)
          </span>
        </div>
        <a
          href={url}
          download={name || "protocol.rtf"}
          onClick={() => onDownload?.()}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
        >
          <Download className="size-3.5" />
          Свали оригинала (.RTF)
        </a>
      </div>
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

const DocxContentRenderer: React.FC<{ blocks: DocxBlock[] }> = ({ blocks }) => {
  return (
    <div className="space-y-3 font-sans text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
      {blocks.map((block, bIdx) => {
        if (block.type === "paragraph") {
          const hasText = block.runs.some((r) => r.text.trim().length > 0);
          if (!hasText && block.runs.length <= 1) {
            return <div key={bIdx} className="h-2" />;
          }

          let alignClass = "text-left";
          if (block.align === "center") alignClass = "text-center";
          else if (block.align === "right") alignClass = "text-right";
          else if (block.align === "justify") alignClass = "text-justify";

          const headingClass = block.isHeading
            ? block.headingLevel === 1
              ? "text-base sm:text-lg font-bold text-zinc-950 dark:text-white pt-2 pb-1"
              : "text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 pt-1.5 pb-0.5"
            : "";

          return (
            <p key={bIdx} className={`${alignClass} ${headingClass}`.trim()}>
              {block.runs.map((run, rIdx) => {
                if (run.isBreak) {
                  return <br key={rIdx} />;
                }
                const classes = [
                  run.bold ? "font-bold" : "",
                  run.italic ? "italic" : "",
                  run.underline ? "underline underline-offset-2" : "",
                  run.strike ? "line-through" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <span key={rIdx} className={classes || undefined}>
                    {run.text}
                  </span>
                );
              })}
            </p>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={bIdx}
              className="my-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <tbody>
                  {block.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={
                        rowIdx === 0
                          ? "bg-zinc-50 font-semibold dark:bg-zinc-800"
                          : "border-t border-zinc-200 dark:border-zinc-800"
                      }
                    >
                      {row.cells.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="border-r last:border-r-0 border-zinc-200 p-2 sm:p-2.5 dark:border-zinc-800 align-top"
                        >
                          <DocxContentRenderer blocks={cell.paragraphs} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

const DocxViewer: React.FC<{
  url: string;
  name?: string | null;
  onDownload?: () => void | Promise<void>;
  onSwitchToExternalViewer?: () => void;
}> = ({ url, name, onDownload, onSwitchToExternalViewer }) => {
  const [blocks, setBlocks] = React.useState<DocxBlock[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Неуспешно изтегляне на файла`);
        }
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          throw new Error("Сървърът върна HTML страница вместо документ.");
        }
        return res.arrayBuffer();
      })
      .then((buf) => loadDocxFromBuffer(buf))
      .then((parsed) => {
        if (cancelled) return;
        if (parsed && parsed.length > 0) {
          setBlocks(parsed);
        } else {
          setErrorMessage("Документът е празен или няма четими параграфи.");
        }
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof Error
            ? e.message
            : "Неуспешно разчитане на Word документа.";
        console.warn("Docx preview fallback:", msg);
        if (!cancelled) setErrorMessage(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex size-full flex-col items-center justify-center p-8 text-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Зареждане и визуализиране на Word документа...
        </p>
      </div>
    );
  }

  if (errorMessage || !blocks) {
    return (
      <div className="flex size-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
          <FileCode className="size-10 text-blue-500" />
        </div>
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          {name || "Word Документ"}
        </h3>
        <p className="mt-1 max-w-md text-xs text-zinc-500 dark:text-zinc-400">
          {errorMessage ||
            "Документът не можа да се визуализира локално. Можете да го отворите през онлайн четец или да го свалите директно."}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onSwitchToExternalViewer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToExternalViewer}
              className="gap-2 rounded-xl text-xs"
            >
              <ExternalLink className="size-3.5" />
              Отвори през онлайн четец
            </Button>
          )}
          <Button asChild size="sm" className="gap-2 rounded-xl text-xs">
            <a
              href={url}
              download={name || "document.docx"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onDownload?.()}
            >
              <Download className="size-3.5" />
              Изтегли файла
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex items-center gap-2">
          <FileCode className="size-4 text-blue-600" />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {name || "Word Документ (.docx)"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onSwitchToExternalViewer && (
            <button
              type="button"
              onClick={onSwitchToExternalViewer}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 cursor-pointer"
            >
              <ExternalLink className="size-3.5" />
              Външен четец (Google / Office)
            </button>
          )}
          <a
            href={url}
            download={name || "document.docx"}
            onClick={() => onDownload?.()}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
          >
            <Download className="size-3.5" />
            Свали оригинала (.docx)
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl min-h-125 rounded-xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <DocxContentRenderer blocks={blocks} />
        </div>
      </div>
    </div>
  );
};

interface ViewerBodyProps {
  isPdf: boolean;
  isDocx: boolean;
  isOffice: boolean;
  isRtf: boolean;
  isImage: boolean;
  isGoogleDrive: boolean;
  googleDrivePreviewUrl: string;
  documentUrl: string | null;
  documentName?: string | null;
  documentType?: DocumentAttachmentType | null;
  officeViewerUrl: string;
  googleViewerUrl: string;
  isLegacyBinary?: boolean;
  isLocalUrl?: boolean;
  onDownload?: () => void | Promise<void>;
}

const DocumentViewerBody: React.FC<ViewerBodyProps> = ({
  isPdf,
  isDocx,
  isOffice,
  isRtf,
  isImage,
  isGoogleDrive,
  googleDrivePreviewUrl,
  documentUrl,
  documentName,
  documentType,
  officeViewerUrl,
  googleViewerUrl,
  isLegacyBinary: _isLegacyBinary = false,
  isLocalUrl = false,
  onDownload,
}) => {
  const [activeViewer, setActiveViewer] = useState<"office" | "google">(
    "google"
  );
  const [showDocxExternal, setShowDocxExternal] = useState(false);

  if (!documentUrl) return null;

  if (isDocx && !showDocxExternal) {
    return (
      <DocxViewer
        url={documentUrl}
        name={documentName}
        onDownload={onDownload}
        onSwitchToExternalViewer={() => setShowDocxExternal(true)}
      />
    );
  }

  if (isRtf) {
    return (
      <RtfViewer
        url={documentUrl}
        name={documentName}
        onDownload={onDownload}
      />
    );
  }

  if (isImage) {
    return (
      <div className="flex size-full items-center justify-center overflow-auto bg-zinc-950/95 p-6">
        <div className="relative flex max-h-full max-w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={documentUrl}
            alt={documentName || "Преглед на изображение"}
            className="max-h-[78vh] w-auto max-w-full rounded-2xl border border-white/10 object-contain shadow-2xl"
          />
        </div>
      </div>
    );
  }

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

  if (isOffice || (isDocx && showDocxExternal)) {
    if (isLocalUrl) {
      return (
        <div className="flex size-full flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-zinc-900/50">
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
            {getDocumentIcon(documentType, "size-10")}
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {documentName}
          </h3>
          <p className="mt-2 max-w-md text-xs text-zinc-600 dark:text-zinc-400">
            Документът е на локален адрес (localhost). Облачните визуализатори
            на Microsoft и Google нямат достъп до локалния ви компютър и не
            могат да го отворят директно през външен iframe.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href={documentUrl}
              download={documentName || "document"}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={() => onDownload?.()}
            >
              ⬇️ Свали и отвори документа
            </a>
          </div>
        </div>
      );
    }
    const currentIframeSrc =
      activeViewer === "google" ? googleViewerUrl : officeViewerUrl;
    const currentViewerName =
      activeViewer === "google" ? "Google Docs Viewer" : "Office Online Viewer";
    const otherViewerName =
      activeViewer === "google" ? "Office Online Viewer" : "Google Docs Viewer";

    return (
      <div className="flex size-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-amber-50/90 px-4 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <span>
            Визуализация през <strong>{currentViewerName}</strong>. Ако
            документът не се зарежда:
          </span>
          <div className="flex items-center gap-3">
            {isDocx && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDocxExternal(false)}
                  className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                >
                  📄 Върни се към вградения преглед
                </button>
                <span>•</span>
              </>
            )}
            <button
              type="button"
              onClick={() =>
                setActiveViewer(activeViewer === "google" ? "office" : "google")
              }
              className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
            >
              🔄 Превключи към {otherViewerName}
            </button>
            <span>•</span>
            <a
              href={documentUrl}
              download={documentName || "document"}
              className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
              onClick={() => onDownload?.()}
            >
              ⬇️ Свали файла
            </a>
          </div>
        </div>
        <iframe
          src={currentIframeSrc}
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
          onClick={() => onDownload?.()}
        >
          <Download className="size-4" />
          Изтегли файла
        </a>
      </Button>
    </div>
  );
};

function parseDocumentViewerData(
  documentUrl: string,
  documentName?: string | null,
  documentType?: DocumentAttachmentType | null
) {
  const getAbsoluteUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return `https://bkgalabovo2025.vercel.app${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const absoluteDocUrl = getAbsoluteUrl(documentUrl);

  const driveMatch = documentUrl.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/
  );
  const isGoogleDrive = Boolean(driveMatch && driveMatch[1]);
  const googleDrivePreviewUrl = isGoogleDrive
    ? `https://drive.google.com/file/d/${driveMatch?.[1]}/preview`
    : "";

  const isRtf =
    !isGoogleDrive &&
    (/\.rtf(\?.*)?$/i.test(documentUrl) || /\.rtf$/i.test(documentName || ""));

  const isDocx =
    !isGoogleDrive &&
    !isRtf &&
    (/\.docx(\?.*)?$/i.test(documentUrl) ||
      /\.docx$/i.test(documentName || ""));

  const isPdf =
    !isGoogleDrive &&
    (documentType === "pdf" ||
      /\.pdf(\?.*)?$/i.test(documentUrl) ||
      /\.pdf$/i.test(documentName || ""));

  const isOffice =
    !isGoogleDrive &&
    !isRtf &&
    !isPdf &&
    !isDocx &&
    (documentType === "word" ||
      documentType === "excel" ||
      /\.(docx?|xlsx?|pptx?)$/i.test(documentName || "") ||
      /\.(docx?|xlsx?|pptx?)(\?.*)?$/i.test(documentUrl));

  const isImage =
    !isGoogleDrive &&
    !isRtf &&
    !isPdf &&
    !isDocx &&
    !isOffice &&
    !/\.(rtf|docx?|xlsx?|pptx?|pdf|txt|csv|zip|rar)$/i.test(
      documentName || ""
    ) &&
    !/\.(rtf|docx?|xlsx?|pptx?|pdf|txt|csv|zip|rar)(\?.*)?$/i.test(
      documentUrl
    ) &&
    (documentType === "image" ||
      /\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(documentUrl) ||
      /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(documentName || "") ||
      documentUrl.startsWith("data:image/"));

  let effectiveType: DocumentAttachmentType = "other";
  if (documentType) {
    effectiveType = documentType;
  } else if (isImage) {
    effectiveType = "image";
  } else if (isPdf) {
    effectiveType = "pdf";
  } else if (isDocx || isOffice || isRtf) {
    effectiveType = "word";
  }

  const isLegacyBinary =
    !isGoogleDrive &&
    (/\.(xls|doc|ppt)(\?.*)?$/i.test(documentUrl) ||
      /\.(xls|doc|ppt)$/i.test(documentName || ""));

  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    absoluteDocUrl
  )}`;

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    absoluteDocUrl
  )}&embedded=true`;

  const isLocalUrl =
    typeof window !== "undefined"
      ? window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        absoluteDocUrl.includes("localhost") ||
        absoluteDocUrl.includes("127.0.0.1")
      : false;

  return {
    isGoogleDrive,
    googleDrivePreviewUrl,
    isImage,
    isPdf,
    isDocx,
    isOffice,
    isRtf,
    isLegacyBinary,
    isLocalUrl,
    effectiveType,
    officeViewerUrl,
    googleViewerUrl,
  };
}

export const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentName = "Документ",
  documentType,
  subtitle,
  onDownload,
}) => {
  if (!documentUrl) return null;

  const {
    isGoogleDrive,
    googleDrivePreviewUrl,
    isImage,
    isPdf,
    isDocx,
    isOffice,
    isRtf,
    isLegacyBinary,
    isLocalUrl,
    effectiveType,
    officeViewerUrl,
    googleViewerUrl,
  } = parseDocumentViewerData(documentUrl, documentName, documentType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[94dvh] sm:max-h-[90vh] h-[90vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <DialogHeader className="p-0 max-w-[55%] sm:max-w-[70%]">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="rounded-xl bg-white p-1.5 sm:p-2 shadow-xs dark:bg-zinc-800 shrink-0">
                {getDocumentIcon(effectiveType, "size-4 sm:size-5")}
              </div>
              <div className="text-left min-w-0">
                <DialogTitle className="truncate text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {documentName ||
                    (isImage
                      ? "Преглед на изображение"
                      : "Преглед на наредба / документ")}
                </DialogTitle>
                <p className="truncate text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  {getDocumentTypeBadge(effectiveType)}
                  {subtitle ? ` • ${subtitle}` : ""}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Action toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 mr-8 sm:mr-10">
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
                onClick={() => onDownload?.()}
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
            isDocx={isDocx}
            isOffice={isOffice}
            isRtf={isRtf}
            isImage={isImage}
            isGoogleDrive={isGoogleDrive}
            googleDrivePreviewUrl={googleDrivePreviewUrl}
            documentUrl={documentUrl}
            documentName={documentName}
            documentType={effectiveType}
            officeViewerUrl={officeViewerUrl}
            googleViewerUrl={googleViewerUrl}
            isLegacyBinary={isLegacyBinary}
            isLocalUrl={isLocalUrl}
            onDownload={onDownload}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
