
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

const statusMap: { [key: string]: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
    paid: { text: 'Платен', variant: 'default' },
    pending: { text: 'Чакащ', variant: 'secondary' },
    overdue: { text: 'Просрочен', variant: 'destructive' },
};

const typeMap: { [key: string]: string } = {
    annual: 'Годишен',
    monthly: 'Месечен',
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
        accessorKey: "type",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Тип" />
        ),
        cell: ({ row }) => {
            const type = row.getValue("type") as string;
            return typeMap[type] || type;
        },
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Сума" />
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            const formatted = new Intl.NumberFormat("bg-BG", {
                style: "currency",
                currency: "BGN",
            }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
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
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Статус" />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            const statusInfo = statusMap[status];
            return <Badge variant={statusInfo?.variant || 'outline'}>{statusInfo?.text || status}</Badge>;
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
                        {/* <DropdownMenuItem>Редактирай</DropdownMenuItem> */}
                        <DropdownMenuItem
                            onClick={() => onDelete(subscription.id)}
                            className="text-red-600"
                        >
                            Изтрий
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
