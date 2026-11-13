"use client";

import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { isRecoveryProfile } from "@/components/members/list/member-list-sections";
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
import { useAuth } from "@/context/auth-context";
import { deleteMemberAction } from "@/lib/actions/members";
import { Member } from "@/types";

const ITEMS_PER_PAGE = 12;

interface RecoveryClientsListProps {
  members?: Member[];
}

export function RecoveryClientsList({
  members = [],
}: RecoveryClientsListProps) {
  const router = useRouter();
  const { idToken } = useAuth();
  const [localMembers, setLocalMembers] = useState<Member[]>(members);
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
    setLocalMembers(members);
  }, [members]);

  const recoveryClients = useMemo(
    () => localMembers.filter(isRecoveryProfile),
    [localMembers]
  );

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return recoveryClients
      .filter((client) => {
        const fullName =
          `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase();
        const matchesSearch =
          !q ||
          fullName.includes(q) ||
          (client.phone && client.phone.toLowerCase().includes(q)) ||
          (client.email && client.email.toLowerCase().includes(q));
        const matchesStatus =
          statusFilter === "all" || client.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        `${a.firstName || ""} ${a.lastName || ""}`.localeCompare(
          `${b.firstName || ""} ${b.lastName || ""}`,
          "bg"
        )
      );
  }, [recoveryClients, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, currentPage]);

  const handleRequestDeleteMember = (
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

  const confirmDeleteMember = async () => {
    if (!deleteTarget || !idToken) return;

    const { id } = deleteTarget;
    const previousMembers = localMembers;
    setIsDeleting(true);
    setLocalMembers((prev) => prev.filter((m) => m.id !== id));

    try {
      const result = await deleteMemberAction(id, idToken);
      if (result.success) {
        toast.success("Клиентът е изтрит");
        setDeleteTarget(null);
        router.refresh();
      } else {
        setLocalMembers(previousMembers);
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setLocalMembers(previousMembers);
      toast.error("Възникна сървърна грешка");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in sm:space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none sm:p-4.5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="shrink-0 rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
            <Activity className="size-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
              Клиенти на зоната
            </p>
            <p className="text-xl font-light text-indigo-600 sm:text-2xl dark:text-indigo-400">
              {recoveryClients.length}
            </p>
          </div>
        </BentoCard>
        <BentoCard className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none sm:col-span-2 sm:p-4.5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="shrink-0 rounded-xl bg-zinc-100 p-3 text-zinc-500 dark:bg-zinc-800">
            <FileText className="size-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
              Относно Клиенти Възстановяване
            </p>
            <p className="text-xs leading-relaxed font-light text-zinc-500">
              Това са клиенти, които имат профил във Възстановителната зона. Те
              могат да бъдат и външни лица, и клубни членове. Тук се съхранява
              тяхното досие със здравна информация и история на процедурите.
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Cards List */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4 dark:border-zinc-900">
          <div className="flex items-center gap-2.5">
            <Activity className="size-4 text-indigo-500" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Регистрирани Клиенти
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

            <Button
              onClick={() => router.push("/members/new?type=recovery")}
              className="h-8.5 rounded-xl bg-indigo-500 px-3.5 text-[10px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-indigo-600"
            >
              <Plus className="mr-1.5 size-3.5" /> Нов Клиент
            </Button>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20">
              <Activity className="size-6 text-indigo-300" strokeWidth={1} />
            </div>
            <p className="mb-2 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Няма регистрирани клиенти
            </p>
            <p className="mx-auto max-w-sm text-xs leading-relaxed font-light text-zinc-400">
              {recoveryClients.length === 0
                ? "Все още няма добавени клиенти за зоната. Използвайте бутона горе, за да създадете първия профил."
                : "Няма клиенти, отговарящи на зададените критерии за търсене."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 rounded-b-2xl bg-zinc-50/50 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 dark:bg-zinc-950/50">
              {paginatedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/members/${client.id}`)}
                  className="group cursor-pointer rounded-3xl border border-zinc-100 bg-white p-5 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-medium text-indigo-600 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400">
                        {(client.firstName || "")[0]}
                        {(client.lastName || "")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="mt-0.5 text-[10px] font-light text-zinc-400">
                          {client.phone || client.email || "Няма контакти"}
                        </p>
                      </div>
                    </div>
                    <Badge className="shrink-0 rounded-full border-none bg-indigo-100 px-2.5 py-0.5 text-[9px] font-semibold tracking-widest text-indigo-700 uppercase shadow-none dark:bg-indigo-950/30 dark:text-indigo-400">
                      Зона
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 border-t border-zinc-50 pt-3 text-zinc-400 dark:border-zinc-800/50">
                    <Calendar
                      className="size-3 text-zinc-300 dark:text-zinc-600"
                      strokeWidth={1.5}
                    />
                    <span className="text-[9px] font-medium tracking-widest uppercase">
                      {client.registrationDate
                        ? new Date(client.registrationDate).toLocaleDateString(
                            "bg-BG"
                          )
                        : "—"}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) =>
                          handleRequestDeleteMember(
                            e,
                            client.id,
                            `${client.firstName} ${client.lastName}`
                          )
                        }
                        aria-label={`Изтрий ${client.firstName} ${client.lastName}`}
                        className="size-7 rounded-lg text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                </div>
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
                      filteredClients.length
                    )}
                  </span>{" "}
                  от{" "}
                  <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                    {filteredClients.length}
                  </span>{" "}
                  клиенти
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
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на клиент</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете клиент{" "}
              <strong>{deleteTarget?.name}</strong>? Това действие е необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteMember();
              }}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600"
            >
              {isDeleting ? "Изтриване..." : "Изтрий"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
