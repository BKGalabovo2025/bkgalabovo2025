'use client'

import { ColumnDef } from '@tanstack/react-table'
import { formatPrice } from '@/lib/currency'
import { DataTableRowActions } from './DataTableRowActions'
import { Service } from './service.types'

export const columns: ColumnDef<Service, any>[] = [
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
      const priceInCents = row.original.price; // Price from DB is in the smallest unit (cents)
      // FIX: The formatPrice function handles the division, so we pass the value in cents directly.
      return <div>{formatPrice(priceInCents)}</div>
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
    accessorFn: () => undefined, 
    cell: ({ row }) => {
      const service = row.original
      return <DataTableRowActions row={row} service={service} />
    },
  },
]
