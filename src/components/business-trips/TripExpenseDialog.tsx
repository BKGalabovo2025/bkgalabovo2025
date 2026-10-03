"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import { cn } from "@/lib/utils";
import { businessTripService } from "@/services/business-trip-service";
import {
  convertBgnToEur,
  convertEurToBgn,
  TripExpense,
  TripExpenseSchema,
} from "@/types/business-trip.types";

const FormSchema = TripExpenseSchema.extend({
  attachmentFile: z.any().optional(), // File type from input
});

type FormValues = z.infer<typeof FormSchema>;

export interface TripExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  siteId: string;
  expenseToEdit?: TripExpense | null;
  onSuccess?: () => void;
}

export function TripExpenseDialog({
  open,
  onOpenChange,
  tripId,
  siteId,
  expenseToEdit,
  onSuccess,
}: TripExpenseDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<"EUR" | "BGN">("EUR");
  const [bgnInputValue, setBgnInputValue] = useState<string>("");

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
      attachmentUrl: "",
    },
  });

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
            file
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

  // Tesseract OCR parser
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check if it's an image
    if (!file.type.startsWith("image/")) return;

    setIsOcrRunning(true);
    const ocrToast = toast.loading("Сканиране с изкуствен интелект (OCR)...");

    try {
      const result = await Tesseract.recognize(file, "bul+eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress > 0) {
            // Optional: could update toast message with progress
          }
        },
      });

      const text = result.data.text.toUpperCase();
      console.log("OCR Extracted Text:\n", text);

      // Search for amounts like ОБЩО: 125.50 or TOTAL: 125.50 or СУМА: 125.50
      const lines = text.split("\n");
      let maxAmount = 0;

      for (const line of lines) {
        if (
          line.includes("ОБЩО") ||
          line.includes("СУМА") ||
          line.includes("TOTAL") ||
          line.includes("EUR") ||
          line.includes("BGN") ||
          line.includes("ЛВ")
        ) {
          // Extract numbers (e.g. 125.50, 125,50)
          const matches = line.match(/\b\d+[.,]\d{2}\b/g);
          if (matches) {
            for (const match of matches) {
              const num = parseFloat(match.replace(",", "."));
              if (num > maxAmount) maxAmount = num;
            }
          }
        }
      }

      if (maxAmount > 0) {
        toast.success(
          `OCR: Намерена е сума ${maxAmount} лв. Моля, проверете!`,
          { id: ocrToast }
        );
        // Automatically assume BGN for BG receipts, so convert to EUR
        form.setValue("amountEUR", convertBgnToEur(maxAmount));
        setBgnInputValue(String(maxAmount));
        setCurrencyMode("BGN");
      } else {
        toast.info(
          "OCR: Не успяхме да открием сумата. Моля, въведете я ръчно.",
          { id: ocrToast }
        );
      }
    } catch (e) {
      console.error("OCR Error", e);
      toast.error("Грешка при сканиране на бележката.", { id: ocrToast });
    } finally {
      setIsOcrRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expenseToEdit ? "Редактиране на разход" : "Добавяне на разход"}
          </DialogTitle>
          <DialogDescription>
            {expenseToEdit
              ? "Променете данните за разхода по-долу."
              : "Въведете детайли за направен разход по време на командировката (гориво, нощувка или др.)"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
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
                                convertEurToBgn(Number(field.value)).toFixed(2)
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
                                вземе общата сума от първоначалните ви настройки
                                в Заповедта (Нареждането).
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
                  <FormItem className="col-span-2">
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

              <FormField
                control={form.control as any}
                name="attachmentFile"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Прикачи снимка/скан (опционално)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          capture="environment"
                          onChange={(e) => {
                            onChange(e.target.files);
                            handleFileUpload(e.target.files);
                          }}
                          {...field}
                          className="file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                        {isOcrRunning ? (
                          <Loader2 className="size-5 animate-spin text-blue-500" />
                        ) : (
                          <FileUp className="size-5 text-zinc-400" />
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Снимката ще бъде качена сигурно в облака.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Отказ
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Качване...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Добави разход
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
