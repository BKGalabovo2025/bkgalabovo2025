"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Download, 
  Trash2, 
  Phone, 
  Mail, 
  CreditCard,
  History,
  Calendar,
  Clock,
  ExternalLink
} from "lucide-react";
import { Reservation } from "@/types/reservation";
import { getReservationHistory, deleteReservation } from "@/lib/reservations";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ReservationHistory = () => {
  const [history, setHistory] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getReservationHistory(200); // Get last 200
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Грешка при зареждане на историята");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteReservation(id);
      setHistory(history.filter(res => res.id !== id));
      toast.success("Резервацията е изтрита успешно");
    } catch (error) {
      toast.error("Грешка при изтриване");
    }
  };

  const filteredHistory = history.filter(res => 
    res.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.clientPhone.includes(searchTerm) ||
    res.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Reservation["status"]) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 rounded-lg px-3 py-1">Платено</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 rounded-lg px-3 py-1">Отказ</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 rounded-lg px-3 py-1">Очаква плащане</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Клиент", "Телефон", "Имейл", "Корт", "Начало", "Край", "Сума", "Статус"];
    const rows = filteredHistory.map(res => [
      res.id,
      res.clientName,
      res.clientPhone,
      res.clientEmail,
      res.courtId,
      format(res.startTime.toDate(), "yyyy-MM-dd HH:mm"),
      format(res.endTime.toDate(), "yyyy-MM-dd HH:mm"),
      res.totalPrice,
      res.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservations_history_${format(new Date(), "yyyy_MM_dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Търсене по име, телефон или имейл..." 
            className="pl-11 h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 dark:bg-zinc-800/50 dark:border-zinc-800 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <Button 
            variant="outline" 
            onClick={fetchHistory}
            className="h-12 px-6 rounded-2xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 font-bold text-xs gap-2"
          >
            <History className="h-4 w-4 text-blue-600" />
            Опресни
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="h-12 px-6 rounded-2xl border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 font-bold text-xs gap-2"
          >
            <Download className="h-4 w-4 text-blue-600" />
            Експорт (CSV)
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Клиент</TableHead>
                <TableHead className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Корт</TableHead>
                <TableHead className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Време</TableHead>
                <TableHead className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Сума</TableHead>
                <TableHead className="py-6 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Статус</TableHead>
                <TableHead className="py-6 px-8 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-zinc-50 dark:border-zinc-800">
                    <TableCell colSpan={6} className="py-12 px-8">
                      <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                        <Search className="h-8 w-8 text-zinc-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-900 dark:text-zinc-100 font-bold">Няма намерени резервации</p>
                        <p className="text-zinc-500 text-sm">Пробвайте с друг критерий за търсене.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((res) => (
                  <TableRow key={res.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 border-zinc-50 dark:border-zinc-800 transition-colors">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-black text-xs">
                          {res.clientName.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">{res.clientName}</p>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {res.clientPhone}</span>
                            {res.clientEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {res.clientEmail}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-white text-[10px] font-black">
                          {res.courtId}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Корт</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          {format(res.startTime.toDate(), "dd MMM yyyy", { locale: bg })}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 font-medium text-[10px] uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          {format(res.startTime.toDate(), "HH:mm")} - {format(res.endTime.toDate(), "HH:mm")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-zinc-300" />
                        <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{res.totalPrice}</span>
                        <span className="text-[10px] font-bold text-zinc-400">EUR</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      {getStatusBadge(res.status)}
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                              Изтриване на резервация?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium pt-2">
                              Това действие не може да бъде отменено. Резервацията ще бъде окончателно премахната от системата.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="pt-6 gap-3">
                            <AlertDialogCancel className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 font-black uppercase text-xs tracking-widest h-12 px-8 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                              Отказ
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(res.id)}
                              className="rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest h-12 px-8 shadow-lg shadow-red-600/20 transition-all border-none"
                            >
                              Изтрий
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
