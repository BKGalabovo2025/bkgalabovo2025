
'use client';

import { Sale } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { ShoppingBag, Receipt, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSales } from '@/hooks/useSales'; // Assuming this hook fetches sales for a member

interface MemberSalesHistoryProps {
  memberId: string;
}

export const MemberSalesHistory = ({ memberId }: MemberSalesHistoryProps) => {
  const router = useRouter();
  // The useSales hook now fetches data internally, making the component self-sufficient.
  const { sales, loading, error, markAsPaid } = useSales(memberId);

  if (loading) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Зареждане на покупките...</p>
        </div>
    );
  }

  if (error) {
      return <p className="text-center text-destructive py-4">{error}</p>;
  }

  const getStatusVariant = (isPaid: boolean) => {
    return isPaid ? 'success' : 'destructive';
  };

  const getStatusText = (isPaid: boolean) => {
    return isPaid ? 'Платено' : 'Неплатено';
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2"/>
                История на покупките
            </CardTitle>
            <CardDescription>Списък с всички покупки на стоки от клуба.</CardDescription>
        </CardHeader>
        <CardContent>
            {sales && sales.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Дата</TableHead>
                            <TableHead className="text-center">Статус</TableHead>
                            <TableHead className="text-right">Сума</TableHead>
                            <TableHead className="w-48 text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.map(sale => (
                            <TableRow key={sale.id}>
                                <TableCell>{new Date(sale.saleDate).toLocaleDateString('bg-BG')}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={getStatusVariant(sale.isPaid)}>{getStatusText(sale.isPaid)}</Badge>
                                </TableCell>
                                <TableCell className="font-medium text-right">{sale.totalAmount.toFixed(2)} {sale.currency || 'EUR'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    {!sale.isPaid && (
                                        <Button variant="outline" size="sm" onClick={() => markAsPaid(sale.id)}>
                                            <CheckCircle className="h-4 w-4 mr-1"/> Плати
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => router.push(`/sales/${sale.id}/receipt`)}>
                                        <Receipt className="h-4 w-4"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-center text-muted-foreground py-4">Няма регистрирани покупки.</p>
            )}
        </CardContent>
    </Card>
  );
};
