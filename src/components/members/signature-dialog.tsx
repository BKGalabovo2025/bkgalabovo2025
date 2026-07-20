"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, PenLine, Trash2, CheckCheck } from "lucide-react";

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
    const ctx = canvas.getContext("2d");
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
      const ctx = canvas.getContext("2d");
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
      const ctx = canvas.getContext("2d");
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
      <DialogContent className="w-full max-w-lg overflow-hidden rounded-3xl border-zinc-100 p-0 shadow-2xl">
        <DialogHeader className="px-8 pt-8 pb-4">
          <div className="mb-1 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950">
              <PenLine className="size-5 text-white" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-xl font-light tracking-tight text-zinc-950">
              {title}
            </DialogTitle>
          </div>
          <p className="ml-13 text-sm font-light text-zinc-400">
            {description}
          </p>
        </DialogHeader>

        {/* Canvas Area */}
        <div className="mx-6 mb-2">
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50">
            {/* Guiding line */}
            <div className="pointer-events-none absolute inset-x-8 bottom-10 h-px bg-zinc-200" />
            <p className="pointer-events-none absolute bottom-3 left-8 text-[10px] font-medium tracking-widest text-zinc-300 uppercase select-none">
              Подпис
            </p>

            <canvas
              ref={canvasRef}
              width={560}
              height={200}
              className="block h-45 w-full cursor-crosshair touch-none touch-none"
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
            <p className="mt-3 text-center text-xs font-light text-zinc-300">
              Начертайте подписа с мишката или пръст (на мобилен)
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 px-6 pb-6 sm:flex-row sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={clearCanvas}
            disabled={!hasSignature || isSaving}
            className="h-11 flex-1 rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-500 uppercase transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 sm:flex-none"
          >
            <Trash2 className="mr-2 size-4" strokeWidth={1.5} />
            Изчисти
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="h-11 flex-1 rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-500 uppercase sm:flex-none"
          >
            Отказ
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasSignature || isSaving}
            className="h-11 flex-1 rounded-xl bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Запазване...
              </>
            ) : (
              <>
                <CheckCheck className="mr-2 size-4" strokeWidth={1.5} />
                Запази подписа
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
