'use client'

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink } from 'lucide-react';
import { Product } from "@/types";

// Схема за валидация с Zod
const productFormSchema = z.object({
  name: z.string().min(3, { message: "Името на продукта трябва да е поне 3 символа." }),
  description: z.string().min(10, { message: "Описанието трябва да е поне 10 символа." }).optional().or(z.literal('')),
  category: z.string().min(3, { message: "Категорията трябва да е поне 3 символа." }),
  price: z.coerce.number().positive({ message: "Цената трябва да е положително число." }),
  currency: z.enum(['BGN', 'EUR']),
  stock: z.coerce.number().int().min(0, { message: "Наличността не може да е отрицателна." }),
  restockThreshold: z.coerce.number().int().min(0, { message: "Прагът не може да е отрицателен." }).optional().nullable(),
  imageUrl: z.string().url({ message: "Моля, въведете валиден URL." }).optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: Omit<Product, 'id'>) => Promise<void> | void;
  onClose: () => void;
}

export function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? { 
        ...product,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        restockThreshold: product.restockThreshold || 0,
     } : {
        name: '',
        description: '',
        category: '',
        price: 0,
        currency: 'BGN',
        stock: 0,
        restockThreshold: 0,
        imageUrl: '',
    }
  });

  const onSubmit: SubmitHandler<ProductFormValues> = (data) => {
    onSave(data as Omit<Product, 'id'>);
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
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea placeholder="Описание на продукта..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Категория</FormLabel>
              <FormControl>
                <Input placeholder="Напр. Облекло, напитки..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Цена (BGN)</FormLabel>
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
            <FormField
                control={form.control}
                name="restockThreshold"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Праг за презареждане</FormLabel>
                        <FormControl>
                            <Input type="number" step="1" placeholder="0" {...field} value={field.value || 0} />
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
                        <Input placeholder="https_//..." {...field} value={field.value || ''} />
                    </FormControl>
                    <a href={field.value || ''} target="_blank" rel="noopener noreferrer" className={!field.value ? 'pointer-events-none opacity-50' : ''}>
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
