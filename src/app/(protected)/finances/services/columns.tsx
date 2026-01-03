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
      // The price is now correctly in the smallest unit
      const priceInSmallestUnit = row.original.price;
      const currency = row.original.currency;

      // Format the price directly
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
    cell: ({ row }) => {
      const service = row.original
      return <DataTableRowActions row={row} service={service} />
    },
  },
]
