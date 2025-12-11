'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Member, Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const subscriptionSchema = z.object({
  memberId: z.string().min(1, 'Моля, изберете член'),
  type: z.enum(['yearly', 'monthly', 'quarterly', 'single_visit'], { required_error: 'Моля, изберете тип на абонамента' }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна дата.' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна дата.' }),
  amount: z.coerce.number().min(0.01, 'Сумата трябва да е положително число'),
  status: z.enum(['paid', 'pending', 'overdue'], { required_error: 'Моля, изберете статус' }),
});

interface SubscriptionFormProps {
  members: Member[];
  onSave: (data: Omit<Subscription, 'id'>) => Promise<void>;
  onClose: () => void;
}

export const SubscriptionForm = ({ members, onSave, onClose }: SubscriptionFormProps) => {
  const form = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
        amount: 0,
        startDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: z.infer<typeof subscriptionSchema>) => {
    await onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Член</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете член" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип абонамент</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Изберете тип" />
                      </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      <SelectItem value="yearly">Годишен</SelectItem>
                      <SelectItem value="monthly">Месечен</SelectItem>
                      <SelectItem value="quarterly">Тримесечен</SelectItem>
                      <SelectItem value="single_visit">Еднократно посещение</SelectItem>
                  </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Начална дата</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Крайна дата</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сума (лв.)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Изберете статус" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="paid">Платен</SelectItem>
                            <SelectItem value="pending">Чакащ</SelectItem>
                            <SelectItem value="overdue">Просрочен</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Отказ</Button>
            <Button type="submit">Запис</Button>
        </div>
      </form>
    </Form>
  );
};
