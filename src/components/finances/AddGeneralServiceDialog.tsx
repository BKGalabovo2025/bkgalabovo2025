"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createGeneralServiceAction } from "@/lib/actions/general-services-server";
import { useAppStore } from "@/store/use-app-store";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [pricingUnit, setPricingUnit] = useState<"fixed" | "per_hour" | "per_session">("fixed");
  const [performerName, setPerformerName] = useState("");
  const [performerType, setPerformerType] = useState<"internal" | "external">("internal");
  const [imageUrl, setImageUrl] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const { activeBranch } = useAppStore();

  const handleAdd = async () => {
    if (!name || !price || !performerName) {
      toast.error("Грешка", {
        description: "Моля попълнете задължителните полета (Име, Цена, Изпълнител).",
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
        toast.success("Успех!", { description: "Услугата е създадена успешно." });
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
      <DialogContent className="sm:max-w-[480px] rounded-4xl p-8 bg-white dark:bg-zinc-950 border-none shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50">
            Добавяне на услуга
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            Въведете детайлите за новата клубна услуга.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 mt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Име на услугата *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Наем на корт"
              className="rounded-xl h-11"
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="price" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Цена (EUR) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="rounded-xl h-11"
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pricingUnit" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Ценообразуване *
              </Label>
              <Select
                value={pricingUnit}
                onValueChange={(val: any) => setPricingUnit(val)}
                disabled={isProcessing}
              >
                <SelectTrigger className="rounded-xl h-11 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
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
              <Label htmlFor="performerName" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Изпълнител *
              </Label>
              <Input
                id="performerName"
                value={performerName}
                onChange={(e) => setPerformerName(e.target.value)}
                placeholder="Име на треньор/клуб"
                className="rounded-xl h-11"
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="performerType" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Тип изпълнител *
              </Label>
              <Select
                value={performerType}
                onValueChange={(val: any) => setPerformerType(val)}
                disabled={isProcessing}
              >
                <SelectTrigger className="rounded-xl h-11 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
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
            <Label htmlFor="imageUrl" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Изображение URL (Снимка)
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Линк към снимка на услугата..."
              className="rounded-xl h-11"
              disabled={isProcessing}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Описание (Опционално)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Допълнителни детайли..."
              className="rounded-xl min-h-[100px] resize-none"
              disabled={isProcessing}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl px-6 h-11"
          >
            Отказ
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isProcessing}
            className="rounded-xl px-6 h-11 bg-zinc-950 text-white hover:bg-zinc-800"
          >
            Добави услуга
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
