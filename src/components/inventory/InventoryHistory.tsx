"use client";

import { useEffect, useState } from "react";
import { getInventoryEvents } from "@/services/inventory-service";
import { InventoryEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            className={`${badgeBase} bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20`}
          >
            Презареждане
          </Badge>
        );
      case "price_update":
        return (
          <Badge
            className={`${badgeBase} bg-amber-50/50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/20`}
          >
            Промяна на цена
          </Badge>
        );
      case "sale":
        return (
          <Badge
            className={`${badgeBase} bg-rose-50/50 text-rose-600 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/20`}
          >
            Продажба
          </Badge>
        );
      case "correction":
        return (
          <Badge
            className={`${badgeBase} bg-zinc-50/50 text-zinc-600 border-zinc-100 dark:bg-zinc-500/5 dark:border-zinc-500/20`}
          >
            Корекция
          </Badge>
        );
      case "initial":
        return (
          <Badge
            className={`${badgeBase} bg-primary/5 text-primary border-primary/10`}
          >
            Първоначално
          </Badge>
        );
      default:
        return <Badge className={badgeBase}>{type}</Badge>;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-none overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
          История на движенията
        </h3>
      </div>
      <div className="p-0">
        {loading && (
          <div className="p-8 text-center text-[11px] uppercase tracking-widest text-zinc-400 font-medium animate-pulse">
            Зареждане на историята...
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-[11px] uppercase tracking-widest text-rose-400 font-medium">
            {error}
          </div>
        )}
        {!loading && !error && (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Дата
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Артикул
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Тип
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6 text-right">
                  Промяна
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Потребител
                </TableHead>
                <TableHead className="h-10 text-[10px] font-medium uppercase tracking-widest text-zinc-400 px-6">
                  Бележка
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
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
                  <TableCell className="px-6 py-4 text-right font-medium text-sm">
                    {renderEventDetails(event)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                    {event.userName}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs text-zinc-400 italic font-light">
                    {event.notes || "--"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && events.length === 0 && (
          <div className="p-12 text-center text-[11px] uppercase tracking-widest text-zinc-400 font-medium">
            Няма записани събития.
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistory;
