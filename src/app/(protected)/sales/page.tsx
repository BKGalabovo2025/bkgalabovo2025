'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSales } from '@/services/sales-service';
import { useToast } from '@/components/ui/use-toast';
import { Sale } from '@/types';
import { formatCurrency, formatBgnCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, AlertTriangle } from 'lucide-react';

const SalesListPage = () => {
    const router = useRouter();
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSales = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const salesData = await getSales();
                
                salesData.sort((a, b) => {
                    const aIsUnpaid = a.status === 'pending';
                    const bIsUnpaid = b.status === 'pending';
                    if (aIsUnpaid && !bIsUnpaid) return -1;
                    if (!aIsUnpaid && bIsUnpaid) return 1;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                });

                setSales(salesData);
            } catch (err) {
                console.error("Грешка при зареждане на продажбите:", err);
                setError("Възникна грешка при зареждането на продажбите.");
                toast({
                    title: "Грешка",
                    description: "Неуспешно зареждане на историята на продажбите.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSales();
    }, [toast]);

    const handleRowClick = (saleId: string) => {
        router.push(`/sales/${saleId}`);
    };

    const isPaid = (status: Sale['status']) => {
        return status === 'paid' || status === 'completed';
    }

    return (
        <div className="p-4 sm:p-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>История на продажбите</CardTitle>
                        <CardDescription>Преглед на всички направени продажби.</CardDescription>
                    </div>
                    <Button onClick={() => router.push('/sales/new')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Нова продажба
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                             <p className="ml-4 text-lg text-muted-foreground">Зареждане...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-destructive flex flex-col items-center">
                             <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>Клиент</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Тип</TableHead>
                                        <TableHead className="text-right">Обща сума</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.length > 0 ? (
                                        sales.map((sale) => (
                                            <TableRow key={sale.id} onClick={() => handleRowClick(sale.id!)} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell>{new Date(sale.date).toLocaleString('bg-BG')}</TableCell>
                                                <TableCell className="font-medium">{sale.customerName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={isPaid(sale.status) ? 'success' : 'destructive'}>
                                                        {isPaid(sale.status) ? 'Платено' : 'Неплатено'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{sale.memberId ? 'Член на клуба' : 'Външен клиент'}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {/* -- Currency Logic -- */}
                                                    {sale.currency === 'EUR' 
                                                        ? formatCurrency(sale.total)
                                                        : formatBgnCurrency(sale.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Няма регистрирани продажби все още.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SalesListPage;
