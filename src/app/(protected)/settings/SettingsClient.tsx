"use client";

import { Activity, Settings, User, Users } from "lucide-react";
import { Save } from "lucide-react";
import { Shield } from "lucide-react";
import { Palette } from "lucide-react";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateSite } from "@/services/site-service";
import { useSettingsStore } from "@/store/use-settings-store";

import { AuditLogTab } from "./components/AuditLogTab";
import { BrandingTab } from "./components/BrandingTab";
import { GeneralTab } from "./components/GeneralTab";
import { ProfileTab } from "./components/ProfileTab";
import { RecoveryZoneTab } from "./components/RecoveryZoneTab";
import { SecurityTab } from "./components/SecurityTab";
import { TeamTab } from "./components/TeamTab";

export default function SettingsClient() {
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
      // Save each site's settings
      const savePromises = Object.entries(formData).map(([id, data]) =>
        updateSite({ ...data, id })
      );

      await Promise.all(savePromises);

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
      console.error("Error saving settings:", error);
      toast.error("Грешка при запазване на настройките.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center space-y-4">
        <div className="size-8 animate-spin text-primary" />
        <p className="text-xs font-light tracking-widest text-zinc-500 uppercase">
          Зареждане на настройки...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 duration-500 animate-in fade-in">
      <PageHeader
        title="Настройки"
        description="Управление на системните параметри, сигурността и брандирането на клуба."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Настройки" },
        ]}
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 rounded-xl bg-primary px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-primary/90"
        >
          {isSaving ? "Запазване..." : "Запази промените"}
          {!isSaving && <Save className="ml-3 size-4" strokeWidth={1.5} />}
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="w-full">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="space-y-3 lg:w-72">
            <TabsList className="no-scrollbar flex h-auto w-full flex-nowrap justify-start gap-3 overflow-x-auto bg-transparent p-1 lg:flex-col lg:overflow-visible lg:p-0">
              <TabsTrigger
                value="general"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Settings className="mr-4 size-5" strokeWidth={1.5} /> Общи
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Palette className="mr-4 size-5" strokeWidth={1.5} /> Брандиране
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Shield className="mr-4 size-5" strokeWidth={1.5} /> Сигурност
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <User className="mr-4 size-5" strokeWidth={1.5} /> Личен Профил
              </TabsTrigger>

              <TabsTrigger
                value="recovery"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-[#00f2fe]/10 data-[state=active]:text-[#00f2fe] lg:w-full"
              >
                <Activity className="mr-4 size-5" strokeWidth={1.5} /> Зона
                Възстановяване
              </TabsTrigger>

              <TabsTrigger
                value="team"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary lg:w-full"
              >
                <Users className="mr-4 size-5" strokeWidth={1.5} /> Екип
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="flex-shrink-0 justify-start rounded-2xl border-none px-6 py-5 text-[13px] font-medium tracking-widest whitespace-nowrap text-zinc-500 uppercase transition-all data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-500 lg:w-full"
              >
                <Shield className="mr-4 size-5" strokeWidth={1.5} /> Системни
                логове
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1">
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50/50 p-6 lg:p-10 dark:border-zinc-800/50 dark:bg-zinc-900/20">
              <TabsContent
                value="general"
                className="m-0 mt-0 animate-in fade-in zoom-in-95 data-[state=inactive]:hidden"
              >
                <GeneralTab />
              </TabsContent>

              <TabsContent
                value="branding"
                className="m-0 mt-0 animate-in fade-in zoom-in-95 data-[state=inactive]:hidden"
              >
                <BrandingTab />
              </TabsContent>

              <TabsContent
                value="security"
                className="m-0 mt-0 animate-in fade-in zoom-in-95 data-[state=inactive]:hidden"
              >
                <SecurityTab />
              </TabsContent>

              <TabsContent
                value="recovery"
                className="m-0 mt-0 animate-in fade-in zoom-in-95 data-[state=inactive]:hidden"
              >
                <RecoveryZoneTab />
              </TabsContent>

              <TabsContent
                value="profile"
                className="m-0 mt-0 animate-in fade-in zoom-in-95 data-[state=inactive]:hidden"
              >
                <ProfileTab />
              </TabsContent>

              <TabsContent
                value="team"
                className="m-0 mt-0 animate-in fade-in zoom-in-95 data-[state=inactive]:hidden"
              >
                <TeamTab />
              </TabsContent>

              <TabsContent
                value="audit"
                className="m-0 mt-0 animate-in fade-in zoom-in-95 data-[state=inactive]:hidden"
              >
                <AuditLogTab />
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
