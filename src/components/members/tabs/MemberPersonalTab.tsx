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
        "flex border-b border-zinc-50 py-4 last:border-0 sm:py-6",
        isBlock
          ? "flex-col items-start gap-3 sm:gap-4"
          : "flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50">
          <Icon className="size-3.5 text-zinc-400" strokeWidth={1.5} />
        </div>
        <span className="tracking-widest2 text-[10px] font-medium text-zinc-400 uppercase">
          {label}
        </span>
      </div>
      {!isBlock ? (
        <span className="w-full pl-12 text-sm font-light text-zinc-900 sm:w-auto sm:pl-0 sm:text-right">
          {value}
        </span>
      ) : (
        <span className="max-w-xl pl-12 text-sm leading-relaxed font-light text-zinc-400">
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
    <div className="rounded-3xl border border-zinc-100 bg-white p-4 sm:rounded-4xl sm:p-8 lg:rounded-5xl lg:p-10">
      <div className="grid grid-cols-1 gap-x-16 gap-y-2 md:grid-cols-2">
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
          <div className="my-6 h-px bg-zinc-50" />
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
          <div className="mt-4 md:col-span-2">
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
          <h3 className="tracking-widest3 mb-8 flex items-center gap-3 text-[11px] font-medium text-zinc-400 uppercase">
            <Users className="size-4" strokeWidth={1.5} />
            Членове на семейството
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {familyMembers.map((familyMember) => (
              <div
                key={familyMember.id}
                className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-100 p-4 transition-all hover:bg-zinc-50"
                onClick={() => router.push(`/members/${familyMember.id}`)}
              >
                <Avatar className="size-12 rounded-xl ring-1 ring-zinc-100">
                  <AvatarImage
                    src={familyMember.avatarUrl ?? undefined}
                    alt={formatFullName(familyMember)}
                  />
                  <AvatarFallback className="bg-zinc-50 text-zinc-400">
                    {getInitials(formatFullName(familyMember))}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {formatFullName(familyMember)}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-light tracking-widest text-zinc-400 uppercase">
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
