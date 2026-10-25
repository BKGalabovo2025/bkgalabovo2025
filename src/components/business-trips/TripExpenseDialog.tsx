"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  FileUp,
  Loader2,
  Moon,
  QrCode,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import {
  ParsedExpenseData,
  processExpenseDocument,
} from "@/lib/expense-document-parser";
import { cn } from "@/lib/utils";
import { businessTripService } from "@/services/business-trip-service";
import {
  BusinessTrip,
  convertBgnToEur,
  convertEurToBgn,
  TripExpense,
  TripExpenseSchema,
} from "@/types/business-trip.types";

import { DocumentCameraScannerDialog } from "./DocumentCameraScannerDialog";

const FormSchema = TripExpenseSchema.extend({
  attachmentFile: z.any().optional(), // File type from input
});

type FormValues = z.infer<typeof FormSchema>;

export interface TripExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  siteId: string;
  trip?: BusinessTrip | null;
  expenseToEdit?: TripExpense | null;
  onSuccess?: () => void;
}

export function TripExpenseDialog({
  open,
  onOpenChange,
  tripId,
  siteId,
  trip,
  expenseToEdit,
  onSuccess,
}: TripExpenseDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [ocrSummary, setOcrSummary] = useState<string | null>(null);
  const [ocrProgressText, setOcrProgressText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currencyMode, setCurrencyMode] = useState<"EUR" | "BGN">("EUR");
  const [bgnInputValue, setBgnInputValue] = useState<string>("");
  const { idToken } = useAuth();

  const form = useForm<any>({
    resolver: zodResolver(FormSchema) as any,
    defaultValues: {
      tripId,
      siteId,
      expenseType: "fuel",
      amountEUR: 0,
      supplierName: "",
      documentNumber: "",
      documentDate: new Date().toISOString(),
      stayDate: "",
      notes: "",
      attachmentUrl: "",
    },
  });

  // Calculate nights of the trip if trip dates are available
  const nightsList = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const totalNights = Math.max(0, differenceInCalendarDays(end, start));
      const items: { label: string; value: string }[] = [];
      for (let i = 0; i < totalNights; i++) {
        const nStart = addDays(start, i);
        const nEnd = addDays(start, i + 1);
        const label = `Нощ ${i + 1} (${format(nStart, "dd.MM.yyyy")} → ${format(nEnd, "dd.MM.yyyy")})`;
        items.push({
          label,
          value: label,
        });
      }
      return items;
    } catch {
      return [];
    }
  }, [trip]);

  useEffect(() => {
    if (open) {
      setCurrencyMode("EUR");
      if (expenseToEdit) {
        form.reset({
          tripId: expenseToEdit.tripId,
          siteId: expenseToEdit.siteId,
          expenseType: expenseToEdit.expenseType,
          amountEUR: expenseToEdit.amountEUR,
          supplierName: expenseToEdit.supplierName || "",
          documentNumber: expenseToEdit.documentNumber || "",
          documentDate: expenseToEdit.documentDate || new Date().toISOString(),
          stayDate: expenseToEdit.stayDate || "",
          notes: expenseToEdit.notes || "",
          attachmentUrl: expenseToEdit.attachmentUrl || "",
        });
        setBgnInputValue(
          expenseToEdit.amountEUR
            ? convertEurToBgn(expenseToEdit.amountEUR).toFixed(2)
            : ""
        );
      } else {
        form.reset({
          tripId,
          siteId,
          expenseType: "fuel",
          amountEUR: 0,
          supplierName: "",
          documentNumber: "",
          documentDate: new Date().toISOString(),
          stayDate: "",
          notes: "",
          attachmentUrl: "",
        });
        setBgnInputValue("");
      }
    }
  }, [open, expenseToEdit, form, tripId, siteId]);

  const amountEUR = form.watch("amountEUR");
  const equivalentBGN = amountEUR ? convertEurToBgn(amountEUR) : 0;
  const isFuel = form.watch("expenseType") === "fuel";

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true);
    try {
      let finalAttachmentUrl = values.attachmentUrl;

      if (values.attachmentFile && values.attachmentFile.length > 0) {
        const file = values.attachmentFile[0] as File;
        const uploadToast = toast.loading("Качване на документа...");
        try {
          finalAttachmentUrl = await businessTripService.uploadExpenseDocument(
            siteId,
            tripId,
            file,
            idToken
          );
          toast.success("Документът е качен!", { id: uploadToast });
        } catch (e) {
          toast.error("Грешка при качване на файла", { id: uploadToast });
          throw e; // abort save
        }
      }

      if (expenseToEdit && expenseToEdit.id) {
        await businessTripService.updateExpense(expenseToEdit.id, {
          ...values,
          attachmentUrl: finalAttachmentUrl,
        } as any);
        toast.success("Разходът е обновен успешно!");
      } else {
        await businessTripService.addExpense({
          ...values,
          attachmentUrl: finalAttachmentUrl,
        } as any);
        toast.success("Разходът е добавен успешно!");
      }

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при запазването.");
    } finally {
      setIsUploading(false);
    }
  };

  // Интелигентен анализ на документи (снимки, PDF, НАП QR кодове)
  const handleFileUpload = async (
    files: FileList | File[] | null,
    preParsedData?: ParsedExpenseData | null
  ) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Задаваме файла във формата за предстоящо качване
    form.setValue("attachmentFile", [file]);

    setIsOcrRunning(true);
    setOcrSummary(null);
    setOcrProgressText("Анализиране на документа...");

    const ocrToast = toast.loading("Сканиране и разпознаване на документа...");

    try {
      const result = await processExpenseDocument(
        file,
        preParsedData,
        (progress, status) => {
          setOcrProgressText(`${status} (${progress}%)`);
        }
      );

      const detectedFields: string[] = [];

      // 1. Попълване на сума
      if (result.amountBGN && result.amountBGN > 0) {
        form.setValue("amountEUR", convertBgnToEur(result.amountBGN));
        setBgnInputValue(result.amountBGN.toFixed(2));
        setCurrencyMode("BGN");
        detectedFields.push(`Сума: ${result.amountBGN.toFixed(2)} лв.`);
      } else if (result.amountEUR && result.amountEUR > 0) {
        form.setValue("amountEUR", result.amountEUR);
        setBgnInputValue(convertEurToBgn(result.amountEUR).toFixed(2));
        setCurrencyMode("EUR");
        detectedFields.push(`Сума: €${result.amountEUR.toFixed(2)}`);
      }

      // 2. Попълване на доставчик / търговец
      if (result.supplierName) {
        form.setValue("supplierName", result.supplierName);
        detectedFields.push(`Търговец: ${result.supplierName}`);
      }

      // 3. Попълване на номер на документ
      if (result.documentNumber) {
        form.setValue("documentNumber", result.documentNumber);
        detectedFields.push(`№ ${result.documentNumber}`);
      }

      // 4. Попълване на дата
      if (result.documentDate) {
        try {
          form.setValue(
            "documentDate",
            new Date(result.documentDate).toISOString()
          );
          detectedFields.push(
            `Дата: ${format(new Date(result.documentDate), "dd.MM.yyyy")}`
          );
        } catch {
          // Игнорираме невалидна дата
        }
      }

      // 5. Попълване на вид разход
      if (result.expenseType && result.expenseType !== "other") {
        form.setValue("expenseType", result.expenseType);
        const typeLabels: Record<string, string> = {
          fuel: "Гориво",
          accommodation: "Нощувка",
          toll: "Пътни такси / Тол",
          entry_fee: "Такса участие",
        };
        detectedFields.push(
          `Вид: ${typeLabels[result.expenseType] || result.expenseType}`
        );
      }

      if (detectedFields.length > 0) {
        const summaryText = `Автоматично извлечени данни: ${detectedFields.join(" | ")}`;
        setOcrSummary(summaryText);
        toast.success(
          "Данните от документа бяха разпознати и попълнени автоматично!",
          {
            id: ocrToast,
          }
        );
      } else {
        toast.info(
          "Документът е прикачен. Моля, проверете и въведете данните ръчно.",
          {
            id: ocrToast,
          }
        );
      }
    } catch (e) {
      console.error("Document process error:", e);
      toast.error("Грешка при обработката на документа.", { id: ocrToast });
    } finally {
      setIsOcrRunning(false);
      setOcrProgressText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-xl md:max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Save className="size-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                {expenseToEdit ? "Редактиране на разход" : "Добавяне на разход"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {expenseToEdit
                  ? "Променете данните за разхода по-долу."
                  : "Детайли за направен разход по време на командировката"}
              </DialogDescription>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="flex flex-1 flex-col overflow-hidden min-h-0"
          >
            <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 min-h-0">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control as any}
                  name="expenseType"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Вид на разхода</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Изберете вид" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fuel">Гориво</SelectItem>
                          <SelectItem value="transport">
                            Транспорт (Билети, Такси)
                          </SelectItem>
                          <SelectItem value="accommodation">
                            Нощувка (Квартирни)
                          </SelectItem>
                          <SelectItem value="food">
                            Храна (Извън дневни)
                          </SelectItem>
                          <SelectItem value="entry_fee">
                            Входна такса за турнир
                          </SelectItem>
                          <SelectItem value="other">Други</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="amountEUR"
                  render={({ field }: any) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>
                          {isFuel ? "Цена за 1 литър" : "Сума"}
                        </FormLabel>
                        <div className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 p-0.5 text-[11px] dark:border-zinc-800 dark:bg-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => setCurrencyMode("EUR")}
                            className={cn(
                              "px-2 py-0.5 rounded font-medium transition-colors",
                              currencyMode === "EUR"
                                ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                            )}
                          >
                            EUR € (Основна)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrencyMode("BGN");
                              if (field.value && !bgnInputValue) {
                                setBgnInputValue(
                                  convertEurToBgn(Number(field.value)).toFixed(
                                    2
                                  )
                                );
                              }
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded font-medium transition-colors",
                              currencyMode === "BGN"
                                ? "bg-white text-blue-600 shadow-2xs dark:bg-zinc-900 dark:text-blue-400"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                            )}
                          >
                            BGN лв (Калкулатор)
                          </button>
                        </div>
                      </div>
                      <FormControl>
                        <div className="relative">
                          {currencyMode === "EUR" ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={field.value ?? ""}
                              placeholder={isFuel ? "Напр. 1.35" : "0.00"}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value);
                                field.onChange(val);
                                setBgnInputValue(
                                  val ? convertEurToBgn(val).toFixed(2) : ""
                                );
                              }}
                              className="pr-12"
                            />
                          ) : (
                            <Input
                              type="number"
                              step="0.01"
                              value={bgnInputValue}
                              placeholder={isFuel ? "Напр. 2.65" : "0.00"}
                              onChange={(e) => {
                                const bgnValStr = e.target.value;
                                setBgnInputValue(bgnValStr);
                                const bgnNum = Number(bgnValStr);
                                if (!isNaN(bgnNum)) {
                                  field.onChange(convertBgnToEur(bgnNum));
                                }
                              }}
                              className="border-blue-200 bg-blue-50/30 pr-12 text-blue-900 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                            />
                          )}
                          <div
                            className={cn(
                              "absolute inset-y-0 right-3 flex items-center text-xs font-semibold",
                              currencyMode === "EUR"
                                ? "text-zinc-500"
                                : "text-blue-600 dark:text-blue-400"
                            )}
                          >
                            {currencyMode}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        {(() => {
                          const bgnText =
                            currencyMode === "EUR"
                              ? `Конвертира автоматично в лв. (≈ ${equivalentBGN.toFixed(2)} лв).`
                              : `Конвертира автоматично в EUR (≈ ${amountEUR.toFixed(2)} €) — записва се в EUR.`;

                          const t = form.watch("expenseType");
                          if (
                            !isFuel &&
                            (t === "accommodation" || t === "entry_fee")
                          ) {
                            return (
                              <>
                                <span>{bgnText}</span>
                                <span className="mt-1.5 block rounded bg-blue-50 p-2 leading-tight text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                                  💡 <strong>Съвет:</strong> Ако въведете{" "}
                                  <strong>0</strong>, системата автоматично ще
                                  вземе общата сума от първоначалните ви
                                  настройки в Заповедта (Нареждането).
                                </span>
                              </>
                            );
                          }
                          return bgnText;
                        })()}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="documentDate"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Дата на фактурата</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? field.value.split("T")[0] : ""}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (!isNaN(date.getTime())) {
                              field.onChange(date.toISOString());
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="documentNumber"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>№ на Фактура / Касов бон</FormLabel>
                      <FormControl>
                        <Input placeholder="0001234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="supplierName"
                  render={({ field }: any) => (
                    <FormItem className="col-span-1 sm:col-span-2">
                      <FormLabel>
                        Име на доставчик (Хотел, Бензиностанция и др.)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Напр. Лукойл България" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("expenseType") === "accommodation" && (
                  <div className="col-span-1 sm:col-span-2 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                    <div className="flex items-center gap-2">
                      <Moon className="size-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                        Период и дати на нощувката (от състезанието)
                      </span>
                    </div>

                    <FormField
                      control={form.control as any}
                      name="stayDate"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            За коя дата / нощ от състезанието е нощувката?
                          </FormLabel>
                          {nightsList.length > 0 ? (
                            <div className="space-y-2">
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-white dark:bg-zinc-900">
                                    <SelectValue placeholder="Изберете конкретна нощ или период" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Всички нощувки (Обща фактура)">
                                    Всички нощувки (Обща фактура за целия
                                    престой)
                                  </SelectItem>
                                  {nightsList.map((n) => (
                                    <SelectItem key={n.value} value={n.value}>
                                      {n.label}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="Друга дата / Специфичен период">
                                    Друга дата / Специфичен период (ръчно)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {(field.value ===
                                "Друга дата / Специфичен период" ||
                                (field.value &&
                                  !nightsList.some(
                                    (n) => n.value === field.value
                                  ) &&
                                  field.value !==
                                    "Всички нощувки (Обща фактура)")) && (
                                <Input
                                  placeholder="Въведете конкретна дата или нощ (напр. 11.10.2025)"
                                  value={
                                    field.value ===
                                    "Друга дата / Специфичен период"
                                      ? ""
                                      : field.value
                                  }
                                  onChange={(e) =>
                                    field.onChange(e.target.value)
                                  }
                                  className="bg-white text-xs dark:bg-zinc-900"
                                />
                              )}
                            </div>
                          ) : (
                            <FormControl>
                              <Input
                                placeholder="напр. 11.10.2025 г. или 10-12.10.2025 г."
                                {...field}
                                className="bg-white dark:bg-zinc-900"
                              />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control as any}
                  name="attachmentFile"
                  render={({ field: { value, onChange } }) => {
                    const currentAttachmentUrl = form.watch("attachmentUrl");
                    const attachedFile = value && value[0] ? value[0] : null;

                    return (
                      <FormItem className="col-span-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            <span>Прикачен документ / касова бележка</span>
                            <span className="text-[10px] font-normal text-zinc-500">
                              (опционално)
                            </span>
                          </FormLabel>
                          {isOcrRunning && (
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              <Loader2 className="size-3.5 animate-spin" />
                              {ocrProgressText || "Анализ на документа..."}
                            </span>
                          )}
                        </div>

                        <FormControl>
                          <div className="space-y-3">
                            {/* Скрит файл инпут за избор на файл */}
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  onChange(e.target.files);
                                  handleFileUpload(e.target.files);
                                }
                              }}
                            />

                            {/* Бутони: 📸 Сканирай с камера и 📁 Прикачи PDF / Снимка */}
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsScannerOpen(true)}
                                disabled={isOcrRunning}
                                className="group relative flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50/50 font-medium text-emerald-700 transition-all hover:border-emerald-500/50 hover:bg-emerald-100/60 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                              >
                                <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm transition-transform group-hover:scale-105">
                                  <Camera className="size-3.5" />
                                </div>
                                <span className="text-xs sm:text-sm">
                                  Сканирай с камера
                                </span>
                                <span className="ml-auto flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <QrCode className="size-3" />
                                  QR
                                </span>
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isOcrRunning}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                <div className="flex size-6 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
                                  <FileUp className="size-3.5" />
                                </div>
                                <span className="text-xs sm:text-sm">
                                  Прикачи PDF / Снимка
                                </span>
                              </Button>
                            </div>

                            {/* Банер за автоматично разпознати данни от OCR / QR */}
                            {ocrSummary && (
                              <div className="flex items-start gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 p-2.5 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                                <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                <div className="flex-1 space-y-0.5">
                                  <p className="font-semibold text-blue-950 dark:text-blue-200">
                                    Автоматично извлечена информация:
                                  </p>
                                  <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                                    {ocrSummary.replace(
                                      "Автоматично извлечени данни: ",
                                      ""
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Показване на прикачения файл (току-що избран или съществуващ в облака) */}
                            {(attachedFile || currentAttachmentUrl) && (
                              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <div className="flex items-center gap-2 min-w-0">
                                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                  <span className="truncate font-medium">
                                    {attachedFile
                                      ? attachedFile.name
                                      : "Прикачен документ в облака"}
                                  </span>
                                  {attachedFile && (
                                    <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">
                                      ({(attachedFile.size / 1024).toFixed(0)}{" "}
                                      KB)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {currentAttachmentUrl && (
                                    <a
                                      href={currentAttachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100"
                                    >
                                      Преглед
                                      <ExternalLink className="size-3" />
                                    </a>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      onChange(undefined);
                                      form.setValue("attachmentUrl", "");
                                      setOcrSummary(null);
                                    }}
                                    className="size-7 text-zinc-400 hover:text-red-500"
                                    title="Премахни документа"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-[10px] text-zinc-500">
                          Поддържа PDF фактури, снимки и автоматично сканиране
                          на НАП QR код от касови бележки.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>

            {/* Fixed Sticky Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl px-5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="h-10 rounded-xl bg-zinc-900 px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Качване...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-3.5" />
                    {expenseToEdit ? "Запази промените" : "Добави разход"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Модал за сканиране с камера (телефон / лаптоп) */}
      <DocumentCameraScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onCapture={(file, preParsedData) => {
          handleFileUpload([file], preParsedData);
        }}
      />
    </Dialog>
  );
}
