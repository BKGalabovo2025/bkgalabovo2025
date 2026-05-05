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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Членове на клуба"
        description="Управление на профили, членски карти и статуси на спортистите."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове" },
        ]}
      >
        <Button
          onClick={() => router.push("/members/new")}
          className="rounded-xl shadow-md font-bento"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Нов член
        </Button>
      </PageHeader>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BentoCard className="p-6 flex items-center gap-4 bg-blue-50/30 dark:bg-blue-900/10 border-blue-100/50">
          <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-2xl text-blue-600 dark:text-blue-200">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600/70 uppercase tracking-wider">
              Общо
            </p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </BentoCard>

        <BentoCard className="p-6 flex items-center gap-4 bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-200">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600/70 uppercase tracking-wider">
              Активни
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {stats.active}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="p-6 flex items-center gap-4 bg-slate-50/30 dark:bg-slate-800/10 border-slate-200/50">
          <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300">
            <UserMinus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600/70 uppercase tracking-wider">
              Неактивни
            </p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-400">
              {stats.inactive}
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Main Table Bento */}
      <BentoCard className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Търсене по име или имейл..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 mr-1" />
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                {(["all", "active", "inactive"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      statusFilter === f
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
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
          <TableHeader className="bg-slate-50/20">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-[300px] py-4">Член</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Възраст</TableHead>
              <TableHead>Регистрация</TableHead>
              <TableHead className="text-right">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => (
                <TableRow
                  key={member.id}
                  onClick={() => router.push(`/members/${member.id}`)}
                  className="cursor-pointer hover:bg-slate-50/50 transition-colors group border-slate-50"
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </div>
                      <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                        {member.firstName} {member.lastName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-sm">{member.email || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.ageGroup ? (
                      <Badge
                        variant="outline"
                        className="rounded-lg font-medium bg-white border-slate-200"
                      >
                        {member.ageGroup}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-sm">
                        {new Date(member.registrationDate).toLocaleDateString(
                          "bg-BG"
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-none shadow-sm",
                        member.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {member.status === "active" ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Users className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-lg font-medium">Няма намерени членове</p>
                    <p className="text-sm">Опитайте с друго име или филтър.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination inside Bento */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/10">
            <p className="text-sm text-slate-500">
              Показани{" "}
              <span className="font-bold text-slate-900">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)}
              </span>{" "}
              от{" "}
              <span className="font-bold text-slate-900">
                {filteredMembers.length}
              </span>
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
              <div className="px-3 py-1 bg-white rounded-xl text-sm font-bold border border-slate-200 shadow-sm min-w-[60px] text-center">
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
