'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import moment from 'moment';

const daysOfWeek = [
  { id: 'tuesday', label: 'Вторник', value: 2 },
  { id: 'wednesday', label: 'Сряда', value: 3 },
  { id: 'thursday', label: 'Четвъртък', value: 4 },
];

const monthlyScheduleSchema = z.object({
  month: z.string().min(1, 'Моля, изберете месец.'),
  days: z.array(z.number()).min(1, 'Моля, изберете поне един ден.'),
  startTime: z.string().min(1, 'Моля, въведете начален час.'),
  endTime: z.string().min(1, 'Моля, въведете краен час.'),
  location: z.string().min(1, 'Моля, въведете локация.'),
}).refine(data => data.startTime < data.endTime, {
    message: 'Крайният час трябва да е след началния.',
    path: ['endTime'],
});

export type MonthlyScheduleFormData = z.infer<typeof monthlyScheduleSchema>;

interface MonthlyScheduleFormProps {
  onSave: (data: MonthlyScheduleFormData) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export default function MonthlyScheduleForm({ onSave, onClose, isSaving }: MonthlyScheduleFormProps) {
  const form = useForm<MonthlyScheduleFormData>({
    resolver: zodResolver(monthlyScheduleSchema),
    defaultValues: {
      month: moment().format('YYYY-MM'),
      days: [],
      startTime: '17:00',
      endTime: '18:30',
      location: 'Спортна зала "Енергетик" град Гълъбово',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Месец</FormLabel>
              <FormControl>
                <Input type="month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
            <FormLabel>Дни от седмицата</FormLabel>
            <div className="flex space-x-4 pt-2">
                {daysOfWeek.map((day) => (
                    <FormField
                        key={day.id}
                        control={form.control}
                        name="days"
                        render={({ field }) => {
                            return (
                            <FormItem key={day.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...field.value, day.value])
                                        : field.onChange(
                                            field.value?.filter(
                                            (value) => value !== day.value
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                    {day.label}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                    />
                ))}
            </div>
            <FormMessage />
        </FormItem>

        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Начален час</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Краен час</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
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

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Отказ</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            Генерирай
          </Button>
        </div>
      </form>
    </Form>
  );
}
