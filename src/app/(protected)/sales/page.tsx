'use client';
export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSales } from '@/hooks/useSales';
import { Sale } from '@/types';
// Use only the necessary currency formatter
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, AlertTriangle, MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SalesListPage = () => {
    const router = useRouter();
    const { sales, isLoading, error, deleteSale } = useSales();
    const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

    // Corrected sorting logic based on the new Sale type
    const sortedSales = useMemo(() => {
        return [...sales].sort((a, b) => {
            // Unpaid sales should come first
            if (!a.isPaid && b.isPaid) return -1;
            if (a.isPaid && !b.isPaid) return 1;
            // Then sort by date, newest first
            return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
        });
    }, [sales]);

    const handleRowClick = (saleId: string) => {
        router.push(`/sales/${saleId}`);
    };

    const handleDeleteConfirm = async () => {
        if (saleToDelete) {
            try {
                await deleteSale(saleToDelete.id);
            } catch (e) {
                // Error is already handled and toasted in the useSales hook
            } finally {
                setSaleToDelete(null);
            }
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
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
                                <p>{error.message || "Възникна грешка при зареждането на продажбите."}</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Дата</TableHead>
                                            <TableHead>Клиент</TableHead>
                                            <TableHead>Статус</TableHead>
                                            <TableHead className="text-right">Обща сума</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedSales.length > 0 ? (
                                            sortedSales.map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell onClick={() => handleRowClick(sale.id)} className="cursor-pointer hover:bg-muted/50">{new Date(sale.saleDate).toLocaleString('bg-BG')}</TableCell>
                                                    <TableCell onClick={() => handleRowClick(sale.id)} className="cursor-pointer hover:bg-muted/50 font-medium">{sale.memberName || 'Външен клиент'}</TableCell>
                                                    <TableCell onClick={() => handleRowClick(sale.id)} className="cursor-pointer hover:bg-muted/50">
                                                        {/* Correctly use sale.isPaid boolean */}
                                                        <Badge variant={sale.isPaid ? 'success' : 'destructive'}>
                                                            {sale.isPaid ? 'Платено' : 'Неплатено'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell onClick={() => handleRowClick(sale.id)} className="text-right font-mono cursor-pointer hover:bg-muted/50">
                                                        {/* Correctly format currency to EUR */}
                                                        {formatCurrency(sale.totalAmount, 'EUR')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-5 w-5" />
                                                                    <span className="sr-only">Отвори меню</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                 <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                                        <Trash2 className="mr-2 h-4 w-4"/>
                                                                        <span>Изтрий</span>
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Потвърдете изтриването</AlertDialogTitle>
                        <AlertDialogDescription>
                            Сигурни ли сте, че искате да изтриете тази продажба? Наличностите на продуктите ще бъдат възстановени. Това действие е необратимо.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Изтрий</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SalesListPage;
