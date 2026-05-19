"use client";

import { useEffect, useState, useMemo } from "react";
import { Member, ClubService, ScheduleEvent, Subscription } from "@/types";
import { getAttendancesByMemberId } from "@/services/attendance-service";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMembershipSuggestions } from "@/lib/membership-utils";
import { format } from "date-fns";

interface MembershipSuggestionsProps {
  member: Member;
  services: ClubService[];
  memberSubscriptions?: Subscription[];
  onSelectService: (
    serviceId: string,
    price: number,
    suggestedName?: string,
    month?: string
  ) => void;
}

export function MembershipSuggestions({
  member,
  services,
  memberSubscriptions = [],
  onSelectService,
}: MembershipSuggestionsProps) {
  const [attendances, setAttendances] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchAttendance() {
      if (!member.id) return;
      setIsLoading(true);
      try {
        const data = await getAttendancesByMemberId(member.id);
        setAttendances(data);
      } catch (error) {
        console.error("Error fetching attendance for suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttendance();
  }, [member.id]);

  const monthlyGroups = useMemo(() => {
    const groups: { [monthStr: string]: ScheduleEvent[] } = {};
    attendances.forEach((event) => {
      if (!event.startDate) return;
      const mStr = event.startDate.substring(0, 7); // YYYY-MM
      if (!groups[mStr]) groups[mStr] = [];
      groups[mStr].push(event);
    });

    const currentMonth = format(new Date(), "yyyy-MM");
    if (!groups[currentMonth]) {
      groups[currentMonth] = [];
    }

    return groups;
  }, [attendances]);

  const candidateMonths = useMemo(() => {
    const subs = memberSubscriptions;
    const allMonths = Object.keys(monthlyGroups).sort((a, b) =>
      b.localeCompare(a)
    );
    const currentMonth = format(new Date(), "yyyy-MM");

    return allMonths.filter((mStr) => {
      const [y, m] = mStr.split("-").map(Number);
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      lastDay.setHours(23, 59, 59, 999);

      const hasSub = subs.some((sub) => {
        if (sub.status === "cancelled") return false;
        const sStart = new Date(sub.startDate);
        const sEnd = new Date(sub.endDate);
        return sStart <= lastDay && sEnd >= firstDay;
      });

      if (!hasSub) return true;
      if (mStr === currentMonth) {
        const hasPaidOrActive = subs.some((sub) => {
          if (sub.status === "cancelled") return false;
          const sStart = new Date(sub.startDate);
          const sEnd = new Date(sub.endDate);
          return (
            sStart <= lastDay &&
            sEnd >= firstDay &&
            (sub.status === "active" || sub.pricePaid > 0)
          );
        });
        return !hasPaidOrActive;
      }

      return false;
    });
  }, [monthlyGroups, memberSubscriptions]);

  if (isLoading) {
    return (
      <div className="p-4 bg-zinc-50 rounded-2xl animate-pulse flex flex-col gap-2">
        <div className="h-4 w-32 bg-zinc-200 rounded" />
        <div className="h-12 w-full bg-zinc-100 rounded-xl" />
      </div>
    );
  }

  if (candidateMonths.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {candidateMonths.map((monthStr) => {
        const monthEvents = monthlyGroups[monthStr] || [];
        const attendanceCount = monthEvents.length;
        const [year, monthNum] = monthStr.split("-");
        const monthName = new Date(
          parseInt(year),
          parseInt(monthNum) - 1
        ).toLocaleString("bg-BG", { month: "long" });
        const localizedMonth = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

        const activeSuggestions = getMembershipSuggestions(
          member,
          services,
          attendanceCount
        ).slice(0, 2);

        if (activeSuggestions.length === 0) return null;

        return (
          <div
            key={monthStr}
            className="space-y-4 pb-4 border-b border-zinc-100/80 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Умни предложения • {localizedMonth}
              </h4>
              <Badge
                variant="outline"
                className="rounded-full bg-blue-50 text-blue-600 border-blue-100 text-[9px] px-2.5 py-0.5"
              >
                {attendanceCount} посещени{attendanceCount === 1 ? "е" : "я"}{" "}
                през {localizedMonth}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activeSuggestions.map((s) => {
                const price = s.suggestedPrice ?? s.service.price;
                const name = s.suggestedServiceName ?? s.service.name;

                return (
                  <BentoCard
                    key={s.service.id}
                    onClick={() =>
                      onSelectService(s.service.id, price, name, monthStr)
                    }
                    className={cn(
                      "p-4 border-zinc-100 bg-white hover:border-zinc-950 transition-all cursor-pointer group relative overflow-hidden shadow-sm",
                      s.bestValue && "bg-zinc-950 text-white border-zinc-950"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl shrink-0",
                          s.bestValue
                            ? "bg-white/10 text-white"
                            : "bg-zinc-50 group-hover:bg-zinc-950 group-hover:text-white transition-colors"
                        )}
                      >
                        <s.icon className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs font-semibold truncate",
                            s.bestValue ? "text-white" : "text-zinc-950"
                          )}
                        >
                          {name}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] mt-0.5 line-clamp-2 leading-relaxed",
                            s.bestValue ? "text-zinc-300" : "text-zinc-500"
                          )}
                        >
                          {s.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-sm font-bold tracking-tight",
                            s.bestValue ? "text-white" : "text-zinc-950"
                          )}
                        >
                          {price} {s.service.currency}
                        </p>
                        {s.bestValue && (
                          <Badge className="bg-white text-zinc-950 rounded-full text-[8px] px-1.5 py-0 mt-1 uppercase font-black">
                            Топ избор
                          </Badge>
                        )}
                      </div>
                    </div>
                  </BentoCard>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
