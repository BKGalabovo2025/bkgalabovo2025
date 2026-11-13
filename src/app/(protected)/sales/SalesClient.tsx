"use client";

import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCheck,
  Eye,
  Link2,
  Loader2,
  MoreVertical,
  Package,
  Pencil,
  PlusCircle,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { SalesListSectionId } from "@/components/sales/sales-list-sections";
import { SalesNav } from "@/components/sales/SalesNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { deleteSaleAction, updateSaleAction } from "@/lib/actions/sales";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Member, Sale } from "@/types";

interface SalesClientProps {
  initialSales: Sale[];
  initialMembers: Member[];
  showPageHeader?: boolean;
  section?: SalesListSectionId;
}

interface SaleMobileCardProps {
  sale: Sale & { memberName: string };
  isHighlighted?: boolean;
  isCopied?: boolean;
  onCopyLink: (id: string) => void;
  onRowClick: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onMarkAsUnpaid: (id: string) => void;
  isUpdating: boolean;
}

function SaleMobileCard({
  sale,
  isHighlighted,
  isCopied,
  onCopyLink,
  onRowClick,
  onDelete,
  onMarkAsPaid,
  onMarkAsUnpaid,
  isUpdating,
}: SaleMobileCardProps) {
  const router = useRouter();
  const itemsSummary = (sale.items || [])
    .map((i) => `${i.name}${i.quantity > 1 ? ` (${i.quantity} бр.)` : ""}`)
    .join(", ");

  return (
    <div
      id={`sale-${sale.id}`}
      onClick={() => onRowClick(sale.id)}
      className={cn(
        "cursor-pointer rounded-2xl border bg-white p-4 shadow-2xs transition-colors active:bg-zinc-50 dark:bg-zinc-950 dark:active:bg-zinc-900",
        isHighlighted
          ? "border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/10 dark:border-blue-400 dark:bg-blue-950/20"
          : "border-zinc-100 dark:border-zinc-800"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <User
              className="size-3.5 text-zinc-400 shrink-0"
              strokeWidth={1.5}
            />
            {sale.memberId &&
            sale.memberId !== "GUEST_EXTERNAL" &&
            sale.memberId !== "Walk-in Customer" ? (
              <Link
                href={`/members/${sale.memberId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold text-zinc-900 truncate hover:text-indigo-600 hover:underline dark:text-white dark:hover:text-indigo-400"
              >
                {sale.memberName}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-zinc-900 truncate dark:text-white">
                {sale.memberName}
              </span>
            )}
          </div>
          {itemsSummary && (
            <p className="text-xs text-zinc-500 truncate dark:text-zinc-400">
              {itemsSummary}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Calendar
              className="size-3 text-zinc-400 shrink-0"
              strokeWidth={1.5}
            />
            <span>{new Date(sale.saleDate).toLocaleString("bg-BG")}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Badge
              className={cn(
                "rounded-full border-none px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase",
                sale.isPaid
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
              )}
            >
              {sale.isPaid ? "Платено" : "Висящо"}
            </Badge>

            {!sale.isPaid && (
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsPaid(sale.id);
                }}
                className="h-7 rounded-lg border-emerald-300 bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs cursor-pointer"
                title="Маркирай тази продажба като платена"
              >
                {isUpdating ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <CheckCheck className="mr-1 size-3 text-emerald-600" />
                )}
                Плати
              </Button>
            )}

            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopyLink(sale.id)}
                className="size-8 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                title="Копирай директен линк към продажбата"
                aria-label="Копирай директен линк към продажбата"
              >
                {isCopied ? (
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Link2 className="size-3.5" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-zinc-400 hover:text-zinc-600"
                    aria-label="Още действия"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-2xl border-zinc-100 p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {!sale.isPaid ? (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:text-emerald-400"
                      onSelect={() => onMarkAsPaid(sale.id)}
                    >
                      <CheckCheck className="mr-2 size-3.5 text-emerald-600" />
                      <span>Маркирай като платено</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:text-amber-400"
                      onSelect={() => onMarkAsUnpaid(sale.id)}
                    >
                      <RotateCcw className="mr-2 size-3.5 text-amber-600" />
                      <span>Отмени плащането</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    onSelect={() => router.push(`/sales/${sale.id}`)}
                  >
                    <Eye className="mr-2 size-3.5 text-zinc-500" />
                    <span>Детайли</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    onSelect={() => router.push(`/sales/${sale.id}/receipt`)}
                  >
                    <Receipt className="mr-2 size-3.5 text-zinc-500" />
                    <span>Касова бележка</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    onSelect={() => router.push(`/sales/${sale.id}/edit`)}
                  >
                    <Pencil className="mr-2 size-3.5 text-zinc-500" />
                    <span>Редактирай</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                    onSelect={() => onDelete(sale.id)}
                  >
                    <Trash2 className="mr-2 size-3.5 text-rose-500" />
                    <span>Изтрий</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-900">
        <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
          Обща сума
        </span>
        <span className="text-sm font-bold text-zinc-950 tabular-nums dark:text-white">
          {formatPrice(sale.totalAmount)}
        </span>
      </div>
    </div>
  );
}

export default function SalesClient({
  initialSales = [],
  initialMembers = [],
  showPageHeader = true,
  section = "all",
}: SalesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");
  const { idToken } = useAuth();

  const [sales, setSales] = useState<Sale[]>(initialSales || []);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingSaleId, setUpdatingSaleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">(
    section === "paid" ? "paid" : section === "pending" ? "pending" : "all"
  );

  useEffect(() => {
    if (section === "paid") setStatusFilter("paid");
    else if (section === "pending") setStatusFilter("pending");
    else setStatusFilter("all");
  }, [section]);

  const handleStatusFilterChange = (nextStatus: "all" | "pending" | "paid") => {
    setStatusFilter(nextStatus);
    if (section === "paid" || section === "pending") {
      if (nextStatus === "all") router.push("/sales");
      else if (nextStatus === "paid") router.push("/sales/paid");
      else if (nextStatus === "pending") router.push("/sales/pending");
    }
  };

  const handleCopySaleLink = (saleId: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${pathname}?id=${saleId}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopiedId(saleId);
        toast.success("Директният линк към продажбата е копиран!");
        setTimeout(() => setCopiedId(null), 2500);
      })
      .catch(() => {
        toast.error("Неуспешно копиране на линк.");
      });
  };

  useEffect(() => {
    setSales(initialSales || []);
  }, [initialSales]);

  const memberMap = useMemo(() => {
    if (!initialMembers) return new Map();
    return new Map(
      initialMembers.map((member) => [
        member.id,
        `${member.firstName} ${member.lastName}`,
      ])
    );
  }, [initialMembers]);

  const salesWithMemberNames = useMemo(() => {
    return sales.map((sale) => {
      let memberName = sale.clientName || "Външен клиент";
      if (sale.memberId === "GUEST_EXTERNAL") {
        memberName = sale.clientName || "Външен гост";
      } else if (sale.memberId && sale.memberId !== "Walk-in Customer") {
        memberName =
          sale.clientName || memberMap.get(sale.memberId) || "Неизвестен член";
      }
      return {
        ...sale,
        memberName,
      };
    });
  }, [sales, memberMap]);

  const sortedSales = useMemo(() => {
    return [...salesWithMemberNames].sort((a, b) => {
      if (!a.isPaid && b.isPaid) return -1;
      if (a.isPaid && !b.isPaid) return 1;
      return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
    });
  }, [salesWithMemberNames]);

  const unpaidCount = useMemo(
    () => sales.filter((s) => !s.isPaid).length,
    [sales]
  );
  const paidCount = useMemo(
    () => sales.filter((s) => s.isPaid).length,
    [sales]
  );

  const filteredSales = useMemo(() => {
    return sortedSales.filter((sale) => {
      // 1. Status filter (synced with route section)
      if (statusFilter === "pending" && sale.isPaid) return false;
      if (statusFilter === "paid" && !sale.isPaid) return false;

      // 2. Search query (client name, note, item names, amount)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = sale.memberName.toLowerCase().includes(q);
        const matchesClient = (sale.clientName || "").toLowerCase().includes(q);
        const matchesNote = (sale.note || "").toLowerCase().includes(q);
        const matchesItems = (sale.items || []).some((item) =>
          (item.name || "").toLowerCase().includes(q)
        );
        const matchesAmount = sale.totalAmount.toString().includes(q);
        return (
          matchesName ||
          matchesClient ||
          matchesNote ||
          matchesItems ||
          matchesAmount
        );
      }
      return true;
    });
  }, [sortedSales, statusFilter, searchQuery]);

  useDeepLinkHighlight("sale", filteredSales.length > 0);

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}`);
  };

  const handleMarkAsPaid = async (saleId: string) => {
    setUpdatingSaleId(saleId);
    const originalSales = [...sales];
    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId ? { ...s, isPaid: true, status: "completed" } : s
      )
    );

    try {
      const result = await updateSaleAction(saleId, idToken || "", {
        isPaid: true,
        status: "completed",
      });
      if (result.success) {
        toast.success("Продажбата беше маркирана като платена.");
        router.refresh();
      } else {
        setSales(originalSales);
        toast.error(result.message || "Грешка при актуализиране на плащането.");
      }
    } catch (err) {
      setSales(originalSales);
      console.error("Error marking sale as paid:", err);
      toast.error("Възникна грешка при маркиране като платено.");
    } finally {
      setUpdatingSaleId(null);
    }
  };

  const handleMarkAsUnpaid = async (saleId: string) => {
    setUpdatingSaleId(saleId);
    const originalSales = [...sales];
    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId ? { ...s, isPaid: false, status: "pending" } : s
      )
    );

    try {
      const result = await updateSaleAction(saleId, idToken || "", {
        isPaid: false,
        status: "pending",
      });
      if (result.success) {
        toast.success("Плащането беше отменено (записано като висящо).");
        router.refresh();
      } else {
        setSales(originalSales);
        toast.error(result.message || "Грешка при актуализиране на статуса.");
      }
    } catch (err) {
      setSales(originalSales);
      console.error("Error marking sale as unpaid:", err);
      toast.error("Възникна грешка при отмяна на плащането.");
    } finally {
      setUpdatingSaleId(null);
    }
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);

    const originalSales = [...sales];
    // Оптимистично изтриване от UI
    const updatedSales = sales.filter((s) => s.id !== saleToDelete);
    setSales(updatedSales);

    try {
      const result = await deleteSaleAction(saleToDelete, idToken || "");
      if (result.success) {
        toast.success(result.message || "Продажбата беше изтрита успешно");
        router.refresh();
      } else {
        setSales(originalSales);
        toast.error(result.message || "Грешка при изтриване");
      }
    } catch (error) {
      setSales(originalSales);
      console.error("Error deleting sale:", error);
      toast.error("Грешка при изтриване");
    } finally {
      setIsDeleting(false);
      setSaleToDelete(null);
    }
  };

  const renderTableContent = () => {
    return (
      <>
        {/* Mobile Card View (< md) */}
        <div className="space-y-3 p-3 md:hidden">
          {filteredSales.length > 0 ? (
            filteredSales.map((sale) => (
              <SaleMobileCard
                key={sale.id}
                sale={sale}
                isHighlighted={targetId === sale.id}
                isCopied={copiedId === sale.id}
                onCopyLink={handleCopySaleLink}
                onRowClick={handleRowClick}
                onDelete={setSaleToDelete}
                onMarkAsPaid={handleMarkAsPaid}
                onMarkAsUnpaid={handleMarkAsUnpaid}
                isUpdating={updatingSaleId === sale.id}
              />
            ))
          ) : (
            <div className="py-16 text-center">
              <ShoppingCart
                className="mx-auto mb-4 size-10 text-zinc-300 dark:text-zinc-700"
                strokeWidth={1}
              />
              <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                {searchQuery || statusFilter !== "all"
                  ? "Няма намерени продажби по зададените критерии"
                  : "Все още няма продажби"}
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
              <TableRow className="h-14 border-none hover:bg-transparent">
                <TableHead className="px-6 text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  Дата и Час
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  Клиент
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  Артикули
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  Статус
                </TableHead>
                <TableHead className="pr-6 text-right text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  Сума
                </TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const itemsSummary = (sale.items || [])
                    .map(
                      (i) =>
                        `${i.name}${i.quantity > 1 ? ` (${i.quantity} бр.)` : ""}`
                    )
                    .join(", ");

                  return (
                    <TableRow
                      key={sale.id}
                      id={`sale-${sale.id}`}
                      onClick={() => handleRowClick(sale.id)}
                      className={cn(
                        "group h-18 cursor-pointer border-zinc-100 transition-colors hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:bg-zinc-900/50",
                        targetId === sale.id &&
                          "bg-blue-50/40 ring-2 ring-blue-500/40 dark:bg-blue-950/20"
                      )}
                    >
                      <TableCell className="px-6">
                        <div className="flex items-center gap-2.5">
                          <Calendar
                            className="size-3.5 text-zinc-400 shrink-0"
                            strokeWidth={1.5}
                          />
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {new Date(sale.saleDate).toLocaleString("bg-BG", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <User
                            className="size-3.5 text-zinc-400 shrink-0"
                            strokeWidth={1.5}
                          />
                          {sale.memberId &&
                          sale.memberId !== "GUEST_EXTERNAL" &&
                          sale.memberId !== "Walk-in Customer" ? (
                            <Link
                              href={`/members/${sale.memberId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-semibold text-zinc-900 hover:text-indigo-600 hover:underline dark:text-white dark:hover:text-indigo-400"
                            >
                              {sale.memberName}
                            </Link>
                          ) : (
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                              {sale.memberName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-xs">
                          <Package
                            className="size-3.5 text-zinc-400 shrink-0"
                            strokeWidth={1.5}
                          />
                          <span
                            className="text-xs text-zinc-600 truncate dark:text-zinc-300 font-medium"
                            title={itemsSummary}
                          >
                            {itemsSummary || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "rounded-full border-none px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase",
                              sale.isPaid
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                            )}
                          >
                            {sale.isPaid ? "Платено" : "Висящо"}
                          </Badge>
                          {!sale.isPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingSaleId === sale.id}
                              onClick={() => handleMarkAsPaid(sale.id)}
                              className="h-7 rounded-lg border-emerald-300 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer shadow-2xs transition-all"
                              title="Маркирай тази продажба като платена"
                            >
                              {updatingSaleId === sale.id ? (
                                <Loader2 className="mr-1.5 size-3 animate-spin" />
                              ) : (
                                <CheckCheck className="mr-1.5 size-3.5 text-emerald-600" />
                              )}
                              Маркирай платено
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right text-xs font-bold text-zinc-950 tabular-nums dark:text-white">
                        {formatPrice(sale.totalAmount)}
                      </TableCell>
                      <TableCell
                        className="px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopySaleLink(sale.id)}
                            className="size-8 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Копирай директен линк към продажбата"
                            aria-label="Копирай директен линк към продажбата"
                          >
                            {copiedId === sale.id ? (
                              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Link2 className="size-4" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                title="Още действия"
                                aria-label="Още действия"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-52 rounded-2xl border-zinc-100 p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                            >
                              {!sale.isPaid ? (
                                <DropdownMenuItem
                                  className="cursor-pointer rounded-xl py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:text-emerald-400"
                                  onSelect={() => handleMarkAsPaid(sale.id)}
                                >
                                  <CheckCheck className="mr-2 size-3.5 text-emerald-600" />
                                  <span>Маркирай като платено</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="cursor-pointer rounded-xl py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:text-amber-400"
                                  onSelect={() => handleMarkAsUnpaid(sale.id)}
                                >
                                  <RotateCcw className="mr-2 size-3.5 text-amber-600" />
                                  <span>Отмени плащането</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="cursor-pointer rounded-xl py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                onSelect={() =>
                                  router.push(`/sales/${sale.id}`)
                                }
                              >
                                <Eye className="mr-2 size-3.5 text-zinc-500" />
                                <span>Детайли</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer rounded-xl py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                onSelect={() =>
                                  router.push(`/sales/${sale.id}/receipt`)
                                }
                              >
                                <Receipt className="mr-2 size-3.5 text-zinc-500" />
                                <span>Касова бележка</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer rounded-xl py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                onSelect={() =>
                                  router.push(`/sales/${sale.id}/edit`)
                                }
                              >
                                <Pencil className="mr-2 size-3.5 text-zinc-500" />
                                <span>Редактирай</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />
                              <DropdownMenuItem
                                className="cursor-pointer rounded-xl py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                                onSelect={() => setSaleToDelete(sale.id)}
                              >
                                <Trash2 className="mr-2 size-3.5 text-rose-500" />
                                <span>Изтрий</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center">
                    <ShoppingCart
                      className="mx-auto mb-4 size-10 text-zinc-200 dark:text-zinc-800"
                      strokeWidth={1}
                    />
                    <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                      {searchQuery || statusFilter !== "all"
                        ? "Няма намерени продажби по зададените критерии"
                        : "Все още няма продажби"}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  const isPaid = section === "paid" || pathname?.startsWith("/sales/paid");
  const isPending =
    section === "pending" || pathname?.startsWith("/sales/pending");

  const breadcrumbs = isPaid
    ? [
        { label: "Начало", href: "/dashboard" },
        { label: "Продажби", href: "/sales" },
        { label: "Платени" },
      ]
    : isPending
      ? [
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби", href: "/sales" },
          { label: "Чакащи плащане" },
        ]
      : [{ label: "Начало", href: "/dashboard" }, { label: "Продажби" }];

  return (
    <div className="space-y-6 duration-500 animate-in fade-in">
      {showPageHeader ? (
        <>
          <PageHeader
            title="Продажби"
            description="Проследяване на продажби на инвентар, напитки и услуги в реално време."
            breadcrumbs={breadcrumbs}
          >
            <Button
              onClick={() => router.push("/sales/new")}
              className="h-11 sm:h-12 w-full sm:w-auto rounded-xl bg-zinc-950 px-6 sm:px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
            >
              <PlusCircle className="mr-3 size-4" strokeWidth={1.5} /> Нова
              продажба
            </Button>
          </PageHeader>
          <SalesNav />

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
            <BentoCard
              onClick={() => handleStatusFilterChange("all")}
              className={cn(
                "rounded-2xl border p-3.5 sm:p-4 shadow-none transition-all cursor-pointer",
                statusFilter === "all"
                  ? "border-blue-500 bg-blue-50/20 dark:border-blue-600 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                  : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-0.5 text-xl sm:text-2xl font-light tracking-tight text-zinc-900 dark:text-white">
                    {sales.length}
                  </p>
                  <p className="text-[10px] tracking-[0.15em] text-zinc-400 uppercase font-semibold">
                    Общо транзакции
                  </p>
                </div>
                <ShoppingCart
                  className="size-4 sm:size-5 text-zinc-400"
                  strokeWidth={1.5}
                />
              </div>
            </BentoCard>

            <BentoCard
              onClick={() =>
                handleStatusFilterChange(
                  statusFilter === "pending" ? "all" : "pending"
                )
              }
              className={cn(
                "rounded-2xl border p-3.5 sm:p-4 shadow-none transition-all cursor-pointer",
                statusFilter === "pending"
                  ? "border-amber-500 bg-amber-50/40 dark:border-amber-600 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                  : "border-zinc-200/80 bg-white hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-0.5 text-xl sm:text-2xl font-bold tracking-tight text-amber-600">
                    {unpaidCount}
                  </p>
                  <p className="text-[10px] tracking-[0.15em] text-zinc-400 uppercase font-semibold">
                    {statusFilter === "pending"
                      ? "Филтър: Висящи (активен)"
                      : "Висящи плащания"}
                  </p>
                </div>
                <AlertTriangle
                  className="size-4 sm:size-5 text-amber-500"
                  strokeWidth={1.5}
                />
              </div>
            </BentoCard>

            <BentoCard
              onClick={() =>
                handleStatusFilterChange(
                  statusFilter === "paid" ? "all" : "paid"
                )
              }
              className={cn(
                "col-span-2 flex items-center rounded-2xl border-none bg-zinc-950 p-3.5 sm:p-4 text-white shadow-none lg:col-span-2 dark:bg-zinc-900 cursor-pointer transition-all",
                statusFilter === "paid" && "ring-2 ring-emerald-500"
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 sm:p-3">
                  <Receipt
                    className="size-4 sm:size-5 text-emerald-400"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="mb-0.5 text-[9px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">
                    Платени продажби
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-zinc-100">
                    {paidCount} от {sales.length} приключени плащания
                  </p>
                </div>
              </div>
            </BentoCard>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-zinc-900 uppercase dark:text-white">
              Хроника на плащанията
            </h3>
            <p className="text-[11px] text-zinc-400">
              Преглед и управление на всички регистрирани плащания.
            </p>
          </div>
          <Button
            onClick={() => router.push("/sales/new")}
            className="h-10 rounded-xl bg-zinc-950 px-6 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
          >
            <PlusCircle className="mr-2 size-3.5" strokeWidth={1.5} /> Нова
            продажба
          </Button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <Input
            id="sales-search-input"
            name="salesSearch"
            placeholder="Търсене по клиент, артикул, бележка..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all" as const, label: "Всички", count: sales.length },
            {
              id: "pending" as const,
              label: "Висящи",
              count: unpaidCount,
              badgeClass:
                "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
            },
            {
              id: "paid" as const,
              label: "Платени",
              count: paidCount,
              badgeClass:
                "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={statusFilter === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilterChange(tab.id)}
              className="h-8 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : tab.badgeClass ||
                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                )}
              >
                {tab.count}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        {renderTableContent()}
      </BentoCard>

      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent className="flex max-h-[90dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          {/* Fixed Sticky Header */}
          <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 pr-10 dark:border-zinc-800 dark:bg-zinc-900/40">
            <AlertDialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              Сигурни ли сте?
            </AlertDialogTitle>
          </div>

          {/* Scrollable Body Container */}
          <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 min-h-0">
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Това действие ще изтрие записа на продажбата за постоянно. Ако
              това е продажба на инвентар, наличностите няма да се възстановят
              автоматично.
            </AlertDialogDescription>
          </div>

          {/* Fixed Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <AlertDialogCancel className="h-9 rounded-xl border-zinc-200 px-4 text-xs font-semibold dark:border-zinc-800">
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-9 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
            >
              {isDeleting && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              )}
              Изтрий
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
