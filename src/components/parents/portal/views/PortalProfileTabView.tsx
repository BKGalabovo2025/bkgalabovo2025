"use client";

import {
  Award,
  Cake,
  CheckCircle2,
  Edit3,
  HeartPulse,
  Info,
  MapPin,
  Phone,
  School,
  Shirt,
  User,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParentMemberPermissions } from "@/types/parent-portal.types";

import { useParentPortalContext } from "../ParentPortalContext";

const FIELD_CONFIG: Array<{
  key: string;
  label: string;
  permKey: keyof ParentMemberPermissions;
  icon: React.ElementType;
}> = [
  {
    key: "birthDate",
    label: "Дата на раждане",
    permKey: "showBirthDate",
    icon: Cake,
  },
  {
    key: "ageGroup",
    label: "Възрастова група",
    permKey: "showAgeGroup",
    icon: User,
  },
  {
    key: "phone",
    label: "Телефон на детето",
    permKey: "showPhone",
    icon: Phone,
  },
  {
    key: "address",
    label: "Адрес на местоживеене",
    permKey: "showAddress",
    icon: MapPin,
  },
  {
    key: "school",
    label: "Учебно заведение (училище)",
    permKey: "showSchool",
    icon: School,
  },
  {
    key: "apparelSize",
    label: "Размер спортна екипировка",
    permKey: "showApparelSize",
    icon: Shirt,
  },
  {
    key: "emergencyContact",
    label: "Телефон за спешни случаи",
    permKey: "showEmergencyContact",
    icon: Phone,
  },
  {
    key: "healthNotes",
    label: "Здравни бележки и особености",
    permKey: "showHealthNotes",
    icon: HeartPulse,
  },
];

export function PortalProfileTabView() {
  const { portal, openCorrectionDialog } = useParentPortalContext();
  const { selectedChild, permissions, visibleData, pendingCorrections } =
    portal;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Main Profile Summary Card ────────────────────────────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-black tracking-wider text-zinc-900 dark:text-white uppercase flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <span>Картон и картотека на състезателя</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Официални данни от картотеката на клуба. При неточност можете да
              заявите корекция.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
              <CheckCircle2 size={11} className="mr-1" />
              {visibleData?.status === "active"
                ? "Активен член"
                : "Член на клуба"}
            </Badge>

            {selectedChild?.isLicensed && (
              <Badge
                variant="outline"
                className="border-blue-300 bg-blue-50 text-blue-700 text-[10px] font-bold dark:bg-blue-950/40 dark:text-blue-300"
              >
                <Award size={11} className="mr-1 text-blue-600" />
                Картотекиран в БФБ
              </Badge>
            )}

            {selectedChild?.trainingGroup && (
              <Badge variant="outline" className="text-[10px] font-bold">
                {selectedChild.trainingGroup}
              </Badge>
            )}
          </div>
        </div>

        {/* Granular Field List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FIELD_CONFIG.map((field) => {
            const isVisible = permissions ? permissions[field.permKey] : true;
            if (isVisible === false) return null;

            const Icon = field.icon;
            const rawVal = visibleData ? visibleData[field.key] : null;
            const displayVal =
              rawVal !== null &&
              rawVal !== undefined &&
              String(rawVal).trim() !== ""
                ? String(rawVal)
                : "Не е въведено";

            const pending = pendingCorrections?.[field.key];

            return (
              <div
                key={field.key}
                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900 shadow-2xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Icon
                      size={13}
                      className="text-blue-600 dark:text-blue-400 shrink-0"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {field.label}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {displayVal}
                  </p>

                  {pending && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold dark:bg-amber-950/60 dark:text-amber-300">
                        ⏳ Заявена корекция: &quot;{pending.proposedValue}&quot;
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openCorrectionDialog(
                      field.key,
                      field.label,
                      String(rawVal || "")
                    )
                  }
                  className="h-8 gap-1 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40 shrink-0"
                  title="Заяви коригиране на тази стойност"
                >
                  <Edit3 size={12} />
                  <span>Корекция</span>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs text-zinc-600 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-zinc-400 flex items-start gap-2.5">
          <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Всички подадени корекции се изпращат директно до администратора на
            клуба за потвърждение и се отразяват в картона на състезателя
            веднага след одобрение.
          </p>
        </div>
      </div>
    </div>
  );
}
