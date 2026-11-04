"use client";

import { Plus } from "lucide-react";
import React, { useState } from "react";

import { AddGeneralServiceDialog } from "@/components/finances/AddGeneralServiceDialog";
import { GeneralServiceList } from "@/components/finances/GeneralServiceList";
import { Button } from "@/components/ui/button";
import { useGeneralServices } from "@/hooks/useGeneralServices";

export function ClubServicesCatalogView() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { refetch } = useGeneralServices();

  const handleServiceAdded = () => {
    setIsAddOpen(false);
    refetch();
  };

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
          onClick={() => setIsAddOpen(true)}
          className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 shrink-0"
        >
          <Plus className="mr-1.5 size-4" />
          <span>Добави клубна услуга</span>
        </Button>
      </div>

      {/* Services List with search, edit, sale and delete actions */}
      <GeneralServiceList />

      {/* Add Service Dialog */}
      <AddGeneralServiceDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleServiceAdded}
      />
    </div>
  );
}
