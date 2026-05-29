import fs from "fs";
import path from "path";

const dialogCode = `"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MonthlyScheduleForm, { MonthlyScheduleFormData } from "./monthly-schedule-form";
import { useState, useCallback } from "react";

interface MonthlyScheduleDialogProps {
  children: React.ReactNode;
  onSave: (data: MonthlyScheduleFormData) => Promise<void>;
}

export default function MonthlyScheduleDialog({ children, onSave }: MonthlyScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (data: MonthlyScheduleFormData) => {
    setIsSaving(true);
    try {
      await onSave(data);
      setOpen(false);
    } catch (error) {
      console.error("Грешка при запис:", error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Генериране на график</DialogTitle>
        </DialogHeader>
        <MonthlyScheduleForm 
          onSave={handleSave} 
          onClose={() => setOpen(false)} 
          isSaving={isSaving} 
        />
      </DialogContent>
    </Dialog>
  );
}

// ДОБАВЯМЕ ТОВА, ЗА ДА СЪВПАДНЕ С ИМПОРТА В ScheduleClient.tsx
export { MonthlyScheduleDialog };
`;

const dialogPath = path.join(
  "src",
  "components",
  "schedule",
  "MonthlyScheduleDialog.tsx"
);

try {
  fs.writeFileSync(dialogPath, dialogCode, "utf-8");
  console.log("✅ ФАЙЛЪТ Е ПОПРАВЕН С ЕКСПОРТ!");
} catch (err) {
  console.error("Грешка:", err);
}
