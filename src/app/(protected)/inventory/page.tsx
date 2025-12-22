'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { getProducts, deleteProduct } from "@/services/inventory-service";
import { Product } from "@/types";
import { PlusCircle, Edit, Trash2, ImageIcon } from 'lucide-react';
import { EditProductDialog } from '@/components/inventory/EditProductDialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryHistory from '@/components/inventory/InventoryHistory';
import { useAuth } from '@/context/auth-context';
import { User } from 'firebase/auth';
import { formatCurrency } from '@/lib/currency'; // <-- ИМПОРТИРАНЕ НА ФУНКЦИЯТА

// A self-contained component for the product list for better organization
const ProductList = ({ user }: { user: User | null }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);
            setError(null);
        } catch (err) {
            setError("Грешка при зареждането на продуктите.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Сигурни ли сте, че искате да изтриете този продукт?")) {
            try {
                await deleteProduct(id);
                toast({ title: "Успех!", description: "Продуктът беше изтрит." });
                await fetchProducts(); // Refresh the list
            } catch (err) {
                toast({ title: "Грешка", description: "Възникна грешка при изтриването.", variant: "destructive" });
                console.error(err);
            }
        }
    };
    
    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setSelectedProduct(null);
    }

    return (
         <>
             {/* Header for larger screens */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center font-semibold text-muted-foreground border-b pb-2 mb-2">
                <div className="col-span-1">Снимка</div>
                <div className="col-span-5">Име</div>
                <div className="col-span-2 text-right">Цена</div>
                <div className="col-span-2 text-right">Наличност</div>
                <div className="col-span-2 text-center">Действия</div>
            </div>

            {/* Product List */}
            <div className="space-y-3">
                {loading && <p className="text-center py-4">Зареждане...</p>}
                {error && <p className="text-destructive text-center py-4">{error}</p>}
                {!loading && !error && products.map((product) => (
                    <div key={product.id} className="grid grid-cols-3 md:grid-cols-12 gap-4 items-center p-3 border rounded-lg bg-card shadow-sm">
                        <div className="col-span-1 md:col-span-1 flex items-center">
                             <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                 {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-md" /> : <ImageIcon className="text-muted-foreground" />}
                             </div>
                        </div>
                        <div className="col-span-2 md:col-span-5 font-medium break-words">{product.name}</div>
                        <div className="col-span-3 md:col-span-4 grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                             {/* -- ПРОМЯНА ТУК -- */}
                             <div className="md:text-right"><span className="font-bold md:hidden">Цена: </span>{formatCurrency(product.price)}</div>
                             <div className="md:text-right"><span className="font-bold md:hidden">Наличност: </span>{product.stock} бр.</div>
                        </div>
                        <div className="col-span-3 md:col-span-2 flex justify-end md:justify-center items-center space-x-1">
                             <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}><Edit className="h-5 w-5 text-muted-foreground" /></Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* The Edit Dialog */}
            {selectedProduct && (
                 <EditProductDialog
                    isOpen={isDialogOpen}
                    onClose={handleDialogClose}
                    product={selectedProduct}
                    onProductUpdate={fetchProducts} // This will refresh the product list
                    user={user} // Pass the user object to the dialog
                 />
            )}
        </>
    )
}

const InventoryPage = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the authenticated user

  const handleAdd = () => {
    toast({ title: "Информация", description: "Функцията за добавяне ще бъде имплементирана скоро." });
  };

  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Управление на инвентара</h1>
            <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" /> Добави продукт
            </Button>
        </div>

        <Tabs defaultValue="stock" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stock">Наличности</TabsTrigger>
                <TabsTrigger value="history">История на инвентара</TabsTrigger>
            </TabsList>
            <TabsContent value="stock" className="mt-4">
                <ProductList user={user} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                <InventoryHistory />
            </TabsContent>
        </Tabs>
    </div>
  );
};

export default InventoryPage;
