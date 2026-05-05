"use client";

import { useState } from "react";
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
  Trophy,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Настройките са запазени успешно!", {
        style: {
          borderRadius: "1rem",
          background: "#0f172a",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "0.875rem",
        },
      });
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
          className="rounded-xl shadow-lg font-black uppercase tracking-widest text-xs h-11 px-6"
        >
          {isSaving ? "Запазване..." : "Запази промените"}
          {!isSaving && <Save className="ml-2 h-4 w-4" />}
        </Button>
      </PageHeader>

      <Tabs
        defaultValue="general"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Custom Tabs Sidebar for Bento Feel */}
          <div className="lg:w-64 space-y-2">
            <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-2">
              <TabsTrigger
                value="general"
                className="w-full justify-start px-6 py-4 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all border-none font-bold text-slate-500 data-[state=active]:text-primary"
              >
                <Settings className="mr-3 h-5 w-5" /> Общи
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="w-full justify-start px-6 py-4 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all border-none font-bold text-slate-500 data-[state=active]:text-primary"
              >
                <Palette className="mr-3 h-5 w-5" /> Брандиране
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start px-6 py-4 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all border-none font-bold text-slate-500 data-[state=active]:text-primary"
              >
                <Shield className="mr-3 h-5 w-5" /> Сигурност
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="w-full justify-start px-6 py-4 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all border-none font-bold text-slate-500 data-[state=active]:text-primary"
              >
                <User className="mr-3 h-5 w-5" /> Личен Профил
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1">
            <TabsContent
              value="general"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BentoCard className="p-8 space-y-6 md:col-span-2 shadow-sm border-none bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-black font-bento uppercase tracking-tight">
                      Информация за Клуба
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Име на клуба
                      </Label>
                      <Input
                        defaultValue="Бадминтон Клуб Гълъбово"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Официален Имейл
                      </Label>
                      <Input
                        defaultValue="info@bkgalabovo.com"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Телефон за връзка
                      </Label>
                      <Input
                        defaultValue="+359 888 123 456"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Уебсайт
                      </Label>
                      <Input
                        defaultValue="https://bkgalabovo.com"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                      />
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-8 space-y-6 shadow-sm border-none bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-xl font-black font-bento uppercase tracking-tight">
                      Локализация
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Основна Валута
                      </Label>
                      <div className="h-12 flex items-center px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700">
                        EUR (€)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Часова Зона
                      </Label>
                      <div className="h-12 flex items-center px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700">
                        UTC+2 (Europe/Sofia)
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="p-8 space-y-6 shadow-sm border-none bg-white flex flex-col justify-center items-center text-center">
                  <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-black font-bento uppercase">
                    Системата е Оптимизирана
                  </h4>
                  <p className="text-sm text-slate-400">
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
                <BentoCard className="md:col-span-8 p-8 space-y-8 shadow-sm border-none bg-white">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-purple-600" />
                    <h3 className="text-xl font-black font-bento uppercase tracking-tight">
                      Визуална Идентичност
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Лого на Клуба
                      </Label>
                      <div className="flex items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                        <div className="h-24 w-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                          <Trophy size={40} />
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest h-10"
                          >
                            <Camera className="mr-2 h-4 w-4" /> Промени Лого
                          </Button>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">
                            Препоръчителен размер: 512x512px (PNG, SVG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Основен Цвят
                        </Label>
                        <div className="flex gap-2">
                          <div className="h-12 w-12 rounded-xl bg-blue-600 border-4 border-white shadow-sm" />
                          <Input
                            defaultValue="#2563eb"
                            className="h-12 rounded-xl border-slate-100 bg-slate-50 font-mono text-center"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Акцентен Цвят
                        </Label>
                        <div className="flex gap-2">
                          <div className="h-12 w-12 rounded-xl bg-indigo-600 border-4 border-white shadow-sm" />
                          <Input
                            defaultValue="#4f46e5"
                            className="h-12 rounded-xl border-slate-100 bg-slate-50 font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-4 p-8 bg-slate-900 text-white border-none shadow-xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-black font-bento uppercase">Преглед</h3>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="h-2 w-12 bg-blue-500 rounded-full" />
                      <div className="h-4 w-full bg-white/10 rounded-full" />
                      <div className="h-4 w-2/3 bg-white/10 rounded-full" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold leading-relaxed">
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
              <BentoCard className="p-8 space-y-8 shadow-sm border-none bg-white">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-rose-600" />
                  <h3 className="text-xl font-black font-bento uppercase tracking-tight">
                    Сигурност на Системата
                  </h3>
                </div>

                <div className="space-y-8 max-w-2xl">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Смяна на Парола (Админ)
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">
                          Текуща Парола
                        </Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 rounded-xl border-slate-100 bg-slate-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">
                            Нова Парола
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-12 rounded-xl border-slate-100 bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">
                            Повтори Новата Парола
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-12 rounded-xl border-slate-100 bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">
                          Двуфакторна автентикация
                        </h4>
                        <p className="text-xs text-slate-400">
                          Добавете допълнително ниво на сигурност към вашия
                          акаунт.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest"
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
                <BentoCard className="md:col-span-4 p-8 bg-white border-none shadow-sm flex flex-col items-center text-center space-y-4">
                  <div className="relative group cursor-pointer">
                    <div className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                      <User size={64} className="text-slate-300" />
                    </div>
                    <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <Camera className="text-white" size={24} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-bento uppercase text-slate-900">
                      Администратор
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Супер Потребител
                    </p>
                  </div>
                  <div className="w-full pt-4 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400">Последен вход</span>
                      <span className="text-slate-900">Днес, 09:12</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400">Ниво на достъп</span>
                      <span className="text-emerald-600">Full Access</span>
                    </div>
                  </div>
                </BentoCard>

                <BentoCard className="md:col-span-8 p-8 space-y-6 bg-white border-none shadow-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-black font-bento uppercase tracking-tight">
                      Лична Информация
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Име
                      </Label>
                      <Input
                        defaultValue="Admin"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Фамилия
                      </Label>
                      <Input
                        defaultValue="User"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Имейл Адрес
                      </Label>
                      <Input
                        defaultValue="admin@bkgalabovo.com"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50"
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
