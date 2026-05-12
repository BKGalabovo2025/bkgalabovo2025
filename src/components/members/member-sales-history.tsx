"use client";

import { useRouter } from "next/navigation";
import { useSales } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";

interface MemberSalesHistoryProps {
  memberId: string;
}

// Helper to determine badge variant and text based on status and amount
const getStatusDetails = (
  status: "completed" | "pending" | "informational" | string,
  totalAmount: number
) => {
  if (totalAmount === 0 && status === "informational") {
    return { text: "Системна", variant: "outline" as const };
  }

  switch (status) {
    case "completed":
      return { text: "Платено", variant: "default" as const };
    case "pending":
      return { text: "Чакащо", variant: "secondary" as const };
    // Fallback for old data that might have status: 'completed' but amount: 0
    case "completed":
      if (totalAmount === 0)
        return { text: "Нулева", variant: "outline" as const };
      return { text: "Платено", variant: "default" as const };
    default:
      return { text: status, variant: "secondary" as const };
  }
};

export const MemberSalesHistory = ({ memberId }: MemberSalesHistoryProps) => {
  const router = useRouter();
  const { sales, loading, error } = useSales(memberId);

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}/receipt`);
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-5xl p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-light tracking-tighter text-zinc-950 mb-2">
            История на продажбите
          </h2>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
            Списък с всички регистрирани плащания и услуги.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push(`/sales/new?memberId=${memberId}`)}
          className="h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-medium uppercase tracking-widest shadow-none"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
          Нова продажба
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2
            className="h-8 w-8 animate-spin text-zinc-200"
            strokeWidth={1.5}
          />
        </div>
      ) : error ? (
        <div className="p-10 text-center bg-rose-50 rounded-4xl border border-rose-100 text-rose-500 text-sm font-light">
          Грешка: {error}
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50/50 border border-zinc-100 border-dashed rounded-4xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300">
            Няма регистрирани продажби.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-zinc-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 border-zinc-100 hover:bg-zinc-50/50">
                <TableHead className="h-12 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 pl-6">
                  Дата
                </TableHead>
                <TableHead className="h-12 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  Статус
                </TableHead>
                <TableHead className="h-12 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 text-right">
                  Обща сума
                </TableHead>
                <TableHead className="h-12 w-[80px]">
                  <span className="sr-only">Действия</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const statusDetails = getStatusDetails(
                  sale.status,
                  sale.totalAmount
                );

                return (
                  <TableRow
                    key={sale.id}
                    onClick={() => handleRowClick(sale.id)}
                    className="cursor-pointer border-zinc-50 hover:bg-zinc-50/50 transition-all group"
                  >
                    <TableCell className="py-5 font-light text-sm text-zinc-600 pl-6">
                      {new Date(sale.saleDate).toLocaleDateString("bg-BG")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusDetails.variant}
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-medium uppercase tracking-widest border-transparent",
                          statusDetails.variant === "default"
                            ? "bg-emerald-500 text-white"
                            : statusDetails.variant === "secondary"
                              ? "bg-amber-500 text-white"
                              : "bg-zinc-100 text-zinc-400 border-zinc-100"
                        )}
                      >
                        {statusDetails.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-5 font-medium text-sm text-zinc-950">
                      {formatPrice(sale.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-950"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-zinc-100 shadow-none"
                          >
                            <DropdownMenuItem
                              onSelect={() => handleRowClick(sale.id)}
                              className="text-[11px] font-medium uppercase tracking-widest py-2"
                            >
                              Преглед на квитанция
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
