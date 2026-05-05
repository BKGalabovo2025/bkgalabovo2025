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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-12 lg:col-span-6 flex flex-col justify-center space-y-2 p-6 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">
            Членове на клуба
          </h1>
          <p className="text-muted-foreground text-sm">
            Управление на профили, членски карти и статуси на спортистите.
          </p>
          <div className="pt-4 flex gap-3">
            <Button
              onClick={() => router.push("/members/new")}
              className="rounded-xl shadow-md"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Нов член
            </Button>
          </div>
        </div>

        <div className="md:col-span-4 lg:col-span-2 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-200 mb-2">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-xs text-blue-600/70 font-medium uppercase tracking-wider">
            Общо
          </span>
        </div>

        <div className="md:col-span-4 lg:col-span-2 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-200 mb-2">
            <UserCheck className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {stats.active}
          </span>
          <span className="text-xs text-emerald-600/70 font-medium uppercase tracking-wider">
            Активни
          </span>
        </div>

        <div className="md:col-span-4 lg:col-span-2 p-6 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-1">
          <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 mb-2">
            <UserMinus className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-slate-700 dark:text-slate-400">
            {stats.inactive}
          </span>
          <span className="text-xs text-slate-600/70 font-medium uppercase tracking-wider">
            Неактивни
          </span>
        </div>
      </div>

      {/* Filters & Table Card */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Търсене по име или имейл..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 mr-1" />
              <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                {(["all", "active", "inactive"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
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
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="w-[300px]">Член</TableHead>
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
                    className="cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </div>
                        <div className="font-semibold text-slate-900">
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
                          className="rounded-lg font-medium bg-white"
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
                        variant={
                          member.status === "active" ? "success" : "secondary"
                        }
                        className={cn(
                          "rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border-none",
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
                      <p className="text-lg font-medium">
                        Няма намерени членове
                      </p>
                      <p className="text-sm">
                        Опитайте с друго име или филтър.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Bento */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">
            Показани{" "}
            <span className="font-semibold text-slate-900">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)}
            </span>{" "}
            от{" "}
            <span className="font-semibold text-slate-900">
              {filteredMembers.length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-1.5 bg-slate-50 rounded-xl text-sm font-bold border border-slate-100">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
