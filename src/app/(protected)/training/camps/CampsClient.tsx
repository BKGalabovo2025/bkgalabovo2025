"use client";

import {
  CalendarDays,
  ExternalLink,
  Link2,
  MapPin,
  Search,
  Tent,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { CampsListNav } from "@/components/training/camps/CampsListNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { formatEventDateRange } from "@/lib/date-utils";
import { getCamps } from "@/services/schedule-service";
import { ScheduleEvent } from "@/types";

interface CampsClientProps {
  section?: "all" | "upcoming" | "past";
}

export default function CampsClient({ section = "all" }: CampsClientProps) {
  const searchParams = useSearchParams();
  const campIdParam = searchParams.get("id") || searchParams.get("campId");

  const [camps, setCamps] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadCamps() {
      try {
        const data = await getCamps();
        setCamps(data);
      } catch (err) {
        console.error("Failed to load camps", err);
      } finally {
        setLoading(false);
      }
    }
    loadCamps();
  }, []);

  useEffect(() => {
    if (!loading && campIdParam) {
      setTimeout(() => {
        const el = document.getElementById(`camp-${campIdParam}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [loading, campIdParam]);

  const kpiStats = useMemo(() => {
    const now = new Date();
    const upcomingCount = camps.filter(
      (camp) => new Date(camp.endDate) >= now
    ).length;
    const pastCount = camps.length - upcomingCount;
    return {
      total: camps.length,
      upcoming: upcomingCount,
      past: pastCount,
    };
  }, [camps]);

  const displayedCamps = useMemo(() => {
    const now = new Date();
    let list = camps;
    if (section === "upcoming") {
      list = camps.filter((camp) => new Date(camp.endDate) >= now);
    } else if (section === "past") {
      list = camps.filter((camp) => new Date(camp.endDate) < now);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.location || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [camps, section, searchQuery]);

  useDeepLinkHighlight("camp", !loading && displayedCamps.length > 0, "campId");

  const renderCampCards = (items: ScheduleEvent[]) => {
    const now = new Date();
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Tent className="mb-4 size-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Няма намерени лагери
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            В тази категория все още няма планирани лагери.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((camp) => {
          const startDateObj = new Date(camp.startDate);
          const endDateObj = new Date(camp.endDate);
          const attendeesCount = camp.attendees?.length || 0;
          const isPast = endDateObj < now;
          const isHighlighted = campIdParam === camp.id;

          return (
            <Card
              key={camp.id}
              id={`camp-${camp.id}`}
              className={`flex h-full flex-col overflow-hidden rounded-2xl border-zinc-200/80 shadow-xs transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 ${
                isHighlighted ? "ring-2 ring-indigo-500" : ""
              }`}
            >
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl font-bold">
                    <Link
                      href={`/training/camps/${camp.id}`}
                      className="hover:underline text-zinc-900 dark:text-zinc-100"
                    >
                      {camp.title}
                    </Link>
                  </CardTitle>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge
                      variant={isPast ? "outline" : "default"}
                      className="text-[10px] uppercase font-bold shrink-0"
                    >
                      {isPast ? "Приключил" : "Предстоящ"}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}?id=${camp.id}`;
                        void navigator.clipboard.writeText(url);
                        toast.success("Линкът е копиран!");
                      }}
                      title="Копирай директен линк"
                      aria-label="Копирай директен линк"
                    >
                      <Link2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-1.5 pt-2 text-zinc-600 dark:text-zinc-300">
                  <MapPin size={16} />
                  <span>{camp.location || "Без локация"}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <CalendarDays size={16} className="text-primary" />
                    <span>
                      {formatEventDateRange(startDateObj, endDateObj)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Users size={16} className="text-primary" />
                    <span>
                      {attendeesCount}{" "}
                      {attendeesCount === 1 ? "участник" : "участници"}
                    </span>
                  </div>

                  {camp.description && (
                    <p className="line-clamp-2 text-xs text-zinc-500">
                      {camp.description}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t border-zinc-100 bg-zinc-50/50 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <Link
                  href={`/training/camps/${camp.id}`}
                  className="flex w-full items-center justify-between text-xs font-semibold text-primary hover:underline"
                >
                  <span>Детайлна програма и участници</span>
                  <ExternalLink size={14} />
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Тренировъчни Лагери"
        description="Организиране, настаняване, графици и състезатели по спортни лагери."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Лагери" },
        ]}
      />
      <CampsListNav />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Общо лагери
            </p>
            <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-white">
              {kpiStats.total}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Предстоящи
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {kpiStats.upcoming}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Приключили
            </p>
            <p className="mt-1 text-2xl font-black text-zinc-600 dark:text-zinc-300">
              {kpiStats.past}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Търси лагер по име или локация..."
          className="rounded-xl border-zinc-200 bg-white pl-9 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <main className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          renderCampCards(displayedCamps)
        )}
      </main>
    </div>
  );
}
