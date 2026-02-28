
// src/app/(protected)/finances/prices/edit-price-dialog.tsx

'use client';

import { useState, useTransition } from 'react';
import { Price } from '@/types/index';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { updatePrice } from '@/services/price-service';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

interface EditPriceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  price: Price;
  onPriceUpdated: (updatedPrice: Price) => void;
}

export function EditPriceDialog({ isOpen, onClose, price, onPriceUpdated }: EditPriceDialogProps) {
  const [newValue, setNewValue] = useState(price.value / 100); // Display in EUR, not cents
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Грешка", description: "Трябва да сте влезли, за да извършите тази операция.", variant: 'destructive' });
      return;
    }

    const newValueInCents = Math.round(newValue * 100);
    if (isNaN(newValueInCents) || newValueInCents < 0) {
        toast({ title: "Грешка", description: "Моля, въведете валидна положителна цена.", variant: 'destructive' });
        return;
    }

    startTransition(async () => {
      try {
        await updatePrice(price.id, newValueInCents, user, notes);
        
        const updatedPriceData: Price = {
            ...price,
            value: newValueInCents,
            updatedAt: new Date().toISOString(),
            updatedBy: { userId: user.uid, userName: user.displayName || user.email || 'System' }
        };

        toast({ title: "Успех!", description: `Цената на "${price.name}" беше актуализирана.` });
        onPriceUpdated(updatedPriceData);
        onClose();
      } catch (error) {
        console.error(error);
        toast({ title: "Грешка", description: "Възникна грешка при актуализиране на цената.", variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактиране на цена</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <p className="font-semibold text-lg">{price.name}</p>
            <p className="text-sm text-muted-foreground">{price.description}</p>
            <div className="grid grid-cols-2 gap-4 items-center">
                <Label>Текуща цена:</Label>
                <span className="font-bold text-lg">{formatPrice(price.value, price.currency)}</span>
            </div>
             <div className="grid grid-cols-2 gap-4 items-center">
                <Label htmlFor="new-price">Нова цена (в {price.currency}):</Label>
                <Input 
                    id="new-price"
                    type="number"
                    step="0.01"
                    value={newValue}
                    onChange={(e) => setNewValue(parseFloat(e.target.value))}
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
            <Button variant="outline" disabled={isPending}>Отказ</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            Запази промяната
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
