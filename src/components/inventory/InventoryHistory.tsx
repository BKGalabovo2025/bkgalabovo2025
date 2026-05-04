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
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/currency";

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
          <span className="text-emerald-600 dark:text-emerald-400 font-black">+{event.quantityChange} бр.</span>
        );
      case "price_update":
        return (
          <span className="text-zinc-500 font-medium">
            {formatPrice(event.oldPrice || 0)} → <span className="text-zinc-900 dark:text-white font-black">{formatPrice(event.newPrice || 0)}</span>
          </span>
        );
      case "sale":
        return <span className="text-red-600 dark:text-red-400 font-black">{event.quantityChange} бр.</span>;
      case "correction":
        return (
          <span
            className={cn(
              "font-black",
              event.quantityChange && event.quantityChange > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {event.quantityChange} бр.
          </span>
        );
      default:
        return "--";
    }
  };

  const getEventTypeLabel = (type: InventoryEvent["type"]) => {
    switch (type) {
      case "restock":
        return <Badge className="rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest">Презареждане</Badge>;
      case "price_update":
        return <Badge className="rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-black text-[10px] uppercase tracking-widest">Промяна цена</Badge>;
      case "sale":
        return <Badge className="rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-black text-[10px] uppercase tracking-widest">Продажба</Badge>;
      case "correction":
        return <Badge className="rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-none font-black text-[10px] uppercase tracking-widest">Корекция</Badge>;
      case "initial":
        return <Badge className="rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-none font-black text-[10px] uppercase tracking-widest">Първоначално</Badge>;
      default:
        return <Badge className="rounded-lg bg-zinc-100 text-zinc-500 border-none font-black text-[10px] uppercase tracking-widest">{type}</Badge>;
    }
  };

  return (
    <div className="bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden">
      <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
        <h3 className="text-xl font-black font-heading text-zinc-900 dark:text-white">История на движенията</h3>
        <p className="text-zinc-500 text-sm font-medium mt-1">Пълен одит на промените в инвентара.</p>
      </div>
      
      {loading ? (
        <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-zinc-300 mx-auto" /></div>
      ) : error ? (
        <div className="p-20 text-center text-red-500 font-bold">{error}</div>
      ) : events.length === 0 ? (
        <div className="p-20 text-center text-zinc-400 font-medium">Няма записани събития.</div>
      ) : (
        <Table>
          <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/80">
            <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
              <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest pl-8 py-4">Дата</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-4">Артикул</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-4">Тип</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-4">Промяна</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-4">Потребител</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest py-4 pr-8">Бележка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <TableCell className="pl-8 py-4 text-zinc-500 text-xs font-bold uppercase tracking-tighter">
                  {new Date(event.createdAt).toLocaleString("bg-BG")}
                </TableCell>
                <TableCell className="py-4 font-black font-heading text-zinc-900 dark:text-white">{event.productName}</TableCell>
                <TableCell className="py-4">{getEventTypeLabel(event.type)}</TableCell>
                <TableCell className="py-4">{renderEventDetails(event)}</TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black">{event.userName?.charAt(0)}</div>
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      {(event.userName?.trim().toLowerCase() === "admin") ? "Админ" : (event.userName?.trim().toLowerCase() === "system" ? "Система" : event.userName)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 pr-8 text-sm text-zinc-500 italic max-w-xs truncate">{event.notes || "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default InventoryHistory;
