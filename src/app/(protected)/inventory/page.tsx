
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/services/inventory-service';
import { Product } from '@/types';
import { PlusCircle, Edit, Trash, Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { ProductForm } from '@/components/inventory/product-form';

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Грешка при зареждане на продуктите:', error);
      toast({ title: "Грешка при зареждане", description: "Неуспешно зареждане на продуктите от базата данни.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (data: Omit<Product, 'id'>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast({ title: "Продуктът е обновен", description: "Данните бяха успешно актуализирани." });
      } else {
        await addProduct(data);
        toast({ title: "Продуктът е добавен", description: "Новият продукт беше успешно записан." });
      }
      fetchProducts(); // Re-fetch to get the latest list
      closeDialog();
    } catch (error) {
      console.error('Грешка при запис на продукт:', error);
      toast({ title: "Грешка при запис", description: "Възникна грешка при запазването на продукта.", variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id)); // Optimistic update is fine here after confirmation
      toast({ title: "Продуктът е изтрит", description: "Избраният продукт беше успешно изтрит." });
      setProductToDelete(null);
    } catch (error) {
      console.error('Грешка при изтриване на продукт:', error);
      toast({ title: "Грешка при изтриване", description: "Възникна грешка при изтриването на продукта.", variant: "destructive" });
    }
  };

  const openDialog = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Зареждане на продукти...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Магазин и инвентар</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}> <PlusCircle className="mr-2 h-4 w-4" /> Добави продукт</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Редактиране на продукт' : 'Добавяне на нов продукт'}</DialogTitle>
              <DialogDescription>Попълнете информацията по-долу. Натиснете "Запази", когато сте готови.</DialogDescription>
            </DialogHeader>
            <ProductForm product={editingProduct} onSave={handleSaveProduct} onClose={closeDialog} />
          </DialogContent>
        </Dialog>
      </div>
      
      <AlertDialog>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Снимка</TableHead>
                <TableHead>Име</TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead className="text-right">Наличност</TableHead>
                <TableHead className="w-[150px] text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                      {product.imageUrl ? (
                          <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden">
                              <Image src={product.imageUrl} alt={product.name} fill sizes="64px" className="object-cover" />
                          </div>
                      ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                      )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{(product.price || 0).toFixed(2)} лв.</TableCell>
                  <TableCell className="text-right">{product.stock || 0} бр.</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(product)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}><Trash className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && !loading && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">Няма добавени продукти.</TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Наистина ли искате да изтриете този продукт?</AlertDialogTitle>
                <AlertDialogDescription>Това действие е необратимо. Продуктът ще бъде изтрит завинаги от инвентара.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setProductToDelete(null)}>Отказ</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryPage;
