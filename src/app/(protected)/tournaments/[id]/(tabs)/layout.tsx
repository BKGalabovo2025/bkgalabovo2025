import { Metadata } from "next";
import React from "react";

import { TournamentDetailsLayoutClient } from "@/components/tournaments/details/TournamentDetailsLayoutClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDateShort } from "@/lib/date-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types/member.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

export const dynamic = "force-dynamic";

async function getInitialData(id: string) {
  try {
    const db = getAdminDb();

    const [tournDoc, entriesSnap, matchesSnap, membersData] = await Promise.all(
      [
        db.collection("tournaments").doc(id).get(),
        db
          .collection("tournament_entries")
          .where("tournamentId", "==", id)
          .get(),
        db
          .collection("tournament_matches")
          .where("tournamentId", "==", id)
          .get(),
        getAllMembersServer(),
      ]
    );

    if (!tournDoc.exists) return null;

    const tournament = serializeFirestoreData({
      id: tournDoc.id,
      ...tournDoc.data(),
    }) as Tournament;

    const entries = entriesSnap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as TournamentEntry[];

    const matches = matchesSnap.docs.map((doc) =>
      serializeFirestoreData({ id: doc.id, ...doc.data() })
    ) as Match[];

    const membersDict: Record<string, Member> = {};
    membersData.forEach((m) => {
      if (m.id) membersDict[m.id] = m;
    });

    // Sort entries by registration date
    entries.sort((a, b) => {
      if (!a.registrationDate) return 1;
      if (!b.registrationDate) return -1;
      return (
        new Date(a.registrationDate).getTime() -
        new Date(b.registrationDate).getTime()
      );
    });

    return { tournament, entries, matches, membersDict };
  } catch (err) {
    console.error("Error fetching tournament initial data:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getInitialData(id);

  if (!data?.tournament) {
    return {
      title: "Детайли за турнир | Турнири - БК Гълъбово",
      description:
        "Информация, участници, жребий и резултати от турнир по бадминтон, организиран от Бадминтон клуб Гълъбово.",
    };
  }

  const { tournament } = data;
  return {
    title: `${tournament.title} | Турнири - БК Гълъбово`,
    description: `Турнир по бадминтон „${tournament.title}“ • ${formatDateShort(tournament.startDate)} • ${tournament.location}. Програма, участници, схема и резултати.`,
  };
}

export default async function TournamentDetailsTabsLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const initialData = await getInitialData(id);

  if (!initialData) {
    return (
      <div className="p-8">
        <Alert
          variant="destructive"
          className="rounded-2xl border-none shadow-lg"
        >
          <AlertTitle className="font-bold tracking-tight uppercase">
            Турнирът не бе намерен
          </AlertTitle>
          <AlertDescription className="font-medium">
            Няма намерен турнир с посочения идентификатор или е бил изтрит.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TournamentDetailsLayoutClient tournamentId={id} initialData={initialData}>
      {children}
    </TournamentDetailsLayoutClient>
  );
}
