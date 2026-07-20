 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Gift, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMembers } from "@/hooks/useMembers";
import { Member } from "@/types/member.types";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

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
    // Ignore if it's just a year
    if (/^\d{4}$/.test(dob.trim())) return null;
    const d = new Date(dob);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function BirthdayReminder() {
  const { members, loading } = useMembers();
  const router = useRouter();

  const upcomingBirthdays = useMemo(() => {
    if (!members || members.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 14); // 14 days ahead

    const currentYear = today.getFullYear();

    const withBirthdays = members
      .filter((m) => m.status === "active")
      .map((m) => {
        const dob = parseDob(m.dateOfBirth);
        if (!dob) return null;

        // Calculate next birthday
        const nextBirthday = new Date(dob);
        nextBirthday.setFullYear(currentYear);
        nextBirthday.setHours(0, 0, 0, 0);

        // If it already passed this year, it's next year
        if (nextBirthday < today) {
          nextBirthday.setFullYear(currentYear + 1);
        }

        const diffTime = nextBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 14) {
          // Calculate age they are turning
          const ageTurning = nextBirthday.getFullYear() - dob.getFullYear();

          return {
            member: m,
            dob,
            nextBirthday,
            diffDays,
            ageTurning,
          };
        }

        return null;
      })
      .filter(Boolean) as {
      member: Member;
      dob: Date;
      nextBirthday: Date;
      diffDays: number;
      ageTurning: number;
    }[];

    // Sort by closest birthday first
    return withBirthdays.sort((a, b) => a.diffDays - b.diffDays);
  }, [members]);

  if (loading) {
    return (
      <BentoCard className="p-6">
        <div className="mb-6 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <Gift className="size-5 text-rose-500" strokeWidth={1.5} />
          <h3 className="text-lg font-medium">Предстоящи Рождени Дни</h3>
        </div>
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-zinc-300" />
        </div>
      </BentoCard>
    );
  }

  if (upcomingBirthdays.length === 0) {
    return null; // Don't show the widget if there are no birthdays in the next 14 days
  }

  return (
    <BentoCard className="relative overflow-hidden border-l-4 border-l-rose-500 p-6">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Gift className="size-48 rotate-12" />
      </div>

      <div className="relative z-10 mb-6 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
        <Gift className="size-5 text-rose-500" strokeWidth={1.5} />
        <h3 className="text-lg font-medium">Предстоящи Рождени Дни</h3>
        <Badge
          variant="secondary"
          className="ml-2 border-rose-100 bg-rose-50 px-2 text-[10px] font-medium tracking-widest text-rose-800 uppercase shadow-none dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
        >
          {upcomingBirthdays.length} члена
        </Badge>
      </div>

      <div className="relative z-10 space-y-3">
        {upcomingBirthdays.map((bday) => (
          <div
            key={bday.member.id}
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-100 bg-white p-3 transition-all hover:border-rose-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            onClick={() => router.push(`/members/${bday.member.id}`)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-zinc-100 transition-colors group-hover:border-rose-200">
                <AvatarImage src={bday.member.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-zinc-50 font-medium text-zinc-700">
                  {bday.member.firstName?.[0]}
                  {bday.member.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {bday.member.firstName} {bday.member.lastName}
                </p>
                <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase dark:text-zinc-400">
                  Навършва {bday.ageTurning} год.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              {(() => {
                if (bday.diffDays === 0) {
                  return (
                    <Badge className="animate-pulse border-none bg-rose-500 shadow-none hover:bg-rose-600">
                      ДНЕС! 🥳
                    </Badge>
                  );
                }
                if (bday.diffDays === 1) {
                  return (
                    <Badge
                      variant="outline"
                      className="border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                    >
                      УТРЕ
                    </Badge>
                  );
                }
                return (
                  <Badge
                    variant="outline"
                    className="border-zinc-200 text-zinc-500 dark:border-zinc-700"
                  >
                    След {bday.diffDays} дни
                  </Badge>
                );
              })()}
              <span className="text-xs font-medium text-zinc-600">
                {bday.nextBirthday.toLocaleDateString("bg-BG", {
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
