
'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { Member, Subscription } from "@/types";

const subscriptionSchema = z.object({
  memberId: z.string({ required_error: "Моля, изберете член." }),
  type: z.enum(["annual", "monthly", "quarterly", "single_visit"], { required_error: "Моля, изберете тип." }),
  status: z.enum(["paid", "pending", "overdue"], { required_error: "Моля, изберете статус." }),
  amount: z.coerce.number().min(0.01, { message: "Сумата трябва да е положително число." }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Моля, въведете валидна начална дата." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Моля, въведете валидна крайна дата." }),
});

interface SubscriptionFormProps {
  members: Member[];
  onSave: (data: Omit<Subscription, 'id'>) => void;
  onClose: () => void;
  initialData?: Subscription;
  isSaving?: boolean;
}

export function SubscriptionForm({ members, onSave, onClose, initialData, isSaving }: SubscriptionFormProps) {
  const form = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: initialData.startDate.split('T')[0],
      endDate: initialData.endDate.split('T')[0],
    } : {
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: z.infer<typeof subscriptionSchema>) => {
    onSave(data);
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
              <FormLabel>Тип абонамент</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="annual">Годишен</SelectItem>
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сума</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
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
