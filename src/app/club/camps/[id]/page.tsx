import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { ArrowLeft, MapPin, Tent } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSiteIdForCamp } from "@/lib/firebase-admin";
import { CampSession } from "@/types";

import CampPublicClient from "./CampPublicClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}

function serializeTimestamp(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if (
      "toDate" in (val as object) &&
      typeof (val as { toDate: () => Date }).toDate === "function"
    ) {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    if ("_seconds" in (val as object)) {
      return new Date(
        (val as { _seconds: number })._seconds * 1000
      ).toISOString();
    }
  }
  return undefined;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const adminDb = getAdminDb();
    const doc = await adminDb.collection("events").doc(id).get();
    if (!doc.exists) return { title: "Програма на лагер | БК Гълъбово" };
    const data = doc.data() || {};
    const title = typeof data.title === "string" ? data.title : "Лагер";
    const location = typeof data.location === "string" ? data.location : "";
    const locationSuffix = location ? ` — ${location}` : "";
    return {
      title: `${title} | Програма | БК Гълъбово`,
      description: `Дневна програма на лагер "${title}"${locationSuffix}. БК Гълъбово.`,
      openGraph: {
        title: `${title} | Дневна програма`,
        description: `Разгледайте програмата на лагер "${title}" на БК Гълъбово.`,
        url: `https://bkgalabovo2025.vercel.app/club/camps/${id}`,
        siteName: "БК Гълъбово",
        images: [
          {
            url: "https://bkgalabovo2025.vercel.app/bk-hero.png",
            width: 1200,
            height: 630,
            alt: "БК Гълъбово",
          },
        ],
        locale: "bg_BG",
        type: "website",
      },
    };
  } catch {
    return { title: "Програма на лагер | БК Гълъбово" };
  }
}

export const dynamic = "force-dynamic";

