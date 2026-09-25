/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";

import { ShadowWizard } from "@/components/training/ShadowWizard";
import { Button } from "@/components/ui/button";
import { resolveMemberAgeGroup } from "@/lib/utils";
import { getAllMembersServer } from "@/services/member-service.server";

export const metadata = {
  title: "Shadow Training | BK Galabovo",
};

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
    // Only include registered CLUB members:
    // External/guest members are excluded unless isClubMember is set to true
    const clubMembersRaw = raw.filter((m: any) => {
      return (
        m.isClubMember === true || (!m.isGuest && m.memberType === "regular")
      );
    });

    // Pre-clean data to prevent Next.js serialization errors (e.g. Firebase Timestamps)
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
    <div className="flex min-h-[calc(100vh-65px)] w-full flex-1 flex-col items-center bg-zinc-50 p-4 dark:bg-black">
      <div className="flex size-full max-w-7xl flex-col space-y-4">
        <div className="shrink-0">
          <h1 className="flex items-center justify-between text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Shadow Training
            <Button variant="outline" size="sm" asChild>
              <Link href="/training/shadow/history">История</Link>
            </Button>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Интерактивен треньор за движения по корта.
          </p>
        </div>

        <div className="min-h-0 flex-1">
          <ShadowWizard initialMembers={members} />
        </div>
      </div>
    </div>
  );
}
