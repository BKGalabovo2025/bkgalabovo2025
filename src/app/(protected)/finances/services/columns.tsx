"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatPrice } from "@/lib/currency";
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
    header: "Цена",
    cell: ({ row }) => {
      const price = row.original.price; // Price from DB is a whole number (e.g., 20 for 20 EUR)
      // The formatPrice function now expects a whole number and formats it correctly.
      return <div>{formatPrice(price)}</div>;
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
