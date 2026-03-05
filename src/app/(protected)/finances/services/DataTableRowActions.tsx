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
import { Service } from './service.types' // FIX: Corrected the import path

interface DataTableRowActionsProps<TData> {
  service: Service
}

export function DataTableRowActions<TData>({ service }: DataTableRowActionsProps<TData>) {

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
