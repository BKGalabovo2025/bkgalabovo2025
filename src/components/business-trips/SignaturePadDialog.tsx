"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SignaturePadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave: (base64Image: string) => void;
}

export function SignaturePadDialog({
  open,
  onOpenChange,
  title,
  onSave,
}: SignaturePadDialogProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setError(null);
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError("Моля, положете подпис преди да запазите.");
      return;
    }
    const dataURL = sigCanvas.current
      ?.getTrimmedCanvas()
      .toDataURL("image/png");
    if (dataURL) {
      onSave(dataURL);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 p-4 sm:p-5 pr-12 dark:border-zinc-800 dark:bg-zinc-900/40">
          <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-zinc-500">
            Моля, подпишете се в полето по-долу, използвайки мишката или
            пръст/писалка на мобилно устройство.
          </DialogDescription>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 min-h-0">
          <div className="relative touch-none overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
            <SignatureCanvas
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={sigCanvas as any}
              penColor="black"
              canvasProps={{
                className: "w-full h-48 cursor-crosshair",
              }}
            />
          </div>
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Изчисти
            </Button>
            <div className="text-xs text-zinc-400">
              След запазване, можете да изчистите подписа от менюто.
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button onClick={handleSave}>Запази Подписа</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
