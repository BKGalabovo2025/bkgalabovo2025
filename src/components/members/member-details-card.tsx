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
      <div className="animate-pulse p-8 text-center text-slate-400">
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
      <div className="animate-pulse p-8 text-center text-slate-400">
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
      <div className="animate-pulse p-8 text-center text-slate-400">
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
      <div className="animate-pulse p-8 text-center text-slate-400">
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
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/members")}
          className="h-10 w-full rounded-xl border-zinc-100 px-6 text-[10px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-50 sm:h-12 sm:w-auto sm:text-[11px]"
        >
          <ArrowLeft className="mr-3 size-4" strokeWidth={1.5} /> Всички
        </Button>
        <Button
          onClick={() => router.push(`/members/${member.id}/edit`)}
          className="h-10 w-full rounded-xl bg-zinc-950 px-8 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800 sm:h-12 sm:w-auto sm:text-[11px]"
        >
          <Pencil className="mr-3 size-4" strokeWidth={1.5} /> Редактирай
        </Button>
      </div>

      <div className="overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none">
        <div className="relative h-32 w-full bg-zinc-50 sm:h-40">
          <div className="absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent" />
        </div>
        <div className="relative z-10 -mt-12 px-6 pb-8 sm:-mt-16 sm:px-10 sm:pb-10">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:gap-8 md:text-left">
            <div className="group relative">
              <Avatar className="size-32 rounded-5xl border-4 border-white bg-zinc-50 shadow-2xl sm:size-40 sm:rounded-6xl sm:border-8 dark:border-zinc-950 dark:bg-zinc-900">
                <AvatarImage
                  src={getValidAvatarUrl(member.avatarUrl)}
                  alt={fullName}
                  className="object-cover duration-500 animate-in fade-in"
                />
                <AvatarFallback className="flex items-center justify-center bg-zinc-100/50 text-4xl font-semibold text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="mb-2 flex-1 space-y-3 sm:mb-4 sm:space-y-4">
              <h2 className="text-3xl font-light tracking-tighter text-zinc-950 sm:text-5xl">
                {fullName}
              </h2>
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <Badge
                  variant="outline"
                  className={cn(
                    "tracking-widest2 rounded-full px-4 py-1 text-[10px] font-medium uppercase",
                    member.status === "active"
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border-rose-100 bg-rose-50 text-rose-700"
                  )}
                >
                  {member.status === "active" ? "Активен" : "Неактивен"}
                </Badge>
                {ageGroup && (
                  <Badge
                    variant="outline"
                    className="tracking-widest2 rounded-full border-zinc-100 px-4 py-1 text-[10px] font-medium text-zinc-400 uppercase"
                  >
                    {ageGroup}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mb-2 w-full sm:mb-4 md:w-auto">
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-5 shadow-xs shadow-zinc-100/10 sm:rounded-4xl sm:p-6 md:justify-start md:gap-6 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
                <div>
                  <p className="tracking-widest2 mb-1 text-[10px] font-semibold text-zinc-400 uppercase dark:text-zinc-500">
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
                        <span className="size-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {lastPayment.toLocaleDateString("bg-BG")}
                        </span>
                      </>
                    )}
                  </div>
                  {overdueReason && (
                    <p className="mt-1.5 text-xs font-normal text-zinc-600 dark:text-zinc-400">
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
        <div className="group relative">
          <TabsList className="mb-8 flex h-auto w-full flex-wrap gap-1 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-1.5">
            <TabsTrigger
              value="personal"
              className="h-9 flex-none rounded-xl border-transparent px-4 text-[9px] font-semibold tracking-widest whitespace-nowrap text-zinc-400 uppercase transition-all data-[state=active]:border data-[state=active]:border-zinc-100 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              Данни
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="h-9 flex-none rounded-xl border-transparent px-4 text-[9px] font-semibold tracking-widest whitespace-nowrap text-zinc-400 uppercase transition-all data-[state=active]:border data-[state=active]:border-zinc-100 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              Документи
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="h-9 flex-none rounded-xl border-transparent px-4 text-[9px] font-semibold tracking-widest whitespace-nowrap text-zinc-400 uppercase transition-all data-[state=active]:border data-[state=active]:border-zinc-100 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              Финансова история
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="h-9 flex-none rounded-xl border-transparent px-4 text-[9px] font-semibold tracking-widest whitespace-nowrap text-zinc-400 uppercase transition-all data-[state=active]:border data-[state=active]:border-zinc-100 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              Присъствия
            </TabsTrigger>
            <TabsTrigger
              value="trainings"
              className="h-9 flex-none rounded-xl border-transparent px-4 text-[9px] font-semibold tracking-widest whitespace-nowrap text-zinc-400 uppercase transition-all data-[state=active]:border data-[state=active]:border-zinc-100 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              Shadow тренировки
            </TabsTrigger>
            <TabsTrigger
              value="volume"
              className="h-9 flex-none rounded-xl border-transparent px-4 text-[9px] font-semibold tracking-widest whitespace-nowrap text-zinc-400 uppercase transition-all data-[state=active]:border data-[state=active]:border-zinc-100 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
            >
              Тренировъчен обем
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="h-9 flex-none rounded-xl border-transparent px-4 text-[9px] font-semibold tracking-widest whitespace-nowrap text-zinc-400 uppercase transition-all data-[state=active]:border data-[state=active]:border-zinc-100 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
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
          <MemberSalesHistory
            memberId={member.id}
            memberName={fullName}
            familyMembers={familyMembers}
          />
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
