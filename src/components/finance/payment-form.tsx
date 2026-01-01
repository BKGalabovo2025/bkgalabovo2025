
'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { Member, Payment } from "@/types";

const paymentSchema = z.object({
  memberId: z.string().min(1, "Моля, изберете член."),
  amount: z.number().min(0.01, "Сумата трябва да е положително число."),
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Моля, въведете валидна дата."),
  type: z.enum(["subscription", "donation", "sale", "other"]),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  members: Member[];
  onSave: (data: Omit<Payment, 'id'>) => void;
  onClose: () => void;
  initialData?: Payment;
  isSaving?: boolean;
}

export function PaymentForm({ members, onSave, onClose, initialData, isSaving }: PaymentFormProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData ? { 
        ...initialData,
        paymentDate: initialData.paymentDate.split('T')[0]
    } : {
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
      memberId: '',
      amount: 0,
      type: 'subscription'
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    const paymentData: Omit<Payment, 'id'> = {
        ...data,
        currency: 'EUR',
        method: 'cash', 
        status: 'succeeded',
        notes: data.notes || '',
    };
    onSave(paymentData);
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
                  {members.map(member => (
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
              <FormLabel>Тип на плащането</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="subscription">Членски внос</SelectItem>
                  <SelectItem value="donation">Дарение</SelectItem>
                  <SelectItem value="sale">Продажба</SelectItem>
                  <SelectItem value="other">Друго</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сума</FormLabel>
              <FormControl>
                <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    value={field.value === 0 ? '' : field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Дата на плащане</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                <Input {...field} value={field.value ?? ''}/>
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
