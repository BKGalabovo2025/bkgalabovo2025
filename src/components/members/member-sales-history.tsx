
import { Sale } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { ShoppingBag, Receipt, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MemberSalesHistoryProps {
  sales: Sale[];
  onMarkAsPaid: (saleId: string) => void;
}

export const MemberSalesHistory = ({ sales, onMarkAsPaid }: MemberSalesHistoryProps) => {
  const router = useRouter();

  const getStatusVariant = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'secondary';
      case 'pending':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: Sale['status']) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'Платено';
      case 'pending':
        return 'Неплатено';
      default:
        return status;
    }
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
            {sales.length > 0 ? (
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
                                <TableCell>{new Date(sale.date).toLocaleDateString('bg-BG')}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={getStatusVariant(sale.status)}>{getStatusText(sale.status)}</Badge>
                                </TableCell>
                                <TableCell className="font-medium text-right">{sale.total.toFixed(2)} лв.</TableCell>
                                <TableCell className="text-right space-x-2">
                                    {sale.status === 'pending' && (
                                        <Button variant="outline" size="sm" onClick={() => onMarkAsPaid(sale.id)}>
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

