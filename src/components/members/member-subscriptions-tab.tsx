'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSubscriptionsByMemberId, getAllClubServices, assignSubscriptionToMember } from '@/services/subscription-service';
import { registerPaymentForSubscription } from '@/services/payment-service';
import { Subscription, ClubService } from '@/types';
import { PlusCircle, Loader2, CalendarIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// #region Payment Dialog Component
const RegisterPaymentDialog = ({ sub, service, onPaymentSuccess }: { sub: Subscription, service?: ClubService, onPaymentSuccess: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState(((service?.price || 0) - sub.pricePaid) / 100);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const { toast } = useToast();

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            await registerPaymentForSubscription(sub.id, {
                paymentId: crypto.randomUUID(),
                amount: Math.round(amount * 100), 
                paymentDate: new Date(paymentDate).toISOString(),
            });
            toast({ title: "Успех!", description: "Плащането е регистрирано успешно." });
            onPaymentSuccess();
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to register payment:", error);
            toast({ title: "Грешка", description: "Неуспешен запис на плащането.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary">Регистрирай плащане</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Регистриране на плащане</DialogTitle>
                    <DialogDescription>За абонамент: <strong>{service?.name || 'Неизвестна услуга'}</strong></DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Сума ({sub.currency})</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(Number(e.target.value))} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentDate">Дата на плащане</Label>
                        <Input 
                            id="paymentDate" 
                            type="date" 
                            value={paymentDate} 
                            onChange={(e) => setPaymentDate(e.target.value)} 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Отказ</Button>
                    <Button onClick={handlePayment} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Потвърди плащането
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
// #endregion

const SubscriptionCard = ({ sub, service, onPaymentSuccess }: { sub: Subscription, service?: ClubService, onPaymentSuccess: () => void }) => {

    const getStatusInfo = (status: Subscription['status']) => {
        switch (status) {
            case 'active':
                return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Активен', color: 'border-green-500' };
            case 'inactive': // FIX: Changed 'expired' to 'inactive'
                return { icon: <XCircle className="h-4 w-4 text-red-500" />, text: 'Изтекъл', color: 'border-red-500' };
            case 'cancelled':
                return { icon: <XCircle className="h-4 w-4 text-gray-500" />, text: 'Отказан', color: 'border-gray-500' };
            case 'pending_payment':
                return { icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, text: 'Чакащо плащане', color: 'border-yellow-500' };
            default:
                return { icon: null, text: 'Неизвестен', color: 'border-gray-300' };
        }
    }

    const statusInfo = getStatusInfo(sub.status);

    return (
        <div className={`border-l-4 ${statusInfo.color} rounded-md bg-muted/20 p-4 mb-4`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-lg">{service?.name || 'Неизвестна услуга'}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{service?.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                    {statusInfo.icon}
                    <span className="font-semibold">{statusInfo.text}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm items-center">
                <div>
                    <p className="text-muted-foreground">Начална дата</p>
                    <p className="font-medium flex items-center"><CalendarIcon className="mr-2 h-4 w-4"/> {new Date(sub.startDate).toLocaleDateString('bg-BG')}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Крайна дата</p>
                    <p className="font-medium flex items-center"><CalendarIcon className="mr-2 h-4 w-4"/>{new Date(sub.endDate).toLocaleDateString('bg-BG')}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Платена сума</p>
                    <p className="font-medium">{(sub.pricePaid / 100).toFixed(2)} {sub.currency}</p>
                </div>
                {sub.status === 'pending_payment' && (
                    <RegisterPaymentDialog sub={sub} service={service} onPaymentSuccess={onPaymentSuccess} />
                )}
            </div>
        </div>
    )
}

interface MemberSubscriptionsTabProps {
  memberId: string;
}

export const MemberSubscriptionsTab = ({ memberId }: MemberSubscriptionsTabProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]); 
  const [services, setServices] = useState<ClubService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { toast } = useToast();

  const fetchData = async () => {
      try {
        setLoading(true);
        const [srvs, subs] = await Promise.all([
            getAllClubServices(),
            getSubscriptionsByMemberId(memberId)
        ]);
        subs.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        setSubscriptions(subs);
        setServices(srvs);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ title: "Грешка", description: "Неуспешно зареждане на данните.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    fetchData();
  }, [memberId]);

  const handleAddSubscription = async () => {
    if (!selectedService || !startDate) {
        toast({ title: "Грешка", description: "Моля, изберете услуга и начална дата.", variant: "destructive" });
        return;
    }
    try {
        await assignSubscriptionToMember(memberId, selectedService, new Date(startDate));
        toast({ title: "Успех", description: "Абонаментът е добавен успешно." });
        setIsAddDialogOpen(false);
        setSelectedService(null);
        setStartDate(new Date().toISOString().split('T')[0]);
        fetchData();
    } catch (error) {
        console.error("Failed to add subscription:", error);
        toast({ title: "Грешка", description: "Възникна проблем при добавянето на абонамента.", variant: "destructive" });
    }
  }

  const getServiceForSubscription = (sub: Subscription) => {
    return services.find(s => s.id === sub.serviceId);
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Активни и изминали абонаменти</CardTitle>
          <CardDescription>Списък с всички услуги, за които членът е абониран.</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Добави абонамент
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Добавяне на нов абонамент</DialogTitle>
              <DialogDescription>
                Изберете услуга и начална дата, за да създадете нов абонамент за този член. Статусът първоначално ще бъде "Чакащо плащане".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Услуга</label>
                     {services.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto rounded-md border bg-background">
                            <div className="p-2 space-y-1">
                            {services.map(service => (
                                <div
                                    key={service.id}
                                    onClick={() => setSelectedService(service.id)}
                                    className={`p-3 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedService === service.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                >
                                    <span className='font-medium'>{service.name}</span>
                                    <span className='font-bold'>{(service.price / 100).toFixed(2)} {service.currency}</span>
                                </div>
                            ))}
                            </div>
                        </div>
                     ) : (
                        <div className='text-center text-sm text-muted-foreground p-4 border rounded-md'>
                            Няма създадени услуги. Моля, първо добавете услуга от секция "Финанси" -&gt; "Услуги".
                        </div>
                     )}
                </div>
                <div className='grid gap-2'>
                    <label htmlFor='start-date' className="text-sm font-medium">Начална дата</label>
                    <Input 
                        id='start-date'
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsAddDialogOpen(false)} variant="outline">Отказ</Button>
                <Button onClick={handleAddSubscription} disabled={!selectedService || !startDate || services.length === 0}>
                    Добави абонамент
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Няма намерени активни или изминали абонаменти.</p>
            <p className="text-sm text-muted-foreground mt-2">Натиснете бутона, за да присвоите услуга към този член.</p>
          </div>
        ) : (
          <div>
            {subscriptions.map(sub => (
                <SubscriptionCard key={sub.id} sub={sub} service={getServiceForSubscription(sub)} onPaymentSuccess={fetchData} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
