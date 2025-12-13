'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSaleById, deleteSale } from '@/services/sales-service';
import { getMemberById } from '@/services/member-service';
import { Sale, Member } from '@/types';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Printer, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { clubInfo } from '@/config/club';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


const SaleReceiptPage = () => {
    const [sale, setSale] = useState<Sale | null>(null);
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const saleId = params.id as string;

    useEffect(() => {
        if (saleId) {
            const fetchSaleData = async () => {
                setLoading(true);
                try {
                    const saleData = await getSaleById(saleId);
                    setSale(saleData);
                    if (saleData && saleData.memberId) {
                        const memberData = await getMemberById(saleData.memberId);
                        setMember(memberData);
                    }
                } catch (error) {
                    console.error("Грешка при зареждане на продажбата:", error);
                    toast({ title: "Грешка", description: "Неуспешно зареждане на данните за продажбата.", variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            fetchSaleData();
        }
    }, [saleId, toast]);

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async () => {
        setShowDeleteDialog(false);
        try {
            await deleteSale(saleId);
            toast({ title: "Успех!", description: "Продажбата беше изтрита успешно." });
            router.push('/sales');
        } catch (error) {
            console.error("Грешка при изтриване на продажба:", error);
            toast({ title: "Грешка", description: "Възникна проблем при изтриването на продажбата.", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!sale) {
        return <div className="text-center py-10">Продажбата не е намерена.</div>;
    }

    return (
        <div className="bg-gray-50 print:bg-white">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <Button variant="outline" onClick={() => router.push('/sales')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Всички продажби
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" /> Принтирай
                        </Button>
                        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Изтрий
                        </Button>
                    </div>
                </div>

                <div className="bg-white p-8 border border-gray-200 shadow-sm print:border-none print:shadow-none">
                    <header className="flex justify-between items-start pb-6 border-b-2 border-gray-100">
                        <div className="flex items-center gap-4">
                            <Image src="/logo.png" alt="Club Logo" width={60} height={60} />
                        </div>
                        <div className="text-right">
                            <h1 className="text-3xl font-bold tracking-wider">СТОКОВА РАЗПИСКА</h1>
                            <p className="text-sm text-gray-500 mt-1">№ {sale.id.substring(0, 8)} / {new Date(sale.date).toLocaleDateString('bg-BG')}</p>
                        </div>
                    </header>

                    <section className="mt-8 grid grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">ИЗДАЛ:</h2>
                            <p className="font-bold mt-2">{clubInfo.name}</p>
                            <p className="text-sm text-gray-600">{clubInfo.address}</p>
                            <p className="text-sm text-gray-600">тел: {clubInfo.contact}</p>
                            <p className="text-sm text-gray-600">e-mail: {clubInfo.email}</p>
                            <p className="text-sm text-gray-600">{clubInfo.website}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">ПОЛУЧАТЕЛ:</h2>
                            {member ? (
                                <>
                                    <p className="font-bold mt-2">{member.firstName} {member.lastName}</p>
                                    <p className="text-sm text-gray-600">Редовен член на клуба</p>
                                </>
                            ) : (
                                <p className="font-bold mt-2">Външен клиент</p>
                            )}
                        </div>
                    </section>

                    <section className="mt-10">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="text-left font-semibold text-gray-500 p-2">Артикул</th>
                                    <th className="text-center font-semibold text-gray-500 p-2">Кол.</th>
                                    <th className="text-right font-semibold text-gray-500 p-2">Ед. цена</th>
                                    <th className="text-right font-semibold text-gray-500 p-2">Общо</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item) => (
                                    <tr key={item.productId}>
                                        <td className="p-2 font-medium">{item.name}</td>
                                        <td className="text-center p-2">{item.quantity}</td>
                                        <td className="text-right p-2">{(item.price || 0).toFixed(2)} лв.</td>
                                        <td className="text-right p-2">{((item.quantity || 0) * (item.price || 0)).toFixed(2)} лв.</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-gray-200">
                                <tr>
                                    <td colSpan={3} className="text-right p-3 font-bold text-gray-700">ОБЩО ЗА ПЛАЩАНЕ:</td>
                                    <td className="text-right p-3 font-bold text-lg">{(sale.total || 0).toFixed(2)} лв.</td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>

                    <section className="mt-20 grid grid-cols-2 gap-8 text-center">
                        <div>
                            <p className="text-sm text-gray-500">Издал:</p>
                            <p className="text-sm mt-1">(Подпис и печат)</p>
                            <p className="mt-8">/СНЦ "Бадминтон клуб Гълъбово"/</p>
                        </div>
                        <div>
                             <p className="text-sm text-gray-500">Получил:</p>
                             <p className="text-sm mt-1">(Подпис)</p>
                             <p className="mt-8">/{member ? `${member.firstName} ${member.lastName}` : '................................'}/</p>
                        </div>
                    </section>

                    <footer className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
                        <p>Настоящият документ се издава в два еднообразни екземпляра - по един за всяка от страните.</p>
                        <p>Той удостоверява предаването и приемането на описаните артикули и служи за целите на вътрешния контрол и отчетност.</p>
                    </footer>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Потвърждение за изтриване</AlertDialogTitle>
                        <AlertDialogDescription>
                            Сигурни ли сте, че искате да изтриете тази продажба? Това действие е необратимо.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
};

export default SaleReceiptPage;
