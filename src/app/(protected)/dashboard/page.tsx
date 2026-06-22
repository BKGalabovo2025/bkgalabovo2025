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
    <div className="space-y-8 animate-pulse pb-12 w-full">
      <div className="h-32 bg-zinc-100 dark:bg-zinc-900 rounded-3xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
          {isQuotaError ? (
            <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
            {isQuotaError
              ? "Лимит на базата данни достигнат"
              : "Грешка при зареждане на данните"}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            {isQuotaError
              ? "Безплатният лимит на Firestore за днес е изчерпан. Таблото ще се върне към нормална работа след полунощ (UTC) или след надграждане на плана. Данните по-долу са от последния успешен запис."
              : "Не можаха да се заредят данни от базата. Опитайте да презаредите страницата."}
          </p>
          {isQuotaError && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-mono bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded inline-block">
              За да избегнете лимита, надградете до Firebase Blaze план
            </p>
          )}
        </div>
        <form action="" method="GET">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 transition-colors shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 w-full">
      <div className="px-0 w-full">
        {errorMessage && <QuotaExceededBanner error={errorMessage} />}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardClient initialData={initialData} />
        </Suspense>
      </div>
    </div>
  );
}
