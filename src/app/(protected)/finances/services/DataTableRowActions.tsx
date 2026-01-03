'use client'

import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Service } from './columns' // Assuming Service type is exported from columns

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  service: Service // FIX: Explicitly expect the service object
}

export function DataTableRowActions<TData>({ row, service }: DataTableRowActionsProps<TData>) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Действия</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          {/* FIX: Now service.id is guaranteed to exist */}
          <Link href={`/finances/services/${service.id}/edit`}>Редактирай</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={`/finances/services/${service.id}/history`}>История</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
            <Link href={`/finances/services/${service.id}/print`}>Принтирай</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
