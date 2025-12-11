
'use client';

import { useState, useEffect } from 'react';
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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getAllPayments, deletePayment, addPayment } from '@/services/finance-service';
import { getMembers } from '@/services/member-service';
import { PaymentForm } from '@/components/finance/payment-form';


const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
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
        console.error("Firebase Error: ", error);
        toast({ title: "Грешка при зареждане на данните", description: "Моля, опитайте отново.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleSavePayment = async (data: Omit<Payment, 'id'>) => {
    try {
        const newPaymentId = await addPayment(data);
        const newPayment: Payment = { id: newPaymentId, ...data };
        
        // Update payments state
        setPayments(prev => [newPayment, ...prev]);

        toast({ title: "Плащането е добавено", description: "Новото плащане беше успешно записано." });
        setIsFormOpen(false); // Close the dialog
    } catch (error) {
        console.error("Firebase Error: ", error);
        toast({ title: "Грешка при запис", description: "Възникна грешка при добавянето на плащането.", variant: "destructive" });
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете това плащане?")) return;

    try {
      await deletePayment(id);
      setPayments(payments.filter(p => p.id !== id));
      toast({ title: "Плащането е изтрито", description: "Данните бяха успешно изтрити." });
    } catch (error) {
      console.error("Firebase Error: ", error);
      toast({ title: "Грешка при изтриване", description: "Възникна грешка при изтриването на плащането.", variant: "destructive" });
    }
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
      <div className="flex justify-end mb-4">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Добави плащане
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Добавяне на ново плащане</DialogTitle>
              <DialogDescription>
                Изберете член и попълнете детайлите на плащането.
              </DialogDescription>
            </DialogHeader>
            <PaymentForm members={members} onSave={handleSavePayment} onClose={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Зареждане на плащания...</p>
        </div>
      ) : (
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
                  <TableCell className="font-medium">{membersMap.get(payment.memberId) || 'Неизвестен член'}</TableCell>
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
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePayment(payment.id)}>
                          Изтрий
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    Няма намерени плащания.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
