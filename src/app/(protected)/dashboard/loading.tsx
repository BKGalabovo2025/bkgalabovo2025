import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-400 space-y-8 p-6">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </header>

      {/* Assistant Placeholder */}
      <Skeleton className="h-40 w-full rounded-2xl" />

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Row 1: Stat Cards */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="md:col-span-12 lg:col-span-3">
            <Card className="h-32 border-slate-100 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between">
                  <Skeleton className="size-10 rounded-xl" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Row 2: Recent Sales & Reminders */}
        <div className="md:col-span-12 lg:col-span-8">
          <Card className="h-100 border-slate-100 shadow-sm">
            <CardHeader className="border-b px-6 py-4">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="size-10 rounded-xl" />
                    <div className="grow space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                      <Skeleton className="ml-auto h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-12 lg:col-span-4">
          <Card className="h-full border-slate-100 shadow-sm">
            <CardHeader className="border-b px-6 py-4">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="grow space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
