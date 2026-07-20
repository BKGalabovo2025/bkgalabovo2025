"use client";

import { useEffect, useState } from "react";
import { getInventoryEvents } from "@/services/inventory-service";
import { InventoryEvent } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";
import { formatDateTimeDisplay } from "@/lib/date-utils";

const InventoryHistory = () => {
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const fetchedEvents = await getInventoryEvents();
        setEvents(fetchedEvents);
      } catch (err) {
        setError("Грешка при зареждане на историята.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const renderEventDetails = (event: InventoryEvent) => {
    switch (event.type) {
      case "restock":
        return (
          <span className="text-green-600">+{event.quantityChange} бр.</span>
        );
      case "price_update":
        return `стара: ${formatPrice(event.oldPrice || 0)} -> нова: ${formatPrice(event.newPrice || 0)}`;
      case "sale": // Assuming you might add sales later
        return <span className="text-red-600">{event.quantityChange} бр.</span>;
      case "correction": // For manual corrections
        return (
          <span
            className={
              event.quantityChange && event.quantityChange > 0
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {event.quantityChange} бр.
          </span>
        );
      default:
        return "--";
    }
  };

  const getEventTypeLabel = (type: InventoryEvent["type"]) => {
    const badgeBase =
      "px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-widest border shadow-none";
    switch (type) {
      case "restock":
        return (
          <Badge
            className={`${badgeBase} border-emerald-100 bg-emerald-50/50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/5`}
          >
            Презареждане
          </Badge>
        );
      case "price_update":
        return (
          <Badge
            className={`${badgeBase} border-amber-100 bg-amber-50/50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/5`}
          >
            Промяна на цена
          </Badge>
        );
      case "sale":
        return (
          <Badge
            className={`${badgeBase} border-rose-100 bg-rose-50/50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/5`}
          >
            Продажба
          </Badge>
        );
      case "correction":
        return (
          <Badge
            className={`${badgeBase} border-zinc-100 bg-zinc-50/50 text-zinc-600 dark:border-zinc-500/20 dark:bg-zinc-500/5`}
          >
            Корекция
          </Badge>
        );
      case "initial":
        return (
          <Badge
            className={`${badgeBase} border-primary/10 bg-primary/5 text-primary`}
          >
            Първоначално
          </Badge>
        );
      default:
        return <Badge className={badgeBase}>{type}</Badge>;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-none dark:border-zinc-900 dark:bg-zinc-950">
      <div className="border-b border-zinc-100 p-6 dark:border-zinc-900">
        <h3 className="text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
          История на движенията
        </h3>
      </div>
      <div className="p-0">
        {loading && (
          <div className="animate-pulse p-8 text-center text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
            Зареждане на историята...
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-[11px] font-medium tracking-widest text-rose-400 uppercase">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="h-10 px-6 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Дата
                    </TableHead>
                    <TableHead className="h-10 px-6 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Артикул
                    </TableHead>
                    <TableHead className="h-10 px-6 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Тип
                    </TableHead>
                    <TableHead className="h-10 px-6 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Клиент (за продажба)
                    </TableHead>
                    <TableHead className="h-10 px-6 text-right text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Промяна
                    </TableHead>
                    <TableHead className="h-10 px-6 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Потребител
                    </TableHead>
                    <TableHead className="h-10 px-6 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Бележка
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow
                      key={event.id}
                      className="border-zinc-50 transition-colors hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
                    >
                      <TableCell className="px-6 py-4 text-[11px] font-medium text-zinc-400">
                        {formatDateTimeDisplay(event.createdAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm font-light text-zinc-900 dark:text-zinc-100">
                        {event.productName}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {getEventTypeLabel(event.type)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                        {event.type === "sale" ? event.clientName || "-" : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-sm font-medium">
                        {renderEventDetails(event)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                        {event.userName}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-light text-zinc-400 italic">
                        {event.notes || "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 p-4 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {event.productName}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {formatDateTimeDisplay(event.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      {getEventTypeLabel(event.type)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                        Промяна
                      </span>
                      <span className="text-sm font-semibold">
                        {renderEventDetails(event)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
                        Потребител
                      </span>
                      <span className="text-xs text-zinc-900 dark:text-zinc-100">
                        {event.userName}
                      </span>
                    </div>
                  </div>
                  {event.type === "sale" && event.clientName && (
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-500">
                      Клиент: {event.clientName}
                    </div>
                  )}
                  {event.notes && (
                    <div className="text-xs text-zinc-400 italic">
                      Забележка: {event.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {!loading && events.length === 0 && (
          <div className="p-12 text-center text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
            Няма записани събития.
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistory;
