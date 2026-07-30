/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { toast } from "sonner";

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
      <DialogContent className="rounded-4xl border-none bg-white p-8 shadow-xl sm:max-w-120 dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50">
            Добавяне на услуга
          </DialogTitle>
          <DialogDescription className="mt-1 font-light text-zinc-400">
            Въведете детайлите за новата клубна услуга.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label
              htmlFor="name"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Име на услугата *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Наем на корт"
              className="h-11 rounded-xl"
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label
                htmlFor="price"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Цена (EUR) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="h-11 rounded-xl"
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="pricingUnit"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Ценообразуване *
              </Label>
              <Select
                value={pricingUnit}
                onValueChange={(val: any) => setPricingUnit(val)}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label
                htmlFor="performerName"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Изпълнител *
              </Label>
              <Input
                id="performerName"
                value={performerName}
                onChange={(e) => setPerformerName(e.target.value)}
                placeholder="Име на треньор/клуб"
                className="h-11 rounded-xl"
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="performerType"
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
              >
                Тип изпълнител *
              </Label>
              <Select
                value={performerType}
                onValueChange={(val: any) => setPerformerType(val)}
                disabled={isProcessing}
              >
                <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <SelectValue placeholder="Избери..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="internal">Вътрешен (Клуб)</SelectItem>
                  <SelectItem value="external">Външен партньор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="imageUrl"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Изображение URL (Снимка)
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Линк към снимка на услугата..."
              className="h-11 rounded-xl"
              disabled={isProcessing}
            />
          </div>

          <div className="grid gap-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              Описание (Опционално)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Допълнителни детайли..."
              className="min-h-25 resize-none rounded-xl"
              disabled={isProcessing}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="h-11 rounded-xl px-6"
          >
            Отказ
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isProcessing}
            className="h-11 rounded-xl bg-zinc-950 px-6 text-white hover:bg-zinc-800"
          >
            Добави услуга
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
