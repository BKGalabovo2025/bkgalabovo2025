"use client";

import { format } from "date-fns";
import {
  Download,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import {
  DocumentAttachmentType,
  DocumentViewerDialog,
} from "@/components/schedule/DocumentViewerDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  buildStaySectionText,
  generateDefaultReportText,
  updateReportTextStaySection,
} from "@/lib/business-trip-report";
import { businessTripService } from "@/services/business-trip-service";
import {
  BusinessTrip,
  TripProtocolAttachment,
} from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

export {
  buildStaySectionText,
  generateDefaultReportText,
  updateReportTextStaySection,
};

interface TripReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: BusinessTrip | null;
  membersDict: Record<string, Member>;
  onSuccess?: () => void;
}

export function TripReportDialog({
  open,
  onOpenChange,
  trip,
  membersDict,
  onSuccess,
}: TripReportDialogProps) {
  const { idToken } = useAuth();
  const [reportText, setReportText] = useState("");
  const [attachMatchProtocols, setAttachMatchProtocols] = useState(false);
  const [protocols, setProtocols] = useState<TripProtocolAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{
    url: string;
    name?: string;
    type?: DocumentAttachmentType;
    protocolId?: string;
  } | null>(null);

  useEffect(() => {
    if (open && trip) {
      const hasProtocols = Boolean(trip.attachMatchProtocols);
      setAttachMatchProtocols(hasProtocols);
      setProtocols(trip.matchProtocols || []);

      const hasOldPlaceholder =
        trip.reportText &&
        (trip.reportText.includes(
          "Ако състезателите са отпаднали по-рано от турнира"
        ) ||
          trip.reportText.includes("Забележка при съкращаване на престоя:"));

      if (
        trip.reportText &&
        trip.reportText.trim() !== "" &&
        !hasOldPlaceholder
      ) {
        setReportText(trip.reportText);
      } else {
        setReportText(
          generateDefaultReportText(trip, membersDict, hasProtocols)
        );
      }
    }
  }, [open, trip, membersDict]);

  const handleToggleProtocols = (checked: boolean) => {
    setAttachMatchProtocols(checked);
    const protocolItem =
      "• Официални съдийски протоколи от изиграните срещи на състезателите;";

    if (checked) {
      if (!reportText.includes(protocolItem)) {
        if (reportText.includes("следните отчетни документи:")) {
          setReportText((prev) =>
            prev.replace(
              "следните отчетни документи:",
              `следните отчетни документи:\n${protocolItem}`
            )
          );
        } else if (reportText.includes("прилагат:")) {
          setReportText((prev) =>
            prev.replace("прилагат:", `прилагат:\n${protocolItem}`)
          );
        } else if (reportText.includes("4. ЗАКЛЮЧЕНИЕ")) {
          setReportText((prev) =>
            prev.replace(
              "4. ЗАКЛЮЧЕНИЕ",
              `4. ЗАКЛЮЧЕНИЕ И ПРИЛОЖЕНИЯ\n(Приложени: ${protocolItem})\n`
            )
          );
        } else {
          setReportText((prev) => `${prev}\n\nПриложение:\n${protocolItem}`);
        }
      }
    } else {
      setReportText((prev) =>
        prev
          .replace(`\n${protocolItem}`, "")
          .replace(`${protocolItem}\n`, "")
          .replace(protocolItem, "")
      );
    }
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !trip?.id) return;
    setIsUploading(true);
    const fileCountLabel =
      files.length > 1 ? `${files.length} файла...` : "протокол...";
    const uploadToast = toast.loading(`Качване на ${fileCountLabel}`);
    try {
      const newProtocols: TripProtocolAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await businessTripService.uploadTripProtocolDocument(
          trip.siteId,
          trip.id,
          file,
          idToken
        );
        newProtocols.push({
          id: uuidv4(),
          name: file.name,
          url,
          size: file.size,
          contentType: file.type,
          createdAt: new Date().toISOString(),
        });
      }

      const updated = [...protocols, ...newProtocols];
      setProtocols(updated);

      // Запазваме веднага в базата данни, за да не се загубят качените файлове
      await businessTripService.updateTrip(trip.id, {
        matchProtocols: updated,
        attachMatchProtocols: true,
      });

      toast.success("Протоколите бяха качени успешно!", { id: uploadToast });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при качване на протокола.", { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    if (!trip?.id) return;
    const updated = protocols.filter((p) => p.id !== protocolId);
    setProtocols(updated);
    try {
      await businessTripService.updateTrip(trip.id, {
        matchProtocols: updated,
      });
      toast.success("Протоколът беше премахнат.");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при премахване на протокола.");
    }
  };

  const handlePreviewProtocol = (p: TripProtocolAttachment) => {
    const isPdf =
      p.url.toLowerCase().includes(".pdf") ||
      p.name.toLowerCase().endsWith(".pdf");
    const isImg =
      /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(p.url) ||
      /\.(png|jpe?g|webp|gif|svg)$/i.test(p.name);
    let docType: DocumentAttachmentType | undefined;
    if (isPdf) {
      docType = "pdf";
    } else if (isImg) {
      docType = "image";
    }

    setViewerDoc({
      url: p.url,
      name: p.name,
      type: docType,
      protocolId: p.id,
    });
  };

  const handleDownloadProtocol = async (p: TripProtocolAttachment) => {
    if (!trip?.id) return;
    try {
      await businessTripService.logTripProtocolDownload(trip.id, p.id);
      const now = new Date().toISOString();
      setProtocols((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, downloadedAt: now } : item
        )
      );
      onSuccess?.();
    } catch {
      // non-critical
    }

    const a = document.createElement("a");
    a.href = p.url;
    a.download = p.name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetToDefault = () => {
    if (!trip) return;
    setReportText(
      generateDefaultReportText(trip, membersDict, attachMatchProtocols)
    );
  };

  const handleSave = async () => {
    if (!trip?.id) return;
    setIsSaving(true);
    try {
      await businessTripService.updateTrip(trip.id, {
        reportText: reportText.trim(),
        attachMatchProtocols,
        matchProtocols: protocols,
      });
      toast.success("Докладът за извършената работа е записан успешно!");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Възникна грешка при записа на доклада.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!trip) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-indigo-600" />
              Доклад за извършената работа (съгласно НКС)
            </DialogTitle>
            <DialogDescription>
              Командированият представя писмен отчет в 3-дневен срок след
              завръщането. Текстът по-долу се визуализира и отпечатва в
              официалния PDF Доклад.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Checkbox за официални съдийски протоколи */}
            <div className="flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-950/60 dark:bg-indigo-950/20">
              <Checkbox
                id="attachProtocols"
                checked={attachMatchProtocols}
                onCheckedChange={(checked) =>
                  handleToggleProtocols(Boolean(checked))
                }
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="attachProtocols"
                  className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Прилагам официални протоколи от срещите на състезателите
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Когато е отбелязано, протоколите от срещите автоматично се
                  включват в текста на доклада (т. 4 Приложения). При
                  отмаркиране се премахват.
                </p>
              </div>
            </div>

            {/* Секция за качване и преглед на протоколите, когато чекбоксът е активен */}
            {attachMatchProtocols && (
              <div className="space-y-2.5 rounded-lg border border-indigo-200/80 bg-white p-3.5 shadow-xs dark:border-indigo-900/50 dark:bg-zinc-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Прикачени официални протоколи ({protocols.length})
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Качете PDF сканове или снимки на съдийските протоколи от
                      срещите.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      id="protocol-file-upload"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        handleUploadFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isUploading}
                      asChild
                      className="h-8 cursor-pointer gap-1.5 border-dashed border-indigo-300 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                    >
                      <label htmlFor="protocol-file-upload">
                        {isUploading ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Качване...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5" />
                            <span>Качи протокол (PDF / снимка)</span>
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </div>

                {/* Списък с качени протоколи */}
                {protocols.length > 0 ? (
                  <div className="divide-y divide-zinc-100 rounded-md border border-zinc-200/70 bg-zinc-50/50 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/40">
                    {protocols.map((p) => {
                      const isPdf =
                        p.url.toLowerCase().includes(".pdf") ||
                        p.name.toLowerCase().endsWith(".pdf");
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            {isPdf ? (
                              <FileText className="size-4 shrink-0 text-rose-500" />
                            ) : (
                              <ImageIcon className="size-4 shrink-0 text-purple-500" />
                            )}
                            <div className="min-w-0">
                              <p
                                className="truncate font-medium text-zinc-800 dark:text-zinc-200"
                                title={p.name}
                              >
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                {p.size && (
                                  <span>{(p.size / 1024).toFixed(0)} KB</span>
                                )}
                                {p.downloadedAt ? (
                                  <span
                                    className="font-medium text-emerald-600 dark:text-emerald-400"
                                    title={`Свалено на: ${format(new Date(p.downloadedAt), "dd.MM.yyyy HH:mm:ss")}`}
                                  >
                                    ↓ Свалено на:{" "}
                                    {format(
                                      new Date(p.downloadedAt),
                                      "dd.MM.yyyy HH:mm"
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400">
                                    Все още не е изтеглено
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            {/* Преглед */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-zinc-500 hover:text-emerald-600"
                              title="Преглед на документа"
                              onClick={() => handlePreviewProtocol(p)}
                            >
                              <Eye className="size-3.5" />
                            </Button>

                            {/* Сваляне */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-zinc-500 hover:text-indigo-600"
                              title="Изтегли документа"
                              onClick={() => handleDownloadProtocol(p)}
                            >
                              <Download className="size-3.5" />
                            </Button>

                            {/* Изтриване */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7 text-zinc-400 hover:text-rose-600"
                              title="Изтрий протокол"
                              onClick={() => handleDeleteProtocol(p.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-zinc-200 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800">
                    Няма качени протоколи. Натиснете „Качи протокол“, за да
                    прикачите PDF или снимка от турнира.
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Съдържание на доклада / спортния отчет:</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetToDefault}
                className="h-7 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <RotateCcw className="mr-1 size-3.5" />
                Възстанови готов текст
              </Button>
            </div>

            <Textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={10}
              className="font-sans text-xs leading-relaxed"
              placeholder="Въведете текст на доклада..."
            />

            <p className="text-[11px] text-muted-foreground">
              💡 <strong>Съвет:</strong> Ако състезателите са отпаднали на 2-рия
              ден и сте ползвали само 1 нощувка, опишете това в т. 3 за
              счетоводна обосновка на представената хотелска фактура.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Отказ
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Save className="mr-2 size-4" />
              {isSaving ? "Запазване..." : "Запази доклада"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Viewer диалог за визуализация и сваляне на съдийските протоколи */}
      {viewerDoc && (
        <DocumentViewerDialog
          isOpen={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
          documentUrl={viewerDoc.url}
          documentName={viewerDoc.name || "Протокол"}
          documentType={viewerDoc.type}
          subtitle="Официален съдийски протокол от срещите"
          onDownload={async () => {
            if (trip?.id && viewerDoc.protocolId) {
              try {
                await businessTripService.logTripProtocolDownload(
                  trip.id,
                  viewerDoc.protocolId
                );
                const now = new Date().toISOString();
                setProtocols((prev) =>
                  prev.map((item) =>
                    item.id === viewerDoc.protocolId
                      ? { ...item, downloadedAt: now }
                      : item
                  )
                );
                onSuccess?.();
              } catch {
                // non-critical
              }
            }
          }}
        />
      )}
    </>
  );
}
