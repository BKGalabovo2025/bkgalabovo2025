export const dynamic = "force-dynamic";

import { getAllMembers } from "@/services/member-service";
import MembersClient from "./MembersClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default async function MembersPage() {
  const members = await getAllMembers();

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <Suspense fallback={<MembersLoading />}>
        <MembersClient initialMembers={JSON.parse(JSON.stringify(members))} />
      </Suspense>
    </div>
  );
}

function MembersLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <Skeleton className="md:col-span-12 lg:col-span-6 h-40 rounded-2xl" />
        <Skeleton className="md:col-span-4 lg:col-span-2 h-40 rounded-2xl" />
        <Skeleton className="md:col-span-4 lg:col-span-2 h-40 rounded-2xl" />
        <Skeleton className="md:col-span-4 lg:col-span-2 h-40 rounded-2xl" />
      </div>
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
