'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink } from 'lucide-react';
import { Product } from "@/types";

// FINAL FIX: Define the form with string types for numbers initially
const formSchema = z.object({
  name: z.string().min(3, { message: "Името на продукта трябва да е поне 3 символа." }),
  description: z.string().optional(),
  category: z.string().min(3, { message: "Категорията трябва да е поне 3 символа." }),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Цената трябва да е положително число." }),
  currency: z.enum(['BGN', 'EUR']),
  stock: z.string().refine(val => !isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0, { message: "Наличността трябва да е цяло, неотрицателно число." }),
  restockThreshold: z.string().optional(),
  imageUrl: z.string().url({ message: "Моля, въведете валиден URL." }).or(z.literal('')).optional(),
});

// FINAL FIX: Create a separate schema that transforms strings to numbers on submit
const productSubmitSchema = formSchema.transform(data => ({
    ...data,
    price: parseFloat(data.price),
    stock: parseInt(data.stock, 10),
    restockThreshold: data.restockThreshold ? parseInt(data.restockThreshold, 10) : null,
    description: data.description || '',
    imageUrl: data.imageUrl || '',
}));

// The type for the final, transformed data
type ProductFormValues = z.infer<typeof productSubmitSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSave: (data: ProductFormValues) => Promise<void> | void;
  onClose: () => void;
}

export function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    // Use the base form schema (with strings) for validation during input
    resolver: zodResolver(formSchema),
    // Default values must match the form schema (strings for numbers)
    defaultValues: product ? { 
        ...product,
        price: String(product.price),
        stock: String(product.stock),
        description: product.description ?? '',
        imageUrl: product.imageUrl ?? '',
        restockThreshold: product.restockThreshold ? String(product.restockThreshold) : '',
     } : {
        name: '',
        description: '',
        category: '',
        price: '0',
        currency: 'BGN',
        stock: '0',
        restockThreshold: '',
        imageUrl: '',
    }
  });

  // This function now receives the raw form data (with strings)
  // and needs to parse it before sending it to the parent.
  async function onSubmit(data: z.infer<typeof formSchema>) {
    const parsedData = await productSubmitSchema.parseAsync(data);
    onSave(parsedData);
  }

  const isEditing = !!product;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* No changes needed below, all inputs work with strings by default */}
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
                <Textarea placeholder="Описание на продукта..." {...field} value={field.value ?? ''} />
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
                        {/* Input is now a simple, controlled component. No complex onChange needed. */}
                        <Input type="number" placeholder="0.00" {...field} />
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
                            <Input type="number" placeholder="0" {...field} />
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
                            <Input type="number" placeholder="Няма" {...field} value={field.value ?? ''} />
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
                        <Input placeholder="https_//..." {...field} value={field.value ?? ''} />
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
