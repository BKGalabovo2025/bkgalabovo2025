'use client';

import { Heading } from "@/components/shared/heading";
import { TournamentsTable } from "@/components/tournaments/tournaments-table";
import { useTournaments } from "@/hooks/useTournaments";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function TournamentsPage() {
  const { tournaments, loading, error } = useTournaments();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p>Грешка при зареждане на турнирите: {error.message}</p>;
  }

  return (
    <div className="p-4">
      <Heading as="h1">Турнири</Heading>
      <p className="text-muted-foreground">Управление на предстоящи и минали турнири</p>
      <TournamentsTable tournaments={tournaments} />
    </div>
  );
}
