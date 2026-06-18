import { ShadowWizard } from "@/components/training/ShadowWizard";
import { getAllMembersServer } from "@/services/member-service.server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Shadow Training | BK Galabovo",
};

export default async function ShadowTrainingPage() {
  let members: any[] = [];
  try {
    const raw = await getAllMembersServer();
    // Pre-clean data to prevent Next.js serialization errors (e.g. Firebase Timestamps)
    members = raw.map((m: any) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      displayName:
        m.firstName && m.lastName
          ? `${m.firstName} ${m.lastName}`
          : "Неизвестен играч",
    }));
  } catch (e) {
    console.error("Error fetching members", e);
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center h-[calc(100vh-65px)] p-4 bg-zinc-50 dark:bg-black overflow-hidden">
      <div className="w-full max-w-4xl flex flex-col h-full space-y-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            Shadow Training
            <Button variant="outline" size="sm" asChild>
              <Link href="/training/shadow/history">История</Link>
            </Button>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Интерактивен треньор за движения по корта.
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <ShadowWizard initialMembers={members} />
        </div>
      </div>
    </div>
  );
}
