/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { ArrowRight, Gift, Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { useMembers } from "@/hooks/useMembers";
import { useAppStore } from "@/store/use-app-store";
import { Member } from "@/types/member.types";

function parseDob(dob: any): Date | null {
  if (!dob) return null;

  // 1. Web SDK Timestamp object
  if (typeof dob.toDate === "function") {
    return dob.toDate();
  }

  // 2. Serialized objects (seconds or _seconds)
  if (typeof dob === "object") {
    if ("seconds" in dob && typeof dob.seconds === "number") {
      return new Date(dob.seconds * 1000);
    }
    if ("_seconds" in dob && typeof dob._seconds === "number") {
      return new Date(dob._seconds * 1000);
    }
  }

  // 3. String date formats
  if (typeof dob === "string") {
    if (/^\d{4}$/.test(dob.trim())) return null;
    const d = new Date(dob);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function BirthdayReminder() {
  const { activeBranch } = useAppStore();
  const isRecovery = activeBranch === "recoveryzone";
  const { members, loading } = useMembers();
  const router = useRouter();

  // All active members with calculated next birthdays
  const allBirthdays = useMemo(() => {
    if (!members || members.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    const withBirthdays = members
      .filter((m) => m.status === "active")
      .filter((m) => (isRecovery ? m.isRecoveryMember === true : true))
      .map((m) => {
        const dob = parseDob(m.dateOfBirth);
        if (!dob) return null;

        const nextBirthday = new Date(dob);
        nextBirthday.setFullYear(currentYear);
        nextBirthday.setHours(0, 0, 0, 0);

        if (nextBirthday < today) {
          nextBirthday.setFullYear(currentYear + 1);
        }

        const diffTime = nextBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const ageTurning = nextBirthday.getFullYear() - dob.getFullYear();

        return {
          member: m,
          dob,
          nextBirthday,
          diffDays,
          ageTurning,
        };
      })
      .filter(Boolean) as {
      member: Member;
      dob: Date;
      nextBirthday: Date;
      diffDays: number;
      ageTurning: number;
    }[];

    return withBirthdays.sort((a, b) => a.diffDays - b.diffDays);
  }, [members]);

  const upcomingBirthdays = useMemo(() => {
    return allBirthdays.filter((b) => b.diffDays <= 14);
  }, [allBirthdays]);

  const nextClosest = allBirthdays[0] || null;

  if (loading) {
    return (
      <BentoCard className="flex flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-6 shadow-none dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/50">
            <Gift className="size-4" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Рождени дни
            </h2>
            <p className="text-[11px] text-zinc-400">Клубен календар</p>
          </div>
        </div>
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-300" />
        </div>
      </BentoCard>
    );
  }

  // When no birthdays in next 14 days, show friendly calm card with closest next birthday
  if (upcomingBirthdays.length === 0) {
    return (
      <BentoCard className="flex flex-col justify-between rounded-4xl border border-zinc-100 bg-white p-6 shadow-none dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400">
                <Gift className="size-4" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Рождени дни
                </h2>
                <p className="text-[11px] text-zinc-400">Клубен календар</p>
              </div>
            </div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              14 дни: 0
            </span>
          </div>

          <div className="my-2 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400">
                <PartyPopper className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Няма рожденици в близките 14 дни
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {nextClosest ? (
                    <span>
                      Следващ:{" "}
                      <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {nextClosest.member.firstName}{" "}
                        {nextClosest.member.lastName}
                      </strong>{" "}
                      (след {nextClosest.diffDays} дни)
                    </span>
                  ) : (
                    "Няма въведени рождени дати в картотеката"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Link
            href="/members"
            className="group flex items-center justify-between text-xs font-semibold text-zinc-600 transition-colors hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
          >
            <span>Картотека на членовете</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="relative flex flex-col justify-between overflow-hidden rounded-4xl border border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 p-6 shadow-none dark:border-rose-900/50 dark:from-rose-950/20 dark:via-zinc-900 dark:to-zinc-900">
      <div>
        <div className="relative z-10 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/25">
              <Gift className="size-4" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                Рождени дни
              </h2>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/70">
                Следващите 14 дни
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="border-rose-200 bg-rose-100 px-2 text-[10px] font-bold text-rose-800 shadow-none dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
          >
            {upcomingBirthdays.length}{" "}
            {upcomingBirthdays.length === 1 ? "рожденик" : "рожденици"}
          </Badge>
        </div>

        <div className="relative z-10 max-h-72 space-y-2 overflow-y-auto pr-1">
          {upcomingBirthdays.map((bday) => (
            <div
              key={bday.member.id}
              className="group flex cursor-pointer items-center justify-between rounded-2xl border border-rose-100/80 bg-white/95 p-3 backdrop-blur-xs transition-all hover:border-rose-300 hover:shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/95"
              onClick={() => router.push(`/members/${bday.member.id}`)}
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="size-9 border border-rose-100 transition-colors group-hover:border-rose-300">
                  <AvatarImage src={bday.member.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-rose-50 text-xs font-semibold text-rose-700">
                    {bday.member.firstName?.[0]}
                    {bday.member.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {bday.member.firstName} {bday.member.lastName}
                  </p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400">
                    Навършва {bday.ageTurning} год.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5 text-right">
                {bday.diffDays === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-extrabold text-white">
                    ДНЕС! 🥳
                  </span>
                ) : bday.diffDays === 1 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    УТРЕ
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    След {bday.diffDays} дни
                  </span>
                )}
                <span className="text-[10px] text-zinc-400">
                  {bday.nextBirthday.toLocaleDateString("bg-BG", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-4 border-t border-rose-200/50 pt-3 dark:border-zinc-800">
        <Link
          href="/members"
          className="group flex items-center justify-between text-xs font-semibold text-rose-900 transition-colors hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-100"
        >
          <span>Картотека на членовете</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </BentoCard>
  );
}
