"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteSale, getSaleById, updateSale } from "@/services/sales-service";
import { getMemberById } from "@/services/member-service";
import { Sale, Member } from "@/types";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { mutate } from "swr";

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
  User,
  ShoppingCart,
  Trash2,
  CheckCheck,
  FilePenLine,
  Receipt,
  Calendar,
  Hash,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";

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
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-medium text-zinc-900">
                  Сигурни ли сте?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-medium">
                  Това действие е необратимо. Наличностите в склада ще бъдат
                  възстановени.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-medium">
                  Отказ
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-xl bg-rose-500 font-medium shadow-none hover:bg-rose-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Потвърди изтриването
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BentoCard className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-zinc-100 p-2 text-zinc-950">
                  <ShoppingCart className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium text-zinc-900">
                  Списък с артикули
                </h3>
              </div>
              <Badge
                variant="outline"
                className="border-zinc-100 bg-white font-medium text-zinc-500 shadow-none"
              >
                {sale.items.length} продукта
              </Badge>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-slate-50">
                {sale.items.map((item, index) => (
                  <li
                    key={item.productId || index}
                    className="flex items-center justify-between p-6 transition-colors hover:bg-slate-50/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-900">{item.name}</p>
                      <p className="text-sm font-light text-zinc-400">
                        {item.quantity} бр. x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-lg font-medium text-zinc-900">
                      {formatPrice(item.quantity * item.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between rounded-b-5xl bg-zinc-950 p-8 text-white">
              <div>
                <p className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">
                  Обща сума
                </p>
                <p className="text-3xl font-light">
                  {formatPrice(sale.totalAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">
                  Валута
                </p>
                <p className="text-xl font-medium">{sale.currency || "EUR"}</p>
              </div>
            </div>
          </BentoCard>
        </div>

        <div className="space-y-6">
          <BentoCard className="p-6">
            <div className="mb-6 flex items-center gap-2">
              <User className="size-5 text-zinc-400" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-zinc-900">Клиент</h3>
            </div>
            {sale.memberId && member ? (
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <Avatar className="size-14 border-2 border-white shadow-none ring-1 ring-zinc-100">
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
                  <p className="truncate font-medium text-zinc-900">
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
              <div className="rounded-2xl border border-dashed bg-slate-50/50 p-4 text-center">
                <p className="text-sm font-medium text-zinc-400">
                  {sale.memberId === "GUEST_EXTERNAL"
                    ? "Външен гост"
                    : "Външен клиент"}
                </p>
              </div>
            )}
          </BentoCard>

          <BentoCard className="p-6">
            <div className="mb-6 flex items-center gap-2">
              <CreditCard className="size-5 text-zinc-400" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-zinc-900">Плащане</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-400">
                  Статус
                </span>
                <Badge
                  variant={isPaid ? "secondary" : "destructive"}
                  className={`px-3 py-1 text-[10px] font-medium tracking-widest shadow-none ${isPaid ? "border-emerald-100 bg-emerald-50 text-emerald-600" : ""}`}
                >
                  {isPaid ? "ПЛАТЕНО" : "НЕПЛАТЕНО"}
                </Badge>
              </div>

              {!isPaid && (
                <Button
                  onClick={handleMarkAsPaid}
                  disabled={isUpdatingStatus}
                  className="mt-2 h-11 w-full rounded-xl bg-emerald-500 font-medium text-white shadow-none transition-all hover:bg-emerald-600 active:scale-95"
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-2 size-4" />
                  )}
                  Маркирай като платено
                </Button>
              )}
            </div>
          </BentoCard>

          <BentoCard className="p-6">
            <div className="mb-6 flex items-center gap-2">
              <Hash className="size-5 text-zinc-400" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-zinc-900">Инфо</h3>
            </div>
            <div className="space-y-4">
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
