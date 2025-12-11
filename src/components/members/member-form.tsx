'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Member } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';

// Схема за валидация с Zod, съобразена с актуалния Member тип
const formSchema = z.object({
  firstName: z.string().min(2, { message: 'Името трябва да е поне 2 символа.' }),
  middleName: z.string().optional(),
  lastName: z.string().min(2, { message: 'Фамилията трябва да е поне 2 символа.' }),
  email: z.string().email({ message: 'Невалиден имейл адрес.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  phoneType: z.enum(['personal', 'parent']).optional(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна дата.' }),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  educationInstitution: z.string().optional(),
  notes: z.string().optional(),
  personalId: z.string().optional(),
  registrationDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Моля, въведете валидна дата.' }),
});

interface MemberFormProps {
  member?: Member;
  onSave: (data: Omit<Member, 'id'>) => Promise<void> | void; // Позволява и async функции
  onClose: () => void;
}

export const MemberForm = ({ member, onSave, onClose }: MemberFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: member ? {
        ...member,
        dateOfBirth: member.dateOfBirth.split('T')[0], // Форматиране на датите
        registrationDate: member.registrationDate.split('T')[0],
    } : {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneType: 'personal',
      dateOfBirth: '',
      address: '',
      status: 'active',
      educationInstitution: '',
      notes: '',
      personalId: '',
      registrationDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Zod вече гарантира, че values е съвместим с Omit<Member, 'id'>
    onSave(values as Omit<Member, 'id'>);
  };

  return (
    <Form {...form}>
        <p>Попълнете данните в полетата по-долу. Натиснете "Запази", когато сте готови.</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Име</FormLabel>
                <FormControl>
                  <Input placeholder="Иван" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Презиме</FormLabel>
                <FormControl>
                  <Input placeholder="Иванов" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Фамилия</FormLabel>
                <FormControl>
                  <Input placeholder="Петров" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имейл (опционално)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ivan.petrov@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Телефон (опционално)</FormLabel>
                    <FormControl>
                        <Input placeholder="0888123456" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
                control={form.control}
                name="phoneType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Тип на телефона</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="personal">Личен</SelectItem>
                        <SelectItem value="parent">На родител</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата на раждане</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="educationInstitution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Образователна институция (Училище или детска градина)</FormLabel>
                <FormControl>
                  <Input placeholder="СУ Св. Климент Охридски" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Адрес (опционално)</FormLabel>
                <FormControl>
                  <Input placeholder="гр. София, ул. Примерна 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бележки</FormLabel>
                <FormControl>
                  <Textarea placeholder="Допълнителна информация..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Отказ</Button>
          <Button type="submit">Запази</Button>
        </div>
      </form>
    </Form>
  );
};
