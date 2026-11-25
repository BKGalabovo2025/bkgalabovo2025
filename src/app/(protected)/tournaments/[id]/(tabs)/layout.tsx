import { Metadata } from "next";
import React, { cache } from "react";

import { TournamentDetailsLayoutClient } from "@/components/tournaments/details/TournamentDetailsLayoutClient";
import { formatDateShort } from "@/lib/date-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types/member.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

export const dynamic = "force-dynamic";

const getInitialData = cache(async function getInitialData(id: string) {
  return serverCache.get(
    `tournament:details:${id}`,
    async () => {
      try {
        const db = getAdminDb();
        const tournDoc = await db.collection("tournaments").doc(id).get();

        if (!tournDoc.exists) return null;

        const tournament = serializeFirestoreData({
          id: tournDoc.id,
          ...tournDoc.data(),
        }) as Tournament;

        let entries: TournamentEntry[] = [];
        let matches: Match[] = [];
        const membersDict: Record<string, Member> = {};

        try {
          const [entriesSnap, matchesSnap, membersData] = await Promise.all([
            db
              .collection("tournament_entries")
              .where("tournamentId", "==", id)
              .get(),
            db
              .collection("tournament_matches")
              .where("tournamentId", "==", id)
              .get(),
            getAllMembersServer().catch(() => []),
          ]);

          entries = entriesSnap.docs.map((doc) =>
            serializeFirestoreData({ id: doc.id, ...doc.data() })
          ) as TournamentEntry[];

          matches = matchesSnap.docs.map((doc) =>
            serializeFirestoreData({ id: doc.id, ...doc.data() })
          ) as Match[];

          // Keep only lightweight member fields needed for name/profile resolution
          // to avoid serializing base64 signatures and large nested fields in SSR HTML.
          membersData.forEach((m) => {
            if (m.id) {
              membersDict[m.id] = {
                id: m.id,
                firstName: m.firstName,
                lastName: m.lastName,
                gender: m.gender,
                dateOfBirth: m.dateOfBirth,
                status: m.status,
                siteId: m.siteId,
              } as Member;
            }
          });

          entries.sort((a, b) => {
            if (!a.registrationDate) return 1;
            if (!b.registrationDate) return -1;
            return (
              new Date(a.registrationDate).getTime() -
              new Date(b.registrationDate).getTime()
            );
          });
        } catch (subErr) {
          console.warn(
            "Secondary tournament data fetch failed on server:",
            subErr
          );
        }

        return { tournament, entries, matches, membersDict };
      } catch (err) {
        console.warn("Error fetching tournament initial data on server:", err);
        return null;
      }
    },
    30_000
  );
});

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

  return (
    <TournamentDetailsLayoutClient
      tournamentId={id}
      initialData={
        initialData || {
          tournament: null,
          entries: [],
          matches: [],
          membersDict: {},
        }
      }
    >
      {children}
    </TournamentDetailsLayoutClient>
  );
}
