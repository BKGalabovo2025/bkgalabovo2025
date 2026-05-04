"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteSale, getSaleById, updateSale } from "@/services/sales-service";
import { getMemberById } from "@/services/member-service";
import { Sale, Member } from "@/types";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  User,
  ShoppingCart,
  Trash2,
  CheckCheck,
  FilePenLine,
  Receipt,
  Calendar,
  Tag,
  CreditCard,
  ExternalLink,
} from "lucide-react";

const SaleDetailsPage = () => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  useEffect(() => {
    if (saleId) {
      const fetchSaleData = async () => {
        try {
          setLoading(true);
          const saleData = await getSaleById(saleId);
          setSale(saleData);
          if (saleData?.memberId) {
            const memberData = await getMemberById(saleData.memberId);
            setMember(memberData);
          } else {
            setMember(null);
          }
        } catch (error) {
          console.error("Error loading sale data:", error);
          toast.error("Грешка", {
            description: "Неуспешно зареждане на данните за продажбата.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchSaleData();
    }
  }, [saleId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSale(saleId);
      toast.success("Успех!", {
        description: "Продажбата беше изтрита успешно.",
      });
      router.push("/sales");
    } catch (error) {
      const err = error as Error;
      console.error("Error deleting sale:", err);
      toast.error("Грешка", {
        description:
          err.message || "Възникна грешка при изтриването на продажбата.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsUpdatingStatus(true);
    try {
      await updateSale(saleId, { status: "completed", isPaid: true });
      setSale((prevSale) =>
        prevSale ? { ...prevSale, status: "completed", isPaid: true } : null
      );
      toast.success("Успех!", {
        description: "Плащането беше регистрирано успешно.",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при актуализирането на статуса.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500 mb-4" />
        <p className="text-xl font-medium text-zinc-500 animate-pulse">Зареждане на детайли...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 rounded-full bg-zinc-100 mb-4 text-zinc-400">
          <ShoppingCart className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold">Продажбата не е намерена</h2>
        <Button onClick={() => router.push("/sales")} className="mt-4" variant="outline">
          Към всички продажби
        </Button>
      </div>
    );
  }

  const isPaid = sale.isPaid;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50 -m-4 sm:-m-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-700">
      {/* Header Banner Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 p-8 sm:p-12 mb-8 shadow-2xl shadow-blue-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => router.push("/sales")} 
              className="text-white/80 hover:text-white hover:bg-white/10 mb-6 -ml-4 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Назад към продажбите
            </Button>
            
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
                Продажба <span className="opacity-60 font-medium">#</span>{sale.id.substring(0, 8).toUpperCase()}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-white/70 mt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{new Date(sale.saleDate).toLocaleDateString("bg-BG", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="font-medium">{sale.items.length} {sale.items.length === 1 ? 'артикул' : 'артикула'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <Badge className={cn(
                  "border-none px-3 py-0.5 font-bold uppercase text-[10px] tracking-widest",
                  isPaid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                )}>
                  {isPaid ? "Платено" : "Очаква плащане"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => router.push(`/sales/${saleId}/receipt`)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-2xl px-6 py-6 h-auto font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <Receipt className="mr-2 h-5 w-5" /> Разписка
            </Button>
            <Button
              onClick={() => router.push(`/sales/${saleId}/edit`)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-2xl px-6 py-6 h-auto font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <FilePenLine className="mr-2 h-5 w-5" /> Редактирай
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-100 border-red-500/30 backdrop-blur-md rounded-2xl px-6 py-6 h-auto font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="mr-2 h-5 w-5" /> Изтрий
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 p-8">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black font-heading">
                    Сигурни ли сте?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-lg">
                    Това действие не може да бъде отменено. Продажбата ще
                    бъде изтрита за постоянно и наличностите ще бъдат възстановени.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8">
                  <AlertDialogCancel className="rounded-xl px-6">Отказ</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Потвърди изтриването
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-[2.5rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black font-heading flex items-center gap-3">
                  <span className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </span>
                  Артикули
                </h3>
                <Badge variant="outline" className="rounded-full px-4 py-1 text-zinc-500 font-bold border-zinc-200 dark:border-zinc-800">
                  {sale.items.length} общо
                </Badge>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500">Артикул</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 text-center">Количество</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 text-right">Ед. цена</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 text-right">Общо</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {sale.items.map((item, index) => (
                      <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-6 font-bold text-zinc-900 dark:text-zinc-100">{item.name}</td>
                        <td className="px-6 py-6 text-center">
                          <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-zinc-600 dark:text-zinc-400">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-6 text-right font-medium text-zinc-500">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-6 py-6 text-right font-black text-lg text-zinc-900 dark:text-zinc-100">
                          {formatPrice(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-10 flex flex-col items-end gap-2">
                <div className="flex items-center gap-8 w-full sm:w-auto px-6">
                  <span className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Обща сума</span>
                  <span className="text-4xl font-black text-gradient">
                    {formatPrice(sale.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Client Card */}
          <div className="glass rounded-[2.5rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden shadow-xl">
            <div className="p-8">
              <h3 className="text-xl font-black font-heading mb-6 flex items-center gap-3">
                <span className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
                  <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </span>
                Клиент
              </h3>

              {sale.memberId && member ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <Avatar className="h-16 w-16 border-2 border-white dark:border-zinc-800 shadow-md">
                      <AvatarImage
                        src={member.avatarUrl ?? undefined}
                        alt={`${member.firstName} ${member.lastName}`}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xl">
                        {member.firstName[0]}{member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <p className="font-black text-lg text-zinc-900 dark:text-zinc-100 truncate">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-zinc-500 truncate flex items-center gap-1">
                        {member.email ?? "Няма имейл"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-6 font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm transition-all"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    Виж пълен профил <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                  <p className="font-bold text-zinc-400 italic">Продажба на място</p>
                  <p className="text-xs text-zinc-400 mt-1">Клиентът не е регистриран член</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status Card */}
          <div className={cn(
            "rounded-[2.5rem] border overflow-hidden shadow-xl transition-all duration-500",
            isPaid 
              ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20 shadow-emerald-500/5" 
              : "bg-amber-50/50 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20 shadow-amber-500/5"
          )}>
            <div className="p-8">
              <h3 className="text-xl font-black font-heading mb-6 flex items-center gap-3">
                <span className={cn(
                  "p-2 rounded-xl",
                  isPaid ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-amber-100 dark:bg-amber-500/20"
                )}>
                  <CheckCheck className={cn(
                    "h-5 w-5",
                    isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  )} />
                </span>
                Статус
              </h3>

              <div className="space-y-6">
                <div className="text-center py-4">
                  <Badge
                    variant={isPaid ? "success" : "destructive"}
                    className={cn(
                      "text-xl px-8 py-2 rounded-full font-black tracking-tight shadow-lg",
                      isPaid ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
                    )}
                  >
                    {isPaid ? "ПЛАТЕНО" : "НЕПЛАТЕНО"}
                  </Badge>
                </div>

                {!isPaid && (
                  <Button
                    onClick={handleMarkAsPaid}
                    disabled={isUpdatingStatus}
                    className="w-full rounded-2xl py-7 text-lg font-black bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-xl transition-all"
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-6 w-6" />
                    )}
                    ОТРАЗИ ПЛАЩАНЕ
                  </Button>
                )}
                
                {isPaid && (
                  <div className="text-center text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20">
                    Трансакцията е успешно приключена
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailsPage;
