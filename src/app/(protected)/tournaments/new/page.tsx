import { Heading } from "@/components/shared/heading";
import { TournamentForm } from "@/components/tournaments/tournament-form";

export default function NewTournamentPage() {
  return (
    <div className="p-4">
      <Heading as="h1">Създай нов турнир</Heading>
      <p className="text-muted-foreground">Попълнете формата, за да добавите нов турнир</p>
      <TournamentForm />
    </div>
  );
}
