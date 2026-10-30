"use client";

import {
  Bell,
  CalendarX2,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  FileSignature,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParentPortalAdmin } from "@/hooks/useParentPortalAdmin";
import { cn } from "@/lib/utils";

function playChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // High gentle chime: F5 (698.46Hz) then A5 (880Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(698.46, now);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.1);

    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.6);
  } catch {
    // Browser audio policy might restrict autoplay before first gesture, ignore gracefully
  }
}

export function ParentNotificationsBell() {
  const { counts, documentRequests } = useParentPortalAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const prevTotalRef = useRef<number | null>(null);

  const recentSignedOrViewedDocs = documentRequests
    .filter((d) => d.status === "completed" || Boolean(d.viewedByParentAt))
    .slice(0, 4);

  useEffect(() => {
    if (
      prevTotalRef.current !== null &&
      counts.totalPending > prevTotalRef.current
    ) {
      playChime();
    }
    prevTotalRef.current = counts.totalPending;
  }, [counts.totalPending]);

  const hasPending = counts.totalPending > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Известия (${counts.totalPending} чакащи)`}
          className={cn(
            "relative size-9 rounded-xl border border-zinc-200 bg-white shadow-xs transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
            hasPending &&
              "border-amber-300 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
          )}
        >
          <Bell
            className={cn(
              "size-4 transition-transform",
              hasPending && "animate-bounce"
            )}
          />
          {hasPending && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-950">
              {counts.totalPending > 9 ? "9+" : counts.totalPending}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-900 dark:text-white">
              Родителски портал
            </span>
          </div>
          {hasPending ? (
            <Badge className="bg-amber-100 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              {counts.totalPending} чакащи
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] text-zinc-400 border-zinc-200 dark:border-zinc-700"
            >
              Всичко е прегледано
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />

        {hasPending ? (
          <div className="space-y-1 p-1">
            {counts.pendingRequests > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href="/parents?tab=requests"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      <UserPlus className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-medium">Заявки за достъп</p>
                      <p className="text-[10px] text-zinc-400">
                        Чакат одобрение
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {counts.pendingRequests}
                  </span>
                </Link>
              </DropdownMenuItem>
            )}

            {counts.pendingAbsences > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href="/parents?tab=absences"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                      <CalendarX2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-medium">Отсъствия</p>
                      <p className="text-[10px] text-zinc-400">
                        Нови съобщения
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {counts.pendingAbsences}
                  </span>
                </Link>
              </DropdownMenuItem>
            )}

            {counts.pendingCorrections > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href="/parents?tab=corrections"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                      <Edit3 className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-medium">Корекции на данни</p>
                      <p className="text-[10px] text-zinc-400">
                        Предложени от родител
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {counts.pendingCorrections}
                  </span>
                </Link>
              </DropdownMenuItem>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center text-zinc-400">
            <CheckCircle2 className="size-7 text-emerald-500/80 mb-1.5 stroke-1.5" />
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Няма чакащи известия
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Всички заявки и отсъствия са обработени
            </p>
          </div>
        )}

        {recentSignedOrViewedDocs.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Документи (Прегледани / Подписани)
            </div>
            <div className="space-y-1 p-1">
              {recentSignedOrViewedDocs.map((doc) => {
                const isSigned = doc.status === "completed";
                return (
                  <DropdownMenuItem key={doc.id} asChild>
                    <Link
                      href={`/members/${doc.memberId}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-lg",
                            isSigned
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400"
                          )}
                        >
                          {isSigned ? (
                            <FileSignature className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[11px]">
                            {doc.documentTitle}
                          </p>
                          <p className="truncate text-[10px] text-zinc-400">
                            {doc.memberName} •{" "}
                            {isSigned ? "✍️ Подписан" : "👁️ Прегледан"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </>
        )}

        <DropdownMenuSeparator className="my-1 bg-zinc-100 dark:bg-zinc-800" />

        <DropdownMenuItem asChild>
          <Link
            href="/parents"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-center text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
          >
            <span>Към целия панел за родители</span>
            <ExternalLink className="size-3" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
