/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { UniversalMediaUpload } from "@/components/shared/media/UniversalMediaUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGeneralServiceAction } from "@/lib/actions/general-services-server";
import { useAppStore } from "@/store/use-app-store";

interface AddGeneralServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddGeneralServiceDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: AddGeneralServiceDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pricingUnit, setPricingUnit] = useState<
    "fixed" | "per_hour" | "per_session"
  >("fixed");
  const [performerName, setPerformerName] = useState("");
  const [performerType, setPerformerType] = useState<"internal" | "external">(
    "internal"
  );
  const [imageUrl, setImageUrl] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const { activeBranch } = useAppStore();

  const handleAdd = async () => {
    if (!name || !price || !performerName) {
      toast.error("Грешка", {
        description:
          "Моля попълнете задължителните полета (Име, Цена, Изпълнител).",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const serviceData = {
        name,
        description,
        price: parseFloat(price),
        pricingUnit,
        performerName,
        performerType,
        imageUrl: imageUrl || null,
        currency: "EUR" as const,
        siteId: activeBranch || "bkgalabovo",
      };

      const result = await createGeneralServiceAction(serviceData);

      if (result.success) {
        toast.success("Успех!", {
          description: "Услугата е създадена успешно.",
        });
        onSuccess();
        onClose();
        // Clear form
        setName("");
        setDescription("");
        setPrice("");
        setPricingUnit("fixed");
        setPerformerName("");
        setPerformerType("internal");
        setImageUrl("");
      } else {
        toast.error("Грешка", { description: result.error });
      }
    } catch (error) {
      toast.error("Грешка при добавяне", {
        description: (error as Error).message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-2xl lg:max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-zinc-100">
                Добавяне на клубна услуга
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Въведете детайлите за новата услуга, изпълнител и
                ценообразуване.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            {/* Left Column: Service Details */}
            <div className="space-y-3.5 sm:space-y-4 md:col-span-7">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  Име на услугата *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="напр. Наем на корт"
                  className="h-9.5 rounded-xl text-xs sm:text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="price"
                    className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    Цена (EUR) *
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-9.5 rounded-xl text-xs sm:text-sm"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pricingUnit"
                    className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    Ценообразуване *
                  </Label>
                  <Select
                    name="pricingUnit"
                    value={pricingUnit}
                    onValueChange={(val: any) => setPricingUnit(val)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger
                      id="pricingUnit"
                      className="h-9.5 rounded-xl border-zinc-200 bg-zinc-50 text-xs sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <SelectValue placeholder="Избери..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="fixed">Фиксирана сума</SelectItem>
                      <SelectItem value="per_hour">На час</SelectItem>
                      <SelectItem value="per_session">На сесия</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="performerName"
                    className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    Изпълнител *
                  </Label>
                  <Input
                    id="performerName"
                    name="performerName"
                    value={performerName}
                    onChange={(e) => setPerformerName(e.target.value)}
                    placeholder="Име на треньор/клуб"
                    className="h-9.5 rounded-xl text-xs sm:text-sm"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="performerType"
                    className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    Тип изпълнител *
                  </Label>
                  <Select
                    name="performerType"
                    value={performerType}
                    onValueChange={(val: any) => setPerformerType(val)}
                    disabled={isProcessing}
                  >
                    <SelectTrigger
                      id="performerType"
                      className="h-9.5 rounded-xl border-zinc-200 bg-zinc-50 text-xs sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <SelectValue placeholder="Избери..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="internal">Вътрешен (Клуб)</SelectItem>
                      <SelectItem value="external">Външен партньор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  Описание (Опционално)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Допълнителни детайли за услугата..."
                  className="resize-none rounded-xl text-xs sm:text-sm leading-relaxed"
                  rows={2}
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Right Column: Media Upload */}
            <div className="flex flex-col justify-start md:col-span-5">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-900/30">
                <UniversalMediaUpload
                  id="service-imageUrl"
                  label="Снимка / Изображение"
                  description="PNG, JPG, WEBP (до 800KB)"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  storageFolder="services"
                  placeholderUrl="Линк към снимка на услугата..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="h-9 rounded-xl border-zinc-200 px-4 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Отказ
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={isProcessing}
            className="h-9 rounded-xl bg-zinc-950 px-5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {isProcessing && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Добави услуга
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
