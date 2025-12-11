
'use client';

import { useState, useEffect } from 'react';
import { Member, Subscription } from '@/types';
import { getMembers } from '@/services/member-service';
import { addSubscription, getAllSubscriptions, deleteSubscription } from '@/services/finance-service';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { SubscriptionForm } from '@/components/finance/subscription-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/data-table';
import { getSubscriptionColumns } from '@/components/finance/subscriptions/columns';
import { useToast } from '@/components/ui/use-toast';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [subs, mems] = await Promise.all([getAllSubscriptions(), getMembers()]);
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
    };
    fetchData();
  }, [toast]);

  const handleSaveSubscription = async (data: Omit<Subscription, 'id'>) => {
    try {
      const newId = await addSubscription(data);
      const newSubscription = { ...data, id: newId };
      setSubscriptions([newSubscription, ...subscriptions]);
      setIsDialogOpen(false);
      toast({
        title: 'Успех!',
        description: 'Абонаментът е добавен успешно.',
      });
    } catch (error) {
      console.error('Failed to save subscription:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно записване на абонамента.',
        variant: 'destructive',
      });
    }
  };

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
        <div className="flex justify-end">
            <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добави абонамент
            </Button>
        </div>

        <DataTable
            columns={columns}
            data={subscriptions}
            filterColumnId="memberId"
            filterPlaceholder="Търси по член..."
            isLoading={isLoading}
            emptyStateMessage="Няма намерени абонаменти."
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Добавяне на нов абонамент</DialogTitle>
                    <DialogDescription>
                        Попълнете формата, за да добавите нов абонамент.
                    </DialogDescription>
                </DialogHeader>
                <SubscriptionForm
                    members={members}
                    onSave={handleSaveSubscription}
                    onClose={() => setIsDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default SubscriptionsPage;
