
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Subscription } from '@/types';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/shared/data-table-column-header';
import { Badge } from '@/components/ui/badge';

// Defines the shape of the status object, including text and a color variant.
interface StatusInfo {
  text: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

/**
 * Determines the subscription status based on the end date.
 * @param endDateString - The end date of the subscription as an ISO string.
 * @returns A status object with text and a corresponding color variant.
 */
const getStatusInfo = (endDateString: string): StatusInfo => {
  const endDate = new Date(endDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day for accurate comparison

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (endDate < today) {
    return { text: 'Изтекъл', variant: 'destructive' }; // Red for expired
  } else if (endDate <= thirtyDaysFromNow) {
    return { text: 'Изтичащ', variant: 'outline' }; // Use outline for expiring soon to stand out
  } else {
    return { text: 'Активен', variant: 'default' }; // Primary color for active
  }
};


export const getSubscriptionColumns = (
    memberMap: Map<string, string>,
    onDelete: (id: string) => Promise<void>
): ColumnDef<Subscription>[] => [
    {
        accessorKey: "memberId",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Член" />
        ),
        cell: ({ row }) => {
            const memberId = row.getValue("memberId") as string;
            return memberMap.get(memberId) || 'Неизвестен член';
        },
        filterFn: (row, id, value) => {
            const memberName = memberMap.get(row.getValue(id));
            return memberName ? memberName.toLowerCase().includes(value.toLowerCase()) : false;
        },
    },
    {
        accessorKey: "startDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Начална дата" />
        ),
        cell: ({ row }) => new Date(row.getValue("startDate")).toLocaleDateString('bg-BG'),
    },
    {
        accessorKey: "endDate",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Крайна дата" />
        ),
        cell: ({ row }) => new Date(row.getValue("endDate")).toLocaleDateString('bg-BG'),
    },
    {
        id: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => {
            const endDate = row.original.endDate;
            const statusInfo = getStatusInfo(endDate);
            return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
        },
    },
    {
        id: "actions",
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
                        <DropdownMenuItem
                            onClick={() => onDelete(subscription.id)}
                            className="text-destructive"
                        >
                            Изтрий
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
