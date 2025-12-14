
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ScheduleEvent } from '@/types';
import { useEffect } from 'react';

const eventSchema = z.object({
  title: z.string().min(1, 'Моля, въведете заглавие.'),
  start: z.string(), // These will be formatted strings
  end: z.string(),
  type: z.enum(['training', 'competition', 'camp', 'event'], { required_error: 'Моля, изберете тип.' }),
  description: z.string().optional(),
  coach: z.string().optional(),
  location: z.string().optional(),
}).refine(data => new Date(data.start) < new Date(data.end), {
  message: 'Крайната дата трябва да е след началната.',
  path: ['end'], 
});

export type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Partial<ScheduleEvent>;
  onSave: (data: EventFormData) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export function EventForm({ event, onSave, onClose, isSaving }: EventFormProps) {

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      start: event?.start || '',
      end: event?.end || '',
      type: event?.type || 'training',
      description: event?.description || '',
      coach: event?.coach || '',
      location: event?.location || '',
    },
  });

  useEffect(() => {
    form.reset({
      title: event?.title || '',
      start: event?.start ? new Date(new Date(event.start).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      end: event?.end ? new Date(new Date(event.end).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      type: event?.type || 'training',
      description: event?.description || '',
      coach: event?.coach || '',
      location: event?.location || '',
    });
  }, [event, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заглавие</FormLabel>
              <FormControl>
                <Input placeholder="Име на събитието" {...field} />
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете тип на събитието" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="training">Тренировка</SelectItem>
                  <SelectItem value="competition">Състезание</SelectItem>
                  <SelectItem value="camp">Лагер</SelectItem>
                  <SelectItem value="event">Друго събитие</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('type') === 'training' && (
            <FormField
                control={form.control}
                name="coach"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Треньор</FormLabel>
                    <FormControl>
                    <Input placeholder="Име на треньора" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        {(form.watch('type') === 'competition' || form.watch('type') === 'camp' || form.watch('type') === 'event') && (
            <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Място</FormLabel>
                    <FormControl>
                    <Input placeholder="Местоположение" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea placeholder="Допълнителна информация..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Отказ</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            Запис
          </Button>
        </div>
      </form>
    </Form>
  );
}
