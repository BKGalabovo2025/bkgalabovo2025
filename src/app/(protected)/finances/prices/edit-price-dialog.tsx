"use client";

import { useState, useTransition } from "react";
import { Price } from "@/types/index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { updatePrice } from "@/services/price-service";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/currency";

interface EditPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  price: Price;
  onPriceUpdated: (updatedPrice: Price) => void;
}

export function EditPriceDialog({
  isOpen,
  onClose,
  price,
  onPriceUpdated,
}: EditPriceDialogProps) {
  const [newValue, setNewValue] = useState(price.value); // Display in EUR directly
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Грешка", {
        description: "Трябва да сте влезли, за да извършите тази операция.",
      });
      return;
    }

    const newValueRounded = Math.round(newValue);
    if (isNaN(newValueRounded) || newValueRounded < 0) {
      toast.error("Грешка", {
        description: "Моля, въведете валидна положителна цена.",
      });
      return;
    }

    startTransition(async () => {
      try {
        await updatePrice(price.id, newValueRounded, user, notes);

        const updatedPriceData: Price = {
          ...price,
          value: newValueRounded,
          updatedAt: new Date().toISOString(),
          updatedBy: {
            userId: user.uid,
            userName: user.displayName || user.email || "System",
          },
        };

        toast.success("Успех!", {
          description: `Цената на "${price.name}" беше актуализирана.`,
        });
        onPriceUpdated(updatedPriceData);
        onClose();
      } catch (error) {
        console.error(error);
        toast.error("Грешка", {
          description: "Възникна грешка при актуализиране на цената.",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактиране на цена</DialogTitle>
          <DialogDescription>
            Актуализирайте стойността на цената и добавете бележка за промяната.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-lg font-semibold">{price.name}</p>
          <p className="text-sm text-muted-foreground">{price.description}</p>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label>Текуща цена:</Label>
            <span className="text-lg font-bold">
              {formatPrice(price.value)}
            </span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <Label htmlFor="new-price">Нова цена (в {price.currency}):</Label>
            <Input
              id="new-price"
              type="number"
              step="1"
              value={newValue}
              onChange={(e) => setNewValue(parseInt(e.target.value, 10))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Причина за промяната (бележки):</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Напр. 'Промяна съгласно решение на УС от 01.01.2024'"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Отказ
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Запази промяната
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
