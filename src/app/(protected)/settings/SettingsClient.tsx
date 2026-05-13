"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Shield,
  Palette,
  User,
  Save,
  Lock,
  Mail,
  Globe,
  Building2,
  Camera,
  CheckCircle2,
  Activity,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getAllSites, updateSite } from "@/services/site-service";
import { Site } from "@/types/site.types";

export default function SettingsClient() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    [key: string]: Partial<Site>;
  }>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const allSites = await getAllSites();

        // Initialize form data
        const initialFormData: { [key: string]: Partial<Site> } = {};
        allSites.forEach((site) => {
          initialFormData[site.id] = { ...site };
        });
        setFormData(initialFormData);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Грешка при зареждане на настройките.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (
    siteId: string,
    field: keyof Site,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [siteId]: {
        ...prev[siteId],
        [field]: value,
      },
    }));
  };

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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-zinc-500 font-light uppercase tracking-widest text-xs">
          Зареждане на настройки...
        </p>
      </div>
    );
  }

  const bkgData = formData["bkgalabovo"] || {};
  const rzData = formData["recoveryzone"] || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
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
          className="rounded-xl font-medium uppercase tracking-widest text-[11px] h-12 px-8 bg-primary text-white hover:bg-primary/90 shadow-none transition-all"
        >
          {isSaving ? "Запазване..." : "Запази промените"}
          {!isSaving && <Save className="ml-3 h-4 w-4" strokeWidth={1.5} />}
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Custom Tabs Sidebar for Bento Feel */}
          <div className="lg:w-72 space-y-3">
            <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-3">
              <TabsTrigger
                value="general"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Settings className="mr-4 h-5 w-5" strokeWidth={1.5} /> Общи
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Palette className="mr-4 h-5 w-5" strokeWidth={1.5} />{" "}
                Брандиране
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <Shield className="mr-4 h-5 w-5" strokeWidth={1.5} /> Сигурност
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="w-full justify-start px-6 py-5 rounded-2xl data-[state=active]:bg-primary/5 transition-all border-none font-medium text-zinc-500 data-[state=active]:text-primary text-[13px] uppercase tracking-widest"
              >
                <User className="mr-4 h-5 w-5" strokeWidth={1.5} /> Личен Профил
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1">
            <TabsContent
              value="general"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BentoCard className="p-10 space-y-8 md:col-span-2 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-2">
                    <Building2
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Информация за Клуба
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Име на клуба
                      </Label>
                      <Input
                        value={bkgData.name || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "name",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Официален Имейл
                      </Label>
                      <Input
                        value={bkgData.email || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "email",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Телефон за връзка
                      </Label>
                      <Input
                        value={bkgData.phone || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "phone",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Уебсайт
                      </Label>
                      <Input
                        value={bkgData.website || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "bkgalabovo",
                            "website",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-10 space-y-8 md:col-span-2 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-2">
                    <Activity
                      className="h-5 w-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Информация за Зоната
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Име на обекта
                      </Label>
                      <Input
                        value={rzData.name || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "name",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-[#00f2fe]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Официален Имейл
                      </Label>
                      <Input
                        value={rzData.email || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "email",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-[#00f2fe]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Телефон за връзка
                      </Label>
                      <Input
                        value={rzData.phone || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "phone",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-[#00f2fe]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Уебсайт / Социални мрежи
                      </Label>
                      <Input
                        value={rzData.website || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "recoveryzone",
                            "website",
                            e.target.value
                          )
                        }
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-[#00f2fe]"
                      />
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-10 space-y-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4 mb-2">
                    <Globe className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Локализация
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Основна Валута
                      </Label>
                      <div className="h-14 flex items-center px-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-light text-zinc-700 dark:text-zinc-300">
                        EUR (€)
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Часова Зона
                      </Label>
                      <div className="h-14 flex items-center px-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 font-light text-zinc-700 dark:text-zinc-300">
                        UTC+2 (Europe/Sofia)
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-10 space-y-6 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col justify-center items-center text-center">
                  <div className="h-20 w-20 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mb-4 transition-all hover:scale-105">
                    <CheckCircle2 size={36} strokeWidth={1} />
                  </div>
                  <h4 className="font-light text-xl text-zinc-900 dark:text-white">
                    Системата е Оптимизирана
                  </h4>
                  <p className="text-sm text-zinc-400 max-w-[200px] font-light leading-relaxed">
                    Всички системни параметри са в нормални граници.
                  </p>
                </BentoCard>
              </div>
            </TabsContent>

            <TabsContent
              value="branding"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <BentoCard className="md:col-span-8 p-10 space-y-10 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Palette
                      className="h-5 w-5 text-primary"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Визуална Идентичност - Бадминтон Клуб
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Лого на Клуба
                      </Label>
                      <div className="flex items-center gap-8 p-8 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <div className="h-28 w-28 bg-white rounded-3xl flex items-center justify-center shadow-none overflow-hidden border border-zinc-100">
                          <Image
                            src="/logo.png"
                            alt="BKG Logo"
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 font-medium text-[11px] uppercase tracking-widest h-12 px-6 bg-white dark:bg-zinc-900"
                          >
                            <Camera
                              className="mr-3 h-4 w-4"
                              strokeWidth={1.5}
                            />{" "}
                            Промени Лого
                          </Button>
                          <p className="text-[11px] text-zinc-400 uppercase font-light tracking-wide">
                            Препоръчителен размер: 512x512px (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          Основен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-[#00AEEF] border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={bkgData.primaryColor || "#00AEEF"}
                            onChange={(e) =>
                              handleInputChange(
                                "bkgalabovo",
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          Акцентен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-zinc-900 dark:bg-white border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={bkgData.accentColor || "#000000"}
                            onChange={(e) =>
                              handleInputChange(
                                "bkgalabovo",
                                "accentColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-8 p-10 space-y-10 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-4">
                    <Palette
                      className="h-5 w-5 text-[#00f2fe]"
                      strokeWidth={1.5}
                    />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Визуална Идентичност - Recovery Zone
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Лого на Зоната
                      </Label>
                      <div className="flex items-center gap-8 p-8 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <div className="h-28 w-28 bg-white rounded-3xl flex items-center justify-center shadow-none overflow-hidden border border-zinc-100">
                          <Image
                            src="/1.png"
                            alt="RZ Logo"
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 font-medium text-[11px] uppercase tracking-widest h-12 px-6 bg-white dark:bg-zinc-900"
                          >
                            <Camera
                              className="mr-3 h-4 w-4"
                              strokeWidth={1.5}
                            />{" "}
                            Промени Лого
                          </Button>
                          <p className="text-[11px] text-zinc-400 uppercase font-light tracking-wide">
                            Препоръчителен размер: 512x512px (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          Основен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-[#00f2fe] border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={rzData.primaryColor || "#00f2fe"}
                            onChange={(e) =>
                              handleInputChange(
                                "recoveryzone",
                                "primaryColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                          Акцентен Цвят
                        </Label>
                        <div className="flex gap-3">
                          <div className="h-14 w-14 rounded-xl bg-zinc-900 dark:bg-white border-4 border-white dark:border-zinc-800 shadow-none" />
                          <Input
                            value={rzData.accentColor || "#18181b"}
                            onChange={(e) =>
                              handleInputChange(
                                "recoveryzone",
                                "accentColor",
                                e.target.value
                              )
                            }
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 font-mono text-center text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-4 p-10 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-none flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className="font-light text-xl uppercase tracking-widest">
                      Преглед
                    </h3>
                    <div className="p-6 rounded-2xl bg-white/5 dark:bg-zinc-50 border border-white/10 dark:border-zinc-200 space-y-4">
                      <div className="h-2 w-16 bg-primary rounded-full" />
                      <div className="h-5 w-full bg-white/10 dark:bg-zinc-100 rounded-full" />
                      <div className="h-5 w-2/3 bg-white/10 dark:bg-zinc-100 rounded-full" />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-medium leading-relaxed tracking-wider">
                    Промените в брандирането ще се отразят веднага на всички
                    публични страници и генерирани документи.
                  </p>
                </BentoCard>
              </div>
            </TabsContent>

            <TabsContent
              value="security"
              className="m-0 focus-visible:outline-none"
            >
              <BentoCard className="p-10 space-y-10 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="flex items-center gap-4">
                  <Lock className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                    Сигурност на Системата
                  </h3>
                </div>

                <div className="space-y-10 max-w-2xl">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                      Смяна на Парола (Админ)
                    </h4>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                          Текуща Парола
                        </Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            Нова Парола
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            Повтори Новата Парола
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-zinc-50 dark:border-zinc-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div>
                        <h4 className="font-light text-lg text-zinc-900 dark:text-white">
                          Двуфакторна автентикация
                        </h4>
                        <p className="text-sm text-zinc-400 font-light mt-1">
                          Добавете допълнително ниво на сигурност към вашия
                          акаунт.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 font-medium text-[11px] uppercase tracking-widest h-12 px-8 bg-white dark:bg-zinc-900"
                      >
                        Активирай
                      </Button>
                    </div>
                  </div>
                </div>
              </BentoCard>
            </TabsContent>

            <TabsContent
              value="profile"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <BentoCard className="md:col-span-4 p-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 flex flex-col items-center text-center space-y-6">
                  <div className="relative group cursor-pointer">
                    <div className="h-40 w-40 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-none overflow-hidden transition-all group-hover:scale-105">
                      <User
                        size={80}
                        className="text-zinc-200 dark:text-zinc-700"
                        strokeWidth={1}
                      />
                    </div>
                    <div className="absolute inset-0 bg-primary/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                      <Camera
                        className="text-primary"
                        size={32}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Администратор
                    </h3>
                    <p className="text-[11px] text-primary font-medium uppercase tracking-widest mt-1">
                      Супер Потребител
                    </p>
                  </div>
                  <div className="w-full pt-8 space-y-4 border-t border-zinc-50 dark:border-zinc-900">
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest">
                      <span className="text-zinc-400">Последен вход</span>
                      <span className="text-zinc-900 dark:text-white font-light">
                        Днес, 09:12
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest">
                      <span className="text-zinc-400">Ниво на достъп</span>
                      <span className="text-primary font-light">
                        Full Access
                      </span>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-8 p-10 space-y-10 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
                      Лична Информация
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Име
                      </Label>
                      <Input
                        defaultValue="Admin"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Фамилия
                      </Label>
                      <Input
                        defaultValue="User"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                        Имейл Адрес
                      </Label>
                      <Input
                        defaultValue="admin@bkgalabovo.com"
                        className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </BentoCard>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
