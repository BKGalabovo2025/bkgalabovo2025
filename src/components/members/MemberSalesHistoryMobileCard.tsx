"use client";

import { MoreHorizontal, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Sale } from "@/types";

import { StatusDetails } from "./MemberSalesHistoryTableRow";

interface MemberSalesHistoryMobileCardProps {
  sale: Sale;
  memberId: string;
  memberName?: string;
  familyMembers?: import("@/types").Member[];
  statusDetails: StatusDetails;
  itemsList: string;
  isSubscription: boolean;
  formatSaleDateMobile: (sale: Sale) => string;
  formatPaymentMethod: (method?: string) => string;
  handleRowClick: (saleId: string, isPaid: boolean, type?: string) => void;
  handleMarkAsPaid: (saleId: string) => void;
  handleMarkAsUnpaid: (saleId: string) => void;
  handleDeleteSale: (saleId: string) => void;
}

function getSaleTypeText(type?: string, isSubscription?: boolean) {
  if (type === "general_service") return "Клубна Услуга";
  if (isSubscription) return "Услуга";
  return "Продажба";
}

function getMobileBadgeClass(variant: string) {
  if (variant === "default")
    return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10";
  if (variant === "secondary")
    return "bg-amber-500 text-white shadow-lg shadow-amber-500/10";
  return "bg-zinc-100 text-zinc-400 border-zinc-100";
}

export function MemberSalesHistoryMobileCard({
  sale,
  memberId,
  memberName,
  familyMembers,
  statusDetails,
  itemsList,
  isSubscription,
  formatSaleDateMobile,
  formatPaymentMethod,
  handleRowClick,
  handleMarkAsPaid,
  handleMarkAsUnpaid,
  handleDeleteSale,
}: MemberSalesHistoryMobileCardProps) {
  const familyMember =
    sale.memberId !== memberId && familyMembers
      ? familyMembers.find((m) => m.id === sale.memberId)
      : null;

  return (
    <div
      onClick={() => handleRowClick(sale.id, sale.isPaid, sale.type)}
      className="active:scale-0.98 rounded-xl border border-zinc-100 bg-zinc-50/40 p-4 transition-all"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[8px] font-medium tracking-widest text-zinc-400 uppercase">
            {formatSaleDateMobile(sale)}
          </p>
          <h3 className="line-clamp-2 text-xs leading-relaxed font-medium text-zinc-950">
            {itemsList}
          </h3>
          <div className="mt-1 flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">
              {sale.clientName ||
                (familyMember
                  ? `${familyMember.firstName} ${familyMember.lastName}`.trim()
                  : null) ||
                (sale.memberId === memberId ? memberName : null) ||
                "Външен клиент"}
              {sale.client2Name ? ` & ${sale.client2Name}` : ""}
            </span>
            <span className="text-[9px] text-zinc-400">
              {sale.note ||
                (sale.clientPhone && sale.client2Phone
                  ? `${sale.clientPhone} / ${sale.client2Phone}`
                  : sale.clientPhone) ||
                "Няма телефон"}
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Badge
            variant={statusDetails.variant}
            className={cn(
              "shrink-0 rounded-full border-transparent px-2 py-0.5 text-[8px] font-medium tracking-widest uppercase",
              getMobileBadgeClass(statusDetails.variant)
            )}
          >
            {statusDetails.text}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 rounded-lg text-zinc-400 hover:text-zinc-950"
              >
                <MoreHorizontal className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-zinc-100 shadow-none"
            >
              <DropdownMenuItem
                onSelect={() => handleRowClick(sale.id, sale.isPaid, sale.type)}
                className="py-1.5 text-[10px] font-medium tracking-widest uppercase"
              >
                Преглед на квитанция
              </DropdownMenuItem>
              {sale.isPaid ? (
                <DropdownMenuItem
                  onSelect={() => handleMarkAsUnpaid(sale.id)}
                  className="py-1.5 text-[10px] font-medium tracking-widest text-rose-500 uppercase hover:bg-rose-50 hover:text-rose-600"
                >
                  Отмени плащането
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => handleMarkAsPaid(sale.id)}
                  className="py-1.5 text-[10px] font-medium tracking-widest text-emerald-500 uppercase hover:bg-emerald-50 hover:text-emerald-600"
                >
                  Маркирай като платено
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-zinc-100" />
              <DropdownMenuItem
                onSelect={() => handleDeleteSale(sale.id)}
                className="py-1.5 text-[10px] font-medium tracking-widest text-red-500 uppercase hover:bg-red-50 hover:text-red-600"
              >
                Изтрий запис
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100/50 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex size-5 items-center justify-center rounded-full border border-zinc-100 bg-white">
            <Receipt className="size-2.5 text-zinc-400" />
          </div>
          <span className="text-[8px] font-medium tracking-widest text-zinc-400 uppercase">
            {getSaleTypeText(sale.type, isSubscription)}
          </span>
          <span className="text-[8px] font-normal text-zinc-400/80">
            • {formatPaymentMethod(sale.paymentMethod)} •{" "}
            {new Date(sale.saleDate).toLocaleTimeString("bg-BG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <span className="text-sm font-medium tracking-tight text-zinc-950">
          {formatPrice(sale.totalAmount)}
        </span>
      </div>
    </div>
  );
}
