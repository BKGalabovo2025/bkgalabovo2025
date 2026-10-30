"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eraser,
  FileCheck,
  Lock,
  PenTool,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import React, { useRef, useState } from "react";
import type SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";

import { OfficialDocumentRenderer } from "@/components/documents/OfficialDocumentRenderer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClubFeeServices } from "@/hooks/useClubFeeServices";
import { submitSignedDocumentAction } from "@/lib/actions/document-requests";
import { isMatchingParticipation } from "@/lib/services-fees";
import {
  ParentData,
  PublicDocumentRequestDTO,
} from "@/types/document-request.types";

interface DocumentSignerClientProps {
  initialData: PublicDocumentRequestDTO;
}

export function DocumentSignerClient({
  initialData,
}: DocumentSignerClientProps) {
  const { feeOptions } = useClubFeeServices();
  const [data, setData] = useState<PublicDocumentRequestDTO>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [parentName, setParentName] = useState(
    initialData.parentData?.parentName || ""
  );
  const [parentPhone, setParentPhone] = useState(
    initialData.parentData?.parentPhone || ""
  );
  const [parentEmail, setParentEmail] = useState(
    initialData.parentData?.parentEmail || ""
  );
  const [parentAddress, setParentAddress] = useState(
    initialData.parentData?.parentAddress || ""
  );
  const [secondParentName, setSecondParentName] = useState(
    initialData.parentData?.secondParentName || ""
  );
  const [secondParentPhone, setSecondParentPhone] = useState(
    initialData.parentData?.secondParentPhone || ""
  );
  const [participationType, setParticipationType] = useState(
    initialData.parentData?.participationType ||
      "Месечен абонамент - 1 дете (20 EUR)"
  );
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [agreedToGdpr, setAgreedToGdpr] = useState(false);
  const [SigCanvasComp, setSigCanvasComp] = useState<
    typeof SignatureCanvas | null
  >(null);

  React.useEffect(() => {
    import("react-signature-canvas").then((mod) => {
      setSigCanvasComp(() => mod.default);
    });
  }, []);

  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const secondParentSigCanvasRef = useRef<SignatureCanvas>(null);
  const athleteSigCanvasRef = useRef<SignatureCanvas>(null);

  // Clear signature canvases
  const handleClearSignature = () => {
    sigCanvasRef.current?.clear();
  };
  const handleClearSecondParentSignature = () => {
    secondParentSigCanvasRef.current?.clear();
  };
  const handleClearAthleteSignature = () => {
    athleteSigCanvasRef.current?.clear();
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parentName.trim()) {
      toast.error("Моля, въведете трите имена на родителя / настойника.");
      return;
    }

    if (!parentPhone.trim()) {
      toast.error("Моля, въведете телефон за връзка.");
      return;
    }

    if (!agreedToRules) {
      toast.error(
        "Моля, потвърдете, че сте запознати със съдържанието на документа."
      );
      return;
    }

    if (!agreedToGdpr) {
      toast.error("Моля, дайте съгласие за обработка на личните данни (GDPR).");
      return;
    }

    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error("Моля, положете вашия подпис в полето по-долу.");
      return;
    }

    // Extract signature data URLs
    const signatureBase64 = sigCanvasRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    const secondParentSignatureBase64 =
      secondParentSigCanvasRef.current &&
      !secondParentSigCanvasRef.current.isEmpty()
        ? secondParentSigCanvasRef.current
            .getTrimmedCanvas()
            .toDataURL("image/png")
        : null;

    const memberSignatureBase64 =
      athleteSigCanvasRef.current && !athleteSigCanvasRef.current.isEmpty()
        ? athleteSigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png")
        : null;

    const parentPayload: ParentData = {
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim() || undefined,
      parentAddress: parentAddress.trim() || undefined,
      secondParentName: secondParentName.trim() || undefined,
      secondParentPhone: secondParentPhone.trim() || undefined,
      participationType:
        data.documentType === "membershipApplication"
          ? participationType
          : undefined,
      agreedToRules,
      agreedToGdpr,
      agreedToMedia: agreedToGdpr,
    };

    setIsSubmitting(true);
    try {
      const res = await submitSignedDocumentAction({
        token: data.token,
        parentData: parentPayload,
        signatureBase64,
        secondParentSignatureBase64,
        memberSignatureBase64,
        metadata: {
          userAgent:
            typeof window !== "undefined" ? window.navigator.userAgent : "",
        },
      });

      if (!res.success) {
        toast.error(res.error || "Грешка при подписване на документа.");
        setIsSubmitting(false);
        return;
      }

      toast.success(res.message || "Документът е подписан успешно!");
      setData((prev) => ({
        ...prev,
        status: "completed",
        signedAt: res.data?.signedAt || new Date().toISOString(),
        parentData: parentPayload,
        signatureUrl: signatureBase64,
      }));
    } catch (err: unknown) {
      console.error("Signature submission error:", err);
      toast.error("Възникна непредвидена грешка. Моля, опитайте отново.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render: Already Completed Screen ──────────────────────────────────────────
  if (data.status === "completed") {
    const signedDateStr = data.signedAt
      ? new Date(data.signedAt).toLocaleString("bg-BG", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <main
        id="main-content"
        className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-xl">
            {/* Header banner */}
            <div className="bg-emerald-600 px-6 py-8 text-center text-white">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <FileCheck className="size-9 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                Документът е подписан
              </h1>
              <p className="mt-1 text-sm text-emerald-100">
                Благодарим Ви! Данните са отразени в системата на клуба.
              </p>
            </div>

            {/* Body */}
            <div className="space-y-6 p-6 sm:p-8">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Документ:</span>
                  <span className="font-semibold text-zinc-900">
                    {data.documentTitle}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600">Състезател / Член:</span>
                  <span className="font-semibold text-zinc-900">
                    {data.memberName}
                  </span>
                </div>
                {data.parentData?.parentName && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-600">Подписано от:</span>
                    <span className="font-semibold text-zinc-900">
                      {data.parentData.parentName}
                    </span>
                  </div>
                )}
                {signedDateStr && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-600">Дата и час:</span>
                    <span className="font-semibold text-zinc-900">
                      {signedDateStr} ч.
                    </span>
                  </div>
                )}
              </div>

              {/* Signature Preview */}
              {data.signatureUrl && (
                <div className="rounded-2xl border border-zinc-200/80 p-4 text-center">
                  <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider block mb-2">
                    Положен електронен подпис
                  </span>
                  <div className="flex items-center justify-center bg-white rounded-xl p-2 min-h-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.signatureUrl}
                      alt="Подпис"
                      className="max-h-20 w-auto object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                <Lock className="size-4 shrink-0 text-emerald-600" />
                <span>
                  Този линк е защитен и еднократен. Промени по подписания
                  документ не са възможни.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Render: Expired Screen ───────────────────────────────────────────────────
  if (data.status === "expired") {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6"
      >
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Clock className="size-7" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900">
            Срокът на линка е изтекъл
          </h1>
          <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
            Валидността на този линк за подписване на „{data.documentTitle}” е
            изтекла. Моля, свържете се с треньора или администратора на клуба за
            генериране на нов линк.
          </p>
        </div>
      </main>
    );
  }

  // ── Render: Cancelled Screen ─────────────────────────────────────────────────
  if (data.status === "cancelled") {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6"
      >
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertCircle className="size-7" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900">Линкът е анулиран</h1>
          <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
            Тази заявка за подписване е била анулирана от администратора на
            клуба.
          </p>
        </div>
      </main>
    );
  }

  // ── Render: Active Signing Form ──────────────────────────────────────────────
  const formattedExpiry = new Date(data.expiresAt).toLocaleDateString("bg-BG");

  return (
    <main
      id="main-content"
      className="min-h-screen bg-zinc-100/70 pb-20 pt-6 px-3 sm:px-6 lg:px-8 font-sans"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Top Header Card */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
                СНЦ „Бадминтон клуб Гълъбово”
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-950 mt-0.5">
                {data.documentTitle}
              </h1>
            </div>
            <div className="hidden sm:flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white">
              <PenTool className="size-6" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
            <div className="flex items-center gap-1.5 font-medium text-zinc-900">
              <User className="size-3.5 text-zinc-400" />
              <span>Състезател:</span>
              <span className="underline decoration-zinc-300 underline-offset-2">
                {data.memberName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Clock className="size-3.5" />
              <span>Срок на линка: {formattedExpiry} г.</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200">
              <Calendar className="size-3 text-emerald-600" />
              <span>
                Валидност на документа: до 31.12.{new Date().getFullYear()} г.
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Official Document Content */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                1. Съдържание на официалния документ
              </h2>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-600">
                Официален образец{" "}
                {data.templateVersion ? `v${data.templateVersion}` : ""}
              </span>
            </div>

            <OfficialDocumentRenderer
              slug={data.documentType}
              title={data.documentTitle}
              bodyText={data.documentLegalTextSnapshot || undefined}
              memberName={data.memberName}
              memberBirthDate={data.memberBirthDate}
              participationType={participationType}
              parentName={parentName}
              parentPhone={parentPhone}
              parentEmail={parentEmail}
              parentAddress={parentAddress}
              fatherName={parentName}
              fatherPhone={parentPhone}
              fatherCity={parentAddress}
              motherName={secondParentName}
              motherPhone={secondParentPhone}
              isPrintMode={false}
            />
          </div>

          {/* Section 2: Parent / Signer Information */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              2. Данни за родител / настойник
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="parentName"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Трите имена на родителя / настойника *
                </Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="напр. Иван Георгиев Иванов"
                  required
                  className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="parentPhone"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Телефон за връзка *
                </Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="напр. 0888 123 456"
                  required
                  className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="parentEmail"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Имейл адрес (по избор)
                </Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="roditel@example.com"
                  className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="parentAddress"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Адрес по местоживеене (по избор)
                </Label>
                <Input
                  id="parentAddress"
                  value={parentAddress}
                  onChange={(e) => setParentAddress(e.target.value)}
                  placeholder="гр. Гълъбово, ул. ..."
                  className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
                />
              </div>

              {/* Second Parent (Optional) */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="secondParentName"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Втори родител (по избор)
                </Label>
                <Input
                  id="secondParentName"
                  value={secondParentName}
                  onChange={(e) => setSecondParentName(e.target.value)}
                  placeholder="Име на втори родител"
                  className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="secondParentPhone"
                  className="text-xs font-semibold text-zinc-900"
                >
                  Телефон на втори родител
                </Label>
                <Input
                  id="secondParentPhone"
                  type="tel"
                  value={secondParentPhone}
                  onChange={(e) => setSecondParentPhone(e.target.value)}
                  placeholder="Телефон на втори родител"
                  className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Participation selection for application */}
            {data.documentType === "membershipApplication" && (
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-900">
                    Избор на форма на участие / абонамент
                  </span>
                  <span className="text-[10.5pt] font-semibold text-emerald-700">
                    (отразява се веднага в документа в т. 1)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {feeOptions.map((opt) => {
                    const isSelected =
                      isMatchingParticipation(participationType, opt.label) ||
                      isMatchingParticipation(
                        participationType,
                        opt.radioLabel
                      ) ||
                      isMatchingParticipation(participationType, opt.name);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setParticipationType(opt.radioLabel)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-950 text-white shadow-sm ring-2 ring-emerald-500"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="participation"
                          checked={isSelected}
                          onChange={() => setParticipationType(opt.radioLabel)}
                          className="sr-only"
                        />
                        <span
                          className={`inline-flex items-center justify-center size-4 rounded-xs border text-[9pt] font-bold ${
                            isSelected
                              ? "border-emerald-400 bg-emerald-500 text-white"
                              : "border-zinc-300 bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <span className="font-medium text-[8.5pt]">
                          {opt.radioLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>
                    Отразена избрана форма в т. 1 на официалния документ:{" "}
                    <strong className="underline decoration-emerald-400 underline-offset-2">
                      {participationType}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Declarations and Consents */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              3. Задължителни съгласия
            </h2>

            <div className="space-y-3 text-xs leading-relaxed">
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 cursor-pointer hover:bg-zinc-50">
                <Checkbox
                  checked={agreedToRules}
                  onCheckedChange={(c) => setAgreedToRules(!!c)}
                  className="mt-0.5"
                />
                <span className="text-zinc-800">
                  <strong>Запознат/а съм и приемам:</strong> Потвърждавам, че
                  прочетох съдържанието на документа по-горе, приемам изложените
                  условия и потвърждавам верността на въведените данни. *
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 cursor-pointer hover:bg-zinc-50">
                <Checkbox
                  checked={agreedToGdpr}
                  onCheckedChange={(c) => setAgreedToGdpr(!!c)}
                  className="mt-0.5"
                />
                <span className="text-zinc-800">
                  <strong>Съгласие за лични данни (GDPR):</strong> Давам своето
                  съгласие личните ми данни и тези на детето да бъдат
                  обработвани от клуба за целите на тренировъчната и
                  състезателна дейност. *
                </span>
              </label>
            </div>
          </div>

          {/* Section 4: Signature Canvas - Parent 1 */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  4. Електронен подпис на родител / настойник 1 *
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Разпишете се с пръст на екрана на телефона или с мишката
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearSignature}
                className="h-8 rounded-lg text-xs border-zinc-200 hover:bg-zinc-100"
              >
                <Eraser className="size-3.5 mr-1 text-zinc-500" />
                Изчисти
              </Button>
            </div>

            <div className="relative touch-none overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-white transition-colors">
              {SigCanvasComp ? (
                <SigCanvasComp
                  ref={sigCanvasRef}
                  penColor="#09090b"
                  velocityFilterWeight={0.7}
                  canvasProps={{
                    className: "w-full h-40 touch-none cursor-crosshair",
                  }}
                />
              ) : (
                <div className="w-full h-40 flex items-center justify-center text-xs text-zinc-600">
                  Зареждане на полето за подпис...
                </div>
              )}
              <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-zinc-600 italic">
                Подпис на родител 1
              </div>
            </div>
          </div>

          {/* Section 5: Signature Canvas - Athlete / Member */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  5. Електронен подпис на състезател / член
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  За лица над 14 г. или присъстващ състезател (по избор)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAthleteSignature}
                className="h-8 rounded-lg text-xs border-zinc-200 hover:bg-zinc-100"
              >
                <Eraser className="size-3.5 mr-1 text-zinc-500" />
                Изчисти
              </Button>
            </div>

            <div className="relative touch-none overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-white transition-colors">
              {SigCanvasComp ? (
                <SigCanvasComp
                  ref={athleteSigCanvasRef}
                  penColor="#09090b"
                  velocityFilterWeight={0.7}
                  canvasProps={{
                    className: "w-full h-36 touch-none cursor-crosshair",
                  }}
                />
              ) : (
                <div className="w-full h-36 flex items-center justify-center text-xs text-zinc-600">
                  Зареждане на полето за подпис...
                </div>
              )}
              <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-zinc-600 italic">
                Подпис на състезател
              </div>
            </div>
          </div>

          {/* Section 6: Signature Canvas - Second Parent (Optional) */}
          {secondParentName.trim() && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    6. Електронен подпис на втори родител ({secondParentName})
                  </h2>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Полага се от втория родител при съгласие на двамата родители
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearSecondParentSignature}
                  className="h-8 rounded-lg text-xs border-zinc-200 hover:bg-zinc-100"
                >
                  <Eraser className="size-3.5 mr-1 text-zinc-500" />
                  Изчисти
                </Button>
              </div>

              <div className="relative touch-none overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-white transition-colors">
                {SigCanvasComp ? (
                  <SigCanvasComp
                    ref={secondParentSigCanvasRef}
                    penColor="#09090b"
                    velocityFilterWeight={0.7}
                    canvasProps={{
                      className: "w-full h-36 touch-none cursor-crosshair",
                    }}
                  />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center text-xs text-zinc-600">
                    Зареждане на полето за подпис...
                  </div>
                )}
                <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-zinc-600 italic">
                  Подпис на втори родител
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-zinc-950 text-white font-bold text-sm tracking-wide shadow-lg hover:bg-zinc-800 active:scale-0.99 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Записване на документа...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="size-4" />
                  Потвърди и изпрати подписания документ
                </span>
              )}
            </Button>

            <p className="text-center text-[11px] text-zinc-600 flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Връзката е криптирана и защитена със сертификат за сигурност
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
