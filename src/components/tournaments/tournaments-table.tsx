"use client";

import { Tournament } from "@/types/tournament.types";

interface TournamentsTableProps {
  tournaments: Tournament[];
}

export function TournamentsTable({ tournaments }: TournamentsTableProps) {
  // TODO: Implement a data table using Shadcn UI
  // It should display columns for Name, Dates, Status, Age Groups
  // It should also have buttons for "Edit" and "Delete" on each row
  // And a main button "Create New Tournament"

  return (
    <div>
      <p>Таблицата с турнири ще бъде тук.</p>
      <pre>{JSON.stringify(tournaments, null, 2)}</pre> {/* Placeholder */} 
    </div>
  );
}
