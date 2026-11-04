"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

import { GeneralServiceList } from "@/components/finances/GeneralServiceList";
import { Button } from "@/components/ui/button";

export function ClubServicesCatalogView() {
  return (
    <div className="space-y-6">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Клубни услуги &amp; Наеми
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Каталог на допълнителни клубни услуги — шкафчета, наем на ракети,
            наплитане и консумативи.
          </p>
        </div>

        <Button
          size="sm"
          asChild
          className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 shrink-0"
        >
          <Link href="/catalogs/club-services/new">
            <Plus className="mr-1.5 size-4" />
            <span>Добави клубна услуга</span>
          </Link>
        </Button>
      </div>

      {/* Services List with search, edit, sale and delete actions */}
      <GeneralServiceList />
    </div>
  );
}
