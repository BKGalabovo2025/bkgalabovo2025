
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { db } from '@/lib/firebase';
import { Sale, SaleItem, Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Printer, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { clubInfo } from '@/config/club';
import { Timestamp } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SaleWithMemberData extends Sale {
  member?: Member | null;
  saleDate: Date;
}

const ReceiptPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [sale, setSale] = useState<SaleWithMemberData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    removeAfterPrint: true, // This can help with issues in some cases
    pageStyle: `
      @media print {
        .no-print {
          display: none !important;
        }
      }
    `
  });

  const handleDeleteSale = async () => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'sales', id));
      toast({ title: 'Успех', description: 'Продажбата беше изтрита.' });
      router.push('/sales');
    } catch (error) {
      console.error('Error deleting sale: ', error);
      toast({ title: 'Грешка', description: 'Възникна проблем при изтриването на продажбата.', variant: 'destructive' });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchSale = async () => {
      setIsLoading(true);
      try {
        const saleRef = doc(db, 'sales', id);
        const saleSnap = await getDoc(saleRef);

        if (saleSnap.exists()) {
          const saleData = saleSnap.data();
          let memberData: Member | null = null;

          if (saleData.memberId) {
            const memberRef = doc(db, 'members', saleData.memberId);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
              memberData = { id: memberSnap.id, ...memberSnap.data() } as Member;
            }
          }

          const saleDate = saleData.date instanceof Timestamp ? saleData.date.toDate() : new Date(saleData.date);

          const saleObject: SaleWithMemberData = {
            id: saleSnap.id,
            items: saleData.items || [],
            totalAmount: saleData.totalAmount || 0,
            memberId: saleData.memberId,
            customerName: saleData.customerName || (memberData ? `${memberData.firstName} ${memberData.lastName}` : 'Външен клиент'),
            member: memberData,
            saleDate: saleDate,
            date: saleDate.toISOString(),
          };

          setSale(saleObject);
        } else {
          toast({ title: 'Грешка', description: 'Продажба с такова ID не е намерена.', variant: 'destructive' });
          router.push('/sales');
        }
      } catch (error) {
        console.error('Firebase Error: ', error);
        toast({ title: 'Грешка при зареждане', description: 'Възникна проблем при извличането на данните.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSale();
  }, [id, router, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!sale) return null;

  const formattedDate = sale.saleDate.toLocaleDateString('bg-BG', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap gap-2 no-print">
        <Button variant="outline" onClick={() => router.push('/sales')}><ArrowLeft className="mr-2 h-4 w-4" /> Всички продажби</Button>
        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Принтирай</Button>
        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Изтрий</Button>
      </div>

      <div ref={componentRef}>
        <Card className="max-w-4xl mx-auto p-8 shadow-lg font-sans">
            <header className="grid grid-cols-3 items-start mb-6">
                <div className="col-span-1">
                    <Image src="/logo.png" alt="Club Logo" width={100} height={100} />
                </div>
                <div className="col-span-2 text-center">
                    <h1 className="text-2xl font-bold">СТОКОВА РАЗПИСКА</h1>
                    <p className="text-md">№ {sale.id.slice(0, 8)} / {formattedDate} г.</p>
                </div>
            </header>

            <CardContent>
                <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                    <div className="border p-4 rounded-md">
                        <h3 className="font-bold mb-2 underline">ИЗДАЛ:</h3>
                        <p className="font-semibold">{clubInfo.name}</p>
                        <p>{clubInfo.address}</p>
                        <p>{clubInfo.contact}</p>
                        <p>{clubInfo.email}</p>
                        <p>{clubInfo.website}</p>
                    </div>
                    <div className="border p-4 rounded-md">
                        <h3 className="font-bold mb-2 underline">ПОЛУЧАТЕЛ:</h3>
                        <p className="font-semibold">{sale.customerName}</p>
                        {sale.member && <p>Редовен член на клуба</p>}
                    </div>
                </div>

                <table className="w-full text-sm mb-6 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-2 px-2 font-bold">Артикул</th>
                            <th className="text-center py-2 px-2 font-bold">Кол.</th>
                            <th className="text-right py-2 px-2 font-bold">Ед. цена</th>
                            <th className="text-right py-2 px-2 font-bold">Общо</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="py-2 px-2">{item.name}</td>
                                <td className="text-center py-2 px-2">{item.quantity}</td>
                                <td className="text-right py-2 px-2">{item.price.toFixed(2)} лв.</td>
                                <td className="text-right py-2 px-2">{(item.price * item.quantity).toFixed(2)} лв.</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-12">
                    <div className="text-right text-lg font-bold">
                        <p>ОБЩО ЗА ПЛАЩАНЕ: {sale.totalAmount.toFixed(2)} лв.</p>
                    </div>
                </div>

                <div className="flex justify-between text-sm mt-16 pt-4">
                    <div className="text-center">
                        <p className="font-semibold">Издал:</p>
                        <p className="mt-8 border-t pt-1">(Подпис и печат)</p>
                        <p>/ {clubInfo.name} /</p>
                    </div>
                    <div className="text-center">
                        <p className="font-semibold">Получил:</p>
                        <p className="mt-8 border-t pt-1">(Подпис)</p>
                        <p>/ {sale.customerName} /</p>
                    </div>
                </div>
            </CardContent>
            <footer className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
              <p>Настоящият документ се издава в два еднообразни екземпляра - по един за всяка от страните.</p>
              <p>Той удостоверява предаването и приемането на описаните артикули и служи за целите на вътрешния контрол и отчетност.</p>
            </footer>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="no-print">
          <AlertDialogHeader>
            <AlertDialogTitle>Наистина ли искате да изтриете тази продажба?</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие е необратимо. Продажбата ще бъде изтрита завинаги.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSale}>Изтрий</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReceiptPage;
