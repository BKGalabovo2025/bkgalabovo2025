
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Subscription } from '@/types';
import { DataTableColumnHeader } from '@/components/shared/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

// Define the shape of the data for the table
export interface SubscriptionData extends Subscription {
  serviceName: string;
  memberFirstName: string;
  memberLastName: string;
}

// Helper function to determine badge color based on status
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="success">Активен</Badge>;
    case 'pending_payment':
      return <Badge variant="secondary">Чакащо плащане</Badge>;
    case 'expired':
      return <Badge variant="destructive">Изтекъл</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">Отказан</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// Define the columns for the DataTable
export const columns: ColumnDef<SubscriptionData>[] = [
  {
    accessorKey: 'memberLastName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Член" />
    ),
    cell: ({ row }) => {
      const memberId = row.original.memberId;
      return (
          <Link href={`/members/${memberId}`} className="hover:underline text-primary font-medium">
             {`${row.original.memberFirstName} ${row.original.memberLastName}`}
          </Link>
      );
    },
  },
  {
    accessorKey: 'serviceName',
     header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Абонамент" />
    ),
  },
  {
    accessorKey: 'status',
     header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: 'startDate',
     header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Начална дата" />
    ),
    cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString('bg-BG'),
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Крайна дата" />
    ),
    cell: ({ row }) => new Date(row.original.endDate).toLocaleDateString('bg-BG'),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const subscription = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Отвори меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Действия</DropdownMenuLabel>
            <DropdownMenuItem asChild>
               <Link href={`/members/${subscription.memberId}?tab=subscriptions`}>Преглед на абонамента</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
               <Link href={`/sales/new?memberId=${subscription.memberId}`}>Регистрирай плащане</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
