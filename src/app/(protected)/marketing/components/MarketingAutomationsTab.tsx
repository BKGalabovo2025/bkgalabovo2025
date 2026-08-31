"use client";

import {
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Power,
  Zap,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingAutomationRule } from "@/types/marketing.types";

interface Props {
  rules: MarketingAutomationRule[];
  onToggleRule: (id: string, isActive: boolean) => Promise<void>;
}

export function MarketingAutomationsTab({ rules, onToggleRule }: Props) {
  const handleToggle = async (rule: MarketingAutomationRule) => {
    try {
      await onToggleRule(rule.id, !rule.isActive);
      toast.success(
        rule.isActive
          ? `Автоматизацията "${rule.title}" беше спряна.`
          : `Автоматизацията "${rule.title}" беше активирана успешно!`
      );
    } catch {
      toast.error("Възникна грешка при промяна на състоянието.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 p-6 shadow-xs sm:flex-row sm:items-center dark:border-indigo-900/50 dark:bg-gradient-to-r dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <Zap className="size-4.5" />
            </div>
            <h2 className="text-lg font-black text-zinc-950 dark:text-white">
              Автоматизирани съобщения & Тригери
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Системата автоматично изпраща известия, напомняния и клубни анкети
            при настъпване на събития
          </p>
        </div>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <Card
            key={rule.id}
            className={`flex flex-col justify-between overflow-hidden rounded-3xl border p-5 shadow-xs transition-all ${
              rule.isActive
                ? "border-emerald-300 bg-white shadow-emerald-100/50 dark:border-emerald-800 dark:bg-zinc-900"
                : "border-zinc-200 bg-zinc-50/50 opacity-80 dark:border-zinc-800 dark:bg-zinc-950/40"
            }`}
          >
            <div className="space-y-3">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 rounded-lg border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-700 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {rule.channel === "whatsapp" && (
                    <MessageCircle className="size-3 text-emerald-600" />
                  )}
                  {rule.channel === "viber" && (
                    <Phone className="size-3 text-purple-600" />
                  )}
                  {rule.channel === "sms" && (
                    <MessageSquare className="size-3 text-blue-600" />
                  )}
                  {rule.channel === "email" && (
                    <Mail className="size-3 text-rose-600" />
                  )}
                  <span>{rule.channel}</span>
                </Badge>

                {rule.isActive ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" />
                    Активна
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-zinc-200 bg-zinc-100 text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    Изключена
                  </Badge>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                  {rule.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {rule.description}
                </p>
              </div>

              {/* Trigger Info */}
              <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                <Clock className="size-3.5" />
                <span>Задействане: след {rule.delayHours} часа</span>
              </div>
            </div>

            {/* Toggle Button */}
            <div className="mt-5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <Button
                type="button"
                variant={rule.isActive ? "outline" : "default"}
                onClick={() => handleToggle(rule)}
                className={`w-full rounded-2xl text-xs font-bold transition-all ${
                  rule.isActive
                    ? "border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-300"
                    : "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                }`}
              >
                <Power className="mr-1.5 size-3.5" />
                {rule.isActive ? "⏸️ Спри автоматизацията" : "▶️ Активирай"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
