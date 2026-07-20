"use client";

import { Sale } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";

export interface StatusDetails {
  text: string;
  variant: "outline" | "secondary" | "default";
}

interface MemberSalesHistoryTableRowProps {
  sale: Sale;
  memberId: string;
  memberName?: string;
  familyMembers?: import("@/types").Member[];
  statusDetails: StatusDetails;
  itemsList: string;
  isSubscription: boolean;
  formatSaleDateCell: (sale: Sale) => React.ReactNode;
  formatPaymentMethod: (method?: string) => string;
  handleRowClick: (saleId: string, isPaid: boolean, type?: string) => void;
  handleMarkAsPaid: (saleId: string) => void;
  handleMarkAsUnpaid: (saleId: string) => void;
  handleDeleteSale: (saleId: string) => void;
}

function getBadgeClass(variant: string) {
  if (variant === "default") return "bg-emerald-500 text-white";
  if (variant === "secondary") return "bg-amber-500 text-white";
  return "bg-zinc-100 text-zinc-400 border-zinc-100";
}

export function MemberSalesHistoryTableRow({
  sale,
  memberId,
  memberName,
  familyMembers,
  statusDetails,
  itemsList,
  isSubscription,
  formatSaleDateCell,
  formatPaymentMethod,
  handleRowClick,
  handleMarkAsPaid,
  handleMarkAsUnpaid,
  handleDeleteSale,
}: MemberSalesHistoryTableRowProps) {
  const familyMember =
    sale.memberId !== memberId && familyMembers
      ? familyMembers.find((m) => m.id === sale.memberId)
      : null;

  return (
    <TableRow
      onClick={() => handleRowClick(sale.id, sale.isPaid, sale.type)}
      className="group cursor-pointer border-zinc-50 transition-all hover:bg-zinc-50/50"
    >
      <TableCell className="py-4 pl-5 whitespace-nowrap">
        {formatSaleDateCell(sale)}
      </TableCell>
      <TableCell className="max-w-75 py-4">
        <div
          className="text-xs leading-tight font-medium break-words text-zinc-900"
          title={itemsList}
        >
          {itemsList}
        </div>
        {isSubscription && (
          <div className="mt-0.5 text-[9px] tracking-widest text-zinc-400 uppercase">
            Услуга
          </div>
        )}
        {sale.memberId !== memberId && familyMembers && (
          <div className="mt-0.5 text-[9px] font-medium text-amber-600">
            За: {familyMember?.firstName || "Семейство"}{" "}
            {familyMember?.lastName || ""}
          </div>
        )}
      </TableCell>
      <TableCell className="py-4">
        <div className="flex flex-col">
          <span className="text-xs leading-tight font-semibold break-words text-zinc-900 dark:text-zinc-100">
            {sale.clientName ||
              (familyMember
                ? `${familyMember.firstName} ${familyMember.lastName}`.trim()
                : null) ||
              (sale.memberId === memberId ? memberName : null) ||
              "Външен клиент"}
            {sale.client2Name ? ` & ${sale.client2Name}` : ""}
          </span>
          <span className="text-[10px] text-zinc-400">
            {sale.note ||
              (sale.clientPhone && sale.client2Phone
                ? `${sale.clientPhone} / ${sale.client2Phone}`
                : sale.clientPhone) ||
              "Няма телефон"}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <span className="text-sm font-light text-zinc-600 dark:text-zinc-400">
          {formatPaymentMethod(sale.paymentMethod)}
        </span>
      </TableCell>
      <TableCell>
        <Badge
          variant={statusDetails.variant}
          className={cn(
            "rounded-full border-transparent px-2 py-0.5 text-[8px] font-medium tracking-widest uppercase",
            getBadgeClass(statusDetails.variant)
          )}
        >
          {statusDetails.text}
        </Badge>
      </TableCell>
      <TableCell className="py-4 text-right text-xs font-medium text-zinc-950">
        {formatPrice(sale.totalAmount)}
      </TableCell>
      <TableCell
        className="pr-5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
                className="size-7 rounded-lg text-zinc-400 hover:text-zinc-950"
              >
                <MoreHorizontal className="size-3.5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-zinc-100 shadow-none"
              onClick={(e) => e.stopPropagation()}
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
      </TableCell>
    </TableRow>
  );
}
