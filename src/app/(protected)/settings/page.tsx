import SettingsClient from "./SettingsClient";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Настройки"
        description="Персонализиране на приложението, управление на профила и конфигурация на системните параметри."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Настройки" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-8">
          <SettingsClient />
        </div>
      </div>
    </div>
  );
}
