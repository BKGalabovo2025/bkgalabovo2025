"use client";

import { Member } from "@/types";
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
  XCircle,
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
const MemberSubscriptionsTab = dynamic(
  () =>
    import("./member-subscriptions-tab").then(
      (mod) => mod.MemberSubscriptionsTab
    ),
  {
    loading: () => (
      <div className="p-8 text-center animate-pulse text-slate-400">
        Зареждане на абонаменти...
      </div>
    ),
  }
);

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
}

const formatPhoneType = (phoneType: string | null | undefined) => {
  if (!phoneType) return null;
  return phoneType === "personal" ? "Личен" : "На родител";
};

export const MemberDetailsCard = ({
  member,
  familyMembers,
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

  // 1. Изчисляваме статуса
  const lastPayment = member.lastPaymentDate
    ? new Date(member.lastPaymentDate)
    : null;
  const isOverdue =
    !lastPayment ||
    Math.floor(
      (new Date().getTime() - lastPayment.getTime()) / (1000 * 3600 * 24)
    ) > 30;

  // 2. Функцията за плащане
  const handlePayment = async () => {
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }

    if (!confirm("Маркиране на месечната такса като платена?")) return;

    try {
      const result = await updateMemberAction(member.id, idToken, {
        lastPaymentDate: new Date().toISOString(),
      });

      if (result.success) {
        toast.success("Успешно платено!");
        router.refresh();
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Грешка при плащане");
    }
  };

  const toggleDocumentStatus = async (
    field: "hasSignedDeclaration" | "hasMedicalCertificate" | "isLicensed",
    currentValue: boolean | undefined
  ) => {
    if (!idToken) return;
    try {
      const result = await updateMemberAction(member.id, idToken, {
        [field]: !currentValue,
      });
      if (result.success) {
        toast.success("Статусът е обновен успешно!");
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
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/members")}
          className="h-12 px-6 rounded-xl border-zinc-100 hover:bg-zinc-50 font-medium text-[11px] uppercase tracking-widest transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4" strokeWidth={1.5} /> Всички
          членове
        </Button>
        <Button
          onClick={() => router.push(`/members/${member.id}/edit`)}
          className="h-12 px-8 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest shadow-none transition-all"
        >
          <Pencil className="mr-3 h-4 w-4" strokeWidth={1.5} /> Редактирай
        </Button>
      </div>

      <div className="overflow-hidden bg-white border border-zinc-100 rounded-5xl shadow-none">
        <div className="h-40 bg-zinc-50 w-full relative">
          <div className="absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent" />
        </div>
        <div className="px-10 pb-10 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="relative group">
              <Avatar className="h-40 w-40 border-8 border-white shadow-2xl rounded-6xl bg-zinc-50">
                <AvatarImage
                  src={member.avatarUrl ?? undefined}
                  alt={fullName}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-light text-zinc-200">
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

            <div className="flex-1 space-y-4 mb-4">
              <h2 className="text-5xl font-light text-zinc-950 tracking-tighter">
                {fullName}
              </h2>
              <div className="flex items-center gap-3">
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

            <div className="mb-4">
              <div className="bg-zinc-50 border border-zinc-100/50 p-6 rounded-4xl flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400 mb-1">
                    Финансов статус
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isOverdue ? "text-rose-500" : "text-emerald-500"
                      )}
                    >
                      {isOverdue ? "Дължи такса" : "Платено"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-200" />
                    <span className="text-[11px] font-light text-zinc-400 uppercase tracking-widest">
                      {lastPayment
                        ? lastPayment.toLocaleDateString("bg-BG")
                        : "няма данни"}
                    </span>
                  </div>
                </div>
                {isOverdue && (
                  <Button
                    size="sm"
                    onClick={handlePayment}
                    className="h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 text-[10px] font-medium uppercase tracking-widest shadow-none"
                  >
                    Плати
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full h-16 bg-zinc-50/50 border border-zinc-100 p-2 rounded-3xl mb-8 overflow-x-auto justify-start no-scrollbar md:justify-center scroll-smooth">
          <TabsTrigger
            value="personal"
            className="shrink-0 md:flex-1 px-6 md:px-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950"
          >
            Лични данни
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="shrink-0 md:flex-1 px-6 md:px-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950"
          >
            Документи
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="shrink-0 md:flex-1 px-6 md:px-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950"
          >
            Финанси
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="shrink-0 md:flex-1 px-6 md:px-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950"
          >
            Абонаменти
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="shrink-0 md:flex-1 px-6 md:px-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border border-transparent data-[state=active]:border-zinc-100 text-[11px] font-medium uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-950"
          >
            Присъствия
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="focus-visible:outline-none">
          <div className="bg-white border border-zinc-100 rounded-5xl p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
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
              <InfoRow icon={FileText} label="ЕГН" value={member.personalId} />
              <InfoRow icon={Home} label="Адрес" value={member.address} />
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
          <div className="bg-white border border-zinc-100 rounded-5xl p-10 space-y-6">
            <div className="flex items-center justify-between p-8 bg-zinc-50/50 rounded-4xl border border-zinc-100/50">
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    member.hasSignedDeclaration
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  {member.hasSignedDeclaration ? (
                    <CheckCircle className="h-6 w-6" strokeWidth={1.5} />
                  ) : (
                    <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <h4 className="text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1">
                    Декларация за съгласие
                  </h4>
                  <p className="text-sm font-light text-zinc-400">
                    {member.hasSignedDeclaration
                      ? "Декларацията е попълнена и подписана."
                      : "Липсва попълнена декларация."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="h-11 px-6 rounded-xl border-zinc-100 font-medium text-[10px] uppercase tracking-widest"
                  onClick={() =>
                    window.open(`/members/${member.id}/declaration`, "_blank")
                  }
                >
                  <Printer className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Печат
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 px-6 rounded-xl border-zinc-100 font-medium text-[10px] uppercase tracking-widest transition-all",
                    !member.hasSignedDeclaration &&
                      "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                  )}
                  onClick={() =>
                    toggleDocumentStatus(
                      "hasSignedDeclaration",
                      member.hasSignedDeclaration
                    )
                  }
                >
                  {member.hasSignedDeclaration
                    ? "Маркирай липсваща"
                    : "Отбележи предадена"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-8 bg-zinc-50/50 rounded-4xl border border-zinc-100/50">
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    member.hasMedicalCertificate
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  {member.hasMedicalCertificate ? (
                    <CheckCircle className="h-6 w-6" strokeWidth={1.5} />
                  ) : (
                    <XCircle className="h-6 w-6" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <h4 className="text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1">
                    Медицинско свидетелство
                  </h4>
                  <p className="text-sm font-light text-zinc-400">
                    {member.hasMedicalCertificate
                      ? "Медицинското е предадено."
                      : "Липсва медицинско свидетелство!"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className={cn(
                  "h-11 px-6 rounded-xl border-zinc-100 font-medium text-[10px] uppercase tracking-widest transition-all",
                  !member.hasMedicalCertificate &&
                    "bg-rose-500 text-white border-rose-500 hover:bg-rose-600"
                )}
                onClick={() =>
                  toggleDocumentStatus(
                    "hasMedicalCertificate",
                    member.hasMedicalCertificate
                  )
                }
              >
                {member.hasMedicalCertificate
                  ? "Отмени предаването"
                  : "Отбележи предадено"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-8 bg-zinc-50/50 rounded-4xl border border-zinc-100/50">
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "p-4 rounded-2xl",
                    member.isLicensed
                      ? "bg-zinc-950 text-white"
                      : "bg-white border border-zinc-100 text-zinc-300"
                  )}
                >
                  {member.isLicensed ? (
                    <CheckCircle className="h-6 w-6" strokeWidth={1.5} />
                  ) : (
                    <XCircle className="h-6 w-6" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <h4 className="text-[11px] font-medium uppercase tracking-widest2 text-zinc-950 mb-1">
                    Картотека към БФБ
                  </h4>
                  <p className="text-sm font-light text-zinc-400">
                    {member.isLicensed
                      ? "Активна картотека."
                      : "Няма активна картотека."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className={cn(
                  "h-11 px-6 rounded-xl border-zinc-100 font-medium text-[10px] uppercase tracking-widest transition-all",
                  !member.isLicensed &&
                    "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-800"
                )}
                onClick={() =>
                  toggleDocumentStatus("isLicensed", member.isLicensed)
                }
              >
                {member.isLicensed ? "Премахни" : "Картотекирай"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="focus-visible:outline-none">
          <MemberSalesHistory memberId={member.id} />
        </TabsContent>

        <TabsContent
          value="subscriptions"
          className="focus-visible:outline-none"
        >
          <MemberSubscriptionsTab memberId={member.id} />
        </TabsContent>

        <TabsContent value="attendance" className="focus-visible:outline-none">
          <MemberAttendanceHistory memberId={member.id} />
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
        "flex py-6 border-b border-zinc-50 last:border-0",
        isBlock ? "flex-col items-start gap-4" : "items-center justify-between"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
          {label}
        </span>
      </div>
      {!isBlock ? (
        <span className="text-sm font-light text-zinc-900">{value}</span>
      ) : (
        <span className="text-sm font-light text-zinc-400 leading-relaxed max-w-xl pl-12">
          {value}
        </span>
      )}
    </div>
  );
};
