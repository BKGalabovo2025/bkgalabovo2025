/* eslint-disable @typescript-eslint/no-explicit-any */
import { ShadowWizard } from "@/components/training/ShadowWizard";
import { resolveMemberAgeGroup } from "@/lib/utils";
import { getAllMembersServer } from "@/services/member-service.server";

export default async function ShadowTrainingPage() {
  let members: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    ageGroup?: string;
  }[] = [];
  try {
    const raw = await getAllMembersServer();
    const clubMembersRaw = raw.filter((m: any) => {
      return (
        m.isClubMember === true || (!m.isGuest && m.memberType === "regular")
      );
    });

    members = clubMembersRaw.map((m: any) => {
      const resolvedAgeGroup = resolveMemberAgeGroup(m);
      return {
        id: m.id,
        firstName: m.firstName || "",
        lastName: m.lastName || "",
        displayName:
          m.displayName ||
          (m.firstName && m.lastName
            ? `${m.firstName} ${m.lastName}`
            : m.name || "Неизвестен играч"),
        ageGroup: resolvedAgeGroup,
      };
    });
  } catch (e: unknown) {
    console.error("Error fetching members", e);
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <div className="size-full">
        <ShadowWizard initialMembers={members} />
      </div>
    </div>
  );
}
