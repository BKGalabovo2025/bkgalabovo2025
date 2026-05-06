"use client";

import { Member } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
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
      const result = await updateMemberAction(idToken, member.id, {
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
      const result = await updateMemberAction(idToken, member.id, {
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

      const result = await updateMemberAction(idToken, member.id, {
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
          className="rounded-xl border-slate-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Всички членове
        </Button>
        <Button
          onClick={() => router.push(`/members/${member.id}/edit`)}
          className="rounded-xl shadow-lg bg-slate-900"
        >
          <Pencil className="mr-2 h-4 w-4" /> Редактирай
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 w-full" />
        <CardContent className="px-8 pb-8 -mt-12">
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-3xl bg-slate-100">
                <AvatarImage
                  src={member.avatarUrl ?? undefined}
                  alt={fullName}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-black text-slate-300">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:bg-black/20"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Camera size={24} />
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

            <div className="flex-1 space-y-1 mb-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {fullName}
              </h2>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                    member.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {member.status === "active" ? "Активен" : "Неактивен"}
                </Badge>
                {ageGroup && (
                  <Badge
                    variant="outline"
                    className="rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-slate-200"
                  >
                    {ageGroup}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase">
            Финансов статус
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isOverdue ? "destructive" : "success"}>
              {isOverdue ? "Дължи такса" : "Редовен"}
            </Badge>
            <span className="text-xs text-gray-400">
              Последно:{" "}
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
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Плати такса
          </Button>
        )}
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Лични данни</TabsTrigger>
          <TabsTrigger value="documents">Документи</TabsTrigger>
          <TabsTrigger value="sales">Финансова история</TabsTrigger>
          <TabsTrigger value="subscriptions">Абонаменти</TabsTrigger>
          <TabsTrigger value="attendance">Присъствия</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardContent className="pt-6 space-y-4">
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
                icon={Calendar}
                label="Дата на регистрация"
                value={formattedRegistrationDate}
              />
              <InfoRow
                icon={Building}
                label="Учебно заведение"
                value={member.educationInstitution}
              />
              <InfoRow
                icon={Users}
                label="Размер екипировка"
                value={member.apparelSize}
              />
              <InfoRow icon={FileText} label="ЕГН" value={member.personalId} />
              <InfoRow icon={Home} label="Адрес" value={member.address} />
              <InfoRow
                icon={FileText}
                label="Бележки"
                value={member.notes}
                isBlock={true}
              />

              {familyMembers && familyMembers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mt-6 mb-3 flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Членове на семейството
                  </h3>
                  <div className="space-y-3">
                    {familyMembers.map((familyMember) => (
                      <div
                        key={familyMember.id}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/members/${familyMember.id}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            router.push(`/members/${familyMember.id}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={familyMember.avatarUrl ?? undefined}
                            alt={formatFullName(familyMember)}
                          />
                          <AvatarFallback>
                            {getInitials(formatFullName(familyMember))}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {formatFullName(familyMember)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {familyMember.email || "Няма имейл"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-full",
                      member.hasSignedDeclaration
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
                    )}
                  >
                    {member.hasSignedDeclaration ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <AlertTriangle className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Декларация за съгласие
                    </h4>
                    <p className="text-sm text-slate-500">
                      {member.hasSignedDeclaration
                        ? "Декларацията е попълнена и подписана."
                        : "Липсва попълнена декларация."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(`/members/${member.id}/declaration`, "_blank")
                    }
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Принтирай
                  </Button>
                  <Button
                    variant={
                      member.hasSignedDeclaration ? "outline" : "default"
                    }
                    onClick={() =>
                      toggleDocumentStatus(
                        "hasSignedDeclaration",
                        member.hasSignedDeclaration
                      )
                    }
                  >
                    {member.hasSignedDeclaration
                      ? "Маркирай като липсваща"
                      : "Отбележи като предадена"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-full",
                      member.hasMedicalCertificate
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-rose-100 text-rose-600"
                    )}
                  >
                    {member.hasMedicalCertificate ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Медицинско свидетелство
                    </h4>
                    <p className="text-sm text-slate-500">
                      {member.hasMedicalCertificate
                        ? "Медицинското за текущата година е предадено."
                        : "ЗАДЪЛЖИТЕЛНО: Не е предадено медицинско свидетелство!"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={member.hasMedicalCertificate ? "outline" : "default"}
                  className={
                    !member.hasMedicalCertificate
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : ""
                  }
                  onClick={() =>
                    toggleDocumentStatus(
                      "hasMedicalCertificate",
                      member.hasMedicalCertificate
                    )
                  }
                >
                  {member.hasMedicalCertificate
                    ? "Отмени предаването"
                    : "Отбележи като предадено"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-full",
                      member.isLicensed
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {member.isLicensed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Картотека към БФБ
                    </h4>
                    <p className="text-sm text-slate-500">
                      {member.isLicensed
                        ? "Състезателят има активна картотека."
                        : "Няма активна картотека към федерацията."}
                    </p>
                  </div>
                </div>
                <Button
                  variant={member.isLicensed ? "outline" : "default"}
                  onClick={() =>
                    toggleDocumentStatus("isLicensed", member.isLicensed)
                  }
                >
                  {member.isLicensed ? "Премахни картотека" : "Картотекирай"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <MemberSalesHistory memberId={member.id} />
        </TabsContent>

        <TabsContent value="subscriptions">
          <MemberSubscriptionsTab memberId={member.id} />
        </TabsContent>

        <TabsContent value="attendance">
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

  const layoutClass = isBlock
    ? "flex-col items-start space-y-2"
    : "flex-row items-center";

  return (
    <div
      className={`flex text-sm py-2 border-b last:border-b-0 ${layoutClass}`}
    >
      <div className="flex items-center w-full">
        <Icon className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
        <span className="font-semibold mr-2 w-40 flex-shrink-0">{label}:</span>
        {!isBlock && (
          <span className="text-muted-foreground break-all">{value}</span>
        )}
      </div>
      {isBlock && (
        <span className="text-muted-foreground pl-7 text-sm whitespace-pre-wrap">
          {value}
        </span>
      )}
    </div>
  );
};
