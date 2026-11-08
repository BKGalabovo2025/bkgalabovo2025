import {
  Activity,
  Contact as FamilyIcon,
  UserCog,
  Users,
} from "lucide-react";

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
