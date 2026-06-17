"use client";

import { Member, Sale } from "@/types";
import { Family } from "@/hooks/useMemberProfile";
import { checkIsMemberOverdue } from "@/lib/membership-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  Calendar,
  Users,
  Building,
  ArrowLeft,
  Pencil,
  FileText,
  Home,
  PhoneCall,
  BarChart2,
  Printer,
  AlertTriangle,
  CheckCircle,
  UserMinus,
  ScrollText,
  ShieldCheck,
  ClipboardCheck,
  Stethoscope,
  Contact,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

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
// Removed MemberSubscriptionsTab import

import { getAgeGroup, getInitials, formatFullName } from "@/lib/utils";

import { updateMemberAction } from "@/lib/actions/members";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { uploadFile } from "@/services/storage-service";
import { Camera, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

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

export const MemberDetailsCard = ({
  member,
  familyMembers,
  family: _family,
  sales = [],
  onRefresh,
}: MemberDetailsCardProps) => {
  const router = useRouter();
  const { idToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fullName = formatFullName(member);
  const ageGroup = member.dateOfBirth ? getAgeGroup(member.dateOfBirth) : null;
  const formattedBirthDate = member.dateOfBirth
    ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
    : null;
  const formattedRegistrationDate = member.registrationDate
    ? new Date(member.registrationDate).toLocaleDateString("bg-BG")
    : null;

  // 1. Изчисляваме статуса динамично и унифицирано с абонаментите
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

    // Map base names to actual fields
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
      // We don't necessarily clear the handed date, or we do?
      // User said "cancel" (Отмени) should probably clear it.
      updates[handedField] = null;
    }

    try {
      const result = await updateMemberAction(member.id, idToken, updates);
      if (result.success) {
        if (action !== "print") {
          toast.success("Статусът е обновен успешно!");
        }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !idToken) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Моля, изберете валидно изображение");
      return;
    }

    // Validate size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Изображението е твърде голямо (макс. 2MB)");
      return;
    }

    setIsUploading(true);
    try {
      const path = `avatars/${member.id}_${Date.now()}`;
      const downloadUrl = await uploadFile(path, file);

      const result = await updateMemberAction(member.id, idToken, {
        avatarUrl: downloadUrl,
      });

      if (result.success) {
        toast.success("Снимката е обновена успешно");
        if (onRefresh) onRefresh();
        router.refresh();
      } else {
        toast.error("Грешка при обновяване на профила");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Грешка при качване на снимката");
    } finally {
      setIsUploading(false);
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
                  src={member.avatarUrl ?? undefined}
                  alt={fullName}
                  className="object-cover animate-in fade-in duration-500"
                />
                <AvatarFallback className="text-4xl font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100/50 dark:bg-zinc-900 flex items-center justify-center">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-2 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm text-white rounded-5xl opacity-0 group-hover:opacity-100 transition-all disabled:opacity-100"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin h-8 w-8" strokeWidth={1.5} />
                ) : (
                  <Camera size={32} strokeWidth={1.5} />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
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
                        isOverdue
                          ? "text-rose-600 dark:text-rose-400"
                          : !lastPayment
                            ? "text-zinc-500"
                            : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {isOverdue
                        ? "Дължи такса"
                        : !lastPayment
                          ? "Няма продажби"
                          : "Платено"}
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
          <TabsList className="w-full h-auto bg-zinc-50/50 border border-zinc-100 p-1 rounded-2xl sm:rounded-3xl mb-8 flex flex-nowrap overflow-x-auto no-scrollbar justify-start md:justify-center gap-1 scroll-smooth">
            <TabsTrigger
              value="personal"
              className="flex-none sm:flex-1 min-w-[100px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Данни
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex-none sm:flex-1 min-w-[100px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Документи
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="flex-none sm:flex-1 min-w-[100px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Финансова история
            </TabsTrigger>
            {/* Removed Услуги & Членство Trigger */}
            <TabsTrigger
              value="attendance"
              className="flex-none sm:flex-1 min-w-[110px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Присъствия
            </TabsTrigger>
            <TabsTrigger
              value="trainings"
              className="flex-none sm:flex-1 min-w-[110px] sm:min-w-0 h-10 sm:h-12 rounded-lg sm:rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[9px] sm:text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950 px-4 sm:px-0"
            >
              Тренировки
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal" className="focus-visible:outline-none">
          <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
              <InfoRow
                icon={Contact}
                label="Тип клиент"
                value={
                  member.memberType === "guest"
                    ? "Външен / Гост"
                    : member.memberType === "recovery"
                      ? "Клиент Възстановяване"
                      : "Клубен Член"
                }
              />
              <InfoRow icon={Mail} label="Имейл" value={member.email} />
              <InfoRow icon={Phone} label="Телефон" value={member.phone} />
              <InfoRow
                icon={PhoneCall}
                label="Тип на телефона"
                value={formatPhoneType(member.phoneType)}
              />
              <InfoRow
                icon={Phone}
                label="Спешен контакт"
                value={
                  member.emergencyContactName
                    ? `${member.emergencyContactName} (${member.emergencyContactPhone || "—"})`
                    : null
                }
              />
              <InfoRow
                icon={Calendar}
                label="Дата на раждане"
                value={formattedBirthDate}
              />
              <InfoRow
                icon={BarChart2}
                label="Възрастова група"
                value={member.ageGroup || ageGroup}
              />
              <InfoRow
                icon={Users}
                label="Пол"
                value={
                  member.gender === "male"
                    ? "Мъж"
                    : member.gender === "female"
                      ? "Жена"
                      : null
                }
              />
              <InfoRow
                icon={Trophy}
                label="Ниво на умения"
                value={
                  member.skillLevel === "beginner"
                    ? "Начинаещ"
                    : member.skillLevel === "intermediate"
                      ? "Средно напреднал"
                      : member.skillLevel === "advanced"
                        ? "Напреднал"
                        : member.skillLevel === "professional"
                          ? "Професионалист"
                          : null
                }
              />
              <div className="md:col-span-2">
                <div className="h-px bg-zinc-50 my-6" />
              </div>
              <InfoRow
                icon={Calendar}
                label="Регистрация"
                value={formattedRegistrationDate}
              />
              <InfoRow
                icon={Building}
                label="Училище"
                value={member.educationInstitution}
              />
              <InfoRow
                icon={Users}
                label="Екипировка"
                value={member.apparelSize}
              />
              <InfoRow icon={Home} label="Адрес" value={member.address} />

              {member.healthConditionNotes && (
                <div className="md:col-span-2 mt-4">
                  <InfoRow
                    icon={Stethoscope}
                    label="Здравно състояние / Травми"
                    value={member.healthConditionNotes}
                    isBlock={true}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <InfoRow
                  icon={FileText}
                  label="Бележки"
                  value={member.notes}
                  isBlock={true}
                />
              </div>
            </div>

            {familyMembers && familyMembers.length > 0 && (
              <div className="mt-16">
                <h3 className="text-[11px] font-medium uppercase tracking-widest3 text-zinc-400 mb-8 flex items-center gap-3">
                  <Users className="h-4 w-4" strokeWidth={1.5} />
                  Членове на семейството
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyMembers.map((familyMember) => (
                    <div
                      key={familyMember.id}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-all group"
                      onClick={() => router.push(`/members/${familyMember.id}`)}
                    >
                      <Avatar className="h-12 w-12 rounded-xl ring-1 ring-zinc-100">
                        <AvatarImage
                          src={familyMember.avatarUrl ?? undefined}
                          alt={formatFullName(familyMember)}
                        />
                        <AvatarFallback className="bg-zinc-50 text-zinc-400">
                          {getInitials(formatFullName(familyMember))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {formatFullName(familyMember)}
                        </p>
                        <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest truncate mt-1">
                          {familyMember.status === "active"
                            ? "Активен"
                            : "Неактивен"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="focus-visible:outline-none">
          <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-6">
            {/* Membership Application */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.hasMembershipApplication
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <FileText
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Молба за членство
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.hasMembershipApplication ? (
                      <span className="text-emerald-600 font-medium">
                        Предадена на{" "}
                        {formatDocDate(member.membershipApplicationHandedAt)}
                      </span>
                    ) : member.membershipApplicationPrintedAt ? (
                      <span>
                        Разпечатана на{" "}
                        {formatDocDate(member.membershipApplicationPrintedAt)}
                      </span>
                    ) : (
                      "Основен документ за приемане в клуба."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("membershipApplication", "print");
                    window.open(
                      `/members/${member.id}/membership-application`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.hasMembershipApplication &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "membershipApplication",
                      member.hasMembershipApplication ? "cancel" : "submit"
                    )
                  }
                >
                  {member.hasMembershipApplication
                    ? "Отмени"
                    : "Отбележи предадена"}
                </Button>
              </div>
            </div>

            {/* Membership Termination */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.hasTerminationRequest
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <UserMinus
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Молба за прекратяване
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.hasTerminationRequest ? (
                      <span className="text-emerald-600 font-medium">
                        Предадена на{" "}
                        {formatDocDate(member.terminationRequestHandedAt)}
                      </span>
                    ) : member.terminationRequestPrintedAt ? (
                      <span>
                        Разпечатана на{" "}
                        {formatDocDate(member.terminationRequestPrintedAt)}
                      </span>
                    ) : (
                      "Документ за прекратяване на членство."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("terminationRequest", "print");
                    window.open(
                      `/members/${member.id}/termination-request`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.hasTerminationRequest &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "terminationRequest",
                      member.hasTerminationRequest ? "cancel" : "submit"
                    )
                  }
                >
                  {member.hasTerminationRequest
                    ? "Отмени"
                    : "Отбележи предадена"}
                </Button>
              </div>
            </div>

            {/* Internal Rules */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.hasInternalRules
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <ScrollText
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Вътрешен правилник
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.hasInternalRules ? (
                      <span className="text-emerald-600 font-medium">
                        Приет на {formatDocDate(member.internalRulesHandedAt)}
                      </span>
                    ) : member.internalRulesPrintedAt ? (
                      <span>
                        Разпечатан на{" "}
                        {formatDocDate(member.internalRulesPrintedAt)}
                      </span>
                    ) : (
                      "Правила за работа и етика в клуба."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("internalRules", "print");
                    window.open(
                      `/members/${member.id}/internal-rules`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.hasInternalRules &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "internalRules",
                      member.hasInternalRules ? "cancel" : "submit"
                    )
                  }
                >
                  {member.hasInternalRules ? "Отмени" : "Отбележи приет"}
                </Button>
              </div>
            </div>

            {/* Informed Consent Declaration */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.hasSignedDeclaration
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  {member.hasSignedDeclaration ? (
                    <CheckCircle
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <AlertTriangle
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Декларация за информирано съгласие
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.hasSignedDeclaration ? (
                      <span className="text-emerald-600 font-medium">
                        Предадена на{" "}
                        {formatDocDate(member.signedDeclarationHandedAt)}
                      </span>
                    ) : member.signedDeclarationPrintedAt ? (
                      <span>
                        Разпечатана на{" "}
                        {formatDocDate(member.signedDeclarationPrintedAt)}
                      </span>
                    ) : (
                      "Липсва декларация!"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("signedDeclaration", "print");
                    window.open(`/members/${member.id}/declaration`, "_blank");
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.hasSignedDeclaration &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "signedDeclaration",
                      member.hasSignedDeclaration ? "cancel" : "submit"
                    )
                  }
                >
                  {member.hasSignedDeclaration
                    ? "Отмени"
                    : "Отбележи предадена"}
                </Button>
              </div>
            </div>

            {/* Participation & Travel Declaration */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.hasTravelDeclaration
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <ShieldCheck
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Съгласие за участие и пътуване
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.hasTravelDeclaration ? (
                      <span className="text-emerald-600 font-medium">
                        Предадено на{" "}
                        {formatDocDate(member.travelDeclarationHandedAt)}
                      </span>
                    ) : member.travelDeclarationPrintedAt ? (
                      <span>
                        Разпечатано на{" "}
                        {formatDocDate(member.travelDeclarationPrintedAt)}
                      </span>
                    ) : (
                      "Съгласие за транспорт и спортни събития."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("travelDeclaration", "print");
                    window.open(
                      `/members/${member.id}/participation-travel`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.hasTravelDeclaration &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "travelDeclaration",
                      member.hasTravelDeclaration ? "cancel" : "submit"
                    )
                  }
                >
                  {member.hasTravelDeclaration
                    ? "Отмени"
                    : "Отбележи предадено"}
                </Button>
              </div>
            </div>

            {/* Safety Instruction */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.hasSafetyInstruction
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <ClipboardCheck
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Инструктаж за безопасност
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.hasSafetyInstruction ? (
                      <span className="text-emerald-600 font-medium">
                        Предаден на{" "}
                        {formatDocDate(member.safetyInstructionHandedAt)}
                      </span>
                    ) : member.safetyInstructionPrintedAt ? (
                      <span>
                        Разпечатан на{" "}
                        {formatDocDate(member.safetyInstructionPrintedAt)}
                      </span>
                    ) : (
                      "Правила за пътуване и състезания."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("safetyInstruction", "print");
                    window.open(
                      `/members/${member.id}/safety-instruction`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.hasSafetyInstruction &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "safetyInstruction",
                      member.hasSafetyInstruction ? "cancel" : "submit"
                    )
                  }
                >
                  {member.hasSafetyInstruction ? "Отмени" : "Отбележи предаден"}
                </Button>
              </div>
            </div>

            {/* Combined Athlete Card (Kartoteka) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.isLicensed
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <Contact
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Картотека към БФБ
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.isLicensed ? (
                      <span className="text-emerald-600 font-medium">
                        Активна от {formatDocDate(member.isLicensedHandedAt)}
                      </span>
                    ) : member.isLicensedPrintedAt ? (
                      <span>
                        Разпечатана на{" "}
                        {formatDocDate(member.isLicensedPrintedAt)}
                      </span>
                    ) : (
                      "Няма активна картотека."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("isLicensed", "print");
                    window.open(`/members/${member.id}/athlete-card`, "_blank");
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.isLicensed &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "isLicensed",
                      member.isLicensed ? "cancel" : "submit"
                    )
                  }
                >
                  {member.isLicensed ? "Отмени" : "Активирай"}
                </Button>
              </div>
            </div>

            {/* Medical Certificate */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 sm:p-8 bg-zinc-50/50 rounded-3xl sm:rounded-4xl border border-zinc-100/50 gap-6">
              <div className="flex items-center gap-4 sm:gap-6 w-full">
                <div
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0",
                    member.hasMedicalCertificate
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  <Stethoscope
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1 truncate">
                    Медицинско свидетелство
                  </h4>
                  <p className="text-xs sm:text-sm font-light text-zinc-400 line-clamp-2">
                    {member.hasMedicalCertificate ? (
                      <span className="text-emerald-600 font-medium">
                        Предадено на{" "}
                        {formatDocDate(member.medicalCertificateHandedAt)}
                      </span>
                    ) : member.medicalCertificatePrintedAt ? (
                      <span>
                        Разпечатано на{" "}
                        {formatDocDate(member.medicalCertificatePrintedAt)}
                      </span>
                    ) : (
                      "Липсва медицинско свидетелство!"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-950 hover:text-white transition-all"
                  onClick={() => {
                    updateDocumentStatus("medicalCertificate", "print");
                    window.open(
                      `/members/${member.id}/medical-certificate`,
                      "_blank"
                    );
                  }}
                >
                  <Printer
                    className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.5}
                  />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 lg:flex-none h-10 sm:h-11 px-4 sm:px-6 rounded-lg sm:rounded-xl border-zinc-100 font-medium text-[9px] sm:text-[10px] uppercase tracking-widest transition-all",
                    !member.hasMedicalCertificate &&
                      "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                  )}
                  onClick={() =>
                    updateDocumentStatus(
                      "medicalCertificate",
                      member.hasMedicalCertificate ? "cancel" : "submit"
                    )
                  }
                >
                  {member.hasMedicalCertificate
                    ? "Отмени"
                    : "Отбележи предадено"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="focus-visible:outline-none">
          <MemberSalesHistory memberId={member.id} />
        </TabsContent>

        {/* Removed subscriptions TabContent */}

        <TabsContent value="attendance" className="focus-visible:outline-none">
          <MemberAttendanceHistory memberId={member.id} />
        </TabsContent>

        <TabsContent value="trainings" className="focus-visible:outline-none">
          <MemberTrainingsHistory memberId={member.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
  isBlock = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  isBlock?: boolean;
}) => {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div
      className={cn(
        "flex py-4 sm:py-6 border-b border-zinc-50 last:border-0",
        isBlock
          ? "flex-col items-start gap-3 sm:gap-4"
          : "flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
          {label}
        </span>
      </div>
      {!isBlock ? (
        <span className="text-sm font-light text-zinc-900 sm:text-right w-full sm:w-auto pl-12 sm:pl-0">
          {value}
        </span>
      ) : (
        <span className="text-sm font-light text-zinc-400 leading-relaxed max-w-xl pl-12">
          {value}
        </span>
      )}
    </div>
  );
};
