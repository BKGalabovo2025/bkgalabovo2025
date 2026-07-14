"use client";

import { Member, Sale } from "@/types";
import { Family } from "@/hooks/useMemberProfile";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getAgeGroup,
  getValidAvatarUrl,
  getInitials,
  formatFullName,
} from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";
import { updateMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { MemberPersonalTab } from "./tabs/MemberPersonalTab";
import { MemberDocumentsTab } from "./tabs/MemberDocumentsTab";
import { MemberAssessmentsTab } from "./tabs/MemberAssessmentsTab";

const MemberSalesHistory = dynamic(
  () => import("./member-sales-history").then((mod) => mod.MemberSalesHistory),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Зареждане на история...
      </div>
    ),
  }
);
const MemberAttendanceHistory = dynamic(
  () =>
    import("./MemberAttendanceHistory").then(
      (mod) => mod.MemberAttendanceHistory
    ),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Зареждане на присъствия...
      </div>
    ),
  }
);
const MemberTrainingsHistory = dynamic(
  () =>
    import("./MemberTrainingsHistory").then(
      (mod) => mod.MemberTrainingsHistory
    ),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Зареждане на тренировки...
      </div>
    ),
  }
);
const MemberTrainingVolumeTab = dynamic(
  () =>
    import("./tabs/MemberTrainingVolumeTab").then(
      (mod) => mod.MemberTrainingVolumeTab
    ),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Зареждане на тренировъчен обем...
      </div>
    ),
  }
);

interface MemberDetailsCardProps {
  member: Member;
  familyMembers: Member[];
  family?: Family | null;
  sales?: Sale[];
  onRefresh?: () => void;
}

const formatPhoneType = (phoneType: string | null | undefined) => {
  if (!phoneType) return null;
  return phoneType === "personal" ? "Личен" : "На родител";
};

// ── Status Helpers ─────────────────────────────────────────────────────────────

function getFinancialStatusColor(
  isOverdue: boolean,
  hasLastPayment: boolean
): string {
  if (isOverdue) return "text-rose-600 dark:text-rose-400";
  if (!hasLastPayment) return "text-zinc-500";
  return "text-emerald-600 dark:text-emerald-400";
}

function getFinancialStatusLabel(
  isOverdue: boolean,
  hasLastPayment: boolean
): string {
  if (isOverdue) return "Дължи такса";
  if (!hasLastPayment) return "Няма продажби";
  return "Платено";
}

