"use client";

import { FileCheck2, FileSignature, Sparkles } from "lucide-react";
import React, { useState } from "react";

import { AllSignedDocumentsRegister } from "@/components/documents/AllSignedDocumentsRegister";
import { DocumentTemplatesManager } from "@/components/documents/DocumentTemplatesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function DocumentsClient() {
  const [activeTab, setActiveTab] = useState<"templates" | "signed">(
    "templates"
  );

  return (
    <div className="flex-1 space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 px-4 py-3.5 sm:px-6 sm:py-4 text-white shadow-md">
        <div className="relative z-10 max-w-2xl space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase backdrop-blur-md">
            <Sparkles className="size-3" />
            Документооборот & Електронни подписи
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Документи, Бланки & Регистър
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-300 font-light leading-relaxed line-clamp-2 sm:line-clamp-none">
            Централно управление на клубни образци и подписи. Всички редакции
            обновяват бланките напред във времето, запазвайки пълната юридическа
            сила на вече подписаните документи.
          </p>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 size-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-32 -bottom-20 size-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "templates" | "signed")}
        className="space-y-3"
      >
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-1.5">
          <TabsList className="h-9 rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-900 border border-zinc-200/60">
            <TabsTrigger
              value="templates"
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all gap-1.5",
                "data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs"
              )}
            >
              <FileCheck2 className="size-3.5 text-emerald-600" />
              Образци на бланки
            </TabsTrigger>
            <TabsTrigger
              value="signed"
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all gap-1.5",
                "data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs"
              )}
            >
              <FileSignature className="size-3.5 text-indigo-600" />
              Всички подписани документи
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="templates"
          className="mt-0 focus-visible:outline-none"
        >
          <DocumentTemplatesManager />
        </TabsContent>

        <TabsContent value="signed" className="mt-0 focus-visible:outline-none">
          <AllSignedDocumentsRegister />
        </TabsContent>
      </Tabs>
    </div>
  );
}
