export const dynamic = "force-dynamic";

import { Member } from "@/types";
import { getAllMembersServer } from "@/services/member-service.server";
import MembersClient from "./MembersClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

export default async function MembersPage() {
  let members: Member[] = [];
  let error = null;

  try {
    members = await getAllMembersServer();
  } catch (err) {
    console.error("Error fetching members:", err);
    error =
      "Неуспешно зареждане на списъка с членове. Моля, опитайте по-късно.";
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Членове на клуба"
        description="Управление на членската маса, проследяване на присъствия, плащания и лични профили на всички състезатели."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Членове" },
        ]}
      />

      {error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 text-center">
          <p className="text-rose-600 font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-900 overflow-hidden shadow-none">
          <div className="p-0">
            <Suspense fallback={<MembersLoading />}>
              <MembersClient initialMembers={members} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

function MembersLoading() {
  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <div className="space-y-4 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
