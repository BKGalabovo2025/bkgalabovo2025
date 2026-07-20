/* eslint-disable sonarjs/no-nested-conditional */

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumnId: string;
  filterPlaceholder: string;
  isLoading: boolean;
  emptyStateMessage: string;
  getCellValue?: (row: TData, columnId: string) => TValue;
  renderMobileCard?: (row: TData) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumnId,
  filterPlaceholder,
  isLoading,
  emptyStateMessage,
  getCellValue,
  renderMobileCard,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="group relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary" />
          <Input
            id="table-filter"
            name="table-filter"
            placeholder={filterPlaceholder}
            value={
              (table.getColumn(filterColumnId)?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn(filterColumnId)
                ?.setFilterValue(event.target.value)
            }
            className="h-12 rounded-2xl border-zinc-100 bg-zinc-50 pl-11 shadow-sm transition-all focus:bg-white focus:ring-1 focus:ring-zinc-200"
          />
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden",
          renderMobileCard ? "hidden md:block" : "block"
        )}
      >
        <Table>
          <TableHeader className="border-b border-zinc-100 bg-zinc-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-none hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-14 px-6 text-[11px] font-medium tracking-wider text-zinc-500 uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="size-8 animate-spin text-zinc-200" />
                    <p className="text-xs font-medium tracking-widest text-zinc-400 uppercase">
                      Зареждане на данни...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group border-b border-zinc-50 transition-colors last:border-none hover:bg-zinc-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4">
                      {getCellValue
                        ? (getCellValue(
                            row.original,
                            cell.column.id
                          ) as React.ReactNode)
                        : flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50">
                      <Search className="size-5 text-zinc-300" />
                    </div>
                    <p className="text-sm font-medium text-zinc-900">
                      {emptyStateMessage}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Опитайте да потърсите с друго ключово име.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {renderMobileCard && (
        <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="size-8 animate-spin text-zinc-200" />
              <p className="text-xs font-medium tracking-widest text-zinc-400 uppercase">
                Зареждане на данни...
              </p>
            </div>
          ) : table.getRowModel().rows?.length ? (
            table
              .getRowModel()
              .rows.map((row) => (
                <div key={row.id}>{renderMobileCard(row.original)}</div>
              ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <div className="mb-2 flex size-12 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50">
                <Search className="size-5 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-900">
                {emptyStateMessage}
              </p>
              <p className="text-xs text-zinc-400">
                Опитайте да потърсите с друго ключово име.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-zinc-100 px-2 pt-4">
        <div className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
          Страница {table.getState().pagination.pageIndex + 1} от{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="size-10 rounded-xl border-zinc-100 p-0 text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="size-10 rounded-xl border-zinc-100 p-0 text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
