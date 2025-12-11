
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSales } from '@/services/sales-service';
import { Sale } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, PlusCircle } from 'lucide-react';

const SalesListPage = () => {
    const router = useRouter();
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const salesData = await getSales();
                setSales(salesData);
            } catch (error) {
                console.error("Error fetching sales:", error);
                // По-добре е да се покаже грешка на потребителя
            } finally {
                setIsLoading(false);
            }
        };
        fetchSales();
    }, []);

    const handleRowClick = (saleId: string) => {
        router.push(`/sales/${saleId}`);
    };

    return (
        <Card className="m-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>История на продажбите</CardTitle>
                <Button onClick={() => router.push('/sales/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Нова продажба
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Дата</TableHead>
                                <TableHead>Клиент</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead className="text-right">Обща сума</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.map((sale) => (
                                <TableRow key={sale.id} onClick={() => handleRowClick(sale.id)} className="cursor-pointer">
                                    <TableCell>{new Date(sale.date).toLocaleString('bg-BG')}</TableCell>
                                    <TableCell>{sale.customerName}</TableCell>
                                    <TableCell>{sale.customerType === 'member' ? 'Член' : 'Външен'}</TableCell>
                                    <TableCell className="text-right">{sale.totalAmount.toFixed(2)} лв.</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                 { !isLoading && sales.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Няма регистрирани продажби все още.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default SalesListPage;
