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
      return <PlusCircle className="h-4 w-4 text-emerald-500" />;
    case "update":
      return <Edit2 className="h-4 w-4 text-amber-500" />;
    case "delete":
      return <Trash2 className="h-4 w-4 text-rose-500" />;
    case "sale":
      return <ShoppingCart className="h-4 w-4 text-blue-500" />;
    default:
      return <History className="h-4 w-4 text-zinc-500" />;
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
      <div className="p-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-500" />
            История на промените
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-light">{description}</p>
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
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
      <div className="flex-1 overflow-auto custom-scrollbar hidden md:block">
        {filteredEvents.length > 0 ? (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-0 backdrop-blur-sm">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Дата
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  Тип
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                  {showExtendedColumns ? "Услуга" : "Промяна / Детайл"}
                </TableHead>
                {showExtendedColumns && (
                  <>
                    <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                      Клиент (за продажба)
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5">
                      Промяна на цена
                    </TableHead>
                  </>
                )}
                <TableHead className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold py-5 text-right">
                  Потребител
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className="border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
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
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
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
                          <span className="text-zinc-400 text-sm">-</span>
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
                            <span className="text-emerald-500 font-medium">
                              {formatPrice(event.newPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-sm">-</span>
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
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <History
              className="h-12 w-12 text-zinc-200 dark:text-zinc-800 mb-4"
              strokeWidth={1}
            />
            <p className="text-zinc-500 text-sm font-light">
              Няма намерени движения.
            </p>
          </div>
        )}
      </div>

      {/* Mobile list */}
      <div className="flex-1 overflow-auto custom-scrollbar md:hidden divide-y divide-zinc-50 dark:divide-zinc-900">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 flex flex-col gap-3 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                    {getEventIcon(event.type)}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {getEventLabel(event.type)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
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
              <div className="text-sm text-zinc-900 dark:text-zinc-100 mt-1 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                {event.serviceName}
              </div>
              {showExtendedColumns && event.type === "sale" && event.clientName && (
                <div className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">
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
                    <span className="text-emerald-500 font-medium">
                      {formatPrice(event.newPrice)}
                    </span>
                  </div>
                )}
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <History
              className="h-10 w-10 text-zinc-200 dark:text-zinc-800 mb-4"
              strokeWidth={1}
            />
            <p className="text-zinc-500 text-sm font-light">
              Няма намерени движения.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
