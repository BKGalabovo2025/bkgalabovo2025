import { Sparkles } from "lucide-react";
import { Metadata } from "next";
import React from "react";

import { DocumentsNav } from "@/components/documents/DocumentsNav";

export const metadata: Metadata = {
  title: "Документи & Бланки | БК Гълъбово",
  description:
    "Управление на клубни образци на документи, онлайн попълване и електронен регистър на подписани документи.",
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 space-y-5 max-w-7xl mx-auto pb-20 duration-700 animate-in fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-4 sm:px-6 sm:py-5 text-white shadow-md">
        <div className="relative z-10 max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase backdrop-blur-md">
            <Sparkles className="size-3" />
            Документооборот & Електронни подписи
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Документи, Бланки & Регистър
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
            Централно управление на клубни образци и подписи. Всички редакции
            обновяват бланките напред във времето, запазвайки пълната юридическа
            сила на вече подписаните документи.
          </p>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 size-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 size-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Hierarchical Subpage Navigation */}
      <DocumentsNav />

      {/* Subpage View */}
      <main className="space-y-4">{children}</main>
    </div>
  );
}
