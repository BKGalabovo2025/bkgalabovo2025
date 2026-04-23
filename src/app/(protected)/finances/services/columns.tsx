"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableRowActions } from "./DataTableRowActions";
import { Service } from "./service.types";

export const columns: ColumnDef<Service>[] = [
  {
    accessorFn: (row) => row.name,
    id: "name",
    header: "Име",
  },
  {
    accessorFn: (row) => row.price,
  id: "price",
  header: () => <div className="text-right">Цена</div>,
  cell: ({ row }) => {
    const price = parseFloat(row.getValue("price"));
    const formatted = new Intl.NumberFormat("bg-BG", {
      style: "currency",
      currency: "BGN",
    }).format(price);

    return <div className="text-right font-medium">{formatted}</div>;
  },
},
  {
    accessorFn: (row) => row.type,
    id: "type",
    header: "Тип",
  },
  {
    accessorFn: (row) => row.billingPeriod,
    id: "billingPeriod",
    header: "Платежен период",
    meta: {
      hideIfNoData: true,
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const service = row.original;
      return <DataTableRowActions service={service} />;
    },
  },
];
