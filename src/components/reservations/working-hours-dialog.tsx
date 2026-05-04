"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Clock, Save, Loader2 } from "lucide-react";
import { getWorkingHours, updateWorkingHours } from "@/lib/reservations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WorkingHoursDialogProps {
  onSave: () => void;
  children?: React.ReactNode;
}

const DAY_NAMES = {
  1: "Понеделник",
  2: "Вторник",
  3: "Сряда",
  4: "Четвъртък",
  5: "Петък",
  6: "Събота",
  0: "Неделя",
};

export function WorkingHoursDialog({ onSave, children }: WorkingHoursDialogProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState<Record<number, { start: string; end: string; closed?: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadHours();
    }
  }, [open]);

  const loadHours = async () => {
    setIsLoading(true);
    try {
      const data = await getWorkingHours();
      setHours(data);
    } catch (error) {
      toast.error("Грешка при зареждане на работното време.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateWorkingHours(hours);
      toast.success("Работното време е актуализирано.");
      onSave();
      setOpen(false);
    } catch (error) {
      toast.error("Грешка при запазване.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDay = (day: number, field: "start" | "end" | "closed", value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl border-zinc-200 dark:border-zinc-800">
            <Settings2 className="w-4 h-4" />
            Настройки на работното време
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 max-h-[90vh] flex flex-col">
        <div className="p-6 sm:p-10 flex flex-col h-full overflow-hidden">
          <DialogHeader className="mb-6 shrink-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black font-heading text-zinc-900 dark:text-white">
                  Работно време
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-zinc-500 font-medium">
                  Настройте часовете за всеки ден от седмицата.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Зареждане...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <div 
                  key={day} 
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    hours[day]?.closed 
                      ? "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-900/20" 
                      : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50 hover:border-blue-200 dark:hover:border-blue-900/30"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <button
                      onClick={() => updateDay(day, "closed", !hours[day]?.closed)}
                      className={cn(
                        "w-10 h-6 rounded-full relative transition-colors duration-200 focus:outline-none shrink-0",
                        hours[day]?.closed ? "bg-rose-500" : "bg-emerald-500"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200",
                        hours[day]?.closed ? "translate-x-4" : "translate-x-0"
                      )} />
                    </button>
                    <Label className="font-black text-sm text-zinc-700 dark:text-zinc-300">
                      {DAY_NAMES[day as keyof typeof DAY_NAMES]}
                    </Label>
                  </div>

                  {hours[day]?.closed ? (
                    <div className="flex-1 flex justify-center sm:justify-end animate-in fade-in zoom-in-95 duration-300">
                      <span className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] border border-rose-200 dark:border-rose-800/50 shadow-sm">
                        Почивен ден
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="relative">
                        <Input
                          type="time"
                          value={hours[day]?.start || ""}
                          onChange={(e) => updateDay(day, "start", e.target.value)}
                          className="w-full sm:w-[110px] h-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold tabular-nums focus:ring-blue-500/20"
                        />
                      </div>
                      <span className="text-zinc-400 font-black">—</span>
                      <div className="relative">
                        <Input
                          type="time"
                          value={hours[day]?.end || ""}
                          onChange={(e) => updateDay(day, "end", e.target.value)}
                          className="w-full sm:w-[110px] h-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold tabular-nums focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 shrink-0 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="order-2 sm:order-1 flex-1 h-12 sm:h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Отказ
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="order-1 sm:order-2 flex-[2] h-12 sm:h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Запази промените
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
