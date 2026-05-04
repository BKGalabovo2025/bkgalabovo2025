"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AssistantPanel() {
  const [isSending, setIsSending] = useState(false);

  const handleSendReminders = async () => {
    setIsSending(true);
    toast.info("Започва изпращане на напомняния...");

    try {
      const response = await fetch("/api/send-reminders", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Неуспешно изпращане на напомнянията.");
      }

      toast.success(result.message || "Напомнянията са изпратени успешно.");
    } catch (error) {
      console.error("Failed to send reminders:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Възникна неочаквана грешка.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-10 py-10 relative overflow-hidden group">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="h-16 w-16 rounded-[1.5rem] bg-zinc-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
          <Zap className="h-8 w-8 text-blue-500 animate-pulse" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-3xl font-black font-heading text-zinc-950 dark:text-white uppercase tracking-tighter leading-none">Интелигентен асистент</h3>
          <p className="text-zinc-500 font-bold text-base uppercase tracking-widest text-[10px]">Автоматизирани действия за оптимизиране на клуба</p>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Системата е в готовност</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSendReminders} 
        disabled={isSending}
        className="relative z-10 h-16 px-10 rounded-[1.5rem] bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/30 border-t border-blue-400/30 w-full md:w-auto"
      >
        {isSending ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Изпращане...
          </>
        ) : (
          "Изпрати напомняния за такси"
        )}
      </Button>
    </div>
  );
}
