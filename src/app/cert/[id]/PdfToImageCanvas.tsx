/* eslint-disable react/forbid-dom-props, @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PdfToImageCanvasProps {
  fileUrl: string;
  fallbackAspect?: number;
}

function loadLocalPdfJs(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is undefined"));
  }
  const win = window as any;
  if (win.pdfjsLib) {
    return Promise.resolve(win.pdfjsLib);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("local-pdfjs-script");
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
    script.id = "local-pdfjs-script";
    script.src = "/vendor/pdfjs/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib?.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
      }
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function PdfToImageCanvas({
  fileUrl,
  fallbackAspect = 1260 / 708,
}: PdfToImageCanvasProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(false);

    async function convertPdfToImage() {
      try {
        const pdfjs = await loadLocalPdfJs();

        // Fetch buffer to avoid any cross-origin or streaming issues
        const res = await fetch(fileUrl);
        const arrayBuffer = await res.arrayBuffer();

        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // High resolution scale for retina screens
        const viewport = page.getViewport({ scale: 2.5 });

        if (isCancelled) return;

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not acquire canvas context");
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        if (isCancelled) return;

        const pngUrl = canvas.toDataURL("image/png");
        setDataUrl(pngUrl);
        setLoading(false);
      } catch (err) {
        console.error("Грешка при конвертиране на PDF към изображение:", err);
        if (!isCancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    convertPdfToImage();

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
    // If canvas fails, render iframe without black letterbox as fallback
    return (
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title="Официален клубен ваучер"
        className="block w-full border-0 bg-white"
        style={{
          aspectRatio: `${fallbackAspect}`,
          width: "100%",
        }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Официален клубен ваучер"
      className="block h-auto w-full object-contain"
    />
  );
}
