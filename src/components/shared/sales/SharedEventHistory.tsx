"use client";

import { useState } from "react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/currency";
import { History, PlusCircle, Edit2, Trash2, ShoppingCart } from "lucide-react";

export interface ServiceHistoryEvent {
  id: string;
  createdAt: string | Date;
  serviceName: string;
  type: string;
  userName: string;
  oldPrice?: number;
  newPrice?: number;
  clientName?: string;
}

export interface SharedEventHistoryProps {
  events: ServiceHistoryEvent[];
  isLoading: boolean;
  description: string;
  /** Show the extra "Клиент" and "Промяна на цена" columns (e.g. GeneralServices) */
  showExtendedColumns?: boolean;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case "create":
      return <PlusCircle className="size-4 text-emerald-500" />;
    case "update":
      return <Edit2 className="size-4 text-amber-500" />;
    case "delete":
      return <Trash2 className="size-4 text-rose-500" />;
    case "sale":
      return <ShoppingCart className="size-4 text-blue-500" />;
    default:
      return <History className="size-4 text-zinc-500" />;
  }
};

const getEventLabel = (type: string) => {
  switch (type) {
    case "create":
      return "Създаване";
    case "update":
      return "Редакция";
    case "delete":
      return "Изтриване";
    case "sale":
      return "Продажба";
    default:
      return "Неизвестно";
  }
};

export function SharedEventHistory({
  events,
  isLoading,
  description,
  showExtendedColumns = false,
}: SharedEventHistoryProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredEvents = events.filter((event) => {
    return filterType === "all" || event.type === filterType;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-zinc-100 p-6 md:flex-row md:items-center md:p-8 dark:border-zinc-900">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-light text-zinc-900 dark:text-zinc-50">
            <History className="size-5 text-emerald-500" />
            История на промените
          </h2>
          <p className="mt-1 text-xs font-light text-zinc-500">{description}</p>
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-45 rounded-xl border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <SelectValue placeholder="Всички движения" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Всички движения</SelectItem>
            <SelectItem value="create">Създадени</SelectItem>
            <SelectItem value="update">Редактирани</SelectItem>
            <SelectItem value="delete">Изтрити</SelectItem>
            <SelectItem value="sale">Продажби</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <div className="custom-scrollbar hidden flex-1 overflow-auto md:block">
        {filteredEvents.length > 0 ? (
          <Table>
            <TableHeader className="sticky top-0 bg-zinc-50/50 backdrop-blur-sm dark:bg-zinc-900/50">
              <TableRow className="border-b border-zinc-100 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Дата
                </TableHead>
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Тип
                </TableHead>
                <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  {showExtendedColumns ? "Услуга" : "Промяна / Детайл"}
                </TableHead>
                {showExtendedColumns && (
                  <>
                    <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                      Клиент (за продажба)
                    </TableHead>
                    <TableHead className="py-5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                      Промяна на цена
                    </TableHead>
                  </>
                )}
                <TableHead className="py-5 text-right text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  Потребител
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className="border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {format(new Date(event.createdAt), "dd MMM yyyy", {
                          locale: bg,
                        })}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {format(new Date(event.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
                        {getEventIcon(event.type)}
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {getEventLabel(event.type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {event.serviceName}
                    </span>
                  </TableCell>
                  {showExtendedColumns && (
                    <>
                      <TableCell className="py-4">
                        {event.type === "sale" ? (
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                            {event.clientName || "-"}
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {event.type === "update" &&
                        event.oldPrice !== undefined &&
                        event.newPrice !== undefined &&
                        event.oldPrice !== event.newPrice ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-400 line-through">
                              {formatPrice(event.oldPrice)}
                            </span>
                            <span className="font-medium text-emerald-500">
                              {formatPrice(event.newPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">-</span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="py-4 text-right">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {event.userName}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <History
              className="mb-4 size-12 text-zinc-200 dark:text-zinc-800"
              strokeWidth={1}
            />
            <p className="text-sm font-light text-zinc-500">
              Няма намерени движения.
            </p>
          </div>
        )}
      </div>

      {/* Mobile list */}
      <div className="custom-scrollbar flex-1 divide-y divide-zinc-50 overflow-auto md:hidden dark:divide-zinc-900">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 p-4 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
                    {getEventIcon(event.type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {getEventLabel(event.type)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {format(new Date(event.createdAt), "dd MMM yyyy, HH:mm", {
                        locale: bg,
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {event.userName}
                  </span>
                </div>
              </div>
              <div className="mt-1 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100">
                {event.serviceName}
              </div>
              {showExtendedColumns && event.type === "sale" && event.clientName && (
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                  Клиент: {event.clientName}
                </div>
              )}
              {showExtendedColumns &&
                event.type === "update" &&
                event.oldPrice !== undefined &&
                event.newPrice !== undefined &&
                event.oldPrice !== event.newPrice && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400 line-through">
                      {formatPrice(event.oldPrice)}
                    </span>
                    <span className="font-medium text-emerald-500">
                      {formatPrice(event.newPrice)}
                    </span>
                  </div>
                )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <History
              className="mb-4 size-10 text-zinc-200 dark:text-zinc-800"
              strokeWidth={1}
            />
            <p className="text-sm font-light text-zinc-500">
              Няма намерени движения.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
