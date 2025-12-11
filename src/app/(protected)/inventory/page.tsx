
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/services/inventory-service';
import { Product } from '@/types';
import { PlusCircle, Edit, Trash, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

// Помощна функция за валидация на URL
const isValidUrl = (urlString: string): boolean => {
    try {
        new URL(urlString);
        return true;
    } catch (e) {
        return false;
    }
};

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', imageUrl: '' });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openDialog = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setFormData({ name: product.name, price: String(product.price || ''), stock: String(product.stock || ''), imageUrl: product.imageUrl || '' });
    } else {
      setFormData({ name: '', price: '', stock: '', imageUrl: '' });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const productData = {
            name: formData.name,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock, 10) || 0,
            imageUrl: isValidUrl(formData.imageUrl) ? formData.imageUrl : '',
        };

        if (editingProduct) {
            await updateProduct(editingProduct.id, productData);
            setProducts(products.map(p => (p.id === editingProduct.id ? { id: editingProduct.id, ...productData } : p)));
        } else {
            const newProductId = await addProduct(productData);
            setProducts([...products, { id: newProductId, ...productData }]);
        }

        closeDialog();
    } catch (error) {
        console.error('Failed to save product:', error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете този продукт?')) {
        try {
            await deleteProduct(productId);
            setProducts(products.filter(p => p.id !== productId));
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    }
  };

  if (loading) {
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
        <Button onClick={() => openDialog()}> <PlusCircle className="mr-2 h-4 w-4" /> Добави продукт</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Снимка</TableHead>
              <TableHead>Име</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead className="text-right">Наличност</TableHead>
              <TableHead className="w-[150px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                    {product.imageUrl && isValidUrl(product.imageUrl) ? (
                        <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                             <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                    )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{(product.price || 0).toFixed(2)} лв.</TableCell>
                <TableCell className="text-right">{product.stock || 0} бр.</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(product)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}><Trash className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Редактиране на продукт' : 'Добавяне на нов продукт'}</DialogTitle>
             <DialogDescription>
                Попълнете информацията по-долу. Натиснете "Запази", когато сте готови.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="name">Име на продукта</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="price">Цена (лв.)</Label>
                        <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="stock">Наличност (бр.)</Label>
                        <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} required />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL на снимка на продукта</Label>
                    <div className="flex items-center space-x-2">
                        <Input id="imageUrl" name="imageUrl" placeholder="https_//..." value={formData.imageUrl} onChange={handleInputChange} className="flex-grow" />
                         <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className={!isValidUrl(formData.imageUrl) ? 'pointer-events-none opacity-50' : ''}>
                            <Button type="button" variant="outline" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                    </div>
                </div>
                
                {isValidUrl(formData.imageUrl) && (
                    <div className="mt-4">
                        <Label>Преглед на снимката</Label>
                        <div className="relative w-full h-48 mt-2 bg-gray-100 rounded-md overflow-hidden">
                            <Image src={formData.imageUrl} alt="Image Preview" fill className="object-contain" />
                        </div>
                    </div>
                )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Отказ</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? 'Запази промените' : 'Създай продукт'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
