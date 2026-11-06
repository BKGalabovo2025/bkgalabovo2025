import { Metadata } from "next";

import RankingsContent from "../RankingsContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ранглиста: Двойки - Бадминтон клуб Гълъбово",
  description: "Класиране по точки в категория двойки от официални турнири",
};

export default function Page(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  return (
    <RankingsContent searchParams={props.searchParams} section="doubles" />
  );
}
