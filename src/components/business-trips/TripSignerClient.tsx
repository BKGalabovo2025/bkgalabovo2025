"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileCheck2,
  MapPin,
  RefreshCw,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { submitPublicTripSignatureAction } from "@/lib/actions/trip-signatures";
import type { PublicTripSignDataDTO } from "@/types/business-trip.types";

interface TripSignerClientProps {
  initialData: PublicTripSignDataDTO;
}

export function TripSignerClient({ initialData }: TripSignerClientProps) {
  const [data, setData] = useState<PublicTripSignDataDTO>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResigning, setIsResigning] = useState(false);
  const [canvasEmpty, setCanvasEmpty] = useState(true);

  const sigCanvas = useRef<SignatureCanvas>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleClear = () => {
    sigCanvas.current?.clear();
    setCanvasEmpty(true);
  };

  const handleBeginStroke = () => {
    setCanvasEmpty(false);
  };

  const handleSubmit = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error("Моля, положете вашия подпис преди потвърждение.");
      return;
    }

    try {
      setIsSubmitting(true);
      const signatureBase64 = sigCanvas.current
        .getTrimmedCanvas()
        .toDataURL("image/png");

      const res = await submitPublicTripSignatureAction({
        token: data.token,
        signatureBase64,
      });

      if (res.success) {
        toast.success(res.message || "Подписът е записан успешно!");
        setData((prev) => ({
          ...prev,
          existingSignature: signatureBase64,
        }));
        setIsSuccess(true);
        setIsResigning(false);
      } else {
        toast.error(res.error || "Грешка при записване на подписа.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Възникна непредвидена грешка при изпращането.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasExistingSig = Boolean(data.existingSignature) && !isResigning;

  return (
    <main
      id="main-content"
      className="min-h-screen bg-linear-to-b from-slate-50 via-zinc-100 to-slate-200 py-6 px-3 sm:px-6 flex items-center justify-center text-zinc-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 dark:text-zinc-100"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-zinc-200/90 overflow-hidden transition-all dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header with Club Branding */}
        <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 sm:p-7 text-white text-center relative">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-inner">
            <Image
              src="/icons/LOGO.jpg"
              alt="БК Гълъбово"
              width={56}
              height={56}
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <span className="inline-block px-3 py-0.5 mb-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
            Финансова Ведомост за Командировка
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {data.tripTitle}
          </h1>
          <p className="mt-1 text-xs text-blue-200/90">
            СНЦ &bdquo;Бадминтон клуб Гълъбово&ldquo;
          </p>
        </div>

        {/* Content Box */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Trip Meta details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
              <User className="size-4 text-blue-600 shrink-0 dark:text-blue-400" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                  Състезател / Участник
                </span>
                <span className="font-bold text-zinc-900 text-sm dark:text-zinc-100">
                  {data.memberName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
              <MapPin className="size-4 text-emerald-600 shrink-0 dark:text-emerald-400" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                  Дестинация
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {data.destination || "По заповед"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
              <Calendar className="size-4 text-amber-600 shrink-0 dark:text-amber-400" />
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                  Период
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatDate(data.startDate)} – {formatDate(data.endDate)}
                </span>
              </div>
            </div>

            {data.coachName && (
              <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                <FileCheck2 className="size-4 text-indigo-600 shrink-0 dark:text-indigo-400" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                    Ръководител / Треньор
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {data.coachName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Success Banner if just signed */}
          {isSuccess && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950/40">
              <CheckCircle2 className="mx-auto size-9 text-emerald-600 mb-2 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Подписът е положен успешно!
              </h2>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                Вашият подпис се отразява автоматично в графа
                &bdquo;Подпис&ldquo; на ред {data.memberName} във финансовата
                ведомост на състезанието.
              </p>
            </div>
          )}

          {/* Existing signature view */}
          {hasExistingSig && !isSuccess && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-center space-y-3 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
                <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />
                Вече имате положен подпис за тази ведомост
              </div>
              <div className="bg-white rounded-xl border border-blue-200/80 dark:border-blue-800/70 p-3 flex items-center justify-center h-28 max-w-xs mx-auto shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.existingSignature!}
                  alt="Положен подпис"
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResigning(true)}
                className="text-xs h-8 rounded-xl border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/50"
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Подпиши отново (корекция)
              </Button>
            </div>
          )}

          {/* Signature Canvas Box */}
          {(!hasExistingSig || isResigning) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Положете вашия подпис
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Използвайте пръст или писалка върху екрана
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                  <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
                  Син химикал
                </span>
              </div>

              {/* Signature Canvas */}
              <div className="relative touch-none overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-slate-50/60 transition-colors focus-within:border-blue-500 dark:border-blue-700 dark:bg-white">
                <SignatureCanvas
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ref={sigCanvas as any}
                  penColor="#1d4ed8" // Official Royal Blue ballpoint pen ink
                  onBegin={handleBeginStroke}
                  canvasProps={{
                    className: "w-full h-44 sm:h-48 cursor-crosshair",
                  }}
                />

                {canvasEmpty && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs font-medium text-zinc-400">
                      Подпишете се тук (син цвят)
                    </p>
                    <span className="text-[10px] text-zinc-400/80 mt-0.5">
                      На мобилно устройство използвайте пръст
                    </span>
                  </div>
                )}
              </div>

              {/* Action row under canvas */}
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 text-xs text-zinc-500 hover:text-red-600 rounded-lg dark:text-zinc-400"
                >
                  Изчисти
                </Button>

                <div className="flex items-center gap-2">
                  {isResigning && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsResigning(false)}
                      className="h-8 text-xs rounded-xl dark:border-zinc-800 dark:text-zinc-200"
                    >
                      Отказ
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || canvasEmpty}
                    className="h-10 px-5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="size-3.5 animate-spin" />
                        Запазване...
                      </span>
                    ) : (
                      "Потвърди и подпиши"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Legal / Informational notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-[11px] text-zinc-500 border border-zinc-200/60 leading-relaxed dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
            <AlertCircle className="size-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              С полагането на подпис декларирате участието си в горепосочената
              командировка и получаването на предвидените финансови средства
              (дневни, квартирни и транспортни пари) по Наредбата за
              командировките в страната.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