export const MemberDetailsCard = ({
  member,
  familyMembers,
  family: _family,
  sales = [],
  onRefresh,
}: MemberDetailsCardProps) => {
  const router = useRouter();
  const { idToken } = useAuth();

  const fullName = formatFullName(member);
  const ageGroup = member.dateOfBirth ? getAgeGroup(member.dateOfBirth) : null;
  const formattedBirthDate = member.dateOfBirth
    ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
    : null;
  const formattedRegistrationDate = member.registrationDate
    ? new Date(member.registrationDate).toLocaleDateString("bg-BG")
    : null;

  const { isOverdue, reason: overdueReason } = checkIsMemberOverdue(
    member,
    familyMembers,
    sales
  );

  const latestSaleDate = (() => {
    const completedSales = sales.filter(
      (s) => s.memberId === member.id && s.isPaid && s.status === "completed"
    );
    if (completedSales.length === 0) return null;
    completedSales.sort(
      (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
    );
    return new Date(completedSales[0].saleDate);
  })();

  const lastPayment = latestSaleDate;

  const formatDocDate = (isoString: string | null | undefined) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const updateDocumentStatus = async (
    baseField:
      | "signedDeclaration"
      | "medicalCertificate"
      | "isLicensed"
      | "travelDeclaration"
      | "safetyInstruction"
      | "internalRules"
      | "membershipApplication"
      | "terminationRequest",
    action: "print" | "submit" | "cancel"
  ) => {
    if (!idToken) return;

    const updates: Record<string, string | boolean | null> = {};
    const now = new Date().toISOString();

    const boolField =
      baseField === "isLicensed"
        ? "isLicensed"
        : `has${baseField.charAt(0).toUpperCase()}${baseField.slice(1)}`;
    const printedField = `${baseField}PrintedAt`;
    const handedField = `${baseField}HandedAt`;

    if (action === "print") {
      updates[printedField] = now;
    } else if (action === "submit") {
      updates[boolField] = true;
      updates[handedField] = now;
    } else if (action === "cancel") {
      updates[boolField] = false;
      updates[handedField] = null;
    }

    try {
      const result = await updateMemberAction(member.id, idToken, updates);
      if (result.success) {
        if (action !== "print") toast.success("Статусът е обновен успешно!");
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        toast.error("Възникна грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Error updating document status:", error);
      toast.error("Грешка при обновяване");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/members")}
          className="h-10 sm:h-12 w-full sm:w-auto px-6 rounded-xl border-zinc-100 hover:bg-zinc-50 font-medium text-[10px] sm:text-[11px] uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4" strokeWidth={1.5} /> Всички
        </Button>
        <Button
          onClick={() => router.push(`/members/${member.id}/edit`)}
          className="h-10 sm:h-12 w-full sm:w-auto px-8 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[10px] sm:text-[11px] uppercase tracking-widest shadow-none transition-all"
        >
          <Pencil className="mr-3 h-4 w-4" strokeWidth={1.5} /> Редактирай
        </Button>
      </div>

      <div className="overflow-hidden bg-white border border-zinc-100 rounded-5xl shadow-none">
        <div className="h-32 sm:h-40 bg-zinc-50 w-full relative">
          <div className="absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent" />
        </div>
        <div className="px-6 sm:px-10 pb-8 sm:pb-10 -mt-12 sm:-mt-16 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left">
            <div className="relative group">
              <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 sm:border-8 shadow-2xl rounded-5xl sm:rounded-6xl bg-zinc-50 dark:bg-zinc-900 border-white dark:border-zinc-950">
                <AvatarImage
                  src={getValidAvatarUrl(member.avatarUrl)}
                  alt={fullName}
                  className="object-cover animate-in fade-in duration-500"
                />
                <AvatarFallback className="text-4xl font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100/50 dark:bg-zinc-900 flex items-center justify-center">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 space-y-3 sm:space-y-4 mb-2 sm:mb-4">
              <h2 className="text-3xl sm:text-5xl font-light text-zinc-950 tracking-tighter">
                {fullName}
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest2",
                    member.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  )}
                >
                  {member.status === "active" ? "Активен" : "Неактивен"}
                </Badge>
                {ageGroup && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest2 border-zinc-100 text-zinc-400"
                  >
                    {ageGroup}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mb-2 sm:mb-4 w-full md:w-auto">
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 sm:p-6 rounded-3xl sm:rounded-4xl flex items-center justify-between md:justify-start gap-4 md:gap-6 shadow-xs shadow-zinc-100/10 dark:shadow-none">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest2 text-zinc-400 dark:text-zinc-500 mb-1">
                    Финансов статус
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-sm font-semibold tracking-wide",
                        getFinancialStatusColor(isOverdue, !!lastPayment)
                      )}
                    >
                      {getFinancialStatusLabel(isOverdue, !!lastPayment)}
                    </span>
                    {lastPayment && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {lastPayment.toLocaleDateString("bg-BG")}
                        </span>
                      </>
                    )}
                  </div>
                  {overdueReason && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 font-normal">
                      {overdueReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <div className="relative group">
          <TabsList className="w-full h-auto bg-zinc-50/50 border border-zinc-100 p-1.5 rounded-2xl mb-8 flex flex-wrap gap-1">
            <TabsTrigger
              value="personal"
              className="flex-none h-9 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 px-4 whitespace-nowrap transition-all"
            >
              Данни
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex-none h-9 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 px-4 whitespace-nowrap transition-all"
            >
              Документи
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="flex-none h-9 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 px-4 whitespace-nowrap transition-all"
            >
              Финансова история
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="flex-none h-9 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 px-4 whitespace-nowrap transition-all"
            >
              Присъствия
            </TabsTrigger>
            <TabsTrigger
              value="trainings"
              className="flex-none h-9 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 px-4 whitespace-nowrap transition-all"
            >
              Shadow тренировки
            </TabsTrigger>
            <TabsTrigger
              value="volume"
              className="flex-none h-9 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 px-4 whitespace-nowrap transition-all"
            >
              Тренировъчен обем
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="flex-none h-9 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 data-[state=active]:text-zinc-900 px-4 whitespace-nowrap transition-all"
            >
              Оценяване
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal" className="focus-visible:outline-none">
          <MemberPersonalTab
            member={member}
            familyMembers={familyMembers}
            ageGroup={ageGroup}
            formattedBirthDate={formattedBirthDate}
            formattedRegistrationDate={formattedRegistrationDate}
            formatPhoneType={formatPhoneType}
          />
        </TabsContent>

        <TabsContent value="documents" className="focus-visible:outline-none">
          <MemberDocumentsTab
            member={member}
            formatDocDate={formatDocDate}
            updateDocumentStatus={updateDocumentStatus}
          />
        </TabsContent>

        <TabsContent value="sales" className="focus-visible:outline-none">
          <MemberSalesHistory memberId={member.id} memberName={fullName} />
        </TabsContent>

        <TabsContent value="attendance" className="focus-visible:outline-none">
          <MemberAttendanceHistory memberId={member.id} />
        </TabsContent>

        <TabsContent value="trainings" className="focus-visible:outline-none">
          <MemberTrainingsHistory memberId={member.id} />
        </TabsContent>

        <TabsContent value="volume" className="focus-visible:outline-none">
          <MemberTrainingVolumeTab memberId={member.id} />
        </TabsContent>

        <TabsContent value="assessments" className="focus-visible:outline-none">
          <MemberAssessmentsTab memberId={member.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
