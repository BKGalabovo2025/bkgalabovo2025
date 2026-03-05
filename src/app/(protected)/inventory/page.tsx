'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types";
import { PlusCircle, Edit, Trash2, ImageIcon, Loader2 } from 'lucide-react';
import { EditProductDialog } from '@/components/inventory/EditProductDialog';
import { useAuth } from '@/context/auth-context';
import { formatPrice } from '@/lib/currency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryHistory from '@/components/inventory/InventoryHistory';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ProductList = () => {
    const { products, isLoading, error, deleteProduct } = useProducts();
    const { user } = useAuth();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsEditOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (productToDelete) {
            await deleteProduct(productToDelete.id);
            setProductToDelete(null);
        }
    };

    const handleProductUpdate = () => {
        setIsEditOpen(false);
        setSelectedProduct(null);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Зареждане...</p></div>;
    }

    if (error) {
        return <p className="text-destructive text-center py-4">Грешка при зареждане на продуктите.</p>;
    }

    return (
         <AlertDialog>
            <div className="hidden md:grid grid-cols-12 gap-4 items-center font-semibold text-muted-foreground border-b pb-2 mb-2">
                <div className="col-span-1">Снимка</div>
                <div className="col-span-5">Име</div>
                <div className="col-span-2 text-right">Цена</div>
                <div className="col-span-2 text-right">Наличност</div>
                <div className="col-span-2 text-center">Действия</div>
            </div>

            <div className="space-y-3">
                {products.length > 0 ? products.map((product) => (
                    <div key={product.id} className="grid grid-cols-3 md:grid-cols-12 gap-4 items-center p-3 border rounded-lg bg-card shadow-sm">
                        <div className="col-span-1 md:col-span-1 flex items-center">
                             <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                 {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="w-full h-full object-cover rounded-md" /> : <ImageIcon className="text-muted-foreground" />}
                             </div>
                        </div>
                        <div className="col-span-2 md:col-span-5 font-medium break-words">{product.name}</div>
                        <div className="col-span-3 md:col-span-4 grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                             <div className="md:text-right"><span className="font-bold md:hidden">Цена: </span>{formatPrice(product.price * 100)}</div>
                             <div className="md:text-right"><span className="font-bold md:hidden">Наличност: </span>{product.stock}</div>
                        </div>
                        <div className="col-span-3 md:col-span-2 flex justify-end md:justify-center items-center space-x-1">
                             <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="h-5 w-5 text-muted-foreground" /></Button>
                             <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                             </AlertDialogTrigger>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-muted-foreground">Няма намерени продукти.</div>
                )}
            </div>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Това ще изтрие перманентно продукта &quot;{productToDelete?.name}&quot;. Това действие не може да бъде отменено.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProductToDelete(null)}>Отказ</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            
            {(isEditOpen || selectedProduct) && (
                 <EditProductDialog
                    isOpen={isEditOpen}
                    onClose={() => {setIsEditOpen(false); setSelectedProduct(null)}}
                    product={selectedProduct}
                    user={user}
                    onProductUpdate={handleProductUpdate}
                 />
            )}
         </AlertDialog>
    )
}

const InventoryPage = () => {
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleProductAdded = () => {
      setIsAddOpen(false);
  };

  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Управление на инвентара</h1>
            <Button onClick={() => setIsAddOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Добави продукт
            </Button>
        </div>

        <Tabs defaultValue="stock" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stock">Наличност</TabsTrigger>
                <TabsTrigger value="history">История на инвентара</TabsTrigger>
            </TabsList>
            <TabsContent value="stock" className="mt-4">
                <ProductList />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                <InventoryHistory />
            </TabsContent>
        </Tabs>
        
        <EditProductDialog
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            product={null}
            user={user}
            onProductUpdate={handleProductAdded}
        />
    </div>
  );
};

export default InventoryPage;
