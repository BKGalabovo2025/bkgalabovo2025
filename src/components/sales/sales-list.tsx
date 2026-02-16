
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSales } from '@/hooks/useSales';
import { useMembers } from '@/hooks/useMembers';

export const SalesList = () => {
  const router = useRouter();
  const { sales, loading, error } = useSales();
  const { members, loading: membersLoading } = useMembers();

  const getMemberName = (memberId: string) => {
    if (memberId === 'external') return 'Външен клиент';
    const member = members.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Неизвестен член';
  };

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}/receipt`);
  };

  if (loading || membersLoading) {
    return <div>Зареждане...</div>;
  }

  if (error) {
    return <div>Грешка при зареждане на продажбите: {error}</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>История на продажбите</CardTitle>
          <CardDescription>Преглед на всички направени продажби.</CardDescription>
        </div>
        <Button onClick={() => router.push('/sales/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Нова продажба
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Обща сума</TableHead>
              <TableHead><span className="sr-only">Действия</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} onClick={() => handleRowClick(sale.id)} className="cursor-pointer">
                <TableCell>{new Date(sale.saleDate).toLocaleString('bg-BG')}</TableCell>
                <TableCell>{getMemberName(sale.memberId)}</TableCell>
                <TableCell><Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>{sale.status}</Badge></TableCell>
                <TableCell className="text-right">{(sale.totalAmount / 100).toFixed(2)} {sale.currency || 'BGN'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Действия</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => router.push(`/sales/${sale.id}/receipt`)}>Преглед на квитанция</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
