'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { deleteSale, getSaleById, markSaleAsPaid } from '@/services/sales-service';
import { getMemberById } from '@/services/member-service';
import { Sale, Member } from '@/types';
import { useToast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Receipt, User, ShoppingCart, Trash2, CheckCheck } from 'lucide-react';

const SaleDetailsPage = () => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const saleId = params.id as string;

  useEffect(() => {
    if (saleId) {
      const fetchSaleData = async () => {
        try {
          setLoading(true);
          const saleData = await getSaleById(saleId);
          setSale(saleData);
          if (saleData && saleData.memberId) {
            const memberData = await getMemberById(saleData.memberId);
            setMember(memberData);
          }
        } catch (error) {
          console.error("Грешка при зареждане на данните за продажбата:", error);
           toast({ title: "Грешка", description: "Неуспешно зареждане на данните.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchSaleData();
    }
  }, [saleId, toast]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteSale(saleId);
        toast({ title: "Успех!", description: "Продажбата беше изтрита и наличностите са възстановени." });
        router.push('/sales');
    } catch (error) {
        console.error("Грешка при изтриване на продажба:", error);
        toast({ title: "Грешка", description: "Възникна проблем при изтриването на продажбата.", variant: "destructive" });
        setIsDeleting(false);
    }
  }

  const handleMarkAsPaid = async () => {
    setIsUpdatingStatus(true);
    try {
      await markSaleAsPaid(saleId);
      setSale(prevSale => prevSale ? { ...prevSale, status: 'paid' } : null);
      toast({
        title: "Успех!",
        description: "Плащането е регистрирано.",
      });
    } catch (error) {
      console.error("Грешка при обновяване на статуса:", error);
      toast({
        title: "Грешка",
        description: "Възникна проблем при обновяване на статуса.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const isPaid = (status: Sale['status']) => {
      return status === 'paid' || status === 'completed';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Зареждане на данни...</p>
      </div>
    );
  }

  if (!sale) {
    return <div className="text-center py-10">Информацията за продажбата не е намерена.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Обратно към продажбите
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Продажба № {sale.id.substring(0, 8)}</CardTitle>
                    <CardDescription>Дата: {new Date(sale.date).toLocaleString('bg-BG')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.push(`/sales/${saleId}/receipt`)}>
                        <Receipt className="mr-2 h-4 w-4" /> Разписка
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Изтрий
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Наистина ли искате да изтриете продажбата?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Тази операция не може да бъде отменена. Продажбата ще бъде перманентно изтрита и наличностите на включените продукти ще бъдат възстановени.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отказ</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Потвърди
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="font-semibold mb-2 text-lg flex items-center"><ShoppingCart className="mr-2 h-5 w-5"/>Артикули</h3>
                <div className="border rounded-md">
                    <ul className="divide-y">
                        {sale.items.map(item => (
                            <li key={item.productId} className="p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.quantity} x {(item.price || 0).toFixed(2)} лв.
                                    </p>
                                </div>
                                <p className="font-semibold">{((item.quantity || 0) * (item.price || 0)).toFixed(2)} лв.</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/40 p-4 flex justify-end">
                 <div className="text-right">
                    <p className="text-sm text-muted-foreground">Общо</p>
                    <p className="font-bold text-2xl">{(sale.total || 0).toFixed(2)} лв.</p>
                </div>
            </CardFooter>
          </Card>
        </div>

        <div>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5"/>Клиент</CardTitle>
                </CardHeader>
                <CardContent>
                    {member ? (
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                                <AvatarFallback>{member.firstName && member.lastName ? `${member.firstName[0]}${member.lastName[0]}` : ''}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-lg">{member.firstName} {member.lastName}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Продажба на каса (без избран член)</p>
                    )}
                </CardContent>
                {member && (
                     <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => router.push(`/members/${member.id}`)}>Преглед на профила</Button>
                    </CardFooter>
                )}
            </Card>
            
            <Card className="mt-6">
                 <CardHeader>
                    <CardTitle>Статус на плащане</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-4">
                     <Badge variant={isPaid(sale.status) ? 'success' : 'destructive'} className="text-base px-4 py-1">
                        {isPaid(sale.status) ? 'Платено' : 'Неплатено'}
                    </Badge>

                    {sale.status === 'pending' && (
                        <Button onClick={handleMarkAsPaid} disabled={isUpdatingStatus} className="w-full mt-2">
                            {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCheck className="mr-2 h-4 w-4" />}
                            Маркирай като платено
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
};

export default SaleDetailsPage;
