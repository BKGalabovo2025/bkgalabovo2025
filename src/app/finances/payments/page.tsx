
'use client';

import { useState, useEffect } from 'react';
import { EnrichedPayment, getEnrichedPayments } from '@/services/finance-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

const paymentMethodMap = {
    cash: 'В брой',
    card: 'С карта',
    bank_transfer: 'Банков превод'
};

const subscriptionTypeMap = {
    monthly: 'Месечен',
    quarterly: 'Тримесечен',
    yearly: 'Годишен',
    single_visit: 'Еднократно посещение'
};

const PaymentsHistoryPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [payments, setPayments] = useState<EnrichedPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const paymentsData = await getEnrichedPayments();
                setPayments(paymentsData);
            } catch (error) {
                console.error("Firebase error:", error);
                toast({ title: "Грешка при зареждане на плащанията", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayments();
    }, [toast]);

  return (
    <div>
        <Button variant="outline" onClick={() => router.push('/finances')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад към Финанси
        </Button>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">История на плащанията</h1>
        <Button variant="outline" disabled> {/* TODO: Implement export functionality */}
            <FileText className="mr-2 h-4 w-4" />
            Експорт (скоро)
        </Button>
      </div>
      
      {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Зареждане на плащанията...</p>
          </div>
        ) : (
        <div className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Член</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Дата на плащане</TableHead>
                <TableHead>Метод</TableHead>
                <TableHead>Абонамент</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {payments.length > 0 ? payments.map((payment) => (
                <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                        <Link href={`/members/${payment.member.id}`} className="text-primary hover:underline">
                            {`${payment.member.firstName} ${payment.member.lastName}`}
                        </Link>
                    </TableCell>
                    <TableCell>{payment.amount.toFixed(2)} лв.</TableCell>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString('bg-BG')}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{paymentMethodMap[payment.method]}</Badge>
                    </TableCell>
                    <TableCell>
                        <span className='text-sm text-muted-foreground'>{subscriptionTypeMap[payment.subscriptionType]}</span>
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

export default PaymentsHistoryPage;
