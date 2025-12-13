
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Payment, Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Loader2, PlusCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { getAllPayments, deletePayment, addPayment, updatePayment } from '@/services/finance-service';
import { getMembers } from '@/services/member-service';
import { PaymentForm } from '@/components/finance/payment-form';


const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | undefined>(undefined);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const { toast } = useToast();

  const membersMap = new Map(members.map(m => [m.id, `${m.firstName} ${m.lastName}`]));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsData, membersData] = await Promise.all([
          getAllPayments(),
          getMembers()
        ]);
        setPayments(paymentsData);
        setMembers(membersData);
      } catch (error) {
        console.error("Грешка при зареждане на финансовите данни: ", error);
        toast({ title: "Грешка при зареждане на данните", description: "Моля, опитайте отново.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleSavePayment = async (data: Omit<Payment, 'id'>) => {
    try {
      if (selectedPayment) {
        const updatedPayment = { ...selectedPayment, ...data };
        await updatePayment(selectedPayment.id, data);
        setPayments(payments.map(p => p.id === selectedPayment.id ? updatedPayment : p));
        toast({ title: "Плащането е обновено", description: "Данните бяха успешно актуализирани." });
      } else {
        const newPaymentId = await addPayment(data);
        const newPayment: Payment = { id: newPaymentId, ...data };
        setPayments(prev => [newPayment, ...prev].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
        toast({ title: "Плащането е добавено", description: "Новото плащане беше успешно записано." });
      }
      setIsFormOpen(false);
      setSelectedPayment(undefined);
    } catch (error) {
        console.error("Грешка при запис на плащане: ", error);
        toast({ title: "Грешка при запис", description: "Възникна грешка при запазването на плащането.", variant: "destructive" });
    }
  }

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;

    try {
      await deletePayment(paymentToDelete.id);
      setPayments(payments.filter(p => p.id !== paymentToDelete.id));
      toast({ title: "Плащането е изтрито", description: "Данните бяха успешно изтрити." });
      setPaymentToDelete(null);
    } catch (error) {
      console.error("Грешка при изтриване на плащане: ", error);
      toast({ title: "Грешка при изтриване", description: "Възникна грешка при изтриването на плащането.", variant: "destructive" });
    }
  }
  
  const openFormForEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsFormOpen(true);
  };

  const openFormForCreate = () => {
    setSelectedPayment(undefined);
    setIsFormOpen(true);
  }

  const getPaymentTypeName = (type: string) => {
    switch (type) {
        case 'membership_fee': return 'Членски внос';
        case 'donation': return 'Дарение';
        case 'other': return 'Друго';
        default: return type;
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Плащания</h1>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={openFormForCreate}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Добави плащане
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{selectedPayment ? 'Редактиране на плащане' : 'Добавяне на ново плащане'}</DialogTitle>
                        <DialogDescription>{selectedPayment ? 'Променете данните и натиснете "Запази".' : 'Изберете член и попълнете детайлите на плащането.'}</DialogDescription>
                    </DialogHeader>
                    <PaymentForm members={members} payment={selectedPayment} onSave={handleSavePayment} onClose={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Зареждане на плащания...</p>
        </div>
      ) : (
        <AlertDialog>
            <div className="border rounded-lg">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Член</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                    <TableHead>Дата на плащане</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead><span className="sr-only">Действия</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {payments.length > 0 ? payments.map((payment) => (
                    <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                        <Link href={`/members/${payment.memberId}`} className="hover:underline text-primary">
                            {membersMap.get(payment.memberId) || 'Неизвестен член'}
                        </Link>
                    </TableCell>
                    <TableCell className="text-right">{payment.amount.toFixed(2)} лв.</TableCell>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString('bg-BG')}</TableCell>
                    <TableCell>{getPaymentTypeName(payment.type)}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Отвори меню</span>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openFormForEdit(payment)}>Редактирай</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()} onClick={() => setPaymentToDelete(payment)}>Изтрий</DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">Няма намерени плащания.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Наистина ли искате да изтриете това плащане?</AlertDialogTitle>
                    <AlertDialogDescription>Това действие е необратимо. Записът за плащане ще бъде изтрит завинаги.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>Отказ</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default PaymentsPage;
