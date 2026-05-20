"use client";

import { useState, useMemo, useEffect } from "react";
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
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-utils";
import {
  bulkUpdateMemberStatusAction,
  deleteMemberAction,
} from "@/lib/actions/members";
import { CreateFamilyDialog } from "@/components/families/CreateFamilyDialog";
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
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { idToken } = useAuth();
  const { families } = useFamilies();
  const [activeTab, setActiveTab] = useState("members");

  // Умни филтри
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [ageFilter, setAgeFilter] = useState<"all" | "under18" | "18plus">(
    "all"
  );
  const [medicalFilter, setMedicalFilter] = useState<
    "all" | "valid" | "missing"
  >("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "due">(
    "all"
  );
  const [documentFilter, setDocumentFilter] = useState<
    "all" | "missing-declaration" | "missing-safety" | "all-valid"
  >("all");

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  // Нулиране на страницата при промяна на филтри
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    ageFilter,
    medicalFilter,
    paymentFilter,
    documentFilter,
  ]);

  const calculateAge = (dateOfBirthString?: string | null) => {
    if (!dateOfBirthString) return null;
    const dob = new Date(dateOfBirthString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const filteredMembers = useMemo(() => {
    return members
      .filter((member) => {
        const matchesSearch =
          `${member.firstName} ${member.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (member.email &&
            member.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          statusFilter === "all" || member.status === statusFilter;

        // Възрастов филтър
        const age = calculateAge(member.dateOfBirth);
        const matchesAge =
          ageFilter === "all" ||
          (ageFilter === "under18" && age !== null && age < 18) ||
          (ageFilter === "18plus" && age !== null && age >= 18);

        // Филтър за медицинско
        const matchesMedical =
          medicalFilter === "all" ||
          (medicalFilter === "valid" &&
            member.hasMedicalCertificate === true) ||
          (medicalFilter === "missing" &&
            member.hasMedicalCertificate !== true);

        // Филтър за плащания (дължимо след 30 дни от последното плащане)
        const lastPayment = member.lastPaymentDate
          ? new Date(member.lastPaymentDate)
          : null;
        const isPaymentDue =
          !lastPayment ||
          (new Date().getTime() - lastPayment.getTime()) / (1000 * 3600 * 24) >
            30;
        const matchesPayment =
          paymentFilter === "all" ||
          (paymentFilter === "paid" && !isPaymentDue) ||
          (paymentFilter === "due" && isPaymentDue);

        // Филтър за документи
        const matchesDocument =
          documentFilter === "all" ||
          (documentFilter === "missing-declaration" &&
            member.hasSignedDeclaration !== true) ||
          (documentFilter === "missing-safety" &&
            member.hasSafetyInstruction !== true) ||
          (documentFilter === "all-valid" &&
            member.hasSignedDeclaration === true &&
            member.hasMedicalCertificate === true &&
            member.hasSafetyInstruction === true);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesAge &&
          matchesMedical &&
          matchesPayment &&
          matchesDocument
        );
      })
      .sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB, "bg");
      });
  }, [
    members,
    searchTerm,
    statusFilter,
    ageFilter,
    medicalFilter,
    paymentFilter,
    documentFilter,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (ageFilter !== "all") count++;
    if (medicalFilter !== "all") count++;
    if (paymentFilter !== "all") count++;
    if (documentFilter !== "all") count++;
    return count;
  }, [ageFilter, medicalFilter, paymentFilter, documentFilter]);

  const applyPreset = (
    preset:
      | "under18-no-medical"
      | "unpaid-fees"
      | "missing-declarations"
      | "all-clear"
  ) => {
    if (preset === "under18-no-medical") {
      setAgeFilter("under18");
      setMedicalFilter("missing");
      setPaymentFilter("all");
      setDocumentFilter("all");
    } else if (preset === "unpaid-fees") {
      setAgeFilter("all");
      setMedicalFilter("all");
      setPaymentFilter("due");
      setDocumentFilter("all");
    } else if (preset === "missing-declarations") {
      setAgeFilter("all");
      setMedicalFilter("all");
      setPaymentFilter("all");
      setDocumentFilter("missing-declaration");
    } else if (preset === "all-clear") {
      setStatusFilter("active");
      setAgeFilter("all");
      setMedicalFilter("valid");
      setPaymentFilter("paid");
      setDocumentFilter("all-valid");
    }
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setAgeFilter("all");
    setMedicalFilter("all");
    setPaymentFilter("all");
    setDocumentFilter("all");
  };

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m) => m.status === "active").length,
      inactive: members.filter((m) => m.status === "inactive").length,
    };
  }, [members]);

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

    // Optimistic Update
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
    } catch {
      setMembers(previousMembers);
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

    // Optimistic Update
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className={cn(
                      "rounded-xl border-zinc-200 h-10 text-[10px] font-semibold uppercase tracking-widest px-4 shrink-0 transition-all",
                      isFiltersExpanded || activeFiltersCount > 0
                        ? "bg-zinc-950 text-white hover:bg-zinc-850 hover:text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-sm"
                        : "hover:bg-zinc-50"
                    )}
                  >
                    <Filter
                      className="mr-1.5 h-3.5 w-3.5 shrink-0"
                      strokeWidth={1.5}
                    />
                    Умни филтри
                    {activeFiltersCount > 0 && (
                      <span
                        className={cn(
                          "ml-1.5 px-1.5 py-0.5 text-[8px] rounded-full font-bold",
                          isFiltersExpanded || activeFiltersCount > 0
                            ? "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white"
                            : "bg-zinc-100 text-zinc-900"
                        )}
                      >
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>

                  <div className="flex bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 shrink-0 h-10 items-center">
                    {(["all", "active", "inactive"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={cn(
                          "px-3 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
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

              {/* Умни филтри панел */}
              {isFiltersExpanded && (
                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
                  {/* Age Filter */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest block">
                      Възрастова група
                    </label>
                    <div className="flex bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 w-full">
                      {(["all", "under18", "18plus"] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAgeFilter(a)}
                          className={cn(
                            "flex-1 py-1.5 text-[9px] font-medium uppercase tracking-widest rounded-lg transition-all text-center",
                            ageFilter === a
                              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                              : "text-zinc-550 hover:text-zinc-700"
                          )}
                        >
                          {a === "all"
                            ? "Всички"
                            : a === "under18"
                              ? "под 18"
                              : "18+"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medical Filter */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest block">
                      Медицинско
                    </label>
                    <div className="flex bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 w-full">
                      {(["all", "valid", "missing"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMedicalFilter(m)}
                          className={cn(
                            "flex-1 py-1.5 text-[9px] font-medium uppercase tracking-widest rounded-lg transition-all text-center",
                            medicalFilter === m
                              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                              : "text-zinc-550 hover:text-zinc-700"
                          )}
                        >
                          {m === "all"
                            ? "Всички"
                            : m === "valid"
                              ? "Има"
                              : "Няма"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Filter */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest block">
                      Такси / Плащане
                    </label>
                    <div className="flex bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 w-full">
                      {(["all", "paid", "due"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPaymentFilter(p)}
                          className={cn(
                            "flex-1 py-1.5 text-[9px] font-medium uppercase tracking-widest rounded-lg transition-all text-center",
                            paymentFilter === p
                              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                              : "text-zinc-550 hover:text-zinc-700"
                          )}
                        >
                          {p === "all"
                            ? "Всички"
                            : p === "paid"
                              ? "Платена"
                              : "Неплатена"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Documents Filter */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest block">
                      Документи
                    </label>
                    <select
                      value={documentFilter}
                      onChange={(e) =>
                        setDocumentFilter(
                          e.target.value as
                            | "all"
                            | "missing-declaration"
                            | "missing-safety"
                            | "all-valid"
                        )
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-transparent rounded-xl h-9.5 px-3 text-[10px] font-medium uppercase tracking-widest outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-200"
                    >
                      <option value="all">Всички документи</option>
                      <option value="missing-declaration">
                        Без Декларация
                      </option>
                      <option value="missing-safety">Без Инструктаж</option>
                      <option value="all-valid">Всичко изрядно</option>
                    </select>
                  </div>

                  {/* Presets and Clear All row */}
                  <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-55 dark:border-zinc-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-medium text-zinc-450 uppercase tracking-widest mr-1">
                        Бързи филтри:
                      </span>
                      <button
                        type="button"
                        onClick={() => applyPreset("under18-no-medical")}
                        className="px-3 py-1.5 rounded-full text-[9px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        Деца без медицинско
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("unpaid-fees")}
                        className="px-3 py-1.5 rounded-full text-[9px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        С неплатени такси
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("missing-declarations")}
                        className="px-3 py-1.5 rounded-full text-[9px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        Липсващи декларации
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("all-clear")}
                        className="px-3 py-1.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-100/70 transition-colors"
                      >
                        Всичко изрядно ✨
                      </button>
                    </div>

                    {(activeFiltersCount > 0 || statusFilter !== "all") && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-[9px] font-semibold text-rose-600 dark:text-rose-450 hover:underline uppercase tracking-widest"
                      >
                        Изчисти филтрите
                      </button>
                    )}
                  </div>
                </div>
              )}
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
                    <TableHead className="w-[60px]"></TableHead>
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
                        <TableCell className="px-4">
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
                            className="h-8 w-8 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
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
                      <div className="flex items-center gap-2">
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
                          className="h-8 w-8 rounded-lg text-zinc-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
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

            <CreateFamilyDialog />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
