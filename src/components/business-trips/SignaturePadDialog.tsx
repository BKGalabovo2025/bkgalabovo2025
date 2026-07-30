"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Моля, подпишете се в полето по-долу, използвайки мишката или
            пръст/писалка на мобилно устройство.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
              След запазване, подписът не може да се редактира
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отказ
          </Button>
          <Button onClick={handleSave}>Запази Подписа</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
