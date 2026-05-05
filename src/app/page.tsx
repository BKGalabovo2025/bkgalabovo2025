"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  ShieldCheck,
  Activity,
  Users,
  ArrowRight,
  Landmark,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            Проверка на сесия...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Branding Card */}
        <BentoCard className="md:col-span-12 p-12 bg-white flex flex-col items-center text-center space-y-6 overflow-hidden relative border-none shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-50" />

          <div className="h-20 w-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 relative z-10 mb-4 transform -rotate-6">
            <Trophy size={40} />
          </div>

          <div className="relative z-10 space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 font-bento uppercase">
              БК ГЪЛЪБОВО
            </h1>
            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
              Система за управление на спортен клуб
            </p>
          </div>
        </BentoCard>

        {/* Club Status Portal */}
        <BentoCard className="md:col-span-7 p-8 bg-white border-none shadow-lg flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h2 className="text-xl font-black font-bento text-slate-900 uppercase">
                Статус на Клуба
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Членове
                </p>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <span className="text-2xl font-black text-slate-900">
                    Active
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Финанси
                </p>
                <div className="flex items-center gap-2">
                  <Landmark size={16} className="text-emerald-600" />
                  <span className="text-2xl font-black text-slate-900">
                    Stable
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">
              Добре дошли в портала за управление на Бадминтон клуб Гълъбово.
              Тук можете да следите графика, резервациите и наличностите в
              реално време.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © 2024 BK Galabovo
            </span>
            <div className="flex gap-2">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                System Online
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Admin Login Portal */}
        <BentoCard className="md:col-span-5 p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck size={120} />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 text-white rounded-xl flex items-center justify-center border border-white/10">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl font-black font-bento uppercase tracking-tight">
                Администрация
              </h2>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              Достъпът до административния панел е ограничен само за оторизирани
              лица.
            </p>
          </div>

          <div className="relative z-10 pt-10">
            <Link href="/login" className="block w-full">
              <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 group transition-all">
                Вход в Системата
                <ArrowRight
                  size={18}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </Link>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
