
'use client';

import { useState, useEffect } from 'react';
import { SubscriptionWithMember, getSubscriptionsWithMembers, addSubscription, updateSubscription, deleteSubscription, createPaymentAndUpdateSubscription } from '@/services/finance-service';
import { getMembers } from '@/services/member-service';
import { Member, Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SubscriptionForm } from '@/components/finances/subscription-form';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';

const getStatusBadgeVariant = (status: 'paid' | 'pending' | 'overdue') => {
  switch (status) {
    case 'paid': return 'success';
    case 'pending': return 'secondary';
    case 'overdue': return 'destructive';
    default: return 'default';
  }
};

const subscriptionTypeMap = {
    monthly: 'Месечен',
    quarterly: 'Тримесечен',
    yearly: 'Годишен',
    single_visit: 'Еднократно посещение'
};

const SubscriptionsPage = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithMember[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | undefined>(undefined);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subsData, membersData] = await Promise.all([
                    getSubscriptionsWithMembers(),
                    getMembers()
                ]);
                setSubscriptions(subsData);
                setMembers(membersData);
            } catch (error) {
                console.error("Firebase Error: ", error);
                toast({ title: "Грешка при зареждане на данните", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const handleSave = async (data: Omit<Subscription, 'id'>) => {
        try {
            setIsLoading(true);
            if (selectedSubscription) {
                await updateSubscription(selectedSubscription.id, data);
                toast({ title: "Абонаментът е обновен успешно!" });
            } else {
                await addSubscription(data);
                toast({ title: "Абонаментът е добавен успешно!" });
            }
            const subsData = await getSubscriptionsWithMembers();
            setSubscriptions(subsData);
            setIsFormOpen(false);
            setSelectedSubscription(undefined);
        } catch (error) {
            console.error("Firebase Error: ", error);
            toast({ title: "Грешка при запис на абонамента", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Сигурни ли сте, че искате да изтриете този абонамент?")) return;
        try {
            setIsLoading(true);
            await deleteSubscription(id);
            setSubscriptions(subscriptions.filter(s => s.id !== id));
            toast({ title: "Абонаментът е изтрит" });
        } catch (error) {
            console.error("Firebase Error: ", error);
            toast({ title: "Грешка при изтриване", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsPaid = async (subscription: Subscription) => {
        if(subscription.status === 'paid') return; // Вече е платен
        try {
            setIsLoading(true);
            await createPaymentAndUpdateSubscription(subscription);
            // Обновяваме локално състоянието
            setSubscriptions(subs => subs.map(s => s.id === subscription.id ? { ...s, status: 'paid' } : s));
            toast({ title: "Успешно плащане!", description: "Абонаментът е маркиран като платен." });
        } catch (error) {
            console.error("Payment Error: ", error);
            toast({ title: "Грешка при плащане", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const openForm = (sub?: Subscription) => {
        setSelectedSubscription(sub);
        setIsFormOpen(true);
    };

  return (
    <div>
      <Button variant="outline" onClick={() => router.push('/finances')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад към Финанси
      </Button>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Управление на абонаменти</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => openForm()}>Добави абонамент</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{selectedSubscription ? 'Редактиране на абонамент' : 'Нов абонамент'}</DialogTitle>
                </DialogHeader>
                <SubscriptionForm 
                    subscription={selectedSubscription}
                    members={members}
                    onSave={handleSave}
                    onClose={() => setIsFormOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </div>
      
      {isLoading && !isFormOpen ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Зареждане...</p>
          </div>
        ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Член</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Период</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead><span className="sr-only">Действия</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length > 0 ? subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                      <Link href={`/members/${sub.memberId}`} className="text-primary hover:underline">
                          {`${sub.member.firstName} ${sub.member.lastName}`}
                      </Link>
                  </TableCell>
                  <TableCell>{subscriptionTypeMap[sub.type]}</TableCell>
                  <TableCell>{`${new Date(sub.startDate).toLocaleDateString('bg-BG')} - ${new Date(sub.endDate).toLocaleDateString('bg-BG')}`}</TableCell>
                  <TableCell>{sub.amount.toFixed(2)} лв.</TableCell>
                  <TableCell>
                      <Badge variant={getStatusBadgeVariant(sub.status)}>
                          {sub.status === 'paid' ? 'Платен' : sub.status === 'pending' ? 'Чакащ' : 'Просрочен'}
                      </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Отвори меню</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openForm(sub)}>Редактирай</DropdownMenuItem>
                        {sub.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(sub)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Маркирай като платен
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(sub.id)}>Изтрий</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Няма намерени абонаменти.</TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
