'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useInventorySales } from '@/hooks/useInventorySales'; 
import { useMembers } from '@/hooks/useMembers';
import { deleteSale } from '@/services/sales-service';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, AlertTriangle, MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const SalesListPage = () => {
    const router = useRouter();
    const { sales, loading: salesLoading, error: salesError, refetch } = useInventorySales();
    const { members, loading: membersLoading, error: membersError } = useMembers();
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const memberMap = useMemo(() => {
        if (!members) return new Map();
        return new Map(members.map(member => [member.id, `${member.firstName} ${member.lastName}`]));
    }, [members]);

    const salesWithMemberNames = useMemo(() => {
        return sales.map(sale => ({
            ...sale,
            memberName: sale.memberId ? memberMap.get(sale.memberId) || 'Unknown Member' : 'Walk-in Customer',
        }));
    }, [sales, memberMap]);

    const sortedSales = useMemo(() => {
        return [...salesWithMemberNames].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
        });
    }, [salesWithMemberNames]);

    const handleRowClick = (saleId: string) => {
        router.push(`/sales/${saleId}/receipt`);
    };

    const handleDelete = async () => {
        if (!saleToDelete) return;
        setIsDeleting(true);
        try {
            await deleteSale(saleToDelete);
            toast.success('Продажбата беше изтрита успешно');
            refetch();
        } catch (error) {
            console.error('Error deleting sale:', error);
            toast.error('Грешка при изтриване');
        } finally {
            setIsDeleting(false);
            setSaleToDelete(null);
        }
    };
    
    const loading = salesLoading || membersLoading;
    const error = salesError || membersError;

    return (
        <div className="p-4 sm:p-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>История на продажбите (инвентар)</CardTitle>
                        <CardDescription>Преглед на всички продажби на продукти.</CardDescription>
                    </div>
                    <Button onClick={() => router.push('/sales/new')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Нова продажба
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4 text-lg text-muted-foreground">Зареждане...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-destructive flex flex-col items-center">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p>{error || "An error occurred while loading the sales."}</p>
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
                                            <TableRow key={sale.id} onClick={() => handleRowClick(sale.id)} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell>{new Date(sale.saleDate).toLocaleString('bg-BG')}</TableCell>
                                                <TableCell className="font-medium">{sale.memberName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={sale.isPaid ? 'default' : 'secondary'}>
                                                        {sale.isPaid ? 'Платено' : 'Висящо'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatPrice(sale.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-5 w-5" />
                                                                <span className="sr-only">Меню</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem 
                                                                className="text-destructive focus:bg-destructive/10 cursor-pointer" 
                                                                onSelect={() => setSaleToDelete(sale.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4"/>
                                                                <span>Изтрий</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Все още няма записани продажби на продукти.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Това действие ще изтрие записа на продажбата за постоянно. Ако това е продажба на инвентар, наличностите няма да се възстановят автоматично.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Изтрий
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SalesListPage;
