'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2 } from 'lucide-react';
import { ScheduleEvent } from '@/types';
import { useEffect } from 'react';

// Helper to format date for datetime-local input
const toLocalISOString = (date: Date) => {
    const tzOffset = -date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + tzOffset).toISOString().slice(0, 16);
}

const campSchema = z.object({
  title: z.string().min(1, 'Моля, въведете заглавие.'),
  location: z.string().min(1, 'Моля, въведете локация.'),
  start: z.string().min(1, 'Моля, въведете начална дата.'),
  end: z.string().min(1, 'Моля, въведете крайна дата.'),
  description: z.string().optional(),
  type: z.literal('camp').default('camp'),
}).refine(data => new Date(data.start) < new Date(data.end), {
  message: 'Крайната дата трябва да е след началната.',
  path: ['end'],
});

export type CampFormData = z.infer<typeof campSchema>;

interface CampFormProps {
  event?: Partial<ScheduleEvent> | null;
  onSave: (data: CampFormData) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export default function CampForm({ event, onSave, onDelete, onClose, isSaving }: CampFormProps) {
  const form = useForm<CampFormData>({
    resolver: zodResolver(campSchema),
  });

  useEffect(() => {
    const start = event?.start;
    const end = event?.end;
    form.reset({
      title: event?.title || '',
      location: event?.location || '',
      start: start ? toLocalISOString(new Date(start)) : '',
      end: end ? toLocalISOString(new Date(end)) : '',
      description: event?.description || '',
      type: 'camp',
    });
  }, [event, form.reset]);

    const handleDelete = () => {
        if (event?.id && onDelete) {
            onDelete(event.id)
        }
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заглавие на лагера</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Локация</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="start"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Начална дата</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Крайна дата</Label>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Бележки (цена, срокове и др.)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center pt-4">
            <div>
                {event && onDelete && (
                    <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="flex space-x-2">
                <Button type="button" variant="ghost" onClick={onClose}>Отказ</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Запис
                </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}
