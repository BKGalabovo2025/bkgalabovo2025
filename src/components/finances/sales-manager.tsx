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
import { Button } from "@/components/ui/button";
import { 
  History, 
  Pencil, 
  Trash2, 
  Calendar,
  User,
  CreditCard,
  FileText,
  Printer,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Sale, Member } from "@/types";
import { getSales, updateSale, deleteSale } from "@/services/sales-service";
import { getAllMembers } from "@/services/member-service";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const SalesManager = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [members, setMembers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    saleDate: "",
    totalAmount: 0,
    isPaid: true
  });

  const [dateFilter, setDateFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, mData] = await Promise.all([getSales(500), getAllMembers()]);
      
      const filteredSales = sData.filter(sale => {
        const d = new Date(sale.saleDate);
        return (d.getMonth() + 1 === dateFilter.month) && (d.getFullYear() === dateFilter.year);
      });

      setSales(filteredSales);
      
      const memberMap: Record<string, string> = {};
      mData.forEach((m: Member) => {
        memberMap[m.id] = `${m.firstName} ${m.lastName}`;
      });
      setMembers(memberMap);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast.error("Грешка при зареждане на транзакциите");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const exportToCSV = () => {
    if (sales.length === 0) {
      toast.error("Няма данни за експортиране");
      return;
    }

    const headers = ["ID", "Дата", "Член", "Артикули", "Сума (EUR)", "Статус"];
    const csvData = sales.map(sale => {
      const itemsString = sale.items.map(i => `${i.quantity}x ${i.name}`).join("; ");
      return [
        sale.id,
        new Date(sale.saleDate).toLocaleDateString("bg-BG"),
        members[sale.memberId] || "Неизвестен",
        itemsString,
        sale.totalAmount.toFixed(2),
        sale.isPaid ? "Платено" : "Отложено"
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${dateFilter.month}_${dateFilter.year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Отчетът е изтеглен");
  };

  const handleOpenEditDialog = (sale: Sale) => {
    setEditingSale(sale);
    setEditFormData({
      saleDate: sale.saleDate.split("T")[0],
      totalAmount: sale.totalAmount,
      isPaid: sale.isPaid
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSale = async () => {
    if (!editingSale) return;
    try {
      await updateSale(editingSale.id, {
        saleDate: new Date(editFormData.saleDate).toISOString(),
        totalAmount: editFormData.totalAmount,
        isPaid: editFormData.isPaid,
        status: editFormData.isPaid ? "completed" : "pending"
      });
      toast.success("Транзакцията е обновена");
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Грешка при обновяване");
    }
  };

  const handleQuickPay = async (sale: Sale) => {
    try {
      await updateSale(sale.id, {
        isPaid: true,
        status: "completed"
      });
      toast.success("Транзакцията е отбелязана като платена");
      fetchData();
    } catch (error) {
      toast.error("Грешка при обновяване");
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете тази транзакция?")) return;
    try {
      await deleteSale(id);
      toast.success("Транзакцията е изтрита");
      fetchData();
    } catch (error) {
      toast.error("Грешка при изтриване");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black font-heading text-zinc-900 dark:text-white tracking-tight">
            История на <span className="text-blue-600">Транзакциите</span>
          </h2>
          <p className="text-zinc-500 font-medium text-lg mt-1">Преглед и корекция на всички плащания в системата</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-zinc-100/80 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50">
            <Select 
              value={dateFilter.month.toString()} 
              onValueChange={(v) => setDateFilter({...dateFilter, month: parseInt(v)})}
            >
              <SelectTrigger className="w-[140px] h-11 rounded-xl border-none bg-transparent hover:bg-white dark:hover:bg-zinc-700 shadow-none font-bold">
                <SelectValue placeholder="Месец" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-lg py-3 font-medium">
                    {new Date(0, i).toLocaleString('bg-BG', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={dateFilter.year.toString()} 
              onValueChange={(v) => setDateFilter({...dateFilter, year: parseInt(v)})}
            >
              <SelectTrigger className="w-[100px] h-11 rounded-xl border-none bg-transparent hover:bg-white dark:hover:bg-zinc-700 shadow-none font-bold">
                <SelectValue placeholder="Година" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()} className="rounded-lg py-3 font-medium">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={exportToCSV}
            className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest gap-2 px-8 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="h-4 w-4" />
            Експорт (CSV)
          </Button>
        </div>
      </div>

      <div className="group relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2.5rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-none">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/80 dark:bg-zinc-800/50">
                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8 pl-10">Дата</TableHead>
                  <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8">Член</TableHead>
                  <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8">Артикули / Услуги</TableHead>
                  <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8">Статус & Сума</TableHead>
                  <TableHead className="font-black text-zinc-400 uppercase tracking-[0.2em] text-[10px] py-8 pr-10 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64">
                      <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-black text-xs uppercase tracking-widest text-zinc-400">Зареждане на транзакции...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64">
                      <div className="flex flex-col items-center justify-center gap-3 py-12">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center">
                          <History className="h-8 w-8 text-zinc-300" />
                        </div>
                        <p className="font-bold text-zinc-400">Няма намерени транзакции за този период</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id} className="border-zinc-100 dark:border-zinc-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group/row">
                      <TableCell className="py-7 pl-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover/row:bg-blue-600 group-hover/row:text-white transition-colors">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="font-bold text-zinc-900 dark:text-white text-base">
                            {new Date(sale.saleDate).toLocaleDateString("bg-BG")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-7">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-[10px]">
                            {sale.memberId === "GUEST_EXTERNAL" ? "G" : (members[sale.memberId] || "U").charAt(0)}
                          </div>
                          <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                            {sale.memberId === "GUEST_EXTERNAL" ? "Външен Клиент" : (members[sale.memberId] || "Зареждане...")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-7">
                        <div className="flex flex-wrap gap-2">
                          {sale.items.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold px-3 py-1 rounded-lg">
                              <span className="text-blue-600 mr-1.5">{item.quantity}x</span> {item.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-7">
                        <div className="flex flex-col gap-1.5">
                          <div className="font-black text-xl text-zinc-900 dark:text-white tracking-tight">
                            {formatPrice(sale.totalAmount)}
                          </div>
                          <div>
                            <Badge className={sale.isPaid 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50 dark:border-emerald-500/20 text-[10px] uppercase font-black px-3" 
                              : "bg-orange-500/10 text-orange-600 border-orange-200/50 dark:border-orange-500/20 text-[10px] uppercase font-black px-3"
                            }>
                              {sale.isPaid ? "Платено" : "Отложено"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-7 pr-10 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          {!sale.isPaid && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleQuickPay(sale)} 
                              className="h-11 w-11 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 shadow-sm"
                              title="Маркирай като платено"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </Button>
                          )}
                          <Link href={`/sales/${sale.id}/receipt`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 shadow-sm" title="Печат на документ">
                              <Printer className="h-5 w-5" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(sale)} className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 shadow-sm" title="Редактирай">
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)} className="h-11 w-11 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 shadow-sm" title="Изтрий">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 rounded-[2.5rem] border-none bg-white dark:bg-zinc-950 shadow-3xl overflow-hidden">
          <DialogHeader className="p-8 sm:p-10 pb-6 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
              <History className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black font-heading text-zinc-900 dark:text-white tracking-tight">Редактирай <span className="text-blue-600">Транзакция</span></DialogTitle>
            <p className="text-zinc-500 font-medium mt-2">Корекция на детайлите по плащането</p>
          </DialogHeader>
          
          <div className="p-8 sm:p-10 space-y-8">
            <div className="grid gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Дата на плащане</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <Input 
                    type="date" 
                    value={editFormData.saleDate} 
                    onChange={(e) => setEditFormData({...editFormData, saleDate: e.target.value})} 
                    className="h-16 rounded-[1.25rem] pl-14 font-bold border-zinc-200 dark:border-zinc-800 focus:ring-blue-500 focus:border-blue-500 bg-zinc-50/50 dark:bg-zinc-900/50 text-lg"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Обща сума (EUR)</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <Input 
                    type="number" 
                    value={editFormData.totalAmount} 
                    onChange={(e) => setEditFormData({...editFormData, totalAmount: parseFloat(e.target.value)})} 
                    className="h-16 rounded-[1.25rem] pl-14 font-black text-2xl border-zinc-200 dark:border-zinc-800 focus:ring-blue-500 focus:border-blue-500 bg-zinc-50/50 dark:bg-zinc-900/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 group hover:border-blue-200 dark:hover:border-blue-900/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${editFormData.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-500'}`}>
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <Label htmlFor="isPaid" className="font-black text-sm cursor-pointer block">Статус на плащане</Label>
                    <p className="text-xs text-zinc-500 font-medium">Маркирайте ако сумата е получена</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  id="isPaid"
                  checked={editFormData.isPaid} 
                  onChange={(e) => setEditFormData({...editFormData, isPaid: e.target.checked})}
                  className="h-6 w-6 rounded-lg border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 sm:p-10 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="h-14 flex-1 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800"
            >
              Отказ
            </Button>
            <Button 
              onClick={handleUpdateSale}
              className="h-14 flex-1 rounded-2xl bg-zinc-900 dark:bg-white dark:text-zinc-900 font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Запази Промените
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
