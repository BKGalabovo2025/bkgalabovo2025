import DashboardClient, { DashboardData } from "./DashboardClient";
import { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cookies } from "next/headers";
import { getDashboardDataServerAction } from "@/lib/actions/dashboard";
import { AlertTriangle, Database, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Табло - Бадминтон клуб Гълъбово",
  description:
    "Общ преглед на активността, членовете и финансовите показатели на клуба.",
};

function DashboardSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-8 pb-12">
      <div className="h-32 w-full rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
        <Skeleton className="h-40 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}

function QuotaExceededBanner({ error }: { error: string }) {
  const isQuotaError =
    error.includes("RESOURCE_EXHAUSTED") || error.includes("Quota exceeded");
  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/20">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/40">
          {isQuotaError ? (
            <Database className="size-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-200">
            {isQuotaError
              ? "Лимит на базата данни достигнат"
              : "Грешка при зареждане на данните"}
          </h3>
          <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">
            {isQuotaError
              ? "Безплатният лимит на Firestore за днес е изчерпан. Таблото ще се върне към нормална работа след полунощ (UTC) или след надграждане на плана. Данните по-долу са от последния успешен запис."
              : "Не можаха да се заредят данни от базата. Опитайте да презаредите страницата."}
          </p>
          {isQuotaError && (
            <p className="mt-2 inline-block rounded bg-amber-100 px-2 py-1 font-mono text-xs text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              За да избегнете лимита, надградете до Firebase Blaze план
            </p>
          )}
        </div>
        <form action="" method="GET">
          <button
            type="submit"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-700 transition-colors hover:text-amber-900 dark:border-amber-700 dark:text-amber-300 dark:hover:text-amber-100"
          >
            <RefreshCw className="size-3" />
            Опитай пак
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const activeBranch = cookieStore.get("activeBranch")?.value || "bkgalabovo";

  // Pre-fetch the dashboard data on the server — errors are handled gracefully
  const result = await getDashboardDataServerAction(activeBranch);
  const res = result as { success: boolean; data?: DashboardData; error?: string };
  const initialData = res.success && res.data ? res.data : null;
  const errorMessage = !res.success ? res.error : null;

  if (errorMessage === "Unauthorized") {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  return (
    <div className="w-full space-y-8 pb-12 duration-500 animate-in fade-in">
      <div className="w-full px-0">
        {errorMessage && <QuotaExceededBanner error={errorMessage} />}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardClient initialData={initialData} />
        </Suspense>
      </div>
    </div>
  );
}
