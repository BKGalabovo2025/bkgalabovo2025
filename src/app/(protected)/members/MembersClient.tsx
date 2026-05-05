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

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  ageGroup?: string;
  registrationDate: string;
  status: "active" | "inactive";
}

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
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest h-11"
          >
            <Download className="mr-2 h-4 w-4" /> Експорт
          </Button>
          <Button
            onClick={() => router.push("/members/new")}
            className="rounded-xl shadow-lg shadow-blue-900/20 font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 h-11"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Нов член
          </Button>
        </div>
      </PageHeader>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6 flex items-center gap-4 bg-white border-none shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Общо членове
            </p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
        </BentoCard>

        <BentoCard className="p-6 flex items-center gap-4 bg-white border-none shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Активни
            </p>
            <p className="text-2xl font-black text-emerald-600">
              {stats.active}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="p-6 flex items-center gap-4 bg-white border-none shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <UserMinus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Неактивни
            </p>
            <p className="text-2xl font-black text-rose-600">
              {stats.inactive}
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Main Table Bento */}
      <BentoCard className="overflow-hidden border-none shadow-sm bg-white">
        <div className="p-6 border-b border-slate-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Търсене по име или имейл..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-slate-100 bg-slate-50 shadow-none focus-visible:ring-blue-500 h-11"
                />
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">
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
                        className="flex items-center gap-2 rounded-lg text-xs font-bold text-emerald-600 focus:text-emerald-700"
                      >
                        <CheckCircle size={14} /> Активирай
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusUpdate("inactive")}
                        className="flex items-center gap-2 rounded-lg text-xs font-bold text-slate-500"
                      >
                        <XCircle size={14} /> Деактивирай
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 mr-1" />
              <div className="flex bg-slate-50 rounded-xl p-1">
                {(["all", "active", "inactive"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                      statusFilter === f
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
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
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-12 px-6">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedMembers.length &&
                    paginatedMembers.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  className="rounded-md border-slate-200"
                />
              </TableHead>
              <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Член
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Контакт
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Възраст
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Регистрация
              </TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                    "cursor-pointer hover:bg-slate-50/50 transition-colors group border-slate-50",
                    selectedIds.includes(member.id) && "bg-blue-50/30"
                  )}
                >
                  <TableCell
                    className="px-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={() => toggleSelect(member.id)}
                      className="rounded-md border-slate-200"
                    />
                  </TableCell>
                  <TableCell
                    className="py-4"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </div>
                      <div className="font-black text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                        {member.firstName} {member.lastName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold">
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
                        className="rounded-lg font-black text-[10px] bg-white border-slate-200 uppercase tracking-widest"
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
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {new Date(member.registrationDate).toLocaleDateString(
                          "bg-BG"
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <Badge
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                        member.status === "active"
                          ? "bg-emerald-100 text-emerald-700 shadow-emerald-100/50"
                          : "bg-slate-100 text-slate-500"
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
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Users className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      Няма намерени членове
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1">
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
          <div className="flex items-center justify-between p-6 border-t border-slate-50 bg-slate-50/10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Показани{" "}
              <span className="text-slate-900">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              -{" "}
              <span className="text-slate-900">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)}
              </span>{" "}
              от{" "}
              <span className="text-slate-900">{filteredMembers.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl h-9 w-9 p-0 border-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-1 bg-white rounded-xl text-xs font-black border border-slate-100 shadow-sm min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-xl h-9 w-9 p-0 border-slate-200"
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
