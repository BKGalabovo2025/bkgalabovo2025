"use client";

import { useEffect, useState } from "react";
import { Member, ClubService, ScheduleEvent } from "@/types";
import { getAttendancesByMemberId } from "@/services/attendance-service";
import { BentoCard } from "@/components/ui/bento-card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMembershipSuggestions } from "@/lib/membership-utils";

interface MembershipSuggestionsProps {
  member: Member;
  services: ClubService[];
  month: string; // YYYY-MM
  onSelectService: (serviceId: string, price: number) => void;
}

export function MembershipSuggestions({
  member,
  services,
  month,
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
        // Filter for the selected month
        const filtered = data.filter((event) => {
          const eventMonth = event.startDate.substring(0, 7);
          return eventMonth === month;
        });
        setAttendances(filtered);
      } catch (error) {
        console.error("Error fetching attendance for suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttendance();
  }, [member.id, month]);

  const attendanceCount = attendances.length;
  const [year, monthNum] = month.split("-");
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

  if (isLoading) {
    return (
      <div className="p-4 bg-zinc-50 rounded-2xl animate-pulse flex flex-col gap-2">
        <div className="h-4 w-32 bg-zinc-200 rounded" />
        <div className="h-12 w-full bg-zinc-100 rounded-xl" />
      </div>
    );
  }

  if (activeSuggestions.length === 0 && attendanceCount === 0) {
    return (
      <div className="p-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl text-center">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
          Няма засечена активност за {localizedMonth}
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Изберете услуга ръчно от каталога.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Умни предложения
        </h4>
        <Badge
          variant="outline"
          className="rounded-full bg-blue-50 text-blue-600 border-blue-100 text-[9px] px-2 py-0"
        >
          {attendanceCount} посещения през {localizedMonth}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {activeSuggestions.map((s) => (
          <BentoCard
            key={s.service.id}
            onClick={() => onSelectService(s.service.id, s.service.price)}
            className={cn(
              "p-4 border-zinc-100 bg-white hover:border-zinc-950 transition-all cursor-pointer group relative overflow-hidden",
              s.bestValue && "bg-zinc-950 text-white border-zinc-950"
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  s.bestValue
                    ? "bg-white/10"
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
                  {s.service.name}
                </p>
                <p
                  className={cn(
                    "text-[10px] mt-0.5 line-clamp-2 leading-relaxed",
                    s.bestValue ? "text-zinc-400" : "text-zinc-500"
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
                  {s.service.price} {s.service.currency}
                </p>
                {s.bestValue && (
                  <Badge className="bg-white text-zinc-950 rounded-full text-[8px] px-1.5 py-0 mt-1 uppercase font-black">
                    Топ избор
                  </Badge>
                )}
              </div>
            </div>
          </BentoCard>
        ))}
      </div>
    </div>
  );
}