export default async function CampPublicPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { date } = await searchParams;

  let campData: {
    id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    campSessions: CampSession[];
    attendees?: { memberId: string; name: string }[];
  } | null = null;

  try {
    const adminDb = getAdminDb();
    const doc = await adminDb.collection("events").doc(id).get();

    if (!doc.exists) {
      notFound();
    }

    const data = doc.data() || {};
    const startDate =
      serializeTimestamp(data.startDate) || new Date().toISOString();
    const endDate =
      serializeTimestamp(data.endDate) || new Date().toISOString();
    const rawSessions = Array.isArray(data.campSessions)
      ? data.campSessions
      : [];

    // Normalize date to yyyy-MM-dd format for consistent filtering
    const normalizeDate = (val: unknown): string => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object" && val !== null) {
        if (
          "toDate" in (val as object) &&
          typeof (val as { toDate: () => Date }).toDate === "function"
        ) {
          return format((val as { toDate: () => Date }).toDate(), "yyyy-MM-dd");
        }
        if ("_seconds" in (val as object)) {
          return format(
            new Date((val as { _seconds: number })._seconds * 1000),
            "yyyy-MM-dd"
          );
        }
      }
      return String(val);
    };

    const resolveSessionType = (type: unknown): CampSession["type"] => {
      const allowed = [
        "training",
        "meal",
        "quiet_hour",
        "leisure",
        "attraction",
        "travel",
        "other",
      ];
      return (
        typeof type === "string" && allowed.includes(type) ? type : "training"
      ) as CampSession["type"];
    };

    const resolveStartTime = (
      ps: Record<string, unknown>,
      blocks: Record<string, unknown>[]
    ): string => {
      if (typeof ps.startTime === "string" && ps.startTime) return ps.startTime;
      if (blocks.length > 0 && typeof blocks[0].startTime === "string")
        return blocks[0].startTime;
      return "09:00";
    };

    const resolveEndTime = (
      ps: Record<string, unknown>,
      blocks: Record<string, unknown>[]
    ): string => {
      if (typeof ps.endTime === "string" && ps.endTime) return ps.endTime;
      if (blocks.length > 0) {
        const last = blocks[blocks.length - 1];
        if (typeof last.endTime === "string") return last.endTime;
      }
      return "11:00";
    };

    const resolveDescription = (
      ps: Record<string, unknown>
    ): string | undefined => {
      if (typeof ps.coachNotes === "string") return ps.coachNotes;
      if (typeof ps.description === "string") return ps.description;
      return undefined;
    };

    // Convert planner sessions to CampSession format
    const convertPlannerSession = (
      ps: Record<string, unknown>
    ): CampSession => {
      const blocks = (Array.isArray(ps.blocks) ? ps.blocks : []) as Record<
        string,
        unknown
      >[];
      const sessionGroups = Array.isArray(ps.sessionGroups)
        ? ps.sessionGroups
        : [];
      return {
        id: typeof ps.id === "string" ? ps.id : "",
        date: normalizeDate(ps.date),
        type: resolveSessionType(ps.type),
        title: typeof ps.title === "string" ? ps.title : "",
        location: typeof ps.location === "string" ? ps.location : undefined,
        startTime: resolveStartTime(ps, blocks),
        endTime: resolveEndTime(ps, blocks),
        isCancelled: Boolean(ps.isCancelled),
        cancelledReason:
          typeof ps.cancelledReason === "string"
            ? ps.cancelledReason
            : undefined,
        exercises: [],
        groups: sessionGroups.map((g: Record<string, unknown>) => ({
          id: typeof g.id === "string" ? g.id : "",
          name: typeof g.name === "string" ? g.name : "",
          memberIds: Array.isArray(g.memberIds) ? g.memberIds : [],
        })),
        description: resolveDescription(ps),
      };
    };

    // Fetch planner sessions for this camp
    let plannerSessions: CampSession[] = [];
    try {
      const siteId = await getSiteIdForCamp(id);
      if (siteId) {
        const plannerSnap = await adminDb
          .collection("planner_sessions")
          .where("siteId", "==", siteId)
          .where("campId", "==", id)
          .get();
        plannerSessions = plannerSnap.docs.map((doc) =>
          convertPlannerSession({ ...doc.data(), id: doc.id })
        );
      }
    } catch (err) {
      console.warn("Failed to fetch planner sessions for camp:", err);
    }

    const campSessions: CampSession[] = rawSessions.map(
      (s: Record<string, unknown>) => ({
        id: typeof s.id === "string" ? s.id : "",
        date: normalizeDate(s.date),
        startTime: typeof s.startTime === "string" ? s.startTime : "",
        endTime: typeof s.endTime === "string" ? s.endTime : "",
        title: typeof s.title === "string" ? s.title : "",
        type: ([
          "training",
          "meal",
          "quiet_hour",
          "leisure",
          "attraction",
          "travel",
          "other",
        ].includes(s.type as string)
          ? s.type
          : "other") as CampSession["type"],
        isCancelled: Boolean(s.isCancelled),
        cancelledReason:
          typeof s.cancelledReason === "string" ? s.cancelledReason : undefined,
        description:
          typeof s.description === "string" ? s.description : undefined,
        exercises: Array.isArray(s.exercises)
          ? (s.exercises as string[])
          : undefined,
        groups: Array.isArray(s.groups)
          ? (
              s.groups as Array<{
                id: string;
                name: string;
                memberIds: string[];
              }>
            ).map((g) => ({
              id: typeof g.id === "string" ? g.id : "",
              name: typeof g.name === "string" ? g.name : "",
              memberIds: Array.isArray(g.memberIds) ? g.memberIds : [],
            }))
          : undefined,
      })
    );

    // Merge camp sessions with planner sessions
    const allSessions = [...campSessions, ...plannerSessions];

    campData = {
      id: doc.id,
      title: typeof data.title === "string" ? data.title : "Лагер",
      location: typeof data.location === "string" ? data.location : "",
      startDate,
      endDate,
      campSessions: allSessions,
      attendees: Array.isArray(data.attendees)
        ? data.attendees.map((a: Record<string, unknown>) => ({
            memberId: typeof a.memberId === "string" ? a.memberId : "",
            name: typeof a.name === "string" ? a.name : "",
          }))
        : [],
    };
  } catch (err) {
    console.error("Failed to load camp for public page:", err);
    notFound();
  }

  const startDateFormatted = format(
    new Date(campData.startDate),
    "dd MMM yyyy",
    { locale: bg }
  );
  const endDateFormatted = format(new Date(campData.endDate), "dd MMM yyyy", {
    locale: bg,
  });

  return (
    <div className="dark min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-blue-400/20 bg-zinc-950/90 px-6 py-4 backdrop-blur-xl">
        <Link
          href="/club"
          className="flex items-center gap-2 text-sm font-medium text-zinc-300 transition-all hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          БК Гълъбово
        </Link>
        <span className="text-sm font-bold tracking-widest text-blue-400 uppercase">
          Програма на лагер
        </span>
        <div className="flex items-center gap-4">
          <GoogleTranslateWidget />
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden px-6 pt-28 pb-10">
        <div className="pointer-events-none absolute top-0 left-1/2 h-72 w-full max-w-2xl -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          {/* Camp badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-bold tracking-widest text-blue-300 uppercase">
              <Tent size={12} />
              Лагер
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {campData.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-300">
            {campData.location && (
              <span className="flex items-center gap-1.5 text-zinc-200">
                <MapPin size={14} className="text-blue-400" />
                {campData.location}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-zinc-300">
              {startDateFormatted} — {endDateFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <CampPublicClient camp={campData} initialDate={date} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8 text-center text-xs text-zinc-600">
        <Link href="/club" className="transition-colors hover:text-zinc-400">
          БК Гълъбово
        </Link>{" "}
        · Бадминтон клуб Гълъбово
      </footer>
    </div>
  );
}
