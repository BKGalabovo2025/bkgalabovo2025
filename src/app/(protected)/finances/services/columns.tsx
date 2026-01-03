'use client'

import { ColumnDef } from '@tanstack/react-table'
// Import the new, correct function
import { formatPriceWithConversion } from '@/lib/currency' 
import { DataTableRowActions } from './DataTableRowActions'

export interface Service {
  id: string;
  name: string;
  price: number; // This is in the smallest unit (e.g., cents)
  currency: 'EUR' | 'BGN'; // The currency of the price
  type: string;
  billingPeriod?: string;
}

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: 'name',
    header: 'Име',
  },
  {
    accessorKey: 'price',
    header: 'Цена',
    cell: ({ row }) => {
      const priceInCents = parseFloat(row.getValue('price'))
      const currency = row.original.currency

      // Use the new function to correctly format the price from cents
      return <div>{formatPriceWithConversion(priceInCents, currency)}</div>
    },
  },
  {
    accessorKey: 'type',
    header: 'Тип',
  },
  {
    accessorKey: 'billingPeriod',
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
