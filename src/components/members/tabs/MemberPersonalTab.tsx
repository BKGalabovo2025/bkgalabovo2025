"use client";

import React from "react";
import { Member } from "@/types";
import { cn, formatFullName, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  Calendar,
  Users,
  Building,
  Home,
  PhoneCall,
  BarChart2,
  Stethoscope,
  Contact,
  Trophy,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface MemberPersonalTabProps {
  member: Member;
  familyMembers: Member[];
  ageGroup: string | null;
  formattedBirthDate: string | null;
  formattedRegistrationDate: string | null;
  formatPhoneType: (phoneType: string | null | undefined) => string | null;
}

// ── Pure label helpers (no nested ternaries) ──────────────────────────────────────

function getMemberTypeLabel(member: { memberType?: string | null; isClubMember?: boolean; isRecoveryMember?: boolean; isGuest?: boolean }): string {
  const roles: string[] = [];
  if (member.isClubMember) roles.push("Клубен член");
  if (member.isRecoveryMember) roles.push("Член на зоната");
  if (member.isGuest) roles.push("Външен / Гост");
  if (roles.length > 0) return roles.join(" + ");
  // Fallback to old memberType
  if (member.memberType === "guest") return "Външен / Гост";
  if (member.memberType === "recovery") return "Клиент Възстановяване";
  return "Клубен член";
}

function getGenderLabel(gender: string | null | undefined): string | null {
  if (gender === "male") return "Мъж";
  if (gender === "female") return "Жена";
  return null;
}

function getSkillLevelLabel(skillLevel: string | null | undefined): string | null {
  if (skillLevel === "beginner") return "Начинаещ";
  if (skillLevel === "intermediate") return "Средно напреднал";
  if (skillLevel === "advanced") return "Напреднал";
  if (skillLevel === "professional") return "Професионалист";
  return null;
}

function getFamilyMemberStatusLabel(status: string | null | undefined): string {
  return status === "active" ? "Активен" : "Неактивен";
}

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

export const MemberPersonalTab = ({
  member,
  familyMembers,
  ageGroup,
  formattedBirthDate,
  formattedRegistrationDate,
  formatPhoneType,
}: MemberPersonalTabProps) => {
  const router = useRouter();

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
        <InfoRow icon={Contact} label="Тип клиент" value={getMemberTypeLabel(member)} />
        <InfoRow icon={Mail} label="Имейл" value={member.email} />
        <InfoRow icon={Phone} label="Телефон" value={member.phone} />
        <InfoRow icon={PhoneCall} label="Тип на телефона" value={formatPhoneType(member.phoneType)} />
        <InfoRow
          icon={Phone}
          label="Спешен контакт"
          value={
            member.emergencyContactName
              ? `${member.emergencyContactName} (${member.emergencyContactPhone || "—"})`
              : null
          }
        />
        <InfoRow icon={Calendar} label="Дата на раждане" value={formattedBirthDate} />
        <InfoRow icon={BarChart2} label="Възрастова група" value={member.ageGroup || ageGroup} />
        <InfoRow icon={Users} label="Пол" value={getGenderLabel(member.gender)} />
        <InfoRow icon={Trophy} label="Ниво на умения" value={getSkillLevelLabel(member.skillLevel)} />
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
                    {getFamilyMemberStatusLabel(familyMember.status)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
