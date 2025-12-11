
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { getSaleById, deleteSale } from '@/services/sales-service';
import { Sale } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Trash2, Printer } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ReceiptPage = () => {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const id = params.id as string;

    const [sale, setSale] = useState<Sale | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchSale = async () => {
            try {
                const saleData = await getSaleById(id);
                if (!saleData) {
                    toast({ title: "Грешка", description: "Документ с такъв номер не е намерен.", variant: "destructive" });
                    router.push('/sales');
                } else {
                    setSale(saleData);
                }
            } catch (error) {
                console.error("Error fetching sale: ", error);
                toast({ title: "Грешка при зареждане", description: "Възникна проблем при извличането на данните.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSale();
    }, [id, router, toast]);

    const handleDelete = async () => {
        if (!sale) return;
        if (!confirm("Сигурни ли сте, че искате да изтриете този документ? Тази операция е необратима.")) {
            return;
        }
        try {
            await deleteSale(id, sale);
            toast({ title: "Успех!", description: "Документът беше изтрит успешно." });
            router.push('/sales');
        } catch (error) {
            console.error("Error deleting sale: ", error);
            toast({ title: "Грешка", description: "Възникна проблем при изтриването на документа.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (!sale) {
        return null;
    }

    const clubInfo = {
        name: 'СНЦ "Бадминтон клуб Гълъбово"',
        address: 'град Гълъбово, п.к 6280, обл. Стара Загора, ул. ”Иван Вазов” №22',
        contact: 'тел: +359 899 82 99 23 - Мира Георгиева',
        email: 'e-mail: bk_galabovo@abv.bg',
        website: 'www.bkgalabovo.alle.bg'
    };

    return (
        <div className="bg-gray-100 p-4">
            <style jsx global>{`
                @media print {
                    body { 
                        background: white !important; 
                        color: black !important; 
                        padding: 20mm !important;
                    }
                    .no-print { display: none !important; }
                    .printable-area {
                        margin: 0;
                        padding: 0;
                        border: none;
                        box-shadow: none;
                        background: white;
                    }
                     .receipt-footer, .signature-section, .issuer-receiver-section {
                        page-break-inside: avoid;
                    }    
                    @page {
                        size: A4;
                        margin: 0;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto">
                 <div className="flex justify-between items-center mb-4 no-print">
                    <Button variant="outline" onClick={() => router.push('/sales')}><ArrowLeft className="mr-2 h-4 w-4" /> Всички продажби</Button>
                    <div className='flex gap-2'>
                        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/> Принтирай</Button>
                        <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Изтрий</Button>
                    </div>
                </div>

                <Card className="printable-area p-8 shadow-lg">
                    <header className="flex justify-between items-center pb-4 border-b">
                        <div className="flex items-center">
                             <Image src="/logo.png" alt="Лого" width={100} height={100} />
                             <div className='ml-4'>
                                <h1 className="text-3xl font-bold">СТОКОВА РАЗПИСКА</h1>
                                <p className="text-gray-600">№ {sale.id.substring(0, 8)} / {new Date(sale.date).toLocaleDateString('bg-BG')}</p>
                             </div>
                        </div>
                    </header>
                    
                    <main className="mt-8">
                        <div className="grid grid-cols-2 gap-8 issuer-receiver-section">
                            <div>
                                <h2 className="text-lg font-semibold border-b pb-1 mb-2">ИЗДАЛ:</h2>
                                <p className="font-bold">{clubInfo.name}</p>
                                <p>{clubInfo.address}</p>
                                <p>{clubInfo.contact}</p>
                                <p>{clubInfo.email}</p>
                                <p>{clubInfo.website}</p>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold border-b pb-1 mb-2">ПОЛУЧАТЕЛ:</h2>
                                <p className="font-bold">{sale.customerName}</p>
                                <p>{sale.customerType === 'member' ? 'Редовен член на клуба' : 'Външен клиент'}</p>
                            </div>
                        </div>

                        <div className="mt-8">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/2">Артикул</TableHead>
                                        <TableHead>Кол.</TableHead>
                                        <TableHead>Ед. цена</TableHead>
                                        <TableHead className="text-right">Общо</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.items.map(item => (
                                        <TableRow key={item.productId}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{item.price.toFixed(2)} лв.</TableCell>
                                            <TableCell className="text-right">{(item.price * item.quantity).toFixed(2)} лв.</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end mt-4 font-bold text-lg">
                             <p>ОБЩО ЗА ПЛАЩАНЕ: {sale.totalAmount.toFixed(2)} лв.</p>
                        </div>
                        
                         <div className="mt-24 grid grid-cols-2 gap-8 text-center signature-section">
                            <div>
                                <p className="border-t pt-2">Издал:</p>
                                <p className='text-sm'>(Подпис и печат)</p>
                                 <p className='mt-2'>/СНЦ "Бадминтон клуб Гълъбово"/</p>
                            </div>
                            <div>
                                <p className="border-t pt-2">Получил:</p>
                                <p className='text-sm'>(Подпис)</p>
                                <p className='mt-2'>/{sale.customerName}/</p>
                            </div>
                        </div>
                    </main>

                    <footer className="text-center text-xs text-gray-500 mt-16 receipt-footer">
                         <p>Настоящият документ се издава в два еднообразни екземпляра - по един за всяка от страните.</p>
                         <p>Той удостоверява предаването и приемането на описаните артикули и служи за целите на вътрешния контрол и отчетност.</p>
                    </footer>
                </Card>
            </div>
        </div>
    );
};

export default ReceiptPage;
