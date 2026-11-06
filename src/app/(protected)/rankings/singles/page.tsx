import { Metadata } from "next";

import RankingsContent from "../RankingsContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ранглиста: Единично - Бадминтон клуб Гълъбово",
  description: "Класиране по точки в единична категория от официални турнири",
};

export default function Page(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  return (
    <RankingsContent searchParams={props.searchParams} section="singles" />
  );
}
