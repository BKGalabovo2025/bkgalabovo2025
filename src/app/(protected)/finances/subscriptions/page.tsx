
'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { columns, SubscriptionData } from '@/components/finance/subscriptions/columns';
import { Subscription, ClubService, Member } from '@/types';
import { getAllClubServices, getSubscriptionsByMemberId, createSubscription, updateSubscription } from '@/services/subscription-service';
import { getAllMembers } from '@/services/member-service';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SubscriptionForm } from '@/components/finance/finances/subscription-form';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<ClubService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | undefined>(undefined);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedServices, fetchedMembers] = await Promise.all([
        getAllClubServices(),
        getAllMembers(),
      ]);

      setServices(fetchedServices);
      setMembers(fetchedMembers);

      const allSubscriptions: Subscription[] = [];
      for (const member of fetchedMembers) {
        const memberSubscriptions = await getSubscriptionsByMemberId(member.id);
        allSubscriptions.push(...memberSubscriptions);
      }

      const enrichedSubscriptions: SubscriptionData[] = allSubscriptions.map((sub: Subscription) => {
        const service = fetchedServices.find((s: ClubService) => s.id === sub.serviceId);
        const member = fetchedMembers.find((m: Member) => m.id === sub.memberId);
        return {
          ...sub,
          serviceName: service?.name || 'Unknown Service',
          memberFirstName: member?.firstName || 'Unknown',
          memberLastName: member?.lastName || 'Member',
        };
      });

      setSubscriptions(enrichedSubscriptions);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast({
        title: 'Грешка при зареждане на данните',
        description: 'Възникна проблем при извличането на абонаментите.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (data: Omit<Subscription, 'id'>) => {
    setIsSaving(true);
    try {
        if (selectedSubscription) {
            await updateSubscription(selectedSubscription.id, data);
            toast({ title: 'Абонаментът е обновен успешно!' });
        } else {
            await createSubscription(data);
            toast({ title: 'Абонаментът е създаден успешно!' });
        }
        setIsFormOpen(false);
        setSelectedSubscription(undefined);
        fetchData(); // Refresh data
    } catch (error) {
        console.error('Error saving subscription:', error);
        toast({ title: 'Грешка при записа', description: 'Възникна проблем при запис на абонамента.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const openForm = (subscription?: SubscriptionData) => {
    const fullSubscription = subscription ? subscriptions.find(s => s.id === subscription.id) : undefined;
    setSelectedSubscription(fullSubscription);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Управление на абонаменти</CardTitle>
                    <CardDescription>Преглед на всички абонаменти на членове.</CardDescription>
                </div>
                <Button onClick={() => openForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Добави абонамент
                </Button>
            </CardHeader>
            <CardContent>
                 <DataTable 
                    columns={columns(openForm)} 
                    data={subscriptions} 
                    isLoading={isLoading}
                    filterColumnId='memberLastName'
                    filterPlaceholder='Филтриране по фамилия...'
                    emptyStateMessage="Все още няма добавени абонаменти."
                 />
            </CardContent>
        </Card>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{selectedSubscription ? 'Редакция на абонамент' : 'Създаване на нов абонамент'}</DialogTitle>
                    <DialogDescription>
                        {selectedSubscription ? 'Променете данните и запазете.' : 'Попълнете формата, за да създадете нов абонамент.'}
                    </DialogDescription>
                </DialogHeader>
                <SubscriptionForm 
                    members={members}
                    services={services} 
                    onSave={handleSave} 
                    onClose={() => setIsFormOpen(false)}
                    initialData={selectedSubscription}
                    isSaving={isSaving}
                />
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default SubscriptionsPage;
