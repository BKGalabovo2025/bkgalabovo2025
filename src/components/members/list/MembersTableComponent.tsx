"use client";

import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MoreVertical,
  Search,
  Trash2,
  Users,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
}

export function MembersTableComponent({
  initialMembers,
  showCategoryBadge = false,
  emptyMessage = "Няма намерени членове",
  exportFileName = "members_list.csv",
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

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  // Нулиране на страницата при промяна на търсене или статус
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

    const previousMembers = members;
    setMembers((prev) =>
      prev.map((m) => (selectedIds.includes(m.id) ? { ...m, status } : m))
    );
    setSelectedIds([]);

    try {
      const result = await bulkUpdateMemberStatusAction(
        selectedIds,
        status,
        idToken
      );
      if (result.success) {
        toast.success(
          result.message || `Успешно обновени ${selectedIds.length} членове`
        );
        router.refresh();
      } else {
        setMembers(previousMembers);
        toast.error(result.message || "Възникна грешка при обновяването");
      }
    } catch (e: unknown) {
      console.error(e);
      setMembers(previousMembers);
      toast.error("Възникна сървърна грешка");
    }
  };

  const handleExport = () => {
    const dataToExport = filteredMembers.map((m) => {
      let category = "Клубен";
      if (m.isGuest || m.memberType === "guest") category = "Гост";
      else if (m.isRecoveryMember || m.memberType === "recovery")
        category = "Възстановяване";

      return {
        Име: `${m.firstName} ${m.lastName}`,
        Имейл: m.email || "—",
        Категория: category,
        Група: m.ageGroup || (m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "—"),
        Статус: m.status === "active" ? "Активен" : "Неактивен",
        Регистрация: new Date(m.registrationDate).toLocaleDateString("bg-BG"),
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
        toast.success("Членът е изтрит");
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
    <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none dark:border-zinc-800 dark:bg-zinc-950">
      {/* Търсене, филтри, експорт и масови действия */}
      <div className="border-b border-zinc-100 p-3 sm:p-4 dark:border-zinc-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex w-full flex-1 items-center gap-2.5 sm:w-auto">
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search
                className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400"
                strokeWidth={1.5}
              />
              <Input
                placeholder="Търсене по име или имейл..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 rounded-xl border-zinc-100 bg-zinc-50/50 pl-8.5 text-xs font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
              />
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-2.5 py-1 animate-in fade-in slide-in-from-left-4 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-[10px] font-medium tracking-widest whitespace-nowrap text-primary uppercase">
                  {selectedIds.length} избрани
                </span>
                <div className="mx-1 h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 rounded-lg px-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <MoreVertical size={13} className="text-zinc-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="rounded-xl border-zinc-100 p-1.5 shadow-xl"
                  >
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusUpdate("active")}
                      className="flex items-center gap-2 rounded-lg text-[10px] font-medium tracking-widest text-emerald-600 uppercase focus:text-emerald-700"
                    >
                      <CheckCircle size={14} strokeWidth={1.5} /> Активирай
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleBulkStatusUpdate("inactive")}
                      className="flex items-center gap-2 rounded-lg text-[10px] font-medium tracking-widest text-zinc-500 uppercase"
                    >
                      <XCircle size={14} strokeWidth={1.5} /> Деактивирай
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 rounded-xl border-zinc-200 px-3 text-[10px] font-medium tracking-wider uppercase hover:bg-zinc-50 dark:border-zinc-800"
            >
              <Download className="mr-1.5 size-3.5" /> Експорт
            </Button>

            <div className="flex shrink-0 items-center rounded-xl bg-zinc-50 p-1 dark:bg-zinc-900">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "rounded-lg px-3 py-1 text-[9px] font-semibold tracking-wider whitespace-nowrap uppercase transition-all sm:text-[10px]",
                    statusFilter === f
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {
                    {
                      all: "Всички",
                      active: "Активни",
                      inactive: "Неактивни",
                    }[f]
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="custom-scrollbar hidden w-full min-w-0 overflow-x-auto md:block">
        <Table className="w-full">
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="border-zinc-100 hover:bg-transparent dark:border-zinc-900">
              <TableHead className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedMembers.length &&
                    paginatedMembers.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  className="rounded-md border-zinc-200"
                />
              </TableHead>
              <TableHead className="min-w-52 px-3 py-2.5 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                Член
              </TableHead>
              <TableHead className="px-3 py-2.5 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                Контакт
              </TableHead>
              <TableHead className="w-32 px-3 py-2.5 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                {showCategoryBadge ? "Категория / Група" : "Група"}
              </TableHead>
              <TableHead className="hidden w-32 px-3 py-2.5 text-[10px] font-medium tracking-widest text-zinc-400 uppercase lg:table-cell">
                Регистрация
              </TableHead>
              <TableHead className="w-28 px-4 py-2.5 text-right text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                Статус
              </TableHead>
              <TableHead className="w-12 px-2 py-2.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => {
                const ageGrp =
                  member.ageGroup ||
                  (member.dateOfBirth ? getAgeGroup(member.dateOfBirth) : null);

                return (
                  <TableRow
                    key={member.id}
                    className={cn(
                      "group cursor-pointer border-zinc-50 transition-colors hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/50",
                      selectedIds.includes(member.id) && "bg-primary/5"
                    )}
                  >
                    <TableCell
                      className="px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.includes(member.id)}
                        onCheckedChange={() => toggleSelect(member.id)}
                        className="rounded-md border-zinc-200"
                      />
                    </TableCell>
                    <TableCell
                      className="px-3 py-2"
                      onClick={() => router.push(`/members/${member.id}`)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7.5 shrink-0 rounded-lg border border-zinc-100 dark:border-zinc-800">
                          <AvatarImage
                            src={getValidAvatarUrl(member.avatarUrl)}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="object-cover"
                          />
                          <AvatarFallback className="flex items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-medium text-zinc-600 transition-all duration-300 group-hover:bg-zinc-950 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
                            {(member.firstName || "")[0]}
                            {(member.lastName || "")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-xs whitespace-nowrap text-zinc-900 transition-colors group-hover:text-primary sm:text-[13px] dark:text-white">
                          {member.firstName} {member.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="px-3 py-2"
                      onClick={() => router.push(`/members/${member.id}`)}
                    >
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Mail
                          className="size-3 shrink-0 text-zinc-300"
                          strokeWidth={1.5}
                        />
                        <span className="max-w-[150px] truncate text-[11px] font-light">
                          {member.email || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="px-3 py-2"
                      onClick={() => router.push(`/members/${member.id}`)}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {showCategoryBadge && getMemberCategoryBadge(member)}
                        {ageGrp && (
                          <Badge
                            variant="outline"
                            className="h-5 rounded-lg border-zinc-100 bg-transparent px-2 py-0 text-[9px] font-medium tracking-widest uppercase dark:border-zinc-800"
                          >
                            {ageGrp}
                          </Badge>
                        )}
                        {!ageGrp && !showCategoryBadge && (
                          <span className="text-[11px] text-zinc-300">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="hidden px-3 py-2 lg:table-cell"
                      onClick={() => router.push(`/members/${member.id}`)}
                    >
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Calendar
                          className="size-3 text-zinc-300"
                          strokeWidth={1.5}
                        />
                        <span className="text-[10px] font-medium tracking-widest uppercase">
                          {member.registrationDate
                            ? new Date(
                                member.registrationDate
                              ).toLocaleDateString("bg-BG")
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="px-4 py-2 text-right"
                      onClick={() => router.push(`/members/${member.id}`)}
                    >
                      <Badge
                        className={cn(
                          "rounded-full border-none px-2 py-0.5 text-[9px] font-semibold tracking-widest uppercase shadow-none",
                          member.status === "active"
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {member.status === "active" ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-2 text-right">
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
                        className="size-7 rounded-lg text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.5} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <Users
                      className="mb-2 size-10 opacity-20"
                      strokeWidth={1}
                    />
                    <p className="text-base font-light tracking-[0.2em] text-zinc-900 uppercase dark:text-white">
                      {emptyMessage}
                    </p>
                    <p className="mt-1 text-[10px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
                      Опитайте с друго име или променете филтъра.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
      <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
        {paginatedMembers.length > 0 ? (
          paginatedMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => router.push(`/members/${member.id}`)}
              className={cn(
                "p-3 sm:p-3.5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900",
                selectedIds.includes(member.id) && "bg-primary/5"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
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
                      className="rounded-md border-zinc-200"
                    />
                  </div>
                  <Avatar className="size-8.5 shrink-0 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <AvatarImage
                      src={getValidAvatarUrl(member.avatarUrl)}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="flex items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {(member.firstName || "")[0]}
                      {(member.lastName || "")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-900 wrap-break-word dark:text-white">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-zinc-500">
                      <Mail
                        className="size-3 shrink-0 text-zinc-300"
                        strokeWidth={1.5}
                      />
                      <span className="truncate text-[10px] font-light">
                        {member.email || "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge
                    className={cn(
                      "rounded-full border-none px-2 py-0.5 text-[9px] font-semibold tracking-widest uppercase shadow-none",
                      member.status === "active"
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {member.status === "active" ? "Активен" : "Неактивен"}
                  </Badge>
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
                    className="size-7 rounded-lg text-zinc-300 transition-colors hover:text-rose-500"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-50 pt-2 dark:border-zinc-900">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <Calendar
                    className="size-3 text-zinc-300"
                    strokeWidth={1.5}
                  />
                  <span className="text-[9px] font-medium tracking-widest uppercase">
                    {member.registrationDate
                      ? new Date(member.registrationDate).toLocaleDateString(
                          "bg-BG"
                        )
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {showCategoryBadge && getMemberCategoryBadge(member)}
                  {(member.ageGroup || member.dateOfBirth) && (
                    <Badge
                      variant="outline"
                      className="h-4.5 rounded-lg border-zinc-100 bg-transparent px-2 py-0 text-[9px] font-medium tracking-widest uppercase dark:border-zinc-800"
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
              className="mx-auto mb-2 size-10 text-zinc-400 opacity-20"
              strokeWidth={1}
            />
            <p className="text-xs font-medium tracking-widest text-zinc-900 uppercase dark:text-white">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-2.5 border-t border-zinc-50 bg-zinc-50/50 p-2.5 sm:flex-row sm:p-3.5 dark:border-zinc-900 dark:bg-zinc-900/50">
          <p className="order-2 text-[10px] font-medium tracking-widest text-zinc-600 uppercase sm:order-1 sm:text-[11px] dark:text-zinc-400">
            Показани{" "}
            <span className="text-zinc-900 dark:text-white">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            -{" "}
            <span className="text-zinc-900 dark:text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)}
            </span>{" "}
            от{" "}
            <span className="text-zinc-900 dark:text-white">
              {filteredMembers.length}
            </span>
          </p>
          <div className="order-1 flex w-full items-center justify-between gap-2 sm:order-2 sm:w-auto sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Предишна страница"
              className="size-8.5 rounded-lg border-zinc-100 bg-white p-0 shadow-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <div className="min-w-15 rounded-lg border border-zinc-100 bg-white px-3 py-1.5 text-center text-[10px] font-semibold tracking-widest uppercase shadow-none dark:border-zinc-700 dark:bg-zinc-800">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Следваща страница"
              className="size-8.5 rounded-lg border-zinc-100 bg-white p-0 shadow-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </BentoCard>
  );
}
