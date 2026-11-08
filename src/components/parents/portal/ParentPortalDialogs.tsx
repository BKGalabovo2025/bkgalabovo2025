"use client";

import {
  Calendar as CalendarIcon,
  CalendarX2,
  Camera,
  Download,
  Edit3,
  FileSignature,
  HeartPulse,
  KeyRound,
  Loader2,
  Printer,
  Sparkles,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { OfficialDocumentRenderer } from "@/components/documents/OfficialDocumentRenderer";
import { ParentReceiptDialog } from "@/components/parents/ParentReceiptDialog";
import { DocumentViewerDialog } from "@/components/schedule/DocumentViewerDialog";
import { EventInquiryDialog } from "@/components/shared/schedule/EventInquiryDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generatePdfFromElement } from "@/lib/html-to-pdf";
import { cn } from "@/lib/utils";

import { useParentPortalContext } from "./ParentPortalContext";

export function ParentPortalDialogs() {
  const {
    portal,
    // Absence
    absenceDialogOpen,
    setAbsenceDialogOpen,
    absenceType,
    setAbsenceType,
    absenceStartDate,
    setAbsenceStartDate,
    absenceEndDate,
    setAbsenceEndDate,
    absenceReason,
    setAbsenceReason,
    absenceNote,
    setAbsenceNote,
    isSubmittingAbsence,
    handleSubmitAbsence,

    // Correction
    correctionDialogOpen,
    setCorrectionDialogOpen,
    activeCorrectionField,
    proposedValue,
    setProposedValue,
    correctionNote,
    setCorrectionNote,
    isSubmittingCorrection,
    handleSubmitCorrection,

    // Password
    changePwdOpen,
    setChangePwdOpen,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isChangingPwd,
    handleChangePasswordSubmit,

    // Sent Document Preview & Sign
    selectedSentDoc,
    setSelectedSentDoc,
    handleOpenSignDocument,

    // Document Viewer
    activeDocViewer,
    setActiveDocViewer,

    // Event Inquiry
    activeInquiryEvent,
    setActiveInquiryEvent,
    setSubmittedInquiries,

    // Medical Upload
    parentMedicalModalOpen,
    setParentMedicalModalOpen,
    parentMedicalDate,
    setParentMedicalDate,
    parentMedicalBase64,
    setParentMedicalBase64,
    parentMedicalFileName,
    setParentMedicalFileName,
    isUploadingMedical,
    handleMedicalUpload,

    // Receipt
    activeReceiptTx,
    setActiveReceiptTx,

    // Welcome Tour
    showWelcomeTour,
    setShowWelcomeTour,
    handleCloseWelcomeTour,

    selectedChildAgeStr,
  } = useParentPortalContext();

  const { parent, selectedChild } = portal;

  const docPrintRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadDocPdf = async () => {
    if (!docPrintRef.current || !selectedSentDoc) return;
    setIsExportingPdf(true);
    try {
      await generatePdfFromElement(
        docPrintRef.current,
        `${selectedSentDoc.documentTitle}_${selectedSentDoc.memberName || "document"}.pdf`
      );
      toast.success("Документът беше свален като PDF файл.");
    } catch {
      toast.error("Неуспешно генериране на PDF документ.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleMedicalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParentMedicalFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setParentMedicalBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* ── DIALOG 1: Absence Notification ───────────────────────────── */}
      <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 shadow-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white uppercase">
              Уведомление за отсъствие от тренировка
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Информацията ще се отрази веднага в дневника на треньора за{" "}
              {selectedChild?.firstName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAbsence} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Период на отсъствието:
              </Label>
              <RadioGroup
                value={absenceType}
                onValueChange={(v: "single_day" | "period") =>
                  setAbsenceType(v)
                }
                className="mt-2 grid grid-cols-2 gap-2"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border p-3 cursor-pointer transition-all",
                    absenceType === "single_day"
                      ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/40"
                      : "border-zinc-200 dark:border-zinc-800"
                  )}
                  onClick={() => setAbsenceType("single_day")}
                >
                  <RadioGroupItem value="single_day" id="type_single_day" />
                  <Label
                    htmlFor="type_single_day"
                    className="text-xs font-bold cursor-pointer"
                  >
                    За 1 ден
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border p-3 cursor-pointer transition-all",
                    absenceType === "period"
                      ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/40"
                      : "border-zinc-200 dark:border-zinc-800"
                  )}
                  onClick={() => setAbsenceType("period")}
                >
                  <RadioGroupItem value="period" id="type_period" />
                  <Label
                    htmlFor="type_period"
                    className="text-xs font-bold cursor-pointer"
                  >
                    За период
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="portal-absence-start"
                  className="text-xs font-semibold"
                >
                  {absenceType === "period"
                    ? "От дата:"
                    : "Дата на тренировката:"}
                </Label>
                <Input
                  id="portal-absence-start"
                  name="absenceStartDate"
                  type="date"
                  value={absenceStartDate}
                  onChange={(e) => setAbsenceStartDate(e.target.value)}
                  required
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              {absenceType === "period" && (
                <div className="space-y-1">
                  <Label
                    htmlFor="portal-absence-end"
                    className="text-xs font-semibold"
                  >
                    До дата (вкл.):
                  </Label>
                  <Input
                    id="portal-absence-end"
                    name="absenceEndDate"
                    type="date"
                    value={absenceEndDate}
                    min={absenceStartDate}
                    onChange={(e) => setAbsenceEndDate(e.target.value)}
                    required
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="portal-absence-reason-select"
                className="text-xs font-semibold"
              >
                Причина за отсъствието:
              </Label>
              <Select
                value={absenceReason}
                onValueChange={(v) =>
                  setAbsenceReason(v as typeof absenceReason)
                }
              >
                <SelectTrigger
                  id="portal-absence-reason-select"
                  className="h-10 rounded-xl text-xs"
                >
                  <SelectValue placeholder="Изберете причина" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="illness">
                    🤒 Здравословни причини (боледуване)
                  </SelectItem>
                  <SelectItem value="injury">🩹 Спортна травма</SelectItem>
                  <SelectItem value="school">
                    📚 Училищни ангажименти
                  </SelectItem>
                  <SelectItem value="travel">
                    ✈️ Семейни причини / Пътуване
                  </SelectItem>
                  <SelectItem value="other">💬 Други причини</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="portal-absence-note"
                className="text-xs font-semibold"
              >
                Кратък коментар към треньора (по избор):
              </Label>
              <Textarea
                id="portal-absence-note"
                name="absenceNote"
                value={absenceNote}
                onChange={(e) => setAbsenceNote(e.target.value)}
                placeholder="напр. Има лека температура, ще се присъедини от петък..."
                className="rounded-xl text-xs resize-none"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAbsenceDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingAbsence}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                {isSubmittingAbsence ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Изпращане...
                  </>
                ) : (
                  "Изпрати уведомлението"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: Data Correction Request ────────────────────────── */}
      <Dialog
        open={correctionDialogOpen}
        onOpenChange={setCorrectionDialogOpen}
      >
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 shadow-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white uppercase">
              Заяви корекция на данни
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Полето: <strong>{activeCorrectionField?.label}</strong>.
              Администраторът ще прегледа промяната и ще я отрази в картона.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCorrection} className="space-y-4 pt-2">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">
                Текуща стойност в картона:
              </span>
              <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {activeCorrectionField?.currentValue ||
                  "Няма въведена стойност"}
              </p>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="portal-proposed-value"
                className="text-xs font-semibold"
              >
                Нова вярна стойност *
              </Label>
              <Input
                id="portal-proposed-value"
                name="proposedValue"
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                placeholder="Въведете правилната стойност..."
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="portal-correction-note"
                className="text-xs font-semibold"
              >
                Пояснение към треньора (незадължително):
              </Label>
              <Textarea
                id="portal-correction-note"
                name="correctionNote"
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="напр. Издаден е нов задграничен паспорт..."
                className="rounded-xl text-xs resize-none"
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCorrectionDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingCorrection}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                {isSubmittingCorrection ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Изпращане...
                  </>
                ) : (
                  "Изпрати за потвърждение"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 3: Change Password ─────────────────────────────────── */}
      <Dialog open={changePwdOpen} onOpenChange={setChangePwdOpen}>
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 shadow-xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <KeyRound size={16} />
              </span>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white uppercase">
                Смяна на паролата
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500">
              Въведете текущата си парола и изберете нова персонална парола
              (мин. 6 символа).
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleChangePasswordSubmit}
            className="space-y-3.5 pt-2"
          >
            <div className="space-y-1">
              <Label
                htmlFor="portal-current-password"
                className="text-xs font-semibold"
              >
                Текуща парола *
              </Label>
              <Input
                id="portal-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="portal-new-password"
                className="text-xs font-semibold"
              >
                Нова парола *
              </Label>
              <Input
                id="portal-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символа"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="portal-confirm-password"
                className="text-xs font-semibold"
              >
                Повторете новата парола *
              </Label>
              <Input
                id="portal-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторете новата парола"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setChangePwdOpen(false)}
                className="rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isChangingPwd}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                {isChangingPwd ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  "Запази новата парола"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 4: Official Document Preview / PDF ────────────────── */}
      {selectedSentDoc && (
        <Dialog
          open={Boolean(selectedSentDoc)}
          onOpenChange={(open) => !open && setSelectedSentDoc(null)}
        >
          <DialogContent className="max-w-4xl rounded-3xl p-5 sm:p-6 max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 shadow-2xl">
            <DialogHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
                  Официален клубен документ
                </Badge>
                {selectedSentDoc.status === "completed" ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    ✓ Подписан с електронен подпис
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                    ⏳ Очаква онлайн подписване
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-black uppercase text-zinc-900 dark:text-white pt-1">
                {selectedSentDoc.documentTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Състезател:{" "}
                <strong>
                  {selectedSentDoc.memberName || selectedChild?.fullName}
                </strong>
                {selectedSentDoc.signedAt && (
                  <span className="ml-2">
                    • Подписан на:{" "}
                    {new Date(selectedSentDoc.signedAt).toLocaleString("bg-BG")}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 flex-1 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
              <div
                ref={docPrintRef}
                className="mx-auto max-w-[210mm] overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-xs text-zinc-900 print:m-0 print:border-none print:p-0 print:shadow-none space-y-4"
              >
                {selectedSentDoc.status !== "completed" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                      Документът очаква вашето цифрово подписване.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const d = selectedSentDoc;
                        setSelectedSentDoc(null);
                        handleOpenSignDocument(d);
                      }}
                      className="h-7 rounded-lg bg-indigo-600 text-[11px] font-bold text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      ✍️ Подпиши сега ↗
                    </Button>
                  </div>
                )}

                <OfficialDocumentRenderer
                  slug={selectedSentDoc.documentType}
                  title={selectedSentDoc.documentTitle}
                  bodyText={
                    selectedSentDoc.documentLegalTextSnapshot || undefined
                  }
                  memberName={
                    selectedSentDoc.memberName || selectedChild?.fullName
                  }
                  parentName={
                    selectedSentDoc.parentData?.parentName || parent?.name
                  }
                  parentPhone={
                    selectedSentDoc.parentData?.parentPhone || parent?.phone
                  }
                  parentEmail={
                    selectedSentDoc.parentData?.parentEmail || parent?.email
                  }
                  parentAddress={selectedSentDoc.parentData?.parentAddress}
                  secondParentName={
                    selectedSentDoc.parentData?.secondParentName
                  }
                  secondParentPhone={
                    selectedSentDoc.parentData?.secondParentPhone
                  }
                  documentDate={
                    selectedSentDoc.signedAt
                      ? new Date(selectedSentDoc.signedAt).toLocaleDateString(
                          "bg-BG"
                        )
                      : new Date(selectedSentDoc.createdAt).toLocaleDateString(
                          "bg-BG"
                        )
                  }
                  parentSignatureDataUrl={selectedSentDoc.signatureUrl}
                  secondParentSignatureDataUrl={
                    selectedSentDoc.secondParentSignatureUrl
                  }
                  memberSignatureDataUrl={selectedSentDoc.memberSignatureUrl}
                  presidentSignatureDataUrl={
                    selectedSentDoc.presidentSignatureUrl
                  }
                  presidentSignedAt={selectedSentDoc.presidentSignedAt}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 flex-wrap items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSentDoc(null)}
                className="rounded-xl text-xs"
              >
                Затвори
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExportingPdf}
                  onClick={handleDownloadDocPdf}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold shadow-2xs"
                >
                  {isExportingPdf ? (
                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                  ) : (
                    <Download size={13} className="mr-1.5" />
                  )}
                  Свали PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold shadow-2xs"
                >
                  <Printer size={13} className="mr-1.5" />
                  Печат
                </Button>
                {selectedSentDoc.status !== "completed" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const d = selectedSentDoc;
                      setSelectedSentDoc(null);
                      handleOpenSignDocument(d);
                    }}
                    className="rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer"
                  >
                    <FileSignature size={13} className="mr-1.5" />
                    ✍️ Подпиши онлайн ↗
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── DIALOG 5: Attachment Document Viewer ─────────────────────── */}
      {activeDocViewer && (
        <DocumentViewerDialog
          isOpen={Boolean(activeDocViewer)}
          onClose={() => setActiveDocViewer(null)}
          documentUrl={activeDocViewer.url}
          documentName={activeDocViewer.name || "Документ / Наредба"}
          documentType={activeDocViewer.type}
        />
      )}

      {/* ── DIALOG 6: Event Inquiry / Sign-up ────────────────────────── */}
      {activeInquiryEvent && (
        <EventInquiryDialog
          isOpen={Boolean(activeInquiryEvent)}
          onClose={() => setActiveInquiryEvent(null)}
          event={activeInquiryEvent}
          defaultName={parent?.name || ""}
          defaultPhone={parent?.phone || ""}
          defaultTarget="child"
          defaultChildAge={selectedChildAgeStr}
          defaultNotes={
            selectedChild
              ? `Желание за участие на състезател: ${selectedChild.firstName} ${selectedChild.lastName}. Моля администраторът да потвърди записването.`
              : ""
          }
          onSuccess={() => {
            if (activeInquiryEvent.id) {
              setSubmittedInquiries((prev) =>
                new Set(prev).add(activeInquiryEvent.id!)
              );
            }
          }}
        />
      )}

      {/* ── DIALOG 7: Medical Certificate Upload ─────────────────────── */}
      <Dialog
        open={parentMedicalModalOpen}
        onOpenChange={setParentMedicalModalOpen}
      >
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 shadow-xl">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <HeartPulse size={16} />
              </span>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white uppercase">
                Качване на медицинско свидетелство
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-500">
              Прикачете снимка или скан на документа за{" "}
              {selectedChild?.firstName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label
                htmlFor="portal-medical-date"
                className="font-bold text-zinc-800 dark:text-zinc-200"
              >
                Дата на извършения медицински преглед:
              </Label>
              <Input
                id="portal-medical-date"
                name="medicalDate"
                type="date"
                value={parentMedicalDate}
                onChange={(e) => setParentMedicalDate(e.target.value)}
                className="h-10 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="portal-medical-file"
                className="font-bold text-zinc-800 dark:text-zinc-200"
              >
                Снимка или сканиран файл (JPG, PNG, PDF):
              </Label>
              <Input
                id="portal-medical-file"
                name="medicalFile"
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleMedicalFileChange}
                className="h-10 rounded-xl text-xs cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-100 dark:file:bg-zinc-800 dark:file:text-zinc-200 file:px-3 file:py-1 file:text-xs file:font-semibold"
              />
              {parentMedicalFileName && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  ✓ Избран файл: {parentMedicalFileName}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setParentMedicalModalOpen(false)}
                className="h-10 rounded-xl text-xs"
              >
                Отказ
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!parentMedicalBase64 || isUploadingMedical}
                onClick={handleMedicalUpload}
                className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {isUploadingMedical ? (
                  <>
                    <Loader2 size={13} className="mr-1.5 animate-spin" />
                    Качване...
                  </>
                ) : (
                  <>
                    <Camera size={13} className="mr-1.5" />
                    Изпрати за картотеката
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 8: Official Payment Receipt & PDF ────────────────── */}
      {activeReceiptTx && (
        <ParentReceiptDialog
          isOpen={Boolean(activeReceiptTx)}
          onClose={() => setActiveReceiptTx(null)}
          transaction={activeReceiptTx}
          childName={selectedChild?.fullName || "Състезател"}
        />
      )}

      {/* ── DIALOG 9: First-Time Welcome Tour Modal ──────────────────── */}
      <Dialog open={showWelcomeTour} onOpenChange={setShowWelcomeTour}>
        <DialogContent className="max-w-md rounded-4xl p-6 sm:p-8 bg-white dark:bg-zinc-900 shadow-xl">
          <div className="text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Sparkles className="size-7" />
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                Добре дошли в Родителския портал!
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Специално създаден за родителите на СНЦ „Бадминтон клуб
                Гълъбово“, за да следите тренировъчния процес лесно и прозрачно:
              </DialogDescription>
            </div>

            <div className="space-y-2.5 text-left text-xs">
              <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <CalendarIcon className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    Присъствия в реално време
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                    Виждате всяка посетена или пропусната тренировка по месеци.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <CalendarX2 className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    Уведомяване при отсъствие от тренировка
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                    С 1 клик информирате треньора предварително за ден или
                    период.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <Edit3 className="size-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    Моливче ✏️ за корекция на данни
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                    Ако откриете неточност, я коригирате незабавно без излишни
                    обаждания.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCloseWelcomeTour}
              className="w-full h-11 rounded-2xl bg-blue-600 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
            >
              Разбрах, да започваме!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
