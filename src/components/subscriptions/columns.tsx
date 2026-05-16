import { ColumnDef } from "@tanstack/react-table";
import { Subscription } from "@/types";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Calendar,
  CreditCard,
  User,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Define the shape of the data for the table
export interface SubscriptionData extends Subscription {
  serviceName: string;
  memberFirstName: string;
  memberMiddleName: string;
  memberLastName: string;
}

// Helper function to determine badge color based on status
const getStatusBadge = (
  status: "active" | "inactive" | "cancelled" | "pending_payment"
) => {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Активен
        </Badge>
      );
    case "pending_payment":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-100 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium"
        >
          <Clock className="h-3.5 w-3.5" />
          Чакащо плащане
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="outline"
          className="bg-zinc-50 text-zinc-700 border-zinc-200 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium"
        >
          <XCircle className="h-3.5 w-3.5" />
          Изтекъл
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-100 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Отказан
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

// Define the columns for the DataTable
export const columns = (
  openForm: (subscription: SubscriptionData) => void,
  onDelete: (id: string) => void
): ColumnDef<SubscriptionData>[] => [
  {
    accessorKey: "memberLastName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Член" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      const initials = `${data.memberFirstName[0]}${data.memberLastName[0]}`;
      return (
        <div className="flex items-center gap-4 py-1">
          <Avatar className="h-10 w-10 border border-zinc-100 shadow-sm">
            <AvatarFallback className="bg-zinc-50 text-zinc-500 font-medium text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Link
              href={`/members/${data.memberId}`}
              className="text-[14px] font-semibold text-zinc-900 hover:text-primary transition-colors leading-tight"
            >
              {`${data.memberFirstName} ${data.memberMiddleName ? data.memberMiddleName + " " : ""}${data.memberLastName}`}
            </Link>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider mt-0.5">
              ID: {data.memberId.substring(0, 8)}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "serviceName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Услуга & Цена" />
    ),
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-zinc-700 line-clamp-1">
            {data.serviceName}
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-zinc-100 text-zinc-600 border-none font-bold text-[10px] px-2"
            >
              {data.price} {data.currency || "EUR"}
            </Badge>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Валидност" />
    ),
    cell: ({ row }) => {
      const start = new Date(row.original.startDate);
      const end = new Date(row.original.endDate);
      const isExpiringSoon =
        end.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 &&
        row.original.status === "active";

      return (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-400",
              isExpiringSoon && "bg-amber-50 border-amber-100 text-amber-500"
            )}
          >
            <Calendar className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-zinc-700 whitespace-nowrap">
              {start.toLocaleDateString("bg-BG", {
                day: "2-digit",
                month: "2-digit",
              })}{" "}
              —{" "}
              {end.toLocaleDateString("bg-BG", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            <span className="text-[11px] text-zinc-400">
              {row.original.status === "active"
                ? "Активна клубна карта"
                : "Предстоящо плащане"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const subscription = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 p-0 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-zinc-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2 rounded-2xl border-zinc-100 shadow-xl"
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-400 px-3 py-2">
              Действия за членство
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => openForm(subscription)}
              className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer"
            >
              <Edit2 className="h-4 w-4 text-zinc-400" />
              <span className="text-sm">Редактирай данни</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer"
            >
              <Link
                href={`/members/${subscription.memberId}?tab=subscriptions`}
              >
                <User className="h-4 w-4 text-zinc-400" />
                <span className="text-sm">Профил на члена</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer"
            >
              <Link href={`/sales/new?memberId=${subscription.memberId}`}>
                <CreditCard className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium text-primary">
                  Маркирай като платено
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-100 my-1" />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-xl px-3 py-2.5 gap-3 cursor-pointer"
              onClick={() => {
                if (
                  confirm("Сигурни ли сте, че искате да изтриете този запис?")
                ) {
                  onDelete(subscription.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Изтрий записа</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
