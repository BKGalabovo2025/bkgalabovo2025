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
      <DialogContent className="max-w-lg w-full rounded-3xl border-zinc-100 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center">
              <PenLine className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-xl font-light text-zinc-950 tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <p className="text-sm font-light text-zinc-400 ml-13">
            {description}
          </p>
        </DialogHeader>

        {/* Canvas Area */}
        <div className="mx-6 mb-2">
          <div className="relative rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 overflow-hidden">
            {/* Guiding line */}
            <div className="absolute bottom-10 left-8 right-8 h-px bg-zinc-200 pointer-events-none" />
            <p className="absolute bottom-3 left-8 text-[10px] font-medium uppercase tracking-widest text-zinc-300 pointer-events-none select-none">
              Подпис
            </p>

            <canvas
              ref={canvasRef}
              width={560}
              height={200}
              className="w-full h-[180px] cursor-crosshair touch-none block touch-none"
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
            <p className="text-center text-xs text-zinc-300 mt-3 font-light">
              Начертайте подписа с мишката или пръст (на мобилен)
            </p>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={clearCanvas}
            disabled={!hasSignature || isSaving}
            className="flex-1 sm:flex-none h-11 rounded-xl border-zinc-200 text-zinc-500 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 transition-all font-medium text-[10px] uppercase tracking-widest"
          >
            <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Изчисти
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 sm:flex-none h-11 rounded-xl border-zinc-200 text-zinc-500 font-medium text-[10px] uppercase tracking-widest"
          >
            Отказ
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasSignature || isSaving}
            className="flex-1 h-11 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-all font-medium text-[10px] uppercase tracking-widest shadow-none"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Запазване...
              </>
            ) : (
              <>
                <CheckCheck className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Запази подписа
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
