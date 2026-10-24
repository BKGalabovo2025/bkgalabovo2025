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
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white sm:p-8 lg:p-10 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase backdrop-blur-md">
            <Sparkles className="size-3.5" />
            Документооборот & Електронни подписи
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Документи, Бланки & Регистър
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
            Централно управление на всички образци на клубни документи.
            Досиетата на състезателите черпят образците директно от тук. Всички
            нови редакции обновяват бланките напред във времето, като запазват
            пълната юридическа неприкосновеност на вече попълнените и подписани
            стари варианти.
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
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
          <TabsList className="h-12 rounded-2xl bg-zinc-100 p-1.5 dark:bg-zinc-900 border border-zinc-200/60">
            <TabsTrigger
              value="templates"
              className={cn(
                "h-9 rounded-xl px-5 text-xs font-bold transition-all gap-2",
                "data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs"
              )}
            >
              <FileCheck2 className="size-4 text-emerald-600" />
              Образци на бланки
            </TabsTrigger>
            <TabsTrigger
              value="signed"
              className={cn(
                "h-9 rounded-xl px-5 text-xs font-bold transition-all gap-2",
                "data-[state=active]:bg-white data-[state=active]:text-zinc-950 data-[state=active]:shadow-xs"
              )}
            >
              <FileSignature className="size-4 text-indigo-600" />
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
