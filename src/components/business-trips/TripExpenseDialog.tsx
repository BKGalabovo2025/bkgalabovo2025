"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { businessTripService } from "@/services/business-trip-service";
import {
  convertBgnToEur,
  convertEurToBgn,
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
  onSuccess?: () => void;
}

export function TripExpenseDialog({
  open,
  onOpenChange,
  tripId,
  siteId,
  onSuccess,
}: TripExpenseDialogProps) {
  const [isUploading, setIsUploading] = useState(false);

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

  const amountEUR = form.watch("amountEUR");
  const equivalentBGN = amountEUR ? convertEurToBgn(amountEUR) : 0;

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

      await businessTripService.addExpense({
        ...values,
        attachmentUrl: finalAttachmentUrl,
      } as any);

      toast.success("Разходът е добавен успешно!");
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

  // Helper for fast BGN to EUR calculation
  const handleBgnInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bgnValue = Number(e.target.value);
    if (!isNaN(bgnValue)) {
      form.setValue("amountEUR", convertBgnToEur(bgnValue));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавяне на Разход / Фактура</DialogTitle>
          <DialogDescription>
            Прикачете фактури, касови бележки или билети. Всички суми се пазят в
            Евро (€), но можете да използвате калкулатора за лева (BGN).
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
                render={({ field }) => (
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
                        <SelectItem value="other">Други</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Бърз калкулатор (BGN лв.)</FormLabel>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ако бележката е в лева..."
                    onChange={handleBgnInput}
                    value={equivalentBGN || ""}
                    className="border-blue-200 bg-blue-50/30 pr-12 text-blue-900 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-blue-500">
                    BGN
                  </div>
                </div>
                <FormDescription className="text-[10px]">
                  Конвертира автоматично в EUR.
                </FormDescription>
              </div>

              <FormField
                control={form.control as any}
                name="amountEUR"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сума (EUR €)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="pr-12"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-zinc-400">
                          EUR
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Сумата, която ще се запази (≈ {equivalentBGN.toFixed(2)}{" "}
                      лв).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="documentDate"
                render={({ field }) => (
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
                name="supplierName"
                render={({ field }) => (
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
                name="documentNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2">
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
                name="attachmentFile"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Прикачи снимка/скан (опционално)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                          className="file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                        />
                        <FileUp className="size-5 text-zinc-400" />
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
