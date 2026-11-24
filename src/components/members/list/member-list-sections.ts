import { Activity, Contact as FamilyIcon, UserCog, Users } from "lucide-react";

import { Member } from "@/types";

export function isClubMemberProfile(m: Member): boolean {
  return m.isClubMember === true || (!m.isGuest && !m.isRecoveryMember);
}

export function isRecoveryProfile(m: Member): boolean {
  return Boolean(m.isRecoveryMember);
}

export function isGuestProfile(m: Member): boolean {
  return Boolean(m.isGuest);
}

export type MemberListSectionId = "club" | "guests" | "recovery" | "families";

export interface MemberListSectionConfig {
  id: MemberListSectionId;
  label: string;
  pathSuffix: string;
  href: string;
  description: string;
  icon: typeof Users;
}

export const MEMBER_LIST_SECTIONS: readonly MemberListSectionConfig[] = [
  {
    id: "club",
    label: "Клубни членове",
    pathSuffix: "club",
    href: "/members/club",
    description:
      "Картотекирани състезатели на Бадминтон Клуб Гълъбово с възрастови групи.",
    icon: Users,
  },
  {
    id: "recovery",
    label: "Зона Възстановяване",
    pathSuffix: "recovery",
    href: "/members/recovery",
    description:
      "Клиенти на Recovery Zone by ZM със здравни досиета и процедури.",
    icon: Activity,
  },
  {
    id: "guests",
    label: "Външни / Гости",
    pathSuffix: "guests",
    href: "/members/guests",
    description: "Любители и почасови играчи без постоянна клубна картотека.",
    icon: UserCog,
  },
  {
    id: "families",
    label: "Семейства",
    pathSuffix: "families",
    href: "/members/families",
    description: "Обединени семейни профили със споделени такси и отстъпки.",
    icon: FamilyIcon,
  },
] as const;

export function getActiveMemberListSectionId(
  pathname: string
): MemberListSectionId | "all" | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/members") return "all";
  if (!normalized.startsWith("/members/")) return null;

  const segment = normalized.slice("/members/".length).split("/")[0];
  const match = MEMBER_LIST_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}

/**
 * Премахва тежки Base64 полета (напр. електронни подписи, документи, големи data-URI),
 * които не се използват в списъчните таблици, за да не раздуват RSC/HTML payload-а.
 */
export function stripHeavyFieldsForMemberList(members: Member[]): Member[] {
  return members.map((m) => {
    const clean = { ...m } as Member & Record<string, unknown>;
    delete clean.signature;
    delete clean.signatures;
    delete clean.documents;
    delete clean.signedDocuments;
    delete clean.declarations;
    delete clean.history;
    if (
      typeof clean.avatarUrl === "string" &&
      clean.avatarUrl.startsWith("data:") &&
      clean.avatarUrl.length > 512
    ) {
      delete clean.avatarUrl;
    }
    return clean as Member;
  });
}
