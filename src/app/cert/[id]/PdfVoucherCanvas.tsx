/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PdfVoucherCanvasProps {
  fileUrl: string;
  fileName?: string;
}

function loadPdfJsScript(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is undefined"));
  }
  const win = window as any;
  if (win.pdfjsLib) {
    return Promise.resolve(win.pdfjsLib);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("pdfjs-browser-cdn-script");
    if (existing) {
      if (win.pdfjsLib) {
        resolve(win.pdfjsLib);
      } else {
        existing.addEventListener("load", () =>
          resolve((window as any).pdfjsLib)
        );
        existing.addEventListener("error", reject);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "pdfjs-browser-cdn-script";
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function PdfVoucherCanvas({ fileUrl, fileName }: PdfVoucherCanvasProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(false);

    async function renderFirstPage() {
      try {
        const pdfjs = await loadPdfJsScript();

        const loadingTask = pdfjs.getDocument({
          url: fileUrl,
          cMapUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // Scale 2.5 for crystal-clear retina rendering & printing
        const viewport = page.getViewport({ scale: 2.5 });

        if (isCancelled) return;

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not acquire canvas 2D rendering context");
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        if (isCancelled) return;

        const generatedDataUrl = canvas.toDataURL("image/png");
        setDataUrl(generatedDataUrl);
        setLoading(false);
      } catch (err) {
        console.error("Грешка при визуализиране на PDF ваучер:", err);
        if (!isCancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    renderFirstPage();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-50/70 p-8 dark:bg-zinc-900/50">
        <Loader2 className="size-8 animate-spin text-amber-500" />
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Зареждане на ваучера в кристално качество...
        </span>
      </div>
    );
  }

  if (error || !dataUrl) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <FileText className="size-10 text-red-400" />
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          {fileName || "Ваучер за подарък.pdf"}
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          download={fileName || "voucher.pdf"}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Download className="size-3.5" />
          Отвори / Свали оригинален файл
        </a>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Официален клубен ваучер"
      className="block h-auto w-full rounded-2xl object-contain shadow-xs"
    />
  );
}
