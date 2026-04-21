import { Heading } from "@/components/ui/heading";
import { TournamentsTable } from "@/components/tournaments/tournaments-table";

export default function TournamentsPage() {
  // TODO: Fetch real data from Firestore
  const tournaments = [];

  return (
    <div className="p-4">
      <Heading title="Турнири" description="Управление на предстоящи и минали турнири" />
      <TournamentsTable tournaments={tournaments} />
    </div>
  );
}
