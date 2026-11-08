"use client";

import {
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Link2,
  Mail,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import {
  bulkUpdateMemberStatusAction,
  deleteMemberAction,
} from "@/lib/actions/members";
import { exportToCSV } from "@/lib/export-utils";
import { cn, getAgeGroup, getValidAvatarUrl } from "@/lib/utils";
import { Member } from "@/types";

const ITEMS_PER_PAGE = 12;

interface MembersTableComponentProps {
  initialMembers: Member[];
  showCategoryBadge?: boolean;
  emptyMessage?: string;
  exportFileName?: string;
  kpiTitle?: string;
}

export function MembersTableComponent({
  initialMembers,
  showCategoryBadge = false,
  emptyMessage = "Няма намерени членове",
  exportFileName = "members_list.csv",
  kpiTitle = "Всички профили",
}: MembersTableComponentProps) {
  const router = useRouter();
  const { idToken } = useAuth();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  // Нулиране на страницата при промяна на търсене или статус
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Статистика за интерактивните KPI карти
  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m) => m.status === "active").length,
      inactive: members.filter((m) => m.status === "inactive").length,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members
      .filter((member) => {
        const fullName =
          `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          (member.email &&
            member.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          statusFilter === "all" || member.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const nameA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
        const nameB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
        return nameA.localeCompare(nameB, "bg");
      });
  }, [members, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  useDeepLinkHighlight("member", paginatedMembers.length > 0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyMemberLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiedId(id);
        toast.success("Директният линк към състезателя е копиран!");
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => toast.info(`Линк: ${url}`));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedMembers.map((m) => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (status: "active" | "inactive") => {
    if (selectedIds.length === 0 || !idToken) return;

    setIsUpdatingStatus(true);
    const previousMembers = members;
    setMembers((prev) =>
      prev.map((m) => (selectedIds.includes(m.id) ? { ...m, status } : m))
    );

    try {
      const result = await bulkUpdateMemberStatusAction(
        selectedIds,
        status,
        idToken
      );
      if (result.success) {
        toast.success(
          result.message ||
            `Успешно ${status === "active" ? "активирани" : "деактивирани"} ${selectedIds.length} профила`
        );
        setSelectedIds([]);
        router.refresh();
      } else {
        setMembers(previousMembers);
        toast.error(result.message || "Възникна грешка при обновяването");
      }
    } catch (e: unknown) {
      console.error(e);
      setMembers(previousMembers);
      toast.error("Възникна сървърна грешка");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredMembers.map((m) => {
      let category = "Клубен";
      if (m.isGuest || m.memberType === "guest") category = "Гост";
      else if (m.isRecoveryMember || m.memberType === "recovery")
        category = "Възстановяване";

      return {
        Име: `${m.firstName || ""} ${m.lastName || ""}`.trim(),
        Имейл: m.email || "—",
        Категория: category,
        Група: m.ageGroup || (m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "—"),
        Статус: m.status === "active" ? "Активен" : "Неактивен",
        Регистрация: m.registrationDate
          ? new Date(m.registrationDate).toLocaleDateString("bg-BG")
          : "—",
      };
    });
    exportToCSV(dataToExport, exportFileName);
    toast.success("Данните са експортирани успешно");
  };

  const handleDeleteMember = async (
    e: React.MouseEvent,
    id: string,
    name: string
  ) => {
    e.stopPropagation();
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }

    if (
      !confirm(
        `Наистина ли искате да изтриете ${name}? Това действие е необратимо.`
      )
    )
      return;

    const previousMembers = members;
    setMembers((prev) => prev.filter((m) => m.id !== id));

    try {
      const result = await deleteMemberAction(id, idToken);
      if (result.success) {
        toast.success("Членът е изтрит успешно");
        router.refresh();
      } else {
        setMembers(previousMembers);
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMembers(previousMembers);
      toast.error("Възникна сървърна грешка");
    }
  };

  const getMemberCategoryBadge = (member: Member) => {
    if (member.isGuest || member.memberType === "guest") {
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-[9px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
        >
          Гост
        </Badge>
      );
    }
    if (member.isRecoveryMember || member.memberType === "recovery") {
      return (
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 text-[9px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
        >
          Възстановяване
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-zinc-200 bg-zinc-50 text-[9px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
      >
        Клубен
      </Badge>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3.5">
        {/* 1. Интерактивни KPI карти (Филтрират с 1 клик и заменят дублиращите се бутони) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Карта: Всички */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-2xl border p-2.5 sm:p-3.5 text-left transition-all duration-200 outline-none",
                  statusFilter === "all"
                    ? "border-zinc-950 bg-white ring-2 ring-zinc-950/10 shadow-xs dark:border-white dark:bg-zinc-900 dark:ring-white/10"
                    : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                )}
              >
                <div className="shrink-0 rounded-xl bg-zinc-100 p-2 text-zinc-900 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white">
                  <Users className="size-4 sm:size-4.5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold tracking-wider text-zinc-500 uppercase sm:text-[11px] dark:text-zinc-400">
                    {kpiTitle}
                  </p>
                  <p className="text-lg font-bold text-zinc-900 sm:text-2xl dark:text-white tabular-nums">
                    {stats.total}
                  </p>
                </div>
                {statusFilter === "all" && (
                  <span className="hidden sm:inline-block absolute top-2 right-2.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Активен
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Кликнете за показване на всички профили без филтър по статус.
            </TooltipContent>
          </Tooltip>

          {/* Карта: Активни */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-2xl border p-2.5 sm:p-3.5 text-left transition-all duration-200 outline-none",
                  statusFilter === "active"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/20"
                    : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                )}
              >
                <div className="shrink-0 rounded-xl bg-emerald-500/10 p-2 text-emerald-600 transition-colors group-hover:bg-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <UserCheck className="size-4 sm:size-4.5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold tracking-wider text-zinc-500 uppercase sm:text-[11px] dark:text-zinc-400">
                    Активни
                  </p>
                  <p className="text-lg font-bold text-emerald-600 sm:text-2xl tabular-nums">
                    {stats.active}
                  </p>
                </div>
                {statusFilter === "active" && (
                  <span className="hidden sm:inline-block absolute top-2 right-2.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                    Филтър
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Кликнете за филтриране само на активните членове с валидни карти.
            </TooltipContent>
          </Tooltip>

          {/* Карта: Неактивни */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-2xl border p-2.5 sm:p-3.5 text-left transition-all duration-200 outline-none",
                  statusFilter === "inactive"
                    ? "border-rose-600 bg-rose-50/40 ring-2 ring-rose-500/20 shadow-xs dark:border-rose-500 dark:bg-rose-950/20"
                    : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                )}
              >
                <div className="shrink-0 rounded-xl bg-rose-500/10 p-2 text-rose-600 transition-colors group-hover:bg-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400">
                  <UserMinus className="size-4 sm:size-4.5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold tracking-wider text-zinc-500 uppercase sm:text-[11px] dark:text-zinc-400">
                    Неактивни
                  </p>
                  <p className="text-lg font-bold text-rose-600 sm:text-2xl tabular-nums">
                    {stats.inactive}
                  </p>
                </div>
                {statusFilter === "inactive" && (
                  <span className="hidden sm:inline-block absolute top-2 right-2.5 text-[9px] font-bold text-rose-600 uppercase tracking-widest">
                    Филтър
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Кликнете за преглед само на неактивните профили с изтекли
              абонаменти.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 2. Bento Картодържач с Toolbar и Таблица */}
        <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          {/* Контролен бар: Търсене, Експорт и Плаващи масови действия */}
          <div className="border-b border-zinc-100 p-3 sm:p-4 dark:border-zinc-900">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              {/* Поле за търсене с бутон за изчистване */}
              <div className="flex w-full flex-1 items-center gap-2 sm:w-auto">
                <div className="relative w-full sm:w-72 lg:w-80">
                  <Search
                    className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400"
                    strokeWidth={1.5}
                  />
                  <Input
                    placeholder="Търсене по име или имейл..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 rounded-xl border-zinc-200/80 bg-zinc-50/60 pl-8.5 pr-8 text-xs font-normal shadow-none transition-all focus-visible:bg-white focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/60 dark:focus-visible:bg-zinc-900"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      aria-label="Изчисти търсенето"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Действия вдясно: Бутон за експорт */}
              <div className="flex shrink-0 items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="h-9 rounded-xl border-zinc-200 px-3 text-[11px] font-medium tracking-wider uppercase hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      <Download className="mr-1.5 size-3.5 text-zinc-500" />
                      <span>Експорт CSV</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                    Изтегля текущия филтриран списък като Excel / CSV файл.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* 3. Плаваща/Инлайн лента за масови действия при маркирани редове */}
            {selectedIds.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-900/10 bg-zinc-900 p-2 text-white shadow-lg animate-in fade-in slide-in-from-top-2 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-950">
                <div className="flex items-center gap-2 px-2 text-xs font-medium">
                  <Check className="size-4 text-emerald-400 dark:text-emerald-600" />
                  <span>
                    Избрани <strong>{selectedIds.length}</strong> от{" "}
                    {paginatedMembers.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleBulkStatusUpdate("active")}
                        className="h-7.5 rounded-lg bg-emerald-600 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-emerald-500"
                      >
                        <CheckCircle className="mr-1 size-3" />
                        Активирай
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Задава статус „Активен“ на всички маркирани профили.
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleBulkStatusUpdate("inactive")}
                        className="h-7.5 rounded-lg bg-zinc-800 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300 hover:bg-rose-950/60 dark:bg-zinc-200 dark:text-rose-700"
                      >
                        <XCircle className="mr-1 size-3" />
                        Деактивирай
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Задава статус „Неактивен“ на всички маркирани профили.
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds([])}
                        className="h-7.5 rounded-lg px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-400 hover:bg-zinc-800 hover:text-white dark:hover:bg-zinc-200"
                      >
                        Отказ
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Изчиства маркирането.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>

          {/* 4. Desktop View: High-Density Table на 100% мащаб */}
          <div className="custom-scrollbar hidden w-full min-w-0 overflow-x-auto md:block">
            <Table className="w-full">
              <TableHeader className="bg-zinc-50/60 dark:bg-zinc-900/60">
                <TableRow className="border-zinc-100 hover:bg-transparent dark:border-zinc-900">
                  <TableHead className="w-10 px-3 py-2.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <Checkbox
                            checked={
                              selectedIds.length === paginatedMembers.length &&
                              paginatedMembers.length > 0
                            }
                            onCheckedChange={toggleSelectAll}
                            className="rounded-md border-zinc-300"
                            aria-label="Избери всички на текущата страница"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Избира всички редове на тази страница.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="min-w-52 px-3 py-2.5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Член / Име
                  </TableHead>
                  <TableHead className="px-3 py-2.5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Контакт (Имейл)
                  </TableHead>
                  <TableHead className="w-36 px-3 py-2.5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    {showCategoryBadge
                      ? "Категория & Възраст"
                      : "Възрастова група"}
                  </TableHead>
                  <TableHead className="hidden w-32 px-3 py-2.5 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase lg:table-cell">
                    Регистрация
                  </TableHead>
                  <TableHead className="w-28 px-4 py-2.5 text-right text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Статус
                  </TableHead>
                  <TableHead className="w-12 px-2 py-2.5 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.length > 0 ? (
                  paginatedMembers.map((member) => {
                    const ageGrp =
                      member.ageGroup ||
                      (member.dateOfBirth
                        ? getAgeGroup(member.dateOfBirth)
                        : null);

                    return (
                      <TableRow
                        key={member.id}
                        id={`member-${member.id}`}
                        className={cn(
                          "group cursor-pointer border-zinc-100/80 transition-colors hover:bg-zinc-50/70 dark:border-zinc-900 dark:hover:bg-zinc-900/60",
                          selectedIds.includes(member.id) &&
                            "bg-primary/5 dark:bg-primary/10"
                        )}
                        onClick={() => router.push(`/members/${member.id}`)}
                      >
                        <TableCell
                          className="px-3 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.includes(member.id)}
                            onCheckedChange={() => toggleSelect(member.id)}
                            className="rounded-md border-zinc-300"
                            aria-label={`Избери ${member.firstName} ${member.lastName}`}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="size-8 shrink-0 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                                  <AvatarImage
                                    src={getValidAvatarUrl(member.avatarUrl)}
                                    alt={`${member.firstName} ${member.lastName}`}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="flex items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-semibold text-zinc-600 transition-all duration-300 group-hover:bg-zinc-950 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
                                    {(member.firstName || "")[0]}
                                    {(member.lastName || "")[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-xs whitespace-nowrap text-zinc-900 transition-colors group-hover:text-primary sm:text-[13px] dark:text-white">
                                  {member.firstName} {member.lastName}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">
                              Кликнете за отваряне на пълното досие на
                              състезателя.
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Mail
                              className="size-3 shrink-0 text-zinc-400"
                              strokeWidth={1.5}
                            />
                            <span className="max-w-[170px] truncate text-[11px] font-normal">
                              {member.email || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {showCategoryBadge &&
                              getMemberCategoryBadge(member)}
                            {ageGrp && (
                              <Badge
                                variant="outline"
                                className="h-5 rounded-lg border-zinc-200/80 bg-zinc-50/50 px-2 py-0 text-[9px] font-medium tracking-wider uppercase dark:border-zinc-800 dark:bg-zinc-900/50"
                              >
                                {ageGrp}
                              </Badge>
                            )}
                            {!ageGrp && !showCategoryBadge && (
                              <span className="text-[11px] text-zinc-400">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden px-3 py-2 lg:table-cell">
                          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                            <Calendar
                              className="size-3 text-zinc-400"
                              strokeWidth={1.5}
                            />
                            <span className="text-[10px] font-medium tracking-wider uppercase tabular-nums">
                              {member.registrationDate
                                ? new Date(
                                    member.registrationDate
                                  ).toLocaleDateString("bg-BG")
                                : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-right">
                          <Badge
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border-none px-2.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase shadow-none",
                              member.status === "active"
                                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                member.status === "active"
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-zinc-400"
                              )}
                            />
                            {member.status === "active"
                              ? "Активен"
                              : "Неактивен"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="p-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) =>
                                    handleCopyMemberLink(e, member.id)
                                  }
                                  aria-label={`Копирай линк за ${member.firstName} ${member.lastName}`}
                                  className="size-7.5 rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                >
                                  {copiedId === member.id ? (
                                    <Check
                                      className="size-3.5 text-emerald-600"
                                      strokeWidth={1.5}
                                    />
                                  ) : (
                                    <Link2
                                      className="size-3.5"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">
                                Копирай директен линк към този ред в регистъра.
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) =>
                                    handleDeleteMember(
                                      e,
                                      member.id,
                                      `${member.firstName} ${member.lastName}`
                                    )
                                  }
                                  aria-label={`Изтрий ${member.firstName} ${member.lastName}`}
                                  className="size-7.5 rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2
                                    className="size-3.5"
                                    strokeWidth={1.5}
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-xs">
                                Изтрива записа след потвърждение.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center text-zinc-400">
                        <Users
                          className="mb-2 size-8 opacity-25"
                          strokeWidth={1.5}
                        />
                        <p className="text-sm font-semibold tracking-wider text-zinc-800 uppercase dark:text-zinc-200">
                          {emptyMessage}
                        </p>
                        <p className="mt-0.5 text-[11px] font-normal text-zinc-500">
                          Опитайте с друго име или изберете друг филтър от
                          горните карти.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 5. Mobile View: Touch-first Cards */}
          <div className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-900">
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => (
                <div
                  key={member.id}
                  id={`member-${member.id}`}
                  onClick={() => router.push(`/members/${member.id}`)}
                  className={cn(
                    "p-3.5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900",
                    selectedIds.includes(member.id) && "bg-primary/5"
                  )}
                >
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(member.id);
                        }}
                        className="mr-0.5 shrink-0"
                      >
                        <Checkbox
                          checked={selectedIds.includes(member.id)}
                          onCheckedChange={() => toggleSelect(member.id)}
                          className="rounded-md border-zinc-300"
                          aria-label={`Избери ${member.firstName} ${member.lastName}`}
                        />
                      </div>
                      <Avatar className="size-8.5 shrink-0 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <AvatarImage
                          src={getValidAvatarUrl(member.avatarUrl)}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="flex items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {(member.firstName || "")[0]}
                          {(member.lastName || "")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-900 truncate dark:text-white">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-zinc-500">
                          <Mail
                            className="size-3 shrink-0 text-zinc-400"
                            strokeWidth={1.5}
                          />
                          <span className="truncate text-[10px] font-normal">
                            {member.email || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        className={cn(
                          "rounded-full border-none px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase shadow-none",
                          member.status === "active"
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {member.status === "active" ? "Активен" : "Неактивен"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleCopyMemberLink(e, member.id)}
                        aria-label={`Копирай линк за ${member.firstName} ${member.lastName}`}
                        className="size-7 rounded-lg text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        {copiedId === member.id ? (
                          <Check
                            className="size-3.5 text-emerald-600"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Link2 className="size-3.5" strokeWidth={1.5} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) =>
                          handleDeleteMember(
                            e,
                            member.id,
                            `${member.firstName} ${member.lastName}`
                          )
                        }
                        aria-label={`Изтрий ${member.firstName} ${member.lastName}`}
                        className="size-7 rounded-lg text-zinc-400 transition-colors hover:text-rose-500"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-100/80 pt-2 dark:border-zinc-900">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Calendar
                        className="size-3 text-zinc-400"
                        strokeWidth={1.5}
                      />
                      <span className="text-[9px] font-medium tracking-wider uppercase tabular-nums">
                        {member.registrationDate
                          ? new Date(
                              member.registrationDate
                            ).toLocaleDateString("bg-BG")
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {showCategoryBadge && getMemberCategoryBadge(member)}
                      {(member.ageGroup || member.dateOfBirth) && (
                        <Badge
                          variant="outline"
                          className="h-4.5 rounded-lg border-zinc-200/80 bg-transparent px-2 py-0 text-[9px] font-medium tracking-wider uppercase dark:border-zinc-800"
                        >
                          {member.ageGroup || getAgeGroup(member.dateOfBirth!)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users
                  className="mx-auto mb-2 size-8 text-zinc-400 opacity-20"
                  strokeWidth={1.5}
                />
                <p className="text-xs font-semibold tracking-wider text-zinc-800 uppercase dark:text-zinc-200">
                  {emptyMessage}
                </p>
              </div>
            )}
          </div>

          {/* 6. Пагинация с индикатор за брой записи */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-2.5 border-t border-zinc-100/80 bg-zinc-50/40 p-2.5 sm:flex-row sm:p-3.5 dark:border-zinc-900 dark:bg-zinc-900/40">
              <p className="order-2 text-[10px] font-medium tracking-wider text-zinc-500 uppercase sm:order-1 sm:text-[11px] dark:text-zinc-400">
                Показани{" "}
                <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredMembers.length
                  )}
                </span>{" "}
                от{" "}
                <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
                  {filteredMembers.length}
                </span>{" "}
                профила
              </p>
              <div className="order-1 flex w-full items-center justify-between gap-2 sm:order-2 sm:w-auto sm:justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Предишна страница"
                      className="size-8.5 rounded-lg border-zinc-200 bg-white p-0 shadow-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Предишна страница
                  </TooltipContent>
                </Tooltip>

                <div className="min-w-15 rounded-lg border border-zinc-200/80 bg-white px-3 py-1.5 text-center text-[10px] font-bold tracking-wider uppercase shadow-none dark:border-zinc-800 dark:bg-zinc-800">
                  {currentPage} / {totalPages}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      aria-label="Следваща страница"
                      className="size-8.5 rounded-lg border-zinc-200 bg-white p-0 shadow-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Следваща страница
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </BentoCard>
      </div>
    </TooltipProvider>
  );
}
