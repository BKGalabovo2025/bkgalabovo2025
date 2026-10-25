"use client";

import { CheckCheck, Loader2, PenLine, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureFile: File) => Promise<void>;
  title?: string;
  description?: string;
}

export const SignatureDialog = ({
  open,
  onClose,
  onSave,
  title = "Електронен подпис",
  description = "Начертайте вашия подпис в полето по-долу.",
}: SignatureDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Reset canvas when dialog opens
  useEffect(() => {
    if (open) {
      clearCanvas();
    }
  }, [open]);

  const getCanvasPoint = (
    canvas: HTMLCanvasElement,
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(canvas, e);
      lastPoint.current = point;
      setIsDrawing(true);
      setHasSignature(true);

      // Draw a dot for single click
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
    },
    []
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const point = getCanvasPoint(canvas, e);
      const prev = lastPoint.current;

      if (prev) {
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      lastPoint.current = point;
    },
    [isDrawing]
  );

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    setIsSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Не може да се генерира изображение"));
        }, "image/png");
      });

      const file = new File([blob], `signature_${Date.now()}.png`, {
        type: "image/png",
      });
      await onSave(file);
      onClose();
    } catch (err) {
      console.error("Signature save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSaving) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-zinc-800">
              <PenLine className="size-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                {title}
              </DialogTitle>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 space-y-2.5 min-h-0">
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/40">
            {/* Guiding line */}
            <div className="pointer-events-none absolute inset-x-8 bottom-10 h-px bg-zinc-200 dark:bg-zinc-700" />
            <p className="pointer-events-none absolute bottom-3 left-8 text-[10px] font-medium tracking-widest text-zinc-400 uppercase select-none">
              Подпис
            </p>

            <canvas
              ref={canvasRef}
              width={560}
              height={200}
              className="block h-45 w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          {!hasSignature && (
            <p className="text-center text-xs text-zinc-400">
              Начертайте подписа с мишката или пръст (на мобилен)
            </p>
          )}
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="ghost"
            onClick={clearCanvas}
            disabled={!hasSignature || isSaving}
            className="h-9 rounded-xl px-3.5 text-xs font-bold text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
          >
            <Trash2 className="mr-1.5 size-3.5" strokeWidth={1.5} />
            Изчисти
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Отказ
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasSignature || isSaving}
              className="h-9 rounded-xl bg-zinc-950 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <CheckCheck className="mr-1.5 size-3.5" strokeWidth={1.5} />
                  Запази подписа
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
