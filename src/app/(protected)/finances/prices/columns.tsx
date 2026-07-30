// src/app/(protected)/finances/prices/columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Edit, History, MoreHorizontal } from "lucide-react";

import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/currency";
import { Price } from "@/types/index";

interface ColumnsProps {
  onEdit: (price: Price) => void;
  onShowHistory: (price: Price) => void;
}

export const columns = ({
  onEdit,
  onShowHistory,
}: ColumnsProps): ColumnDef<Price>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Име на цената" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Стойност" />
    ),
    cell: ({ row }) => formatPrice(row.original.value),
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "success" : "secondary"}>
        {row.original.isActive ? "Активна" : "Неактивна"}
      </Badge>
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Последна промяна" />
    ),
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString("bg-BG"),
  },
  {
    accessorKey: "updatedBy",
    header: "Променено от",
    cell: ({ row }) => row.original.updatedBy.userName,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <span className="sr-only">Отвори меню</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            <Edit className="mr-2 size-4" />
            Редактирай
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onShowHistory(row.original)}>
            <History className="mr-2 size-4" />
            Виж история
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
