import { ShadowWizard } from "@/components/training/ShadowWizard";
import { getAllMembersServer } from "@/services/member-service.server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Shadow Training | BK Galabovo",
};

export default async function ShadowTrainingPage() {
  let members: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
  }[] = [];
  try {
    const raw = await getAllMembersServer();
    // Pre-clean data to prevent Next.js serialization errors (e.g. Firebase Timestamps)
    members = raw.map(
      (m: { id: string; firstName?: string; lastName?: string }) => ({
        id: m.id,
        firstName: m.firstName || "",
        lastName: m.lastName || "",
        displayName:
          m.firstName && m.lastName
            ? `${m.firstName} ${m.lastName}`
            : "Неизвестен играч",
      })
    );
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
