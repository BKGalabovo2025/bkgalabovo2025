'use client'

import { ColumnDef } from '@tanstack/react-table'
import { formatPriceWithConversion } from '@/lib/currency' 
import { DataTableRowActions } from './DataTableRowActions'

export interface Service {
  id: string;
  name: string;
  price: number; // in smallest unit (e.g., cents)
  currency: 'EUR' | 'BGN';
  type: string;
  billingPeriod?: string;
}

export const columns: ColumnDef<Service>[] = [
  {
    accessorFn: row => row.name,
    id: 'name',
    header: 'Име',
  },
  {
    accessorFn: row => row.price,
    id: 'price',
    header: 'Цена',
    cell: ({ row }) => {
      const priceInSmallestUnit = row.original.price;
      const currency = row.original.currency;
      return <div>{formatPriceWithConversion(priceInSmallestUnit, currency)}</div>
    },
  },
  {
    accessorFn: row => row.type,
    id: 'type',
    header: 'Тип',
  },
  {
    accessorFn: row => row.billingPeriod,
    id: 'billingPeriod',
    header: 'Платежен период',
    meta: {
        hideIfNoData: true, 
    }
  },
  {
    id: 'actions',
    // Add a dummy accessorFn to satisfy TypeScript's strict checks in the DataTable component.
    // The actual rendering is handled by the `cell` property.
    accessorFn: () => undefined, 
    cell: ({ row }) => {
      const service = row.original
      return <DataTableRowActions row={row} service={service} />
    },
  },
]
