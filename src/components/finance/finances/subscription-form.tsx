
'use client'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { Member, MemberSubscription } from "@/types";

const subscriptionSchema = z.object({
  memberId: z.string({ required_error: "Моля, изберете член." }),
  serviceId: z.string({ required_error: "Моля, изберете услуга." }),
  status: z.enum(["active", "expired", "cancelled", "pending_payment"], { required_error: "Моля, изберете статус." }),
  pricePaid: z.coerce.number().min(0.01, { message: "Сумата трябва да е положително число." }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Моля, въведете валидна начална дата." }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Моля, въведете валидна крайна дата." }),
  currency: z.enum(["BGN", "EUR"]),
  paymentHistory: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    notes: z.string().optional(),
  })),
  paymentsMadeCount: z.number(),
  licenseGranted: z.boolean(),
  apparelGranted: z.boolean(),

});

interface SubscriptionFormProps {
  members: Member[];
  onSave: (data: Omit<MemberSubscription, 'id'>) => void;
  onClose: () => void;
  initialData?: MemberSubscription;
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

        {/* This needs to be adapted to select a service, not a subscription type */}

        <FormField
          control={form.control}
          name="pricePaid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Платена сума</FormLabel>
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
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="pending_payment">Чакащо плащане</SelectItem>
                  <SelectItem value="expired">Изтекъл</SelectItem>
                  <SelectItem value="cancelled">Анулиран</SelectItem>
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
