"use client";

import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Mail,
  MoreVertical,
  PlusCircle,
  Search,
  Trash2,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Activity, Contact as FamilyIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CreateFamilyDialog } from "@/components/families/CreateFamilyDialog";
import { RecoveryClientsList } from "@/components/finances/RecoveryClientsList";
import { PageHeader } from "@/components/layout/page-header";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useFamilies } from "@/hooks/useFamilies";
import {
  bulkUpdateMemberStatusAction,
  deleteMemberAction,
} from "@/lib/actions/members";
import { exportToCSV } from "@/lib/export-utils";
import { cn, getAgeGroup, getValidAvatarUrl } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

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
  const { activeBranch } = useAppStore();
  const isRecoveryBranch = activeBranch === "recoveryzone";

  const [activeTab, setActiveTab] = useState(
    isRecoveryBranch ? "recovery-clients" : "members"
  );

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
        // Оставяме само клубните членове
        const isRegular =
          member.isClubMember ||
          (!member.isGuest && member.memberType === "regular");
        if (!isRegular) return false;

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
    // Club members = has isClubMember flag OR old memberType="regular" (and not a guest-only)
    const clubMembers = members.filter(
      (m) =>
        m.isClubMember === true || (m.memberType === "regular" && !m.isGuest)
    );
    return {
      total: clubMembers.length,
      active: clubMembers.filter((m) => m.status === "active").length,
      inactive: clubMembers.filter((m) => m.status === "inactive").length,
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
    } catch (e: unknown) {
      console.error(e);
      setMembers(previousMembers);
      toast.error("Възникна сървърна грешка");
    }
  };

  const handleExport = () => {
    const dataToExport = filteredMembers.map((m) => ({
      Име: `${m.firstName} ${m.lastName}`,
      Имейл: m.email || "—",
      Група: m.ageGroup || (m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "—"),
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

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncStatuses = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/cron/check-statuses", {
        headers: {
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Успешно синхронизирани! Деактивирани: ${data.deactivatedCount}, Активирани: ${data.activatedCount}`
        );
        router.refresh();
      } else {
        toast.error("Грешка: " + (data.error || "Неуспешна синхронизация"));
      }
    } catch (e: unknown) {
      console.error("Sync statuses error:", e);
      toast.error("Възникна грешка при синхронизацията.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 pb-12 duration-500 animate-in fade-in sm:space-y-8 sm:px-6 lg:px-8">
      <PageHeader
        title={isRecoveryBranch ? "Членове на зоната" : "Членове на клуба"}
        description={
          isRecoveryBranch
            ? "Управление на профили, здравни досиета и статуси на клиентите."
            : "Управление на профили, членски карти и статуси на спортистите."
        }
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове" },
        ]}
      >
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            onClick={handleSyncStatuses}
            disabled={isSyncing}
            className="h-10 w-full rounded-xl border-zinc-200 px-4 text-[10px] font-medium tracking-widest uppercase hover:bg-zinc-50 sm:h-11 sm:w-auto sm:px-6 sm:text-xs"
          >
            <Activity
              className={cn("mr-2 size-4", isSyncing && "animate-spin")}
            />{" "}
            Синхронизирай статуси
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="h-10 w-full rounded-xl border-zinc-200 px-4 text-[10px] font-medium tracking-widest uppercase hover:bg-zinc-50 sm:h-11 sm:w-auto sm:px-6 sm:text-xs"
          >
            <Download className="mr-2 size-4" /> Експорт
          </Button>
          <Button
            onClick={() => router.push("/members/new")}
            className="h-10 w-full rounded-xl bg-zinc-950 px-4 text-[10px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-zinc-800 sm:h-11 sm:w-auto sm:px-6 sm:text-xs"
          >
            <PlusCircle className="mr-2 size-4" /> Нов член
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!isRecoveryBranch && (
          <TabsList className="no-scrollbar flex h-12 w-full justify-start overflow-x-auto rounded-2xl bg-zinc-100 p-1 sm:inline-flex sm:w-fit dark:bg-zinc-900">
            <TabsTrigger
              value="members"
              className="flex-1 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              <Users className="mr-2 size-4" /> Членове
            </TabsTrigger>
            <TabsTrigger
              value="guests"
              className="flex-1 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              <UserCog className="mr-2 size-4" /> Външни
            </TabsTrigger>
            <TabsTrigger
              value="families"
              className="flex-1 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              <FamilyIcon className="mr-2 size-4" /> Семейства
            </TabsTrigger>
            <TabsTrigger
              value="recovery-clients"
              className="flex-1 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              <Activity className="mr-2 size-4" /> Зона Възстановяване
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent
          value="recovery-clients"
          className={cn(
            isRecoveryBranch ? "mt-0" : "mt-8",
            "animate-in fade-in"
          )}
        >
          <BentoCard className="min-h-[calc(100vh-16rem)] overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
            <RecoveryClientsList members={members} />
          </BentoCard>
        </TabsContent>

        <TabsContent value="members" className="mt-8 space-y-8">
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:gap-6 sm:rounded-5xl sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="shrink-0 rounded-2xl bg-primary/5 p-3.5 text-primary sm:p-4">
                <Users className="size-5 sm:size-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase sm:text-[11px] dark:text-zinc-400">
                  Общо членове
                </p>
                <p className="text-2xl font-light text-zinc-900 sm:text-3xl dark:text-white">
                  {stats.total}
                </p>
              </div>
            </BentoCard>

            <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:gap-6 sm:rounded-5xl sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="shrink-0 rounded-2xl bg-emerald-500/5 p-3.5 text-emerald-600 sm:p-4">
                <UserCheck className="size-5 sm:size-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase sm:text-[11px] dark:text-zinc-400">
                  Активни
                </p>
                <p className="text-2xl font-light text-emerald-600 sm:text-3xl">
                  {stats.active}
                </p>
              </div>
            </BentoCard>

            <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:col-span-2 sm:gap-6 sm:rounded-5xl sm:p-8 lg:col-span-1 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="shrink-0 rounded-2xl bg-rose-500/5 p-3.5 text-rose-600 sm:p-4">
                <UserMinus className="size-5 sm:size-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase sm:text-[11px] dark:text-zinc-400">
                  Неактивни
                </p>
                <p className="text-2xl font-light text-rose-600 sm:text-3xl">
                  {stats.inactive}
                </p>
              </div>
            </BentoCard>

            <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:col-span-2 sm:gap-6 sm:rounded-5xl sm:p-8 lg:col-span-3 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="shrink-0 rounded-2xl bg-zinc-100 p-3.5 text-zinc-500 sm:p-4 dark:bg-zinc-800">
                <Users className="size-5 sm:size-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase sm:text-[11px] dark:text-zinc-400">
                  Относно Клубни Членове
                </p>
                <p className="text-xs leading-relaxed font-light text-zinc-500">
                  Клубните членове са редовни участници в клуба. Те разполагат с
                  пълно досие, членска карта, проследяване на статус
                  (активен/неактивен), финансова история и история на
                  посещенията. Статусът им се обновява автоматично спрямо
                  тяхната активност.
                </p>
              </div>
            </BentoCard>
          </div>

          {/* Main Table Bento */}
          <BentoCard className="overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-none sm:rounded-5xl dark:border-zinc-900 dark:bg-zinc-950">
            <div className="border-b border-zinc-50 p-4 sm:p-6 dark:border-zinc-900">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
                  <div className="relative w-full sm:w-80 lg:w-96">
                    <Search
                      className="absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-zinc-400"
                      strokeWidth={1.5}
                    />
                    <Input
                      placeholder="Търсене по име или имейл..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 pl-10 text-xs font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                    />
                  </div>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-1.5 animate-in fade-in slide-in-from-left-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-medium tracking-widest whitespace-nowrap text-primary uppercase">
                        {selectedIds.length} избрани
                      </span>
                      <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 rounded-lg px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                            className="flex items-center gap-2 rounded-lg text-[10px] font-medium tracking-widest text-emerald-600 uppercase focus:text-emerald-700"
                          >
                            <CheckCircle size={14} strokeWidth={1.5} />{" "}
                            Активирай
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

                <div className="custom-scrollbar no-scrollbar flex w-full items-center gap-3 overflow-x-auto pb-2 sm:w-auto sm:pb-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className={cn(
                      "h-10 shrink-0 rounded-xl border-zinc-200 px-4 text-[10px] font-semibold tracking-widest uppercase transition-all",
                      isFiltersExpanded || activeFiltersCount > 0
                        ? "hover:bg-zinc-850 border-transparent bg-zinc-950 text-white shadow-sm hover:text-white dark:bg-white dark:text-zinc-950"
                        : "hover:bg-zinc-50"
                    )}
                  >
                    <Filter
                      className="mr-1.5 size-3.5 shrink-0"
                      strokeWidth={1.5}
                    />
                    Умни филтри
                    {activeFiltersCount > 0 && (
                      <span
                        className={cn(
                          "ml-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                          isFiltersExpanded || activeFiltersCount > 0
                            ? "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white"
                            : "bg-zinc-100 text-zinc-900"
                        )}
                      >
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>

                  <div className="flex h-10 shrink-0 items-center rounded-xl bg-zinc-50 p-1 dark:bg-zinc-900">
                    {(["all", "active", "inactive"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-[9px] font-semibold tracking-widest whitespace-nowrap uppercase transition-all sm:px-4 sm:text-[10px]",
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

              {/* Умни филтри панел */}
              {isFiltersExpanded && (
                <div className="mt-6 grid grid-cols-1 gap-6 border-t border-zinc-100 pt-6 duration-300 animate-in slide-in-from-top-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-900">
                  {/* Age Filter */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
                      Възрастова група
                    </label>
                    <div className="flex w-full rounded-xl bg-zinc-50 p-1 dark:bg-zinc-900">
                      {(["all", "under18", "18plus"] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAgeFilter(a)}
                          className={cn(
                            "flex-1 rounded-lg py-1.5 text-center text-[9px] font-medium tracking-widest uppercase transition-all",
                            ageFilter === a
                              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-550 hover:text-zinc-700"
                          )}
                        >
                          {
                            {
                              all: "Всички",
                              under18: "под 18",
                              "18plus": "18+",
                            }[a]
                          }
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medical Filter */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
                      Медицинско
                    </label>
                    <div className="flex w-full rounded-xl bg-zinc-50 p-1 dark:bg-zinc-900">
                      {(["all", "valid", "missing"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMedicalFilter(m)}
                          className={cn(
                            "flex-1 rounded-lg py-1.5 text-center text-[9px] font-medium tracking-widest uppercase transition-all",
                            medicalFilter === m
                              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-550 hover:text-zinc-700"
                          )}
                        >
                          {
                            {
                              all: "Всички",
                              valid: "Има",
                              missing: "Няма",
                            }[m]
                          }
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Filter */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
                      Такси / Плащане
                    </label>
                    <div className="flex w-full rounded-xl bg-zinc-50 p-1 dark:bg-zinc-900">
                      {(["all", "paid", "due"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPaymentFilter(p)}
                          className={cn(
                            "flex-1 rounded-lg py-1.5 text-center text-[9px] font-medium tracking-widest uppercase transition-all",
                            paymentFilter === p
                              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                              : "text-zinc-550 hover:text-zinc-700"
                          )}
                        >
                          {
                            {
                              all: "Всички",
                              paid: "Платена",
                              due: "Неплатена",
                            }[p]
                          }
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Documents Filter */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
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
                      className="h-9.5 w-full rounded-xl border border-transparent bg-zinc-50 px-3 text-[10px] font-medium tracking-widest text-zinc-800 uppercase outline-none focus:border-zinc-200 focus:bg-white dark:bg-zinc-900 dark:text-zinc-200 dark:focus:bg-zinc-800"
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
                  <div className="border-zinc-55 flex flex-wrap items-center justify-between gap-4 border-t pt-4 sm:col-span-2 lg:col-span-4 dark:border-zinc-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-zinc-450 mr-1 text-[10px] font-medium tracking-widest uppercase">
                        Бързи филтри:
                      </span>
                      <button
                        type="button"
                        onClick={() => applyPreset("under18-no-medical")}
                        className="dark:hover:bg-zinc-750 rounded-full bg-zinc-100 px-3 py-1.5 text-[9px] font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        Деца без медицинско
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("unpaid-fees")}
                        className="dark:hover:bg-zinc-750 rounded-full bg-zinc-100 px-3 py-1.5 text-[9px] font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        С неплатени такси
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("missing-declarations")}
                        className="dark:hover:bg-zinc-750 rounded-full bg-zinc-100 px-3 py-1.5 text-[9px] font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        Липсващи декларации
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("all-clear")}
                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:text-emerald-400"
                      >
                        Всичко изрядно ✨
                      </button>
                    </div>

                    {(activeFiltersCount > 0 || statusFilter !== "all") && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="dark:text-rose-450 text-[9px] font-semibold tracking-widest text-rose-600 uppercase hover:underline"
                      >
                        Изчисти филтрите
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="custom-scrollbar hidden overflow-x-auto md:block">
              <Table className="min-w-225 table-fixed lg:min-w-full">
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow className="border-zinc-100 hover:bg-transparent dark:border-zinc-900">
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
                    <TableHead className="p-4 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Член
                    </TableHead>
                    <TableHead className="px-4 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Контакт
                    </TableHead>
                    <TableHead className="w-30 px-4 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Група
                    </TableHead>
                    <TableHead className="hidden w-35 px-4 text-[10px] font-medium tracking-widest text-zinc-400 uppercase lg:table-cell">
                      Регистрация
                    </TableHead>
                    <TableHead className="w-30 px-6 text-right text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Статус
                    </TableHead>
                    <TableHead className="w-15"></TableHead>
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
                          className={cn(
                            "group cursor-pointer border-zinc-50 transition-colors hover:bg-zinc-50/50 dark:border-zinc-900 dark:hover:bg-zinc-900/50",
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
                            className="p-4"
                            onClick={() => router.push(`/members/${member.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8 shrink-0 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <AvatarImage
                                  src={getValidAvatarUrl(member.avatarUrl)}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  className="object-cover"
                                />
                                <AvatarFallback className="flex items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-medium text-zinc-600 transition-all duration-300 group-hover:bg-zinc-950 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
                                  {member.firstName[0]}
                                  {member.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="truncate text-[13px] font-medium text-zinc-900 transition-colors group-hover:text-zinc-950 dark:text-white">
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
                                className="size-3 shrink-0 text-zinc-300"
                                strokeWidth={1.5}
                              />
                              <span className="max-w-[150px] truncate text-[11px] font-light">
                                {member.email || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className="px-4"
                            onClick={() => router.push(`/members/${member.id}`)}
                          >
                            {ageGrp ? (
                              <Badge
                                variant="outline"
                                className="h-5 rounded-lg border-zinc-100 bg-transparent px-2 py-0 text-[9px] font-medium tracking-widest uppercase"
                              >
                                {ageGrp}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-zinc-300">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className="hidden px-4 lg:table-cell"
                            onClick={() => router.push(`/members/${member.id}`)}
                          >
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                              <Calendar
                                className="size-3 text-zinc-300"
                                strokeWidth={1.5}
                              />
                              <span className="text-[10px] font-medium tracking-widest uppercase">
                                {new Date(
                                  member.registrationDate
                                ).toLocaleDateString("bg-BG")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className="px-6 text-right"
                            onClick={() => router.push(`/members/${member.id}`)}
                          >
                            <Badge
                              className={cn(
                                "rounded-full border-none px-2.5 py-0.5 text-[9px] font-semibold tracking-widest uppercase shadow-none",
                                member.status === "active"
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
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
                              aria-label={`Изтрий ${member.firstName} ${member.lastName}`}
                              className="size-8 rounded-lg text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                            >
                              <Trash2 className="size-4" strokeWidth={1.5} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-zinc-400">
                          <Users
                            className="mb-3 size-12 opacity-20"
                            strokeWidth={1}
                          />
                          <p className="text-xl font-light tracking-[0.2em] text-zinc-900 uppercase dark:text-white">
                            Няма намерени членове
                          </p>
                          <p className="mt-2 text-[10px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
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
            <div className="divide-y divide-zinc-50 md:hidden dark:divide-zinc-900">
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => router.push(`/members/${member.id}`)}
                    className="p-5 transition-colors active:bg-zinc-50 dark:active:bg-zinc-900"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 shrink-0 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <AvatarImage
                            src={getValidAvatarUrl(member.avatarUrl)}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="object-cover"
                          />
                          <AvatarFallback className="flex items-center justify-center rounded-xl bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-zinc-500">
                            <Mail
                              className="size-3 text-zinc-300"
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
                            "rounded-full border-none px-2.5 py-0.5 text-[9px] font-semibold tracking-widest uppercase shadow-none",
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
                          className="size-8 rounded-lg text-zinc-300 transition-colors hover:text-rose-500"
                        >
                          <Trash2 className="size-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-50 pt-3 dark:border-zinc-900">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Calendar
                          className="size-3 text-zinc-300"
                          strokeWidth={1.5}
                        />
                        <span className="text-[9px] font-medium tracking-widest uppercase">
                          {new Date(member.registrationDate).toLocaleDateString(
                            "bg-BG"
                          )}
                        </span>
                      </div>
                      {(member.ageGroup || member.dateOfBirth) && (
                        <Badge
                          variant="outline"
                          className="h-5 rounded-lg border-zinc-100 bg-transparent px-2 py-0 text-[9px] font-medium tracking-widest uppercase"
                        >
                          {member.ageGroup || getAgeGroup(member.dateOfBirth!)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Users
                    className="mx-auto mb-3 size-12 text-zinc-400 opacity-20"
                    strokeWidth={1}
                  />
                  <p className="text-sm font-medium tracking-widest text-zinc-900 uppercase dark:text-white">
                    Няма резултати
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-6 border-t border-zinc-50 bg-zinc-50/50 p-5 sm:flex-row sm:p-6 dark:border-zinc-900 dark:bg-zinc-900/50">
                <p className="order-2 text-[10px] font-medium tracking-widest text-zinc-600 uppercase sm:order-1 sm:text-[11px] dark:text-zinc-400">
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
                <div className="order-1 flex w-full items-center justify-between gap-3 sm:order-2 sm:w-auto sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Предишна страница"
                    className="size-11 rounded-xl border-zinc-100 bg-white p-0 shadow-none hover:bg-zinc-50 dark:bg-zinc-800"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="min-w-[70px] rounded-xl border border-zinc-100 bg-white px-5 py-2.5 text-center text-[10px] font-semibold tracking-widest uppercase shadow-none dark:border-zinc-700 dark:bg-zinc-800">
                    {currentPage} {"/"} {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    aria-label="Следваща страница"
                    className="size-11 rounded-xl border-zinc-100 bg-white p-0 shadow-none hover:bg-zinc-50 dark:bg-zinc-800"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </BentoCard>
        </TabsContent>

        <TabsContent value="guests" className="mt-8 space-y-8">
          {/* Guest Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:gap-6 sm:rounded-5xl sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="shrink-0 rounded-2xl bg-amber-500/10 p-3.5 text-amber-600 sm:p-4">
                <UserCog className="size-5 sm:size-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
                  Външни клиенти
                </p>
                <p className="text-2xl font-light text-amber-600 sm:text-3xl">
                  {
                    members.filter((m) => m.isGuest || m.memberType === "guest")
                      .length
                  }
                </p>
              </div>
            </BentoCard>
            <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:col-span-2 sm:gap-6 sm:rounded-5xl sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
              <div className="shrink-0 rounded-2xl bg-zinc-100 p-3.5 text-zinc-500 sm:p-4 dark:bg-zinc-800">
                <UserPlus className="size-5 sm:size-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
                  Относно Външни клиенти
                </p>
                <p className="text-xs leading-relaxed font-light text-zinc-500">
                  Външните клиенти са лица, участвали в тренировки, но не са
                  редовни членове на клуба. Те имат собствени досиета и история
                  на посещенията.
                </p>
              </div>
            </BentoCard>
          </div>

          {/* Guest Cards */}
          <BentoCard className="overflow-hidden rounded-4xl border border-zinc-100 bg-white shadow-none sm:rounded-5xl dark:border-zinc-900 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-50 p-4 sm:p-6 dark:border-zinc-900">
              <div className="flex items-center gap-3">
                <UserCog className="size-4 text-amber-500" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Регистрирани Външни клиенти
                </h3>
              </div>
              <Button
                onClick={() => router.push("/members/new?type=guest")}
                className="h-9 rounded-xl bg-amber-500 px-4 text-[10px] font-medium tracking-widest text-white uppercase shadow-none hover:bg-amber-600"
              >
                <UserPlus className="mr-2 size-3.5" /> Нов Гост
              </Button>
            </div>
            {members.filter((m) => m.isGuest || m.memberType === "guest")
              .length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20">
                  <UserCog className="size-8 text-amber-300" strokeWidth={1} />
                </div>
                <p className="mb-3 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                  Няма регистрирани външни клиенти
                </p>
                <p className="mx-auto max-w-sm text-sm leading-relaxed font-light text-zinc-400">
                  Когато добавите външен клиент, той ще се появи тук с пълно
                  досие и история на посещенията.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
                {members
                  .filter((m) => m.isGuest || m.memberType === "guest")
                  .sort((a, b) =>
                    `${a.firstName} ${a.lastName}`.localeCompare(
                      `${b.firstName} ${b.lastName}`,
                      "bg"
                    )
                  )
                  .map((guest) => (
                    <div
                      key={guest.id}
                      onClick={() => router.push(`/members/${guest.id}`)}
                      className="group cursor-pointer rounded-3xl border border-zinc-100 bg-white p-5 transition-all duration-300 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-amber-800"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-medium text-amber-600 transition-colors group-hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400">
                            {guest.firstName[0]}
                            {guest.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">
                              {guest.firstName} {guest.lastName}
                            </p>
                            <p className="mt-0.5 text-[10px] font-light text-zinc-400">
                              {guest.email || "Няма имейл"}
                            </p>
                          </div>
                        </div>
                        <Badge className="shrink-0 rounded-full border-none bg-amber-100 px-2.5 py-0.5 text-[9px] font-semibold tracking-widest text-amber-700 uppercase shadow-none dark:bg-amber-950/30 dark:text-amber-400">
                          Гост
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 border-t border-zinc-50 pt-3 text-zinc-400 dark:border-zinc-900">
                        <Calendar
                          className="size-3 text-zinc-300"
                          strokeWidth={1.5}
                        />
                        <span className="text-[9px] font-medium tracking-widest uppercase">
                          {new Date(guest.registrationDate).toLocaleDateString(
                            "bg-BG"
                          )}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) =>
                              handleDeleteMember(
                                e,
                                guest.id,
                                `${guest.firstName} ${guest.lastName}`
                              )
                            }
                            className="size-7 rounded-lg text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="size-3.5" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </BentoCard>
        </TabsContent>

        <TabsContent value="families" className="mt-8 space-y-8">
          <BentoCard className="flex items-center gap-4 rounded-4xl border border-zinc-100 bg-white p-5 shadow-none sm:gap-6 sm:rounded-5xl sm:p-8 dark:border-zinc-900 dark:bg-zinc-950">
            <div className="shrink-0 rounded-2xl bg-zinc-100 p-3.5 text-zinc-500 sm:p-4 dark:bg-zinc-800">
              <FamilyIcon className="size-5 sm:size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase sm:text-[11px]">
                Относно Семейства
              </p>
              <p className="text-xs leading-relaxed font-light text-zinc-500">
                Семейните профили обединяват няколко членове на клуба в една
                група за по-лесно управление. Те позволяват споделяне на семейни
                такси и отстъпки, както и общо проследяване на финансовата
                история.
              </p>
            </div>
          </BentoCard>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => {
              const familyMembers = initialMembers.filter((m) =>
                family.memberIds.includes(m.id)
              );
              return (
                <BentoCard
                  key={family.id}
                  className="space-y-4 rounded-3xl border border-zinc-100 bg-white p-6 shadow-none dark:border-zinc-900 dark:bg-zinc-950"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
                        <FamilyIcon className="size-5 text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-semibold">
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
                        <div className="size-1.5 rounded-full bg-emerald-500" />
                        {m.firstName} {m.lastName}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-2 w-full rounded-xl text-xs font-semibold tracking-widest uppercase hover:bg-zinc-50 dark:hover:bg-zinc-900"
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
