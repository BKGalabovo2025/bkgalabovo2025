'use client';

import { useState, useEffect, useCallback } from 'react';
import { Member, Subscription, Payment } from '@/types';
import { getAllMembers } from '@/services/member-service'; // Corrected import
import { addPayment, addSubscription, getAllSubscriptions, deleteSubscription, updateSubscription } from '@/services/finance-service';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PaymentForm } from '@/components/finance/payment-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/data-table';
import { getSubscriptionColumns } from '@/components/finance/subscriptions/columns';
import { useToast } from '@/components/ui/use-toast';

const FinancesPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [subs, mems] = await Promise.all([getAllSubscriptions(), getAllMembers()]); // Corrected function call
      setSubscriptions(subs);
      setMembers(mems);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на данните.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSavePayment = async (paymentData: Omit<Payment, 'id'>) => {
    try {
      const paymentDataWithCurrency = { ...paymentData, currency: 'EUR' };
      await addPayment(paymentDataWithCurrency);

      if (paymentData.type === 'Членски внос') {
        await upsertSubscription(paymentDataWithCurrency);
      }
      
      await fetchData(); 
      setIsDialogOpen(false);
      toast({
        title: 'Успех!',
        description: 'Плащането е записано успешно.',
      });

    } catch (error) {
      console.error('Failed to save payment:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно записване на плащането.',
        variant: 'destructive',
      });
    }
  };

  const upsertSubscription = async (paymentData: Omit<Payment, 'id'> & { currency: string }) => {
    const existingSubscription = subscriptions.find(sub => sub.memberId === paymentData.memberId);
    const paymentDate = new Date(paymentData.paymentDate);

    if (existingSubscription) {
      const currentEndDate = new Date(existingSubscription.endDate);
      const newEndDate = new Date(currentEndDate.setFullYear(currentEndDate.getFullYear() + 1));
      
      await updateSubscription(existingSubscription.id, { 
        endDate: newEndDate.toISOString().split('T')[0],
        status: 'paid',
      });
    } else {
      const startDate = paymentDate;
      const endDate = new Date(new Date(startDate).setFullYear(startDate.getFullYear() + 1));

      await addSubscription({
        memberId: paymentData.memberId,
        type: 'annual',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'paid',
        amount: paymentData.amount,
        currency: paymentData.currency,
      });
    }
  }

  const handleDeleteSubscription = async (id: string) => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете този абонамент?')) return;

    try {
      await deleteSubscription(id);
      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
      toast({
        title: 'Успех!',
        description: 'Абонаментът е изтрит успешно.',
      });
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно изтриване на абонамента.',
        variant: 'destructive',
      });
    }
  };

  const memberMap = new Map(members.map(m => [m.id, `${m.firstName} ${m.lastName}`]));
  const columns = getSubscriptionColumns(memberMap, handleDeleteSubscription);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Финанси и Абонаменти</h1>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Добави плащане
            </Button>
        </div>

        <DataTable
            columns={columns}
            data={subscriptions}
            filterColumnId="memberId"
            filterPlaceholder="Търси по член..."
            isLoading={isLoading}
            emptyStateMessage="Няма намерени абонаменти."
            getCellValue={(row, columnId) => {
              if (columnId === 'memberId') {
                return memberMap.get(row.memberId) || row.memberId;
              }
              return row[columnId as keyof Subscription];
            }}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Добавяне на ново плащане</DialogTitle>
                    <DialogDescription>
                        Попълнете формата, за да запишете ново плащане. Ако е членски внос, абонаментът ще се обнови автоматично.
                    </DialogDescription>
                </DialogHeader>
                <PaymentForm
                    members={members}
                    onSave={handleSavePayment}
                    onClose={() => setIsDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default FinancesPage;
