"use client";

import {
  Calendar,
  CheckCheck,
  CreditCard,
  FilePenLine,
  Hash,
  Loader2,
  Receipt,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { getMemberById } from "@/services/member-service";
import { deleteSale, getSaleById, updateSale } from "@/services/sales-service";
import { Member, Sale } from "@/types";

export interface SharedSaleDetailsProps {
  saleId: string;
  backUrl: string;
  baseSaleUrl: string;
  breadcrumbs: { label: string; href?: string }[];
}

export function SharedSaleDetails({
  saleId,
  backUrl,
  baseSaleUrl,
  breadcrumbs,
}: SharedSaleDetailsProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const router = useRouter();

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
          toast.error("Неуспешно зареждане на данните.");
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
      if (sale?.memberId && sale.memberId !== "GUEST_EXTERNAL") {
        mutate(sale.memberId);
      }
      toast.success("Продажбата беше изтрита успешно.");
      router.push(backUrl);
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Възникна грешка при изтриването.");
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
      if (sale?.memberId && sale.memberId !== "GUEST_EXTERNAL") {
        mutate(sale.memberId);
      }
      toast.success("Плащането беше регистрирано успешно.");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Възникна грешка при актуализирането.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary/20" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="rounded-3xl border-2 border-dashed bg-slate-50 py-20 text-center">
        <p className="font-medium text-zinc-400">
          Продажбата не беше намерена.
        </p>
        <Button variant="link" onClick={() => router.push(backUrl)}>
          Назад към продажби
        </Button>
      </div>
    );
  }

  const isPaid = sale.isPaid;

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title={`Детайли на продажба`}
        description={`Управление и преглед на продажба #${sale.id.substring(0, 8)}.`}
        breadcrumbs={breadcrumbs}
      >
        <div className="flex gap-2">
          {isPaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${baseSaleUrl}/${saleId}/receipt`)}
              className="rounded-xl"
            >
              <Receipt className="mr-2 size-4" /> Касова бележка
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`${baseSaleUrl}/${saleId}/edit`)}
            className="rounded-xl"
          >
            <FilePenLine className="mr-2 size-4" /> Редакция
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="rounded-xl">
                <Trash2 className="mr-2 size-4" /> Изтрий
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
              <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 pr-10 dark:border-zinc-800 dark:bg-zinc-900/40">
                <AlertDialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Сигурни ли сте?
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-0.5 text-xs text-zinc-500">
                  Това действие е необратимо. Наличностите в склада ще бъдат
                  възстановени.
                </AlertDialogDescription>
              </div>
              <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 text-xs text-zinc-600 dark:text-zinc-400 min-h-0">
                <p>
                  Продажбата #{sale.id.substring(0, 8)} ще бъде изтрита от
                  регистъра.
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <AlertDialogCancel className="h-9 rounded-xl font-medium text-xs">
                  Отказ
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="h-9 rounded-xl bg-rose-500 font-medium text-xs text-white shadow-none hover:bg-rose-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : null}
                  Потвърди изтриването
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BentoCard className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 p-3.5 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-zinc-100 p-2 text-zinc-950 dark:bg-zinc-800 dark:text-white">
                  <ShoppingCart className="size-4" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-medium text-zinc-900 dark:text-white">
                  Списък с артикули
                </h3>
              </div>
              <Badge
                variant="outline"
                className="border-zinc-200 bg-white font-medium text-zinc-500 shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {sale.items.length} продукта
              </Badge>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                {sale.items.map((item, index) => (
                  <li
                    key={item.productId || index}
                    className="flex items-center justify-between p-3.5 sm:p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/50"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm text-zinc-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs font-light text-zinc-400">
                        {item.quantity} бр. x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-base font-medium text-zinc-900 dark:text-white">
                      {formatPrice(item.quantity * item.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between rounded-b-2xl bg-zinc-950 p-4 sm:p-5 text-white">
              <div>
                <p className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">
                  Обща сума
                </p>
                <p className="text-2xl sm:text-3xl font-light">
                  {formatPrice(sale.totalAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">
                  Валута
                </p>
                <p className="text-lg sm:text-xl font-medium">
                  {sale.currency || "EUR"}
                </p>
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="space-y-4">
          <BentoCard className="p-3.5 sm:p-4.5">
            <div className="mb-3 flex items-center gap-2">
              <User className="size-4 text-zinc-400" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-zinc-900 dark:text-white">
                Клиент
              </h3>
            </div>
            {sale.memberId && member ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <Avatar className="size-10 border border-white shadow-none ring-1 ring-zinc-100 dark:ring-zinc-800">
                  <AvatarImage
                    src={member.avatarUrl ?? undefined}
                    alt={`${member.firstName} ${member.lastName}`}
                  />
                  <AvatarFallback className="bg-zinc-50 font-medium text-zinc-400">
                    {member.firstName && member.lastName
                      ? `${member.firstName[0]}${member.lastName[0]}`
                      : "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm text-zinc-900 dark:text-white">
                    {member.firstName} {member.lastName}
                  </p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs font-medium text-blue-500"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    Виж профил
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-slate-50/50 p-3 text-center dark:bg-zinc-900/50">
                <p className="text-xs font-medium text-zinc-400">
                  {sale.memberId === "GUEST_EXTERNAL"
                    ? "Външен гост"
                    : "Външен клиент"}
                </p>
              </div>
            )}
          </BentoCard>

          <BentoCard className="p-3.5 sm:p-4.5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="size-4 text-zinc-400" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-zinc-900 dark:text-white">
                Плащане
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                  Статус
                </span>
                <Badge
                  variant={isPaid ? "secondary" : "destructive"}
                  className={`px-2.5 py-0.5 text-[10px] font-medium tracking-widest shadow-none ${isPaid ? "border-emerald-100 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : ""}`}
                >
                  {isPaid ? "ПЛАТЕНО" : "НЕПЛАТЕНО"}
                </Badge>
              </div>

              {!isPaid && (
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={isUpdatingStatus}
                  className="mt-1 h-9.5 w-full rounded-xl bg-emerald-500 text-xs font-medium text-white shadow-none transition-all hover:bg-emerald-600 active:scale-95"
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-2 size-3.5" />
                  )}
                  Маркирай като платено
                </Button>
              )}
            </div>
          </BentoCard>

          <BentoCard className="p-3.5 sm:p-4.5">
            <div className="mb-3 flex items-center gap-2">
              <Hash className="size-4 text-zinc-400" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-zinc-900 dark:text-white">
                Инфо
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-50 p-2">
                  <Calendar className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] leading-none font-medium tracking-[0.2em] text-zinc-300 uppercase">
                    Дата
                  </p>
                  <p className="text-sm font-medium text-zinc-600">
                    {new Date(sale.saleDate).toLocaleDateString("bg-BG", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-50 p-2">
                  <Hash className="size-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] leading-none font-medium tracking-[0.2em] text-zinc-300 uppercase">
                    ID Продажба
                  </p>
                  <p className="font-mono text-[10px] font-medium text-zinc-400">
                    {sale.id}
                  </p>
                </div>
              </div>
              {sale.note && (
                <div className="mt-4 flex items-start gap-3 border-t border-zinc-100 pt-4">
                  <div className="mt-1 rounded-lg bg-amber-50 p-2 text-amber-500">
                    <FilePenLine className="size-4" />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] leading-none font-medium tracking-[0.2em] text-zinc-400 uppercase">
                      Бележка
                    </p>
                    <p className="text-sm font-medium text-zinc-700 italic">
                      &quot;{sale.note}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
