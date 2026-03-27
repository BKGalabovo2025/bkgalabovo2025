'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { Product } from "@/types";
import { restockProduct, updateProductPrice, adjustProductStock } from '@/services/inventory-service';
import { User } from 'firebase/auth';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/currency';

interface EditProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: () => void;
  user: User | null;
}

export const EditProductDialog = ({ product, isOpen, onClose, onProductUpdate, user }: EditProductDialogProps) => {
  const [restockAmount, setRestockAmount] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const getUserInfo = () => {
    if (!user) {
        toast({ title: "Грешка", description: "Трябва да сте логнат, за да извършите тази операция.", variant: "destructive" });
        return null;
    }
    return { userId: user.uid, userName: user.displayName || user.email || "Анонимен потребител" };
  };

  const handleRestock = async () => {
    const userInfo = getUserInfo();
    if (!product || !restockAmount || !userInfo) return;
    const amount = parseInt(restockAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Грешка", description: "Моля, въведете валидно положително число за презареждане.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      await restockProduct(product.id, amount, userInfo.userId, userInfo.userName);
      toast({ title: "Успех!", description: `Артикулът '${product.name}' беше презареден с ${amount} бр.` });
      onProductUpdate();
      onClose();
    } catch (error) {
      toast({ title: "Грешка при презареждане", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setRestockAmount("");
    }
  };
  
  const handleAdjustment = async () => {
    const userInfo = getUserInfo();
    if (!product || !adjustmentAmount || !userInfo) return;

    const amount = parseInt(adjustmentAmount, 10);

    if (isNaN(amount) || amount === 0) {
        toast({ title: "Грешка", description: "Моля, въведете валидно, ненулево число за корекция.", variant: "destructive" });
        return;
    }

    if (amount < 0 && !adjustmentNotes) {
        toast({ title: "Грешка", description: "При отписване на количества, бележката е задължителна.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    try {
        await adjustProductStock(product.id, amount, userInfo.userId, userInfo.userName, adjustmentNotes);
        toast({ title: "Успех!", description: `Наличността на '${product.name}' беше коригирана с ${amount} бр.` });
        onProductUpdate();
        onClose();
    } catch (error) {
        toast({ title: "Грешка при корекция", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
        setAdjustmentAmount("");
        setAdjustmentNotes("");
    }
  };

  const handlePriceUpdate = async () => {
    const userInfo = getUserInfo();
    if (!product || !newPrice || !userInfo) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: "Грешка", description: "Моля, въведете валидна, неотрицателна цена.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      await updateProductPrice(product.id, price, userInfo.userId, userInfo.userName);
      toast({ title: "Успех!", description: `Цената на '${product.name}' беше актуализирана.` });
      onProductUpdate();
      onClose();
    } catch (error) {
      toast({ title: "Грешка при актуализация на цената", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setNewPrice("");
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Редактиране на: {product.name}</DialogTitle>
           <p className="text-sm text-gray-500 pt-1">Текуща наличност: <strong>{product.stock} бр.</strong> | Текуща цена: <strong>{formatPrice(product.price)}</strong></p>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 gap-y-6">
          
          <div className="space-y-2">
            <h3 className="font-semibold">Презареждане</h3>
            <div className="flex items-center space-x-2">
              <Input id="restock-amount" type="number" placeholder="Количество (напр. 10)" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)} disabled={isProcessing}/>
              <Button onClick={handleRestock} disabled={isProcessing || !restockAmount}>Презареди</Button>
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          <div className="space-y-2">
             <h3 className="font-semibold">Корекция / Отписване</h3>
             <p className="text-sm text-gray-500">Използвайте отрицателно число за отписване (напр. -5).</p>
             <div className="flex items-center space-x-2">
                 <Input id="adjustment-amount" type="number" placeholder="Количество" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} disabled={isProcessing}/>
                 <Button onClick={handleAdjustment} disabled={isProcessing || !adjustmentAmount}>Коригирай</Button>
             </div>
             <Textarea id="adjustment-notes" placeholder="Причина (задължително при отписване)..." value={adjustmentNotes} onChange={(e) => setAdjustmentNotes(e.target.value)} disabled={isProcessing} className="mt-2"/>
          </div>

          <div className="border-t border-gray-200"></div>

          <div className="space-y-2">
            <h3 className="font-semibold">Актуализация на цена</h3>
            <div className="flex items-center space-x-2">
                <Input id="new-price" type="number" placeholder="Нова цена" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} disabled={isProcessing}/>
                <Button onClick={handlePriceUpdate} disabled={isProcessing || !newPrice}>Актуализирай</Button>
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Затвори</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
