"use client";

import {
  Camera,
  CheckCircle2,
  Flashlight,
  FlashlightOff,
  FlipHorizontal,
  Loader2,
  QrCode,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ParsedExpenseData,
  parseNraQrCode,
} from "@/lib/expense-document-parser";

interface DocumentCameraScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File, parsedData?: ParsedExpenseData | null) => void;
}

export function DocumentCameraScannerDialog({
  open,
  onOpenChange,
  onCapture,
}: DocumentCameraScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningTimerRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedQr, setDetectedQr] = useState<ParsedExpenseData | null>(null);

  // Спира стрийма на камерата и таймерите
  const stopStream = () => {
    if (scanningTimerRef.current) {
      window.clearInterval(scanningTimerRef.current);
      scanningTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setHasTorch(false);
  };

  // Стартира стрийма на камерата
  const startCamera = async () => {
    stopStream();
    setErrorMessage(null);
    setDetectedQr(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setHasCamera(false);
      setErrorMessage(
        "Браузърът или устройството не поддържа достъп до камера."
      );
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Проверка за фенерче / светкавица
      const track = stream.getVideoTracks()[0];
      if (track) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = (track.getCapabilities?.() || {}) as any;
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }

      setHasCamera(true);
      startQrScanningLoop();
    } catch (err: unknown) {
      console.warn("Camera start error:", err);
      setHasCamera(false);
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Достъпът до камерата бе отказан. Моля, разрешете камерата от настройките на браузъра."
          : "Не бе открита активна камера или тя се използва от друго приложение.";
      setErrorMessage(msg);
    }
  };

  // Цикъл за сканиране на QR код в реално време през BarcodeDetector
  const startQrScanningLoop = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== "undefined" ? (window as any) : {};
    if (!win.BarcodeDetector) {
      // BarcodeDetector не се поддържа от браузъра — потребителят може да заснеме с бутона
      return;
    }

    try {
      const detector = new win.BarcodeDetector({ formats: ["qr_code"] });

      scanningTimerRef.current = window.setInterval(async () => {
        if (
          !videoRef.current ||
          videoRef.current.readyState < 2 ||
          isProcessing
        ) {
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const qrRawValue = barcodes[0].rawValue;
            if (qrRawValue) {
              const parsed = parseNraQrCode(qrRawValue);
              if (parsed && (parsed.amountBGN || parsed.documentNumber)) {
                // Открит е валиден НАП фискален QR код!
                setDetectedQr(parsed);
                triggerVibration();
                // Автоматично заснемане на кадъра
                await captureFrame(parsed);
              }
            }
          }
        } catch {
          // Игнорираме единични грешки в кадъра
        }
      }, 350);
    } catch {
      // Игнорираме грешка при инициализация
    }
  };

  const triggerVibration = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {
        // Игнорираме
      }
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [
            { torch: nextState } as unknown as MediaTrackConstraintSet,
          ],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn("Torch error:", e);
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Заснемане на кадър от видео потока
  const captureFrame = async (parsedData?: ParsedExpenseData | null) => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("Неуспешно създаване на изображение");

      const filename = `scan-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;
      const file = new File([blob], filename, { type: "image/jpeg" });

      if (parsedData?.amountBGN) {
        toast.success(
          `✨ НАП QR: Номер ${parsedData.documentNumber || "—"}, Сума ${parsedData.amountBGN.toFixed(2)} лв.`
        );
      } else {
        toast.info("Снимката е заснета! Започва интелигентно разпознаване...");
      }

      stopStream();
      onCapture(file, parsedData);
      onOpenChange(false);
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Възникна грешка при заснемане.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-[calc(100%-1.5rem)] sm:max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-white shadow-2xl">
        <DialogHeader className="shrink-0 flex flex-row items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Camera className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-white sm:text-base">
                Сканиране на документ / касова бележка
              </DialogTitle>
              <DialogDescription className="text-[11px] text-zinc-400">
                Насочете камерата към документа или QR кода на бележката
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 text-zinc-400 hover:text-white"
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        {/* Зона на видео визьора */}
        <div className="relative flex min-h-85 sm:min-h-105 w-full flex-1 items-center justify-center overflow-hidden bg-black">
          {hasCamera && !errorMessage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-cover"
              />

              {/* Рамка на визьора */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 sm:p-10">
                <div className="relative aspect-3/4 sm:aspect-4/3 w-full max-w-85 rounded-2xl border-2 border-emerald-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* Ъглови маркери */}
                  <span className="absolute -top-1 -left-1 size-4 rounded-tl-lg border-t-4 border-l-4 border-emerald-400" />
                  <span className="absolute -top-1 -right-1 size-4 rounded-tr-lg border-t-4 border-r-4 border-emerald-400" />
                  <span className="absolute -bottom-1 -left-1 size-4 rounded-bl-lg border-b-4 border-l-4 border-emerald-400" />
                  <span className="absolute -bottom-1 -right-1 size-4 rounded-br-lg border-b-4 border-r-4 border-emerald-400" />

                  {/* Лазерна линия за сканиране */}
                  <div className="absolute inset-x-2 top-0 h-0.5 animate-[bounce_2.5s_infinite] bg-linear-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399]" />

                  {/* Информационна табелка във визьора */}
                  <div className="absolute inset-x-0 bottom-3 flex justify-center px-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
                      <QrCode className="size-3.5 text-emerald-400" />
                      Автоматично разпознаване на НАП QR код
                    </span>
                  </div>
                </div>
              </div>

              {/* Индикатор за открит QR */}
              {detectedQr && (
                <div className="absolute top-4 inset-x-4 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-600/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-200" />
                    <span>
                      Разпознат бон:{" "}
                      {detectedQr.amountBGN
                        ? `${detectedQr.amountBGN.toFixed(2)} лв.`
                        : ""}{" "}
                      (№ {detectedQr.documentNumber || "—"})
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <Camera className="mb-3 size-12 text-zinc-600" />
              <p className="max-w-xs text-xs text-zinc-300">
                {errorMessage || "Няма достъп до камера."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="mt-4 border-zinc-700 bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white"
              >
                Опитай отново
              </Button>
            </div>
          )}
        </div>

        {/* Контролен панел */}
        <div className="shrink-0 flex items-center justify-between border-t border-zinc-800 bg-zinc-900/90 px-6 py-4">
          {/* Бутон за фенерче */}
          <div className="w-12">
            {hasTorch && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleTorch}
                className="rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white"
                title="Включи / изключи осветление"
              >
                {torchOn ? (
                  <Flashlight className="size-5 text-amber-400" />
                ) : (
                  <FlashlightOff className="size-5" />
                )}
              </Button>
            )}
          </div>

          {/* Главен бутон за снимане */}
          <Button
            type="button"
            disabled={!hasCamera || isProcessing}
            onClick={() => captureFrame(detectedQr)}
            className="flex size-14 items-center justify-center rounded-full bg-emerald-600 p-0 text-white shadow-lg ring-4 ring-emerald-500/30 transition-transform active:scale-95 hover:bg-emerald-500 disabled:opacity-50"
            title="Снимай документа"
          >
            {isProcessing ? (
              <Loader2 className="size-6 animate-spin text-white" />
            ) : (
              <Camera className="size-6" />
            )}
          </Button>

          {/* Бутон за смяна на камерата (предна/задна) */}
          <div className="w-12 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleFacingMode}
              className="rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white"
              title="Смени камерата"
            >
              <FlipHorizontal className="size-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
