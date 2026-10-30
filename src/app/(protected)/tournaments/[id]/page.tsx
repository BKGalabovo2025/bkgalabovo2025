import { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types/member.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

import TournamentDetailsClient, {
  InitialTournamentData,
} from "./TournamentDetailsClient";

async function getInitialData(
  id: string
): Promise<InitialTournamentData | null> {
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

    // Sort entries by registration date client-side safe
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

// --- SEO Metadata ---
export const metadata: Metadata = {
  title: "Детайли за турнир | Турнири - БК Гълъбово",
  description:
    "Информация, участници, жребий и резултати от турнир по бадминтон, организиран от Бадминтон клуб Гълъбово.",
};

// --- Page (Server Component) ---
export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getInitialData(id);

  if (!initialData) {
    notFound();
  }

  return (
    <TournamentDetailsClient tournamentId={id} initialData={initialData} />
  );
}
