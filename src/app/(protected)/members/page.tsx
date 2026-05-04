"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { getAllMembers } from "@/services/member-service";
import { cn } from "@/lib/utils";

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
import {
  PlusCircle,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  ShieldCheck,
  UserCircle
} from "lucide-react";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

const ITEMS_PER_PAGE = 20;

interface PageHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddMember: () => void;
}

const PageHeader = ({
  searchTerm,
  onSearchChange,
  onAddMember,
}: PageHeaderProps) => (
  <div className="relative -mx-8 -mt-8 mb-10 px-8 py-12 premium-header">
    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-[0.2em]">
          <Users className="h-3 w-3" />
          Клубно Управление
        </div>
        <h1 className="text-5xl font-black tracking-tight font-heading text-white flex items-center gap-4">
          Членове на клуба
        </h1>
        <p className="text-blue-50/80 text-lg font-medium max-w-2xl">
          Дигитален регистър на атлетите и членовете на BKGálabovo.
        </p>
      </div>
      <div className="flex w-full md:w-auto items-center gap-4">
        <div className="relative flex-1 md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
          <Input
            placeholder="Търсене по име или имейл..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-14 bg-white/10 hover:bg-white/20 focus:bg-white/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 rounded-2xl transition-all shadow-inner font-medium text-lg"
          />
        </div>
        <Button 
          onClick={onAddMember} 
          className="h-14 px-8 rounded-2xl bg-white text-blue-600 hover:bg-zinc-100 shadow-2xl shadow-blue-950/20 transition-all font-black text-base"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Добави член
        </Button>
      </div>
    </div>
    
    {/* Decorative abstract shape */}
    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
  </div>
);

const MembersPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);

  const {
    data: members = [],
    error,
    isLoading,
  } = useSWR("members", () => getAllMembers(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  useEffect(() => {
    if (error) {
      console.error("Грешка при зареждане на членовете:", error);
      toast.error("Грешка", {
        description: "Неуспешно зареждане на списъка с членове.",
      });
    }
  }, [error]);

  const filteredMembers = useMemo(() => {
    let result = members;
    if (searchTerm) {
      result = members.filter(
        (member) =>
          `${member.firstName} ${member.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (member.email &&
            member.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return result;
  }, [members, searchTerm]);

  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-700">
        <PageHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddMember={() => router.push("/members/new")}
        />
        <div className="premium-card flex items-center justify-center h-[500px]">
          <LoadingSpinner size={48} />
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="animate-in fade-in duration-700">
        <PageHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddMember={() => router.push("/members/new")}
        />
        <div className="premium-card p-24">
          <EmptyState
            Icon={Users}
            title="Няма добавени членове"
            description="Все още не сте добавили нито един член. Започнете, като добавите първия."
          >
            <Button onClick={() => router.push("/members/new")} className="mt-8 rounded-2xl px-10 h-14 bg-blue-600 hover:bg-blue-700 font-black text-white shadow-xl shadow-blue-500/30">
              <PlusCircle className="mr-2 h-5 w-5" /> Добави първия член
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddMember={() => router.push("/members/new")}
      />

      <div className="premium-card overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-black text-zinc-500 uppercase text-xs tracking-widest pl-10 py-6">Име и Фамилия</TableHead>
              <TableHead className="font-black text-zinc-500 uppercase text-xs tracking-widest py-6">
                <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> Контакт</div>
              </TableHead>
              <TableHead className="font-black text-zinc-500 uppercase text-xs tracking-widest py-6 text-center">Група</TableHead>
              <TableHead className="font-black text-zinc-500 uppercase text-xs tracking-widest py-6 text-center">
                <div className="flex items-center justify-center gap-2"><Calendar className="h-3 w-3" /> Регистрация</div>
              </TableHead>
              <TableHead className="font-black text-zinc-500 uppercase text-xs tracking-widest py-6 text-right pr-10">
                <div className="flex items-center justify-end gap-2"><ShieldCheck className="h-3 w-3" /> Статус</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length > 0 ? (
              paginatedMembers.map((member) => (
                <TableRow
                  key={member.id}
                  onClick={() => router.push(`/members/${member.id}`)}
                  className="group cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-950/20 border-zinc-50 dark:border-zinc-800/50 transition-all"
                >
                  <TableCell className="pl-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-black text-xl shadow-xl group-hover:scale-105 group-hover:bg-blue-600 transition-all duration-300">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-zinc-900 dark:text-zinc-100 font-heading text-lg group-hover:text-blue-600 transition-colors">{member.firstName} {member.lastName}</span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">клубен член</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="text-zinc-600 dark:text-zinc-400 font-bold">{member.email || "—"}</span>
                  </TableCell>
                  <TableCell className="py-6 text-center">
                    {member.ageGroup ? (
                      <Badge variant="outline" className="rounded-xl px-4 py-1.5 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-black text-[10px] uppercase tracking-widest shadow-sm">
                        {member.ageGroup}
                      </Badge>
                    ) : (
                      <span className="text-zinc-400 italic text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="py-6 text-center">
                    <span className="text-zinc-900 dark:text-zinc-100 font-black">
                      {new Date(member.registrationDate).toLocaleDateString("bg-BG", { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </TableCell>
                  <TableCell className="py-6 text-right pr-10">
                    <Badge
                      className={cn(
                        "rounded-full px-5 py-1.5 font-black text-[10px] uppercase tracking-[0.15em] transition-all",
                        member.status === "active" 
                          ? "bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20" 
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-none"
                      )}
                    >
                      {member.status === "active" ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-40">
                  <div className="flex flex-col items-center gap-6 opacity-40">
                    <Search className="h-20 w-20 text-zinc-400" />
                    <p className="font-black text-3xl font-heading">Няма намерени резултати</p>
                    <p className="text-muted-foreground max-w-xs mx-auto font-bold uppercase tracking-tight">
                      Опитайте с различно име или филтър
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-10 premium-card p-8">
          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">
            Показани <span className="text-zinc-900 dark:text-zinc-100 text-sm">{(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)}</span> от <span className="text-zinc-900 dark:text-zinc-100 text-sm">{filteredMembers.length}</span>
          </p>
          <div className="flex items-center gap-10">
            <div className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">
              Страница <span className="text-blue-600 text-xl mx-2">{currentPage}</span> от {totalPages}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-2xl h-12 border-zinc-200 dark:border-zinc-800 px-8 hover:bg-white dark:hover:bg-zinc-900 font-black shadow-sm transition-all disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5 mr-2" /> Предишна
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-2xl h-12 border-zinc-200 dark:border-zinc-800 px-8 hover:bg-white dark:hover:bg-zinc-900 font-black shadow-sm transition-all disabled:opacity-30"
              >
                Следваща <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
