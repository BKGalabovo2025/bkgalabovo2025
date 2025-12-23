'use client';
export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSales } from '@/hooks/useSales';
import { Sale } from '@/types';
import { formatCurrency, formatBgnCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, AlertTriangle, MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from 'react';

const SalesListPage = () => {
    const router = useRouter();
    const { sales, isLoading, error, deleteSale } = useSales();
    const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

    const sortedSales = useMemo(() => {
        return [...sales].sort((a, b) => {
            const aIsUnpaid = a.status === 'pending';
            const bIsUnpaid = b.status === 'pending';
            if (aIsUnpaid && !bIsUnpaid) return -1;
            if (!aIsUnpaid && bIsUnpaid) return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [sales]);

    const handleRowClick = (saleId: string) => {
        router.push(`/sales/${saleId}`);
    };

    const handleDeleteConfirm = async () => {
        if (saleToDelete) {
            await deleteSale(saleToDelete.id);
            setSaleToDelete(null);
        }
    };

    const isPaid = (status: Sale['status']) => {
        return status === 'paid' || status === 'completed';
    }

    return (
        <div className="p-4 sm:p-6">
            <AlertDialog>
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
                                <p>Възникна грешка при зареждането на продажбите.</p>
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
                                            <TableHead className="text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedSales.length > 0 ? (
                                            sortedSales.map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell onClick={() => handleRowClick(sale.id!)} className="cursor-pointer hover:bg-muted/50">{new Date(sale.date).toLocaleString('bg-BG')}</TableCell>
                                                    <TableCell onClick={() => handleRowClick(sale.id!)} className="cursor-pointer hover:bg-muted/50 font-medium">{sale.customerName}</TableCell>
                                                    <TableCell onClick={() => handleRowClick(sale.id!)} className="cursor-pointer hover:bg-muted/50">
                                                        <Badge variant={isPaid(sale.status) ? 'success' : 'destructive'}>
                                                            {isPaid(sale.status) ? 'Платено' : 'Неплатено'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell onClick={() => handleRowClick(sale.id!)} className="cursor-pointer hover:bg-muted/50">{sale.memberId ? 'Член на клуба' : 'Външен клиент'}</TableCell>
                                                    <TableCell onClick={() => handleRowClick(sale.id!)} className="text-right font-mono cursor-pointer hover:bg-muted/50">
                                                        {sale.currency === 'EUR' 
                                                            ? formatCurrency(sale.total)
                                                            : formatBgnCurrency(sale.total)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-5 w-5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                                 <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()} onClick={() => setSaleToDelete(sale)}> 
                                                                        <Trash2 className="mr-2 h-4 w-4"/>Изтрий
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">Няма регистрирани продажби все още.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
                {/* This is the dialog content, now correctly structured */}
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Потвърдете изтриването</AlertDialogTitle>
                        <AlertDialogDescription>
                            Сигурни ли сте, че искате да изтриете тази продажба? Това действие е необратимо.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Отказ</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SalesListPage;
