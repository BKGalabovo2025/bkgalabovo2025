
'use client';

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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


// Схема за валидация
const formSchema = z.object({
  memberId: z.string({ required_error: "Моля, изберете член." }),
  type: z.enum(['monthly', 'quarterly', 'yearly', 'single_visit'], { required_error: "Моля, изберете тип на абонамента." }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна начална дата.' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна крайна дата.' }),
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive({ message: 'Сумата трябва да е положително число.' })
  ),
  status: z.enum(['paid', 'pending', 'overdue'], { required_error: "Моля, изберете статус." }),
});

interface SubscriptionFormProps {
  subscription?: Subscription;
  members: Member[]; // Списък с всички членове
  onSave: (data: Omit<Subscription, 'id'>) => void;
  onClose: () => void;
}

export const SubscriptionForm = ({ subscription, members, onSave, onClose }: SubscriptionFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: subscription || {
        memberId: '',
        type: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        amount: 50,
        status: 'pending',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!subscription}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете член от списъка" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {`${member.firstName} ${member.lastName}`}
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
                      <SelectValue placeholder="Избери тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Месечен</SelectItem>
                    <SelectItem value="quarterly">Тримесечен</SelectItem>
                    <SelectItem value="yearly">Годишен</SelectItem>
                    <SelectItem value="single_visit">Еднократно посещение</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Сума (лв.)</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" placeholder="50.00" {...field} />
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
                        <SelectValue placeholder="Избери статус" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="pending">Чакащ</SelectItem>
                        <SelectItem value="paid">Платен</SelectItem>
                        <SelectItem value="overdue">Просрочен</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Отказ</Button>
          <Button type="submit">Запази</Button>
        </div>
      </form>
    </Form>
  );
};
