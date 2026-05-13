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
import { bulkUpdateMemberStatusAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFamilies } from "@/hooks/useFamilies";
import { Contact as FamilyIcon } from "lucide-react";

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
  const { idToken } = useAuth();
  const { families } = useFamilies();
  const [activeTab, setActiveTab] = useState("members");

  const filteredMembers = useMemo(() => {
    return initialMembers
      .filter((member) => {
        const matchesSearch =
          `${member.firstName} ${member.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (member.email &&
            member.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          statusFilter === "all" || member.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB, "bg");
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
    if (selectedIds.length === 0 || !idToken) return;
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
        setSelectedIds([]);
        router.refresh();
      } else {
        toast.error(result.message || "Възникна грешка при обновяването");
      }
    } catch {
      toast.error("Възникна сървърна грешка");
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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12 px-3 sm:px-6 lg:px-8">
      <PageHeader
        title="Членове на клуба"
        description="Управление на профили, членски карти и статуси на спортистите."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове" },
        ]}
      >
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-xl border-zinc-200 font-medium text-[10px] sm:text-xs uppercase tracking-widest h-10 sm:h-11 px-4 sm:px-6 hover:bg-zinc-50 w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Експорт
          </Button>
          <Button
            onClick={() => router.push("/members/new")}
            className="rounded-xl font-medium text-[10px] sm:text-xs uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 h-10 sm:h-11 px-4 sm:px-6 shadow-none w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Нов член
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl h-12 w-full sm:w-[400px]">
          <TabsTrigger
            value="members"
            className="rounded-xl flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all uppercase tracking-widest text-[10px] font-semibold"
          >
            <Users className="h-4 w-4 mr-2" /> Членове
          </TabsTrigger>
          <TabsTrigger
            value="families"
            className="rounded-xl flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all uppercase tracking-widest text-[10px] font-semibold"
          >
            <FamilyIcon className="h-4 w-4 mr-2" /> Семейства
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-8 space-y-8">
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            <BentoCard className="p-5 sm:p-8 flex items-center gap-4 sm:gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none rounded-4xl sm:rounded-5xl">
              <div className="p-3.5 sm:p-4 bg-primary/5 text-primary rounded-2xl shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
                  Общо членове
                </p>
                <p className="text-2xl sm:text-3xl font-light text-zinc-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </BentoCard>

            <BentoCard className="p-5 sm:p-8 flex items-center gap-4 sm:gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none rounded-4xl sm:rounded-5xl">
              <div className="p-3.5 sm:p-4 bg-emerald-500/5 text-emerald-600 rounded-2xl shrink-0">
                <UserCheck
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  strokeWidth={1.5}
                />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
                  Активни
                </p>
                <p className="text-2xl sm:text-3xl font-light text-emerald-600">
                  {stats.active}
                </p>
              </div>
            </BentoCard>

            <BentoCard className="p-5 sm:p-8 flex items-center gap-4 sm:gap-6 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 shadow-none rounded-4xl sm:rounded-5xl sm:col-span-2 lg:col-span-1">
              <div className="p-3.5 sm:p-4 bg-rose-500/5 text-rose-600 rounded-2xl shrink-0">
                <UserMinus
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  strokeWidth={1.5}
                />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
                  Неактивни
                </p>
                <p className="text-2xl sm:text-3xl font-light text-rose-600">
                  {stats.inactive}
                </p>
              </div>
            </BentoCard>
          </div>

          {/* Main Table Bento */}
          <BentoCard className="overflow-hidden border border-zinc-100 dark:border-zinc-900 shadow-none bg-white dark:bg-zinc-950 rounded-4xl sm:rounded-5xl">
            <div className="p-4 sm:p-6 border-b border-zinc-50 dark:border-zinc-900">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <div className="relative w-full sm:w-80 lg:w-96">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
                      strokeWidth={1.5}
                    />
                    <Input
                      placeholder="Търсене по име или имейл..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-none focus-visible:ring-primary h-11 text-xs font-light"
                    />
                  </div>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-medium text-primary uppercase tracking-widest whitespace-nowrap">
                        {selectedIds.length} избрани
                      </span>
                      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg h-7 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <MoreVertical size={14} className="text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="rounded-xl border-zinc-100 p-2 shadow-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => handleBulkStatusUpdate("active")}
                            className="flex items-center gap-2 rounded-lg text-[10px] font-medium text-emerald-600 focus:text-emerald-700 uppercase tracking-widest"
                          >
                            <CheckCircle size={14} strokeWidth={1.5} />{" "}
                            Активирай
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

                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto custom-scrollbar no-scrollbar pb-2 sm:pb-0">
                  <Filter
                    className="h-3.5 w-3.5 text-zinc-400 shrink-0"
                    strokeWidth={1.5}
                  />
                  <div className="flex bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 shrink-0">
                    {(["all", "active", "inactive"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={cn(
                          "px-3 sm:px-5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                          statusFilter === f
                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-700"
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

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <Table className="min-w-[900px] lg:min-w-full table-fixed">
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                    <TableHead className="w-[50px] px-4">
                      <Checkbox
                        checked={
                          selectedIds.length === paginatedMembers.length &&
                          paginatedMembers.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                        className="rounded-md border-zinc-200"
                      />
                    </TableHead>
                    <TableHead className="py-4 px-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                      Член
                    </TableHead>
                    <TableHead className="px-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                      Контакт
                    </TableHead>
                    <TableHead className="px-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400 w-[120px]">
                      Група
                    </TableHead>
                    <TableHead className="hidden lg:table-cell px-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400 w-[140px]">
                      Регистрация
                    </TableHead>
                    <TableHead className="text-right px-6 text-[10px] font-medium uppercase tracking-widest text-zinc-400 w-[120px]">
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
                          className="px-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.includes(member.id)}
                            onCheckedChange={() => toggleSelect(member.id)}
                            className="rounded-md border-zinc-200"
                          />
                        </TableCell>
                        <TableCell
                          className="py-4 px-4"
                          onClick={() => router.push(`/members/${member.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium text-[10px] group-hover:bg-zinc-950 group-hover:text-white transition-all duration-300 shrink-0">
                              {member.firstName[0]}
                              {member.lastName[0]}
                            </div>
                            <div className="font-medium text-[13px] text-zinc-900 dark:text-white group-hover:text-zinc-950 transition-colors truncate">
                              {member.firstName} {member.lastName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell
                          className="px-4"
                          onClick={() => router.push(`/members/${member.id}`)}
                        >
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Mail
                              className="h-3 w-3 shrink-0 text-zinc-300"
                              strokeWidth={1.5}
                            />
                            <span className="text-[11px] font-light truncate max-w-[150px]">
                              {member.email || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="px-4"
                          onClick={() => router.push(`/members/${member.id}`)}
                        >
                          {member.ageGroup ? (
                            <Badge
                              variant="outline"
                              className="rounded-lg font-medium text-[9px] bg-transparent border-zinc-100 uppercase tracking-widest px-2 py-0 h-5"
                            >
                              {member.ageGroup}
                            </Badge>
                          ) : (
                            <span className="text-zinc-300 text-[11px]">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="hidden lg:table-cell px-4"
                          onClick={() => router.push(`/members/${member.id}`)}
                        >
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Calendar
                              className="h-3 w-3 text-zinc-300"
                              strokeWidth={1.5}
                            />
                            <span className="text-[10px] font-medium uppercase tracking-widest">
                              {new Date(
                                member.registrationDate
                              ).toLocaleDateString("bg-BG")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-right px-6"
                          onClick={() => router.push(`/members/${member.id}`)}
                        >
                          <Badge
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest border-none shadow-none",
                              member.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            )}
                          >
                            {member.status === "active"
                              ? "Активен"
                              : "Неактивен"}
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
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-zinc-50 dark:divide-zinc-900">
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => router.push(`/members/${member.id}`)}
                    className="p-5 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium text-xs">
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-zinc-900 dark:text-white">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-500 mt-1">
                            <Mail
                              className="h-3 w-3 text-zinc-300"
                              strokeWidth={1.5}
                            />
                            <span className="text-[10px] font-light">
                              {member.email || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest border-none shadow-none",
                          member.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {member.status === "active" ? "Активен" : "Неактивен"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-50 dark:border-zinc-900">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar
                          className="h-3 w-3 text-zinc-300"
                          strokeWidth={1.5}
                        />
                        <span className="text-[9px] font-medium uppercase tracking-widest">
                          {new Date(member.registrationDate).toLocaleDateString(
                            "bg-BG"
                          )}
                        </span>
                      </div>
                      {member.ageGroup && (
                        <Badge
                          variant="outline"
                          className="rounded-lg font-medium text-[9px] bg-transparent border-zinc-100 uppercase tracking-widest px-2 py-0 h-5"
                        >
                          {member.ageGroup}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Users
                    className="h-12 w-12 mx-auto mb-3 opacity-20 text-zinc-400"
                    strokeWidth={1}
                  />
                  <p className="text-sm font-medium text-zinc-900 dark:text-white uppercase tracking-widest">
                    Няма резултати
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-5 sm:p-6 border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 gap-6">
                <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-widest order-2 sm:order-1">
                  Показани{" "}
                  <span className="text-zinc-900 dark:text-white">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  -{" "}
                  <span className="text-zinc-900 dark:text-white">
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredMembers.length
                    )}
                  </span>{" "}
                  от{" "}
                  <span className="text-zinc-900 dark:text-white">
                    {filteredMembers.length}
                  </span>
                </p>
                <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl h-11 w-11 p-0 border-zinc-100 bg-white dark:bg-zinc-800 shadow-none hover:bg-zinc-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="px-5 py-2.5 bg-white dark:bg-zinc-800 rounded-xl text-[10px] font-semibold border border-zinc-100 dark:border-zinc-700 shadow-none min-w-[70px] text-center uppercase tracking-widest">
                    {currentPage} {"/"} {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-xl h-11 w-11 p-0 border-zinc-100 bg-white dark:bg-zinc-800 shadow-none hover:bg-zinc-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </BentoCard>
        </TabsContent>

        <TabsContent value="families" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => {
              const familyMembers = initialMembers.filter((m) =>
                family.memberIds.includes(m.id)
              );
              return (
                <BentoCard
                  key={family.id}
                  className="p-6 space-y-4 border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-3xl shadow-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <FamilyIcon className="h-5 w-5 text-zinc-500" />
                      </div>
                      <h3 className="font-semibold text-lg">
                        {family.name || "Без име"}
                      </h3>
                    </div>
                    <Badge variant="outline" className="rounded-lg">
                      {familyMembers.length} члена
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {familyMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {m.firstName} {m.lastName}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full mt-2 rounded-xl text-xs uppercase tracking-widest font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => router.push(`/families/${family.id}`)}
                  >
                    Детайли
                  </Button>
                </BentoCard>
              );
            })}

            <BentoCard
              className="p-6 flex flex-col items-center justify-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-3xl shadow-none cursor-pointer hover:border-zinc-300 transition-all group"
              onClick={() =>
                toast.info(
                  "Функционалността за нови семейства ще бъде добавена скоро."
                )
              }
            >
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <PlusCircle className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Ново семейство
              </p>
            </BentoCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
