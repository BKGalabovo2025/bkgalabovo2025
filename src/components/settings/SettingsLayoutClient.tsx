"use client";

import { Save } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { revalidateSiteAction } from "@/lib/actions/site";
import { updateSite } from "@/services/site-service";
import { useSettingsStore } from "@/store/use-settings-store";

import { SettingsNav } from "./SettingsNav";

interface SettingsLayoutClientProps {
  children: React.ReactNode;
}

export function SettingsLayoutClient({ children }: SettingsLayoutClientProps) {
  const {
    formData,
    isLoading,
    isSaving,
    fetchSettings,
    fetchLogs,
    setIsSaving,
  } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, [fetchSettings, fetchLogs]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "bkg_cached_sites_settings",
            JSON.stringify(formData)
          );
        } catch {
          // ignore quota
        }
      }

      const savePromises = Object.entries(formData).map(([id, data]) =>
        updateSite({ ...data, id })
      );

      await Promise.all(savePromises);
      await revalidateSiteAction();

      toast.success("Настройките са запазени успешно!", {
        style: {
          borderRadius: "1.5rem",
          background: "#18181b",
          color: "#fff",
          fontWeight: 400,
          fontSize: "0.875rem",
        },
      });
    } catch (error) {
      console.warn("Cloud save warning:", error);
      toast.success(
        "Настройките са съхранени локално в браузъра (ще се синхронизират в облака при зануляване на квотата)!",
        {
          style: {
            borderRadius: "1.5rem",
            background: "#18181b",
            color: "#fff",
            fontWeight: 400,
            fontSize: "0.875rem",
          },
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center space-y-4">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs font-light tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
          Зареждане на настройки...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Настройки"
        description="Управление на системните параметри, сигурността и брандирането на клуба."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Настройки", href: "/settings" },
        ]}
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 w-full sm:w-auto rounded-xl bg-primary px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-primary/90"
        >
          {isSaving ? "Запазване..." : "Запази промените"}
          {!isSaving && <Save className="ml-3 size-4" strokeWidth={1.5} />}
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row">
        {/* Navigation Sidebar */}
        <div className="space-y-2 lg:w-60 shrink-0">
          <div className="sticky top-16 z-20 -mx-1 backdrop-blur-md sm:top-20 p-1">
            <SettingsNav />
          </div>
        </div>

        {/* Section Content Pane */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 sm:p-5 lg:p-6 dark:border-zinc-800/80 dark:bg-zinc-900/30">
            <div className="duration-300 animate-in fade-in-50">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
