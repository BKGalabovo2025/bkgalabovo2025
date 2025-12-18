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

const generalEventSchema = z.object({
  title: z.string().min(1, 'Моля, въведете име на събитието.'),
  start: z.string().min(1, 'Моля, въведете начална дата и час.'),
  end: z.string().min(1, 'Моля, въведете крайна дата и час.'),
  location: z.string().optional(),
  description: z.string().optional(),
  type: z.literal('event').default('event'),
}).refine(data => new Date(data.start) < new Date(data.end), {
  message: 'Краят трябва да е след началото.',
  path: ['end'],
});

export type GeneralEventFormData = z.infer<typeof generalEventSchema>;

interface GeneralEventFormProps {
  event?: Partial<ScheduleEvent> | null;
  onSave: (data: GeneralEventFormData) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export default function GeneralEventForm({ event, onSave, onDelete, onClose, isSaving }: GeneralEventFormProps) {
  const form = useForm<GeneralEventFormData>({
    resolver: zodResolver(generalEventSchema),
  });

  useEffect(() => {
    const start = event?.start;
    const end = event?.end;
    form.reset({
        title: event?.title || '',
        start: start ? toLocalISOString(new Date(start)) : '',
        end: end ? toLocalISOString(new Date(end)) : '',
        location: event?.location || '',
        description: event?.description || '',
        type: 'event',
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
              <FormLabel>Име на събитието</FormLabel>
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
                    <FormLabel>Начало</FormLabel>
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
                    <FormLabel>Край</FormLabel>
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Бележки</FormLabel>
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
