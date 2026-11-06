export const dynamic = "force-dynamic";

import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { TripDetailsLayoutClient } from "@/components/business-trips/details/TripDetailsLayoutClient";
import { Button } from "@/components/ui/button";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { getAllMembersServer } from "@/services/member-service.server";
import { docToScheduleEvent } from "@/services/schedule-service";
import { ScheduleEvent } from "@/types";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

async function getInitialTripData(id: string) {
  try {
    const db = getAdminDb();
    const tripDoc = await db.collection("business_trips").doc(id).get();

    if (!tripDoc.exists) return null;

    const trip = serializeFirestoreData({
      id: tripDoc.id,
      ...tripDoc.data(),
    }) as BusinessTrip;

    let event: ScheduleEvent | null = null;
    let expenses: TripExpense[] = [];
    const membersDict: Record<string, Member> = {};

    try {
      const promises: Promise<unknown>[] = [
        db
          .collection("trip_expenses")
          .where("tripId", "==", id)
          .get()
          .then((snap) => {
            expenses = snap.docs.map((d) =>
              serializeFirestoreData({ id: d.id, ...d.data() })
            ) as TripExpense[];
          }),
        getAllMembersServer()
          .then((members) => {
            members.forEach((m) => {
              if (m.id) membersDict[m.id] = m;
            });
          })
          .catch(() => {}),
      ];

      if (trip.eventId) {
        promises.push(
          db
            .collection("schedule_events")
            .doc(trip.eventId)
            .get()
            .then((eDoc) => {
              if (eDoc.exists) {
                event = docToScheduleEvent(eDoc as never);
              }
            })
            .catch(() => {})
        );
      }

      await Promise.all(promises);
    } catch (e) {
      console.warn(
        "Вторичното зареждане на данни за командировката бе прекъснато:",
        e
      );
    }

    return { trip, event, expenses, membersDict };
  } catch (err) {
    console.error("Грешка при зареждане на командировка:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getInitialTripData(id);

  if (!data?.trip) {
    return {
      title: "Командировка | Счетоводни отчети",
      description: "Детайли за командировка и решения на УС.",
    };
  }

  const { trip } = data;
  return {
    title: `${trip.title} | Командировка`,
    description: `Командировка до ${trip.destination}. Заповед, разходи, протокол и отчет на състезатели.`,
  };
}

export default async function TripLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const data = await getInitialTripData(id);

  if (!data || !data.trip) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8 text-center">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertCircle className="mb-3 size-10 text-rose-500" />
          <h2 className="text-lg font-bold">Командировката не беше намерена</h2>
          <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400">
            Възможно е командировката да е изтрита или връзката да е невалидна.
          </p>
          <Button asChild className="mt-4 rounded-xl text-xs font-semibold">
            <Link href="/accounting">Към счетоводните отчети</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TripDetailsLayoutClient
      tripId={id}
      initialTrip={data.trip}
      initialEvent={data.event}
      initialExpenses={data.expenses}
      initialMembersDict={data.membersDict}
    >
      {children}
    </TripDetailsLayoutClient>
  );
}
