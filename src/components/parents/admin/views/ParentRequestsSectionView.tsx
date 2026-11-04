"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Mail,
  Phone,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay } from "@/lib/phone-utils";

import { useParentAdminContext } from "../ParentAdminContext";

export function ParentRequestsSectionView() {
  const {
    pendingRequests,
    members,
    handleOpenApproveDialog,
    setRejectDialogReq,
    setRejectReason,
  } = useParentAdminContext();

  if (pendingRequests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <CheckCircle2
          size={40}
          className="mx-auto text-emerald-500 opacity-60"
        />
        <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-white">
          Няма чакащи заявки
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Всички подадени заявки от родители са прегледани и обработени.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {pendingRequests.map((req) => {
        const matchedMember = members.find((m) => m.id === req.matchedMemberId);

        const roleLabel =
          req.parentRole === "mother"
            ? "Майка"
            : req.parentRole === "father"
              ? "Баща"
              : "Настойник";

        return (
          <div
            key={req.id}
            className="flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div>
              {/* Top badges */}
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold"
                >
                  Чака одобрение
                </Badge>
                <span className="text-[11px] text-zinc-400">
                  {req.createdAt
                    ? new Date(req.createdAt).toLocaleDateString("bg-BG", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>

              {/* Parent details */}
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-base font-black text-zinc-900 dark:text-white">
                    {req.parentName}
                  </h4>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    ({roleLabel})
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} className="text-zinc-400" />
                    <a
                      href={`tel:${req.parentPhone}`}
                      className="font-medium hover:underline"
                    >
                      {formatPhoneDisplay(req.parentPhone)}
                    </a>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-zinc-400" />
                    <a
                      href={`mailto:${req.parentEmail}`}
                      className="font-medium hover:underline"
                    >
                      {req.parentEmail}
                    </a>
                  </span>
                </div>
              </div>

              {/* Child info requested */}
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Заявено дете:
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    {req.childFullName}
                  </span>
                  <span className="text-xs text-zinc-500">
                    Роден(а): {req.childBirthDate}
                  </span>
                </div>

                {/* Match Status */}
                {matchedMember ? (
                  <div className="mt-2.5 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-50/80 px-2.5 py-1.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>
                        Открито съвпадение в картотеката:{" "}
                        {matchedMember.fullName}
                      </span>
                    </span>
                    <Link
                      href={`/members/${matchedMember.id}`}
                      className="text-[11px] font-bold underline hover:opacity-80"
                      target="_blank"
                    >
                      Картон ↗
                    </Link>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-50/80 px-2.5 py-1.5 text-xs text-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
                    <AlertTriangle
                      size={14}
                      className="text-orange-500 shrink-0"
                    />
                    <span>
                      Няма автоматично съвпадение. Моля, изберете член ръчно
                      преди одобрение.
                    </span>
                  </div>
                )}

                {req.isSecondParent && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    <Users size={12} />
                    <span>ℹ️ Втори родител за това дете</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
              <Button
                size="sm"
                onClick={() => handleOpenApproveDialog(req)}
                className="flex-1 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 shadow-sm"
              >
                <Check size={15} className="mr-1.5" />
                <span>Одобри достъп</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRejectDialogReq(req);
                  setRejectReason("Няма открито дете с посочените данни.");
                }}
                className="rounded-xl border-zinc-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-zinc-800 dark:hover:bg-red-950/20"
              >
                <X size={15} className="mr-1.5" />
                <span>Откажи</span>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
