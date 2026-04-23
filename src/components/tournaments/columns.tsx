'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Tournament } from '@/types/tournament.types';
import { format } from 'date-fns';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Tournament>[] = [
  {
    accessorKey: 'name',
    header: 'Име на турнира',
  },
  {
    accessorKey: 'startDate',
    header: 'Начална дата',
    cell: ({ row }) => format(row.original.startDate, 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'endDate',
    header: 'Крайна дата',
    cell: ({ row }) => format(row.original.endDate, 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'status',
    header: 'Статус',
  },
  {
    accessorKey: 'ageGroups',
    header: 'Възрастови групи',
    cell: ({ row }) => row.original.ageGroups.join(', '),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
