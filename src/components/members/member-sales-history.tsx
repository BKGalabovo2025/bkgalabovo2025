
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSales } from '@/hooks/useSales';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/currency'; // IMPORT THE CENTRALIZED FORMATTER

interface MemberSalesHistoryProps {
  memberId: string;
}

export const MemberSalesHistory = ({ memberId }: MemberSalesHistoryProps) => {
  const router = useRouter();
  // The useSales hook fetches sales. We can assume it returns amounts in the currency they were recorded in.
  const { sales, loading, error } = useSales(memberId);

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}/receipt`);
  };

  const getDisplayPrice = (amount: number, currency: string | undefined) => {
    // If the historical currency was BGN, convert it to EUR for display.
    // Assumes amounts are stored in the smallest unit (stotinki/cents).
    const priceInMainUnit = amount / 100;
    if (currency === 'BGN') {
      // This is a legacy record. Convert the BGN amount to EUR.
      // IMPORTANT: The conversion logic should be centralized if it's complex,
      // but for this one-time display fix, a direct conversion is clear.
      const BGN_TO_EUR_RATE = 1.95583;
      return priceInMainUnit / BGN_TO_EUR_RATE;
    }
    // Otherwise, assume it's already in EUR (or should be treated as such).
    return priceInMainUnit;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">История на продажбите</h3>
        <Button size="sm" onClick={() => router.push(`/sales/new?memberId=${memberId}`)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Нова продажба
        </Button>
      </div>
      {loading ? (
        <p>Зареждане...</p>
      ) : error ? (
        <p>Грешка: {error}</p>
      ) : sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">Няма регистрирани продажби.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Обща сума</TableHead>
              <TableHead><span className="sr-only">Действия</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map(sale => {
              // Calculate the correct display price in EUR.
              const displayPriceInEur = getDisplayPrice(sale.totalAmount, sale.currency);
              
              return (
                <TableRow key={sale.id} onClick={() => handleRowClick(sale.id)} className="cursor-pointer">
                  <TableCell>{new Date(sale.saleDate).toLocaleDateString('bg-BG')}</TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                      {sale.status === 'completed' ? 'Платено' : 'Чакащо'}
                    </Badge>
                  </TableCell>
                  {/* ALWAYS use the centralized formatter to display the EUR price */}
                  <TableCell className="text-right">{formatPrice(displayPriceInEur)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleRowClick(sale.id)}>
                          Преглед на квитанция
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
