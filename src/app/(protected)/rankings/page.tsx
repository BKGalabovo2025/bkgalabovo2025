import { Metadata } from "next";

import RankingsContent from "./RankingsContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ранглиста - Бадминтон клуб Гълъбово",
  description:
    "Глобално класиране по натрупани точки от всички официални турнири",
};

export default function Page(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  return <RankingsContent searchParams={props.searchParams} section="all" />;
}
