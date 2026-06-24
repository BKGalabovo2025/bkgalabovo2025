import { Member } from "@/types";
import { getAgeGroup } from "../utils";

export interface GroupedMembers {
  [ageGroup: string]: Member[];
}

export function groupMembersByAgeGroup(members: Member[]): GroupedMembers {
  const groups: GroupedMembers = {};

  members.forEach((member) => {
    let group = member.dateOfBirth
      ? getAgeGroup(member.dateOfBirth)
      : "Неопределена";
    // Normalize older labels if needed to match Planner standards
    if (group === "Мъже/Жени") group = "Мъже и Жени";

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(member);
  });

  return groups;
}
