"use client";

import { useState, useEffect } from "react";
import { Member } from "@/types";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ShieldCheck,
  UserCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MemberSalesHistory } from "./member-sales-history";
import { MemberAttendanceHistory } from "./MemberAttendanceHistory";
import { MemberSubscriptionsTab } from "./member-subscriptions-tab";
import { getAgeGroup, getInitials, formatFullName, cn } from "@/lib/utils";
import { updateMember } from "@/services/member-service";
import { getMemberMonthlyBillingHistory, MonthlyBillingInfo } from "@/services/sales-service";
import { toast } from "sonner";
import { FamilyManager } from "./family-manager";

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
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "personal";
  const [showFamilyView, setShowFamilyView] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    router.refresh();
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/members/${member.id}?${params.toString()}`, { scroll: false });
  };

  const fullName = formatFullName(member);
  const ageGroup = member.dateOfBirth ? getAgeGroup(member.dateOfBirth) : null;
  const formattedBirthDate = member.dateOfBirth
    ? new Date(member.dateOfBirth).toLocaleDateString("bg-BG")
    : null;
  const formattedRegistrationDate = member.registrationDate
    ? new Date(member.registrationDate).toLocaleDateString("bg-BG")
    : null;

  // 1. Изчисляваме статуса на база историята
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const history = await getMemberMonthlyBillingHistory(member.id);
        setBillingHistory(history);
      } catch (err) {
        console.error("Error fetching billing for status:", err);
      } finally {
        setLoadingBilling(false);
      }
    };
    fetchBilling();
  }, [member.id]);

  const hasUnpaidMonths = billingHistory.some((h: MonthlyBillingInfo) => !h.isPaid && h.attendanceCount > 0);
  const lastPayment = member.lastPaymentDate ? new Date(member.lastPaymentDate) : null;
  
  // Статусът е "Дължи такса", ако има неплатени месеци с присъствия
  const isOverdue = hasUnpaidMonths;

  // 2. Функцията за плащане
  const handlePayment = async () => {
    router.push(`/members/${member.id}?tab=sales`); // Пренасочваме към раздела за плащане
    toast.info("Моля, използвайте бутоните за бързо плащане в раздел 'Финанси'.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/members")}
          className="rounded-2xl h-12 px-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-black text-xs uppercase tracking-widest text-zinc-500"
        >
          <ArrowLeft className="mr-3 h-4 w-4" /> Назад към списъка
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push(`/members/${member.id}/edit`)}
            className="h-12 px-8 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 shadow-xl transition-all font-black text-xs uppercase tracking-widest"
          >
            <Pencil className="mr-2 h-4 w-4" /> Редактирай профил
          </Button>
        </div>
      </div>

      {/* Premium Profile Header */}
      <div className="relative -mx-8 px-8 py-16 premium-header rounded-b-[4rem] shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] blur-2xl group-hover:scale-110 transition-transform duration-500" />
            <Avatar className="h-44 w-44 rounded-[2.5rem] border-4 border-white/30 shadow-2xl relative z-10">
              <AvatarImage src={member.avatarUrl ?? undefined} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-white text-blue-600 text-5xl font-black rounded-[2.5rem]">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg z-20",
              member.status === "active" ? "bg-emerald-500" : "bg-zinc-400"
            )}>
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                ID: {member.id.slice(-6).toUpperCase()}
              </Badge>
              {ageGroup && (
                <Badge className="bg-blue-400/30 backdrop-blur-md text-white border-white/30 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                  ГРУПА: {ageGroup}
                </Badge>
              )}
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white font-heading leading-tight drop-shadow-sm">
              {fullName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-blue-50/80 font-bold uppercase text-xs tracking-widest">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white" />
                {member.email || "Няма имейл"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-white" />
                {member.phone || "Няма телефон"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white" />
                От {formattedRegistrationDate}
              </div>
            </div>
          </div>

          {/* Financial Summary Card in Header */}
          <div className="w-full md:w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Финансов статус</span>
              {loadingBilling ? (
                <Loader2 size={16} className="animate-spin text-white/50" />
              ) : (
                <Badge className={cn(
                  "px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest",
                  isOverdue ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                )}>
                  {isOverdue ? "Дължи такса" : "Редовен"}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-white text-3xl font-black font-heading">
                {isOverdue ? "Такса дължима" : "Всичко платено"}
              </p>
              <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest">
                Последно плащане: {lastPayment ? lastPayment.toLocaleDateString("bg-BG") : "Няма данни"}
              </p>
            </div>
            {isOverdue && (
              <Button
                onClick={handlePayment}
                className="w-full h-12 bg-white text-blue-600 hover:bg-zinc-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
              >
                Към плащанията
              </Button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-900/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800">
            <TabsTrigger value="personal" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all">Лични данни</TabsTrigger>
            <TabsTrigger value="sales" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all">Финанси</TabsTrigger>
            <TabsTrigger value="subscriptions" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all">Абонаменти</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all">Присъствия</TabsTrigger>
          </TabsList>

          {familyMembers && familyMembers.length > 0 && (
            <Button 
              variant={showFamilyView ? "default" : "outline"}
              size="lg"
              onClick={() => setShowFamilyView(!showFamilyView)}
              className={cn(
                "rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest transition-all shadow-xl",
                showFamilyView 
                  ? "bg-zinc-950 text-white hover:bg-zinc-800" 
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              )}
            >
              <Users className={cn("h-4 w-4 mr-3", showFamilyView ? "text-blue-400" : "text-zinc-400")} />
              {showFamilyView ? "Семеен изглед: ВКЛЮЧЕН" : "Превключи към Семеен изглед"}
            </Button>
          )}
        </div>

        <TabsContent value="personal" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="premium-card p-10">
                <h3 className="text-2xl font-black mb-8 flex items-center text-zinc-950 dark:text-white font-heading uppercase tracking-tight">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 mr-4 shadow-inner">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  Персонална информация
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <PremiumInfoItem icon={Mail} label="Имейл адрес" value={member.email} />
                  <PremiumInfoItem icon={Phone} label="Телефонен номер" value={member.phone} />
                  <PremiumInfoItem
                    icon={PhoneCall}
                    label="Тип на телефона"
                    value={formatPhoneType(member.phoneType)}
                  />
                  <PremiumInfoItem
                    icon={Calendar}
                    label="Дата на раждане"
                    value={formattedBirthDate}
                  />
                  <PremiumInfoItem icon={Home} label="Постоянен адрес" value={member.address} />
                  <PremiumInfoItem
                    icon={Phone}
                    label="Спешен контакт"
                    value={
                      member.emergencyContactName
                        ? `${member.emergencyContactName} (${member.emergencyContactPhone || "—"})`
                        : null
                    }
                  />
                </div>
              </div>

              <div className="premium-card p-10">
                <h3 className="text-2xl font-black mb-8 flex items-center text-zinc-950 dark:text-white font-heading uppercase tracking-tight">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 mr-4 shadow-inner">
                    <Building className="h-6 w-6" />
                  </div>
                  Администрация & Спорт
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <PremiumInfoItem
                    icon={Building}
                    label="Учебно заведение"
                    value={member.educationInstitution}
                  />
                  <PremiumInfoItem
                    icon={Users}
                    label="Размер екипировка"
                    value={member.apparelSize}
                  />
                  <PremiumInfoItem
                    icon={BarChart2}
                    label="Ниво на умения"
                    value={
                      member.skillLevel === "beginner" ? "Начално" :
                      member.skillLevel === "intermediate" ? "Средно" :
                      member.skillLevel === "advanced" ? "Напреднало" :
                      member.skillLevel === "professional" ? "Професионално" : null
                    }
                  />
                  <PremiumInfoItem
                    icon={BarChart2}
                    label="Рейтинг"
                    value={member.rating?.toString()}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="premium-card p-8 bg-zinc-950 dark:bg-zinc-900 border-none">
                <h3 className="text-lg font-black mb-6 text-white font-heading uppercase tracking-widest flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-blue-400" />
                  Вътрешни бележки
                </h3>
                <div className="bg-white/5 p-6 rounded-2xl text-blue-50/70 text-sm font-medium leading-relaxed italic border border-white/5 shadow-inner">
                  {member.notes || "Няма въведени административни бележки за този член."}
                </div>
              </div>

              <div className="premium-card p-8">
                <FamilyManager 
                  currentMember={member} 
                  familyMembers={familyMembers} 
                  onUpdate={handleRefresh} 
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-0">
          <MemberSalesHistory 
            memberId={member.id} 
            member={member} 
            familyMembers={familyMembers} 
            showFamily={showFamilyView}
          />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-0">
          <MemberSubscriptionsTab 
            memberId={member.id} 
            familyMembers={familyMembers}
            showFamily={showFamilyView}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <MemberAttendanceHistory 
            memberId={member.id} 
            familyMembers={familyMembers}
            showFamily={showFamilyView}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PremiumInfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) => {
  if (!value) return null;

  return (
    <div className="group space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-heading break-all pl-6">
        {value}
      </p>
    </div>
  );
};
