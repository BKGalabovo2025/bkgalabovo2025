'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink } from 'lucide-react';
import { Product } from "@/types";

// Схема за валидация с Zod
const productFormSchema = z.object({
  name: z.string().min(3, { message: "Името на продукта трябва да е поне 3 символа." }),
  price: z.coerce.number().positive({ message: "Цената трябва да е положително число." }),
  stock: z.coerce.number().int().min(0, { message: "Наличността не може да е отрицателна." }),
  imageUrl: z.string().url({ message: "Моля, въведете валиден URL." }).or(z.literal('')).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Помощна функция за валидация на URL
const isValidUrl = (urlString: string): boolean => {
    try {
        new URL(urlString);
        return true;
    } catch (e) {
        return false;
    }
};

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: Omit<Product, 'id' | 'productId'>) => Promise<void> | void;
  onClose: () => void;
}

export function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? { ...product, price: product.price || 0, stock: product.stock || 0 } : {
        name: '',
        price: 0,
        stock: 0,
        imageUrl: '',
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    onSave(data);
  };

  const isEditing = !!product;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Име на продукта</FormLabel>
              <FormControl>
                <Input placeholder="Напр. Тениска, бутилка вода..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Цена (лв.)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Наличност (бр.)</FormLabel>
                        <FormControl>
                            <Input type="number" step="1" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL на снимка (опционално)</FormLabel>
                <div className="flex items-center space-x-2">
                    <FormControl>
                        <Input placeholder="https_//..." {...field} />
                    </FormControl>
                    <a href={field.value || ''} target="_blank" rel="noopener noreferrer" className={!field.value || !isValidUrl(field.value) ? 'pointer-events-none opacity-50' : ''}>
                        <Button type="button" variant="outline" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                    </a>
                </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Отказ</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Запази промените' : 'Създай продукт'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
