"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  UserMinus,
  Mail,
  Calendar,
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-utils";
import { bulkUpdateMemberStatus } from "@/services/member-service";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 12;

import { Member } from "@/types";

interface MembersClientProps {
  initialMembers: Member[];
}

export default function MembersClient({ initialMembers }: MembersClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredMembers = useMemo(() => {
    return initialMembers.filter((member) => {
      const matchesSearch =
        `${member.firstName} ${member.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (member.email &&
          member.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [initialMembers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const stats = useMemo(() => {
    return {
      total: initialMembers.length,
      active: initialMembers.filter((m) => m.status === "active").length,
      inactive: initialMembers.filter((m) => m.status === "inactive").length,
    };
  }, [initialMembers]);

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
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateMemberStatus(selectedIds, status);
      toast.success(`Успешно обновени ${selectedIds.length} членове`);
      setSelectedIds([]);
      router.refresh();
    } catch {
      toast.error("Възникна грешка при обновяването");
    }
  };

  const handleExport = () => {
    const dataToExport = filteredMembers.map((m) => ({
      Име: `${m.firstName} ${m.lastName}`,
      Имейл: m.email || "—",
      Група: m.ageGroup || "—",
      Статус: m.status === "active" ? "Активен" : "Неактивен",
      Регистрация: new Date(m.registrationDate).toLocaleDateString("bg-BG"),
    }));
    exportToCSV(dataToExport, "members_list.csv");
    toast.success("Данните са експортирани успешно");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Членове на клуба"
        description="Управление на профили, членски карти и статуси на спортистите."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове" },
        ]}
      >
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-xl border-zinc-200 font-medium text-xs uppercase tracking-widest h-11 px-6 hover:bg-zinc-50"
          >
            <Download className="mr-2 h-4 w-4" /> Експорт
          </Button>
          <Button
            onClick={() => router.push("/members/new")}
            className="rounded-xl font-medium text-xs uppercase tracking-widest bg-primary text-white hover:bg-primary/90 h-11 px-6 shadow-none"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Нов член
          </Button>
        </div>
      </PageHeader>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <BentoCard className="p-8 flex items-center gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none">
          <div className="p-4 bg-primary/5 text-primary rounded-2xl">
            <Users className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.1em]">
              Общо членове
            </p>
            <p className="text-3xl font-light text-zinc-900 dark:text-white">
              {stats.total}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="p-8 flex items-center gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none">
          <div className="p-4 bg-emerald-500/5 text-emerald-600 rounded-2xl">
            <UserCheck className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.1em]">
              Активни
            </p>
            <p className="text-3xl font-light text-emerald-600">
              {stats.active}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="p-8 flex items-center gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none">
          <div className="p-4 bg-rose-500/5 text-rose-600 rounded-2xl">
            <UserMinus className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.1em]">
              Неактивни
            </p>
            <p className="text-3xl font-light text-rose-600">
              {stats.inactive}
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Main Table Bento */}
      <BentoCard className="overflow-hidden border border-zinc-100 dark:border-zinc-900 shadow-none bg-white dark:bg-zinc-950 rounded-2xl">
        <div className="p-8 border-b border-zinc-50 dark:border-zinc-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="relative w-full md:w-96">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                  strokeWidth={1.5}
                />
                <Input
                  placeholder="Търсене по име или имейл..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-none focus-visible:ring-primary h-12 text-sm font-light"
                />
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                  <span className="text-xs font-medium text-primary uppercase tracking-widest whitespace-nowrap">
                    {selectedIds.length} избрани
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-lg h-8 px-2"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="rounded-xl border-slate-100 p-2 shadow-xl"
                    >
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusUpdate("active")}
                        className="flex items-center gap-2 rounded-lg text-[10px] font-medium text-emerald-600 focus:text-emerald-700 uppercase tracking-widest"
                      >
                        <CheckCircle size={14} strokeWidth={1.5} /> Активирай
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusUpdate("inactive")}
                        className="flex items-center gap-2 rounded-lg text-[10px] font-medium text-zinc-500 uppercase tracking-widest"
                      >
                        <XCircle size={14} strokeWidth={1.5} /> Деактивирай
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              <div className="flex bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1">
                {(["all", "active", "inactive"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-4 py-2 text-[10px] font-medium uppercase tracking-widest rounded-lg transition-all",
                      statusFilter === f
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-600"
                    )}
                  >
                    {f === "all"
                      ? "Всички"
                      : f === "active"
                        ? "Активни"
                        : "Неактивни"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
              <TableHead className="w-12 px-8">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedMembers.length &&
                    paginatedMembers.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  className="rounded-md border-zinc-200"
                />
              </TableHead>
              <TableHead className="py-6 px-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Член
              </TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Контакт
              </TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Възраст
              </TableHead>
              <TableHead className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Регистрация
              </TableHead>
              <TableHead className="text-right px-8 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Статус
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className={cn(
                    "cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group border-zinc-50 dark:border-zinc-900",
                    selectedIds.includes(member.id) && "bg-primary/5"
                  )}
                >
                  <TableCell
                    className="px-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={() => toggleSelect(member.id)}
                      className="rounded-md border-zinc-200"
                    />
                  </TableCell>
                  <TableCell
                    className="py-6 px-4"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium text-xs group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </div>
                      <div className="font-medium text-sm text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                        {member.firstName} {member.lastName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span className="text-xs font-light">
                        {member.email || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    {member.ageGroup ? (
                      <Badge
                        variant="outline"
                        className="rounded-lg font-medium text-[10px] bg-transparent border-zinc-200 uppercase tracking-widest px-3"
                      >
                        {member.ageGroup}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span className="text-[10px] font-medium uppercase tracking-widest">
                        {new Date(member.registrationDate).toLocaleDateString(
                          "bg-BG"
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-right px-8"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <Badge
                      className={cn(
                        "rounded-lg px-3 py-1 text-[10px] font-medium uppercase tracking-widest border-none shadow-none",
                        member.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      )}
                    >
                      {member.status === "active" ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <Users
                      className="h-12 w-12 mb-3 opacity-20"
                      strokeWidth={1}
                    />
                    <p className="text-xl font-light text-zinc-900 dark:text-white uppercase tracking-[0.2em]">
                      Няма намерени членове
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-widest mt-2 text-zinc-400">
                      Опитайте с друго име или филтър.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-8 border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
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
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl h-10 w-10 p-0 border-zinc-200 bg-white dark:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-white dark:bg-zinc-800 rounded-xl text-xs font-medium border border-zinc-100 dark:border-zinc-700 shadow-none min-w-[70px] text-center">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-xl h-10 w-10 p-0 border-zinc-200 bg-white dark:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </BentoCard>
    </div>
  );
}
