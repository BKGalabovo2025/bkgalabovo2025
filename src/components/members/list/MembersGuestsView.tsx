"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { deleteMemberAction } from "@/lib/actions/members";
import { Member } from "@/types";

import { isGuestProfile } from "./member-list-sections";

const ITEMS_PER_PAGE = 12;

interface MembersGuestsViewProps {
  initialMembers: Member[];
}

export function MembersGuestsView({ initialMembers }: MembersGuestsViewProps) {
  const router = useRouter();
  const { idToken } = useAuth();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const guestMembers = useMemo(() => members.filter(isGuestProfile), [members]);

  const filteredGuests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return guestMembers
      .filter((guest) => {
        const fullName =
          `${guest.firstName || ""} ${guest.lastName || ""}`.toLowerCase();
        const matchesSearch =
          !q ||
          fullName.includes(q) ||
          (guest.phone && guest.phone.toLowerCase().includes(q)) ||
          (guest.email && guest.email.toLowerCase().includes(q));
        const matchesStatus =
          statusFilter === "all" || guest.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        `${a.firstName || ""} ${a.lastName || ""}`.localeCompare(
          `${b.firstName || ""} ${b.lastName || ""}`,
          "bg"
        )
      );
  }, [guestMembers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE);
  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGuests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGuests, currentPage]);

  const handleRequestDeleteGuest = (
    e: React.MouseEvent,
    id: string,
    name: string
  ) => {
    e.stopPropagation();
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }
    setDeleteTarget({ id, name });
  };

  const confirmDeleteGuest = async () => {
    if (!deleteTarget || !idToken) return;

    const { id } = deleteTarget;
    const previousMembers = members;
    setIsDeleting(true);
    setMembers((prev) => prev.filter((m) => m.id !== id));

    try {
      const result = await deleteMemberAction(id, idToken);
      if (result.success) {
        toast.success("Гостът е изтрит успешно");
        setDeleteTarget(null);
        router.refresh();
      } else {
        setMembers(previousMembers);
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Delete guest error:", error);
      setMembers(previousMembers);
      toast.error("Възникна сървърна грешка");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Информационна лента */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
            <div className="shrink-0 rounded-xl bg-amber-500/10 p-2.5 text-amber-600 sm:p-3 dark:text-amber-400">
              <UserCog className="size-5" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase sm:text-[11px]">
                Външни клиенти
              </p>
              <p className="text-xl font-bold text-amber-600 sm:text-2xl tabular-nums dark:text-amber-400">
                {guestMembers.length}
              </p>
            </div>
          </BentoCard>

          <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="shrink-0 rounded-xl bg-zinc-100 p-2.5 text-zinc-600 sm:p-3 dark:bg-zinc-800 dark:text-zinc-300">
              <UserPlus className="size-5" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase sm:text-[11px]">
                Какво представляват Външните клиенти?
              </p>
              <p className="text-xs leading-relaxed font-light text-zinc-500">
                Това са лица, ползващи залата за свободни игри или събития, без
                да са картотекирани клубни членове. Имат собствени досиета и
                история на посещенията.
              </p>
            </div>
          </BentoCard>
        </div>

        {/* Списък с карти за гости */}
        <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-zinc-900">
            <div className="flex items-center gap-2.5">
              <UserCog className="size-4 text-amber-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Регистрирани Външни клиенти
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search
                  className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400"
                  strokeWidth={1.5}
                />
                <Input
                  placeholder="Име, телефон, имейл..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8.5 rounded-xl border-zinc-200/80 bg-zinc-50/60 pl-8.5 pr-7 text-xs shadow-none dark:border-zinc-800 dark:bg-zinc-900/60"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    aria-label="Изчисти търсенето"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val as "all" | "active" | "inactive");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  aria-label="Филтър по статус"
                  className="h-8.5 w-[130px] rounded-xl border-zinc-200/80 bg-zinc-50/60 text-xs shadow-none dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички</SelectItem>
                  <SelectItem value="active">Активни</SelectItem>
                  <SelectItem value="inactive">Неактивни</SelectItem>
                </SelectContent>
              </Select>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => router.push("/members/new?type=guest")}
                    className="h-8.5 rounded-xl bg-amber-500 px-3.5 text-[10px] font-semibold tracking-wider text-white uppercase shadow-none hover:bg-amber-600"
                  >
                    <UserPlus className="mr-1.5 size-3.5" /> Нов Гост
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  Регистрира нов външен клиент или гост без клубна такса.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {filteredGuests.length === 0 ? (
            <div className="p-12 text-center sm:p-16">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20">
                <UserCog className="size-7 text-amber-400" strokeWidth={1.5} />
              </div>
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Няма регистрирани външни клиенти
              </p>
              <p className="mx-auto max-w-sm text-xs leading-relaxed font-normal text-zinc-500">
                {guestMembers.length === 0
                  ? "Когато добавите външен клиент, неговият профил и история на посещенията ще се появят тук."
                  : "Няма гости, отговарящи на зададените критерии за търсене."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                {paginatedGuests.map((guest) => (
                  <Tooltip key={guest.id}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => router.push(`/members/${guest.id}`)}
                        className="group cursor-pointer rounded-2xl border border-zinc-100 bg-white p-4 transition-all duration-200 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-amber-900/50"
                      >
                        <div className="mb-3.5 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-semibold text-amber-600 transition-colors group-hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400">
                              {(guest.firstName || "")[0]}
                              {(guest.lastName || "")[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900 transition-colors group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                                {guest.firstName} {guest.lastName}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-normal text-zinc-400">
                                {guest.phone ||
                                  guest.email ||
                                  "Няма въведен контакт"}
                              </p>
                            </div>
                          </div>
                          <Badge className="shrink-0 rounded-full border-none bg-amber-100 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-amber-800 uppercase shadow-none dark:bg-amber-950/40 dark:text-amber-400">
                            Гост
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-100/80 pt-2.5 text-zinc-400 dark:border-zinc-900">
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              className="size-3 text-zinc-400"
                              strokeWidth={1.5}
                            />
                            <span className="text-[9px] font-medium tracking-wider uppercase tabular-nums">
                              {guest.registrationDate
                                ? new Date(
                                    guest.registrationDate
                                  ).toLocaleDateString("bg-BG")
                                : "—"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) =>
                              handleRequestDeleteGuest(
                                e,
                                guest.id,
                                `${guest.firstName} ${guest.lastName}`
                              )
                            }
                            aria-label={`Изтрий ${guest.firstName} ${guest.lastName}`}
                            className="size-7 rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="size-3.5" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Кликнете за отваряне на досието на госта.
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-2.5 border-t border-zinc-100/80 bg-zinc-50/40 p-3 sm:flex-row sm:p-4 dark:border-zinc-900 dark:bg-zinc-900/40">
                  <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase sm:text-[11px] dark:text-zinc-400">
                    Показани{" "}
                    <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredGuests.length
                      )}
                    </span>{" "}
                    от{" "}
                    <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                      {filteredGuests.length}
                    </span>{" "}
                    гости
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Предишна страница"
                      className="size-8 rounded-lg border-zinc-200 bg-white p-0 shadow-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <div className="min-w-14 rounded-lg border border-zinc-200/80 bg-white px-2.5 py-1 text-center text-[10px] font-bold tracking-wider uppercase dark:border-zinc-800 dark:bg-zinc-800">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      aria-label="Следваща страница"
                      className="size-8 rounded-lg border-zinc-200 bg-white p-0 shadow-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </BentoCard>
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на гост</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете гост{" "}
              <strong>{deleteTarget?.name}</strong>? Това действие е необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteGuest();
              }}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600"
            >
              {isDeleting ? "Изтриване..." : "Изтрий"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
